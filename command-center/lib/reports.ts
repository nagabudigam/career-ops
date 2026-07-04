import fs from "node:fs";
import path from "node:path";
import { P, safeRead } from "./paths";
import { slugify } from "./utils";
import type { ReportDetail, ReportMeta } from "./types";

let fileIndexCache: Map<string, string> | null = null; // reportNum -> filename

/** Map of leading report number -> filename, e.g. "663" -> "663-google-2026-06-19.md" */
export function reportFileIndex(): Map<string, string> {
  if (fileIndexCache) return fileIndexCache;
  const idx = new Map<string, string>();
  try {
    for (const f of fs.readdirSync(P.reportsDir())) {
      if (!f.endsWith(".md")) continue;
      const m = f.match(/^(\d{1,4})-/);
      if (m && !idx.has(m[1])) idx.set(m[1], f);
    }
  } catch {
    /* no reports dir */
  }
  fileIndexCache = idx;
  return idx;
}

function pluck(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function parseHeader(md: string, file: string): Omit<ReportMeta, "id" | "slug" | "file"> {
  const head = md.slice(0, 1500);
  const title = pluck(/^#\s+(.+)$/m, head);
  let company: string | null = null;
  let role: string | null = null;
  // "# Evaluation: Google — Senior Applied AI/ML Engineer (Finance DnA)"
  if (title) {
    const cleaned = title.replace(/^Evaluation:\s*/i, "");
    const parts = cleaned.split(/[—–-]|@/).map((s) => s.trim());
    if (cleaned.includes("@")) {
      // "Role @ Company"
      role = parts[0] || null;
      company = parts[1] || null;
    } else {
      company = parts[0] || null;
      role = parts.slice(1).join(" — ").trim() || null;
    }
  }
  const date = pluck(/\*\*Date:\*\*\s*(.+)$/m, head);
  const scoreStr = pluck(/\*\*Score:\*\*\s*([\d.]+)/m, head);
  const legitimacy = pluck(/\*\*Legitimacy:\*\*\s*(.+)$/m, head);
  const archetype = pluck(/\*\*Archetype:\*\*\s*(.+)$/m, head);
  return {
    company,
    role,
    date: date && /\d{4}-\d{2}-\d{2}/.test(date) ? date.match(/\d{4}-\d{2}-\d{2}/)![0] : date,
    score: scoreStr ? parseFloat(scoreStr) : null,
    legitimacy,
    archetype,
  };
}

export function getReport(idOrSlug: string): ReportDetail | null {
  const idx = reportFileIndex();
  const decoded = decodeURIComponent(idOrSlug);
  // Resolve by exact slug (filename without .md) first, then by report number.
  let file: string | undefined;
  if (fs.existsSync(path.join(P.reportsDir(), `${decoded}.md`))) {
    file = `${decoded}.md`;
  } else {
    file = idx.get(decoded);
  }
  if (!file) return null;
  const id = file.match(/^(\d{1,4})-/)?.[1] ?? decoded;
  const full = path.join(P.reportsDir(), file);
  const md = safeRead(full);
  if (md === null) return null;
  const meta = parseHeader(md, file);

  // collect h2/h3 headings for table of contents
  const headings: ReportDetail["headings"] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const text = m[2].replace(/[#*`]/g, "").trim();
    headings.push({ id: slugify(text), text, level: m[1].length });
  }

  return {
    id,
    slug: file.replace(/\.md$/, ""),
    file,
    ...meta,
    markdown: md,
    headings,
  };
}

export function listReports(): ReportMeta[] {
  const out: ReportMeta[] = [];
  for (const [id, file] of reportFileIndex()) {
    const md = safeRead(path.join(P.reportsDir(), file));
    if (md === null) continue;
    const meta = parseHeader(md, file);
    out.push({ id, slug: file.replace(/\.md$/, ""), file, ...meta });
  }
  out.sort((a, b) => Number(b.id) - Number(a.id));
  return out;
}
