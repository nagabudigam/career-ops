"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Loader2,
  CircleAlert,
  ExternalLink,
  Check,
  KeyRound,
} from "lucide-react";
import { Card, Pill, EmptyState } from "./ui";
import { relativeDate } from "@/lib/utils";

interface MatchedEmail {
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
  classification: string | null;
}

const CLASS_TONE: Record<string, "good" | "bad" | "info" | "brand" | "default"> = {
  interview: "good",
  offer: "brand",
  rejection: "bad",
  recruiter: "info",
  auto: "default",
  other: "default",
};

export function InboxClient() {
  const [state, setState] = useState<{
    loading: boolean;
    configured: boolean;
    emails: MatchedEmail[];
    error?: string;
  }>({ loading: true, configured: true, emails: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    const r = await fetch(`/api/inbox?classify=true${force ? "&force=true" : ""}`)
      .then((x) => x.json())
      .catch((e) => ({ configured: true, emails: [], error: String(e) }));
    setState({ loading: false, ...r });
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-4 rounded w-1/3 mb-2" />
            <div className="skeleton h-3 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!state.configured) return <SetupGuide />;

  if (state.error) {
    return (
      <Card>
        <div className="flex items-start gap-2 text-[var(--color-bad)]">
          <CircleAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Couldn’t reach the mailbox</div>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 break-words">{state.error}</p>
            <p className="text-xs text-[var(--color-text-faint)] mt-2">
              Check IMAP_USER / IMAP_PASSWORD in <code className="font-mono">.env.local</code>.
              Gmail requires an App Password (not your normal password).
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          {state.emails.length} matched {state.emails.length === 1 ? "reply" : "replies"} from companies you’ve engaged with
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-50"
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {state.emails.length ? (
        <div className="space-y-3">
          {state.emails.map((e) => (
            <EmailCard key={e.uid} email={e} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No responses matched yet"
          hint="When a company you’ve applied to replies, it’ll show up here. Make sure those applications are marked 'Applied' in the tracker so they’re watched."
          icon={Mail}
        />
      )}
    </div>
  );
}

function EmailCard({ email }: { email: MatchedEmail }) {
  const [status, setStatus] = useState(email.appStatus ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function update(newStatus: string) {
    if (!email.appNum) return;
    setSaving(true);
    // company/role unknown here beyond company; backend matches num+company+role,
    // so we send what we can — the inbox flow targets the company's row(s).
    const res = await fetch("/api/applications/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        num: email.appNum,
        company: email.company,
        role: email.appRole,
        status: newStatus,
      }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.ok) {
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  const tone = email.classification ? CLASS_TONE[email.classification] ?? "default" : "default";

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="brand">{email.company}</Pill>
            {email.classification && (
              <Pill tone={tone as any}>{email.classification}</Pill>
            )}
            <span className="text-xs text-[var(--color-text-faint)]">
              {relativeDate(email.date)}
            </span>
          </div>
          <div className="font-medium mt-2">{email.subject}</div>
          <div className="text-xs text-[var(--color-text-faint)] mt-0.5">
            {email.from} {email.fromAddress && `<${email.fromAddress}>`}
          </div>
          {email.snippet && (
            <p className="text-sm text-[var(--color-text-muted)] mt-2 line-clamp-3">
              {email.snippet}
            </p>
          )}
        </div>
      </div>

      {email.appNum != null && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-soft)]">
          <span className="text-xs text-[var(--color-text-faint)]">Update tracker:</span>
          {["responded", "interview", "offer", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => update(s)}
              disabled={saving}
              className={`rounded-lg border px-2.5 py-1 text-xs capitalize transition-colors ${
                status === s
                  ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {s}
            </button>
          ))}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-good)]">
              <Check size={12} /> saved
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SetupGuide() {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid place-items-center size-10 rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand-soft)] shrink-0">
          <KeyRound size={18} />
        </span>
        <div>
          <div className="font-medium">Connect your inbox</div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Watch your job-search Gmail for replies from companies you’ve applied to.
            Read-only, fully local — credentials live in <code className="font-mono">.env.local</code>.
          </p>
          <ol className="text-sm text-[var(--color-text-muted)] mt-3 space-y-1.5 list-decimal pl-5">
            <li>Enable 2-Step Verification on your Google account.</li>
            <li>
              Create an <strong>App Password</strong> at{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-brand-soft)] underline inline-flex items-center gap-1"
              >
                myaccount.google.com/apppasswords <ExternalLink size={11} />
              </a>
              .
            </li>
            <li>
              Add to <code className="font-mono">web/.env.local</code>:
              <pre className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-xs font-mono whitespace-pre-wrap">{`IMAP_USER=you@gmail.com
IMAP_PASSWORD=your-16-char-app-password
# optional (defaults shown):
# IMAP_HOST=imap.gmail.com
# IMAP_PORT=993`}</pre>
            </li>
            <li>Restart the dev server and reload this page.</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
