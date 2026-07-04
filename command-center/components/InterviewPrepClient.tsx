"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquareText,
  BookOpen,
  Sparkles,
  Loader2,
  Cpu,
  Square,
} from "lucide-react";
import type { OllamaModel } from "@/lib/types";
import type { PrepFile } from "@/lib/interview";
import { ReportMarkdown } from "./ReportMarkdown";
import { Pill, EmptyState } from "./ui";

export function InterviewPrepClient({
  storyBank,
  prepFiles,
}: {
  storyBank: string | null;
  prepFiles: PrepFile[];
}) {
  const [tab, setTab] = useState<"generate" | "stories">("generate");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState("");
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ollama/models")
      .then((r) => r.json())
      .then((d) => {
        setReachable(d.reachable);
        setModels(d.models ?? []);
        if (d.models?.length) setModel(d.models[0].name);
      })
      .catch(() => setReachable(false));
  }, []);

  useEffect(() => {
    if (running && outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [output, running]);

  async function run() {
    if (!company.trim() || !model || running) return;
    setOutput("");
    setErr(null);
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jd, model }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setErr(await res.text());
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((o) => o + dec.decode(value, { stream: true }));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(String(e?.message ?? e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-lg p-0.5 w-fit mb-4">
        <Tab active={tab === "generate"} onClick={() => setTab("generate")} icon={Sparkles}>
          Generate prep
        </Tab>
        <Tab active={tab === "stories"} onClick={() => setTab("stories")} icon={BookOpen}>
          Story Bank
        </Tab>
      </div>

      {tab === "generate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Company</span>
                <input value={company} onChange={(e) => setCompany(e.target.value)} className="co-input mt-1" placeholder="e.g. Google" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Role</span>
                <input value={role} onChange={(e) => setRole(e.target.value)} className="co-input mt-1" placeholder="Senior AI Engineer" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Job description (optional)</span>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="w-full min-h-[140px] resize-y rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)] p-3 text-sm font-mono mt-1 outline-none focus:border-[var(--color-brand)]/50"
                placeholder="Paste the JD for sharper prep…"
              />
            </label>
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[var(--color-text-faint)]" />
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!models.length} className="co-input flex-1 !py-2">
                {reachable === false && <option>Ollama offline</option>}
                {models.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
              {!running ? (
                <button onClick={run} disabled={!company.trim() || !model} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand)] text-white px-3.5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40">
                  <Sparkles size={15} /> Generate
                </button>
              ) : (
                <button onClick={() => abortRef.current?.abort()} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-bad)]/15 text-[var(--color-bad)] border border-[var(--color-bad)]/30 px-3.5 py-2 text-sm font-medium">
                  <Square size={14} /> Stop
                </button>
              )}
            </div>
          </div>

          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2">
              <span className="text-sm font-medium">Prep guide</span>
              {running && <Pill tone="brand"><Loader2 size={11} className="animate-spin" /> generating</Pill>}
            </div>
            <div ref={outRef} className="p-5 overflow-y-auto min-h-[360px] max-h-[560px]">
              {err ? (
                <div className="text-sm text-[var(--color-bad)]">{err}</div>
              ) : output ? (
                <ReportMarkdown markdown={output} />
              ) : (
                <div className="h-full grid place-items-center text-center text-[var(--color-text-faint)]">
                  <div>
                    <MessageSquareText size={26} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter a company and generate tailored prep.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 sm:p-7">
          {storyBank ? (
            <ReportMarkdown markdown={storyBank} />
          ) : (
            <EmptyState
              title="No story bank yet"
              hint="Your STAR+R stories accumulate in interview-prep/story-bank.md as you evaluate roles."
              icon={BookOpen}
            />
          )}
          {prepFiles.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                Saved company prep ({prepFiles.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {prepFiles.map((p) => (
                  <Pill key={p.slug} tone="default">{p.title}</Pill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"
      }`}
    >
      <Icon size={14} /> {children}
    </button>
  );
}
