import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { loadApplications } from "./applications";
import { OLLAMA_HOST, listOllamaModels } from "./ollama";

export interface MatchedEmail {
  uid: string;
  date: string;
  from: string;
  fromAddress: string;
  subject: string;
  snippet: string;
  company: string;
  appNum: number | null;
  appRole: string | null;
  appStatus: string | null;
  classification: EmailClass | null;
}

export type EmailClass =
  | "interview"
  | "rejection"
  | "recruiter"
  | "offer"
  | "auto"
  | "other";

export function emailConfigured(): boolean {
  return Boolean(process.env.IMAP_USER && process.env.IMAP_PASSWORD);
}

// Generic words that shouldn't be used alone to match a company.
const COMPANY_STOPWORDS = new Set([
  "the", "inc", "llc", "ltd", "group", "labs", "lab", "technologies",
  "technology", "tech", "systems", "solutions", "global", "ai", "co",
  "corp", "company", "team", "talent", "careers", "recruiting", "people",
  "and", "of", "data", "io", "hq", "app",
]);

function companyKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !COMPANY_STOPWORDS.has(w));
}

let cache: { at: number; data: MatchedEmail[] } | null = null;
const TTL = 120_000; // 2 min

export async function fetchResponses(opts?: {
  days?: number;
  classify?: boolean;
  force?: boolean;
}): Promise<{ configured: boolean; emails: MatchedEmail[]; error?: string }> {
  if (!emailConfigured()) return { configured: false, emails: [] };
  const days = opts?.days ?? 30;

  if (!opts?.force && cache && Date.now() - cache.at < TTL) {
    return { configured: true, emails: cache.data };
  }

  // Build company → app lookup from applications we've engaged with.
  const apps = loadApplications();
  const tracked = apps.filter((a) =>
    ["applied", "responded", "interview", "offer"].includes(a.status)
  );
  // fall back to all companies if nothing is marked applied yet
  const pool = tracked.length ? tracked : apps;
  const keyMap: { keywords: string[]; app: (typeof apps)[number] }[] = pool.map(
    (a) => ({ keywords: companyKeywords(a.company), app: a })
  );

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASSWORD! },
    logger: false,
  });

  const matched: MatchedEmail[] = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - days * 86400000);
      // Pass 1: envelopes only (fast) → match by subject + sender.
      const candidates: { uid: number; env: any }[] = [];
      for await (const msg of client.fetch(
        { since },
        { uid: true, envelope: true }
      )) {
        candidates.push({ uid: msg.uid, env: msg.envelope });
      }

      const hits: { uid: number; env: any; company: string; app: any }[] = [];
      for (const c of candidates) {
        const from = c.env?.from?.[0] ?? {};
        const hayName = `${from.name ?? ""} ${from.address ?? ""}`.toLowerCase();
        const haySubject = (c.env?.subject ?? "").toLowerCase();
        const hay = `${hayName} ${haySubject}`;
        let best: { company: string; app: any } | null = null;
        for (const { keywords, app } of keyMap) {
          if (keywords.some((k) => hay.includes(k))) {
            best = { company: app.company, app };
            break;
          }
        }
        if (best) hits.push({ ...c, ...best });
      }

      // newest first, cap to 40
      hits.sort((a, b) => b.uid - a.uid);
      const top = hits.slice(0, 40);

      // Pass 2: fetch source for matched messages → snippet via mailparser.
      for (const h of top) {
        let snippet = "";
        try {
          const dl = await client.download(String(h.uid), undefined, { uid: true });
          if (dl?.content) {
            const parsed = await simpleParser(dl.content as any);
            snippet = (parsed.text ?? parsed.subject ?? "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 400);
          }
        } catch {
          /* snippet best-effort */
        }
        const from = h.env?.from?.[0] ?? {};
        matched.push({
          uid: String(h.uid),
          date: h.env?.date ? new Date(h.env.date).toISOString().slice(0, 10) : "",
          from: from.name || from.address || "Unknown",
          fromAddress: from.address || "",
          subject: h.env?.subject || "(no subject)",
          snippet,
          company: h.company,
          appNum: h.app?.num ?? null,
          appRole: h.app?.role ?? null,
          appStatus: h.app?.status ?? null,
          classification: null,
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e: any) {
    return { configured: true, emails: [], error: String(e?.message ?? e) };
  }

  if (opts?.classify) {
    await classifyAll(matched);
  }

  cache = { at: Date.now(), data: matched };
  return { configured: true, emails: matched };
}

const classCache = new Map<string, EmailClass>();

async function classifyAll(emails: MatchedEmail[]) {
  const { reachable, models } = await listOllamaModels();
  if (!reachable || !models.length) return;
  const model = models[models.length - 1].name; // smallest = fastest
  for (const e of emails) {
    const key = `${e.uid}`;
    if (classCache.has(key)) {
      e.classification = classCache.get(key)!;
      continue;
    }
    const label = await classifyOne(model, e);
    if (label) {
      classCache.set(key, label);
      e.classification = label;
    }
  }
}

async function classifyOne(model: string, e: MatchedEmail): Promise<EmailClass | null> {
  const prompt = `Classify this email about a job application into ONE label.
Labels: interview (invites to interview/schedule a call), offer (job offer), rejection (declined/not moving forward), recruiter (new outreach/opportunity), auto (automated acknowledgement/received), other.
From: ${e.from} <${e.fromAddress}>
Subject: ${e.subject}
Body: ${e.snippet}
Answer with ONLY the single label word.`;
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0, num_predict: 8 },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const word = String(data.response ?? "")
      .toLowerCase()
      .match(/interview|offer|rejection|recruiter|auto|other/)?.[0];
    return (word as EmailClass) ?? "other";
  } catch {
    return null;
  }
}
