"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Cpu,
  Loader2,
  Square,
  Copy,
  Check,
  Download,
  CircleAlert,
  RefreshCw,
  Save,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { OllamaModel } from "@/lib/types";
import { ReportMarkdown } from "./ReportMarkdown";
import { Pill } from "./ui";

function parseMeta(md: string): { company: string; role: string; score: number | null } {
  let company = "";
  let role = "";
  let score: number | null = null;
  const s = md.match(/\*\*Score:\*\*\s*([\d.]+)/);
  if (s) score = parseFloat(s[1]);
  // Prefer a Machine Summary yaml block if present.
  const yc = md.match(/company:\s*["']?([^"'\n]+)/i);
  const yr = md.match(/role:\s*["']?([^"'\n]+)/i);
  if (yc) company = yc[1].trim();
  if (yr) role = yr[1].trim();
  if (!company || !role) {
    const title = md.match(/^#\s+(?:Evaluation:\s*)?(.+)$/m);
    if (title) {
      const parts = title[1].split(/—|–|\||@/).map((p) => p.trim()).filter(Boolean);
      if (title[1].includes("@")) {
        role = role || parts[0] || "";
        company = company || parts[1] || "";
      } else {
        company = company || parts[0] || "";
        role = role || parts.slice(1).join(" — ") || "";
      }
    }
  }
  return { company: company.replace(/[[\]]/g, ""), role: role.replace(/[[\]]/g, ""), score };
}

export function EvaluateClient() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [model, setModel] = useState("");
  const [jd, setJd] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outRef = useRef<HTMLDivElement>(null);

  // Save-to-tracker state
  const [showSave, setShowSave] = useState(false);
  const [sf, setSf] = useState({ company: "", role: "", score: "", status: "evaluated", url: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ reportNum: number; slug: string } | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function openSave() {
    const m = parseMeta(output);
    setSf({
      company: m.company,
      role: m.role,
      score: m.score != null ? String(m.score) : "",
      status: "evaluated",
      url: "",
    });
    setSaved(null);
    setSaveErr(null);
    setShowSave(true);
  }

  async function doSave() {
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await fetch("/api/save-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: output,
          company: sf.company,
          role: sf.role,
          score: sf.score ? parseFloat(sf.score) : null,
          status: sf.status,
          url: sf.url || undefined,
        }),
      }).then((r) => r.json());
      if (res.ok) setSaved({ reportNum: res.reportNum, slug: res.slug });
      else setSaveErr(res.error || "Save failed");
    } catch (e: any) {
      setSaveErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function loadModels() {
    setReachable(null);
    const r = await fetch("/api/ollama/models").then((x) => x.json());
    setReachable(r.reachable);
    setModels(r.models ?? []);
    if (r.models?.length && !model) setModel(r.models[0].name);
  }

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (running) {
      const start = Date.now();
      timerRef.current = setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (running && outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [output, running]);

  async function run() {
    if (!jd.trim() || !model || running) return;
    setOutput("");
    setError(null);
    setElapsed(0);
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, model }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setError(await res.text());
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((o) => o + decoder.decode(value, { stream: true }));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(String(e?.message ?? e));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  function copy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Input panel */}
      <div className="card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Job description</label>
          <span className="text-xs text-[var(--color-text-faint)]">
            {jd.length.toLocaleString()} chars
          </span>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here…"
          className="flex-1 min-h-[260px] resize-y rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)] p-3 text-sm font-mono leading-relaxed outline-none focus:border-[var(--color-brand)]/50 focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />

        {/* Model picker */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Cpu size={15} className="text-[var(--color-brand-soft)]" /> Local model
            </label>
            <button
              onClick={loadModels}
              className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)] inline-flex items-center gap-1"
            >
              <RefreshCw size={12} /> refresh
            </button>
          </div>
          {reachable === false ? (
            <div className="rounded-xl border border-[var(--color-bad)]/30 bg-[var(--color-bad)]/10 p-3 text-xs text-[var(--color-bad)] flex items-start gap-2">
              <CircleAlert size={15} className="shrink-0 mt-0.5" />
              <span>
                Ollama isn’t reachable. Start it with{" "}
                <code className="font-mono">ollama serve</code>, then refresh.
              </span>
            </div>
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!models.length}
              className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50 disabled:opacity-50"
            >
              {reachable === null && <option>Detecting models…</option>}
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} · {(m.size / 1024 ** 3).toFixed(1)} GB
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          {!running ? (
            <button
              onClick={run}
              disabled={!jd.trim() || !model}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <Sparkles size={16} /> Evaluate
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-bad)]/15 text-[var(--color-bad)] border border-[var(--color-bad)]/30 px-4 py-2.5 text-sm font-medium"
            >
              <Square size={14} /> Stop
            </button>
          )}
        </div>
        <p className="text-[11px] text-[var(--color-text-faint)] mt-2 leading-relaxed">
          Runs fully on your machine via Ollama using your CV + modes. Output is{" "}
          <strong>not</strong> auto-saved to the tracker — review, then copy or download.
        </p>
      </div>

      {/* Output panel */}
      <div className="card p-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Evaluation</span>
            {running && (
              <Pill tone="brand">
                <Loader2 size={11} className="animate-spin" /> {elapsed.toFixed(1)}s
              </Pill>
            )}
            {!running && output && <Pill tone="good">done · {elapsed.toFixed(1)}s</Pill>}
          </div>
          {output && !running && (
            <div className="flex items-center gap-1">
              <button
                onClick={openSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand-soft)] border border-[var(--color-brand)]/30 px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--color-brand)]/25"
                title="Save as report + tracker entry"
              >
                <Save size={14} /> Save to tracker
              </button>
              <button
                onClick={copy}
                className="grid place-items-center size-8 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                title="Copy markdown"
              >
                {copied ? <Check size={15} className="text-[var(--color-good)]" /> : <Copy size={15} />}
              </button>
              <button
                onClick={download}
                className="grid place-items-center size-8 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                title="Download .md"
              >
                <Download size={15} />
              </button>
            </div>
          )}
        </div>

        <div ref={outRef} className="flex-1 overflow-y-auto p-5 min-h-[400px]">
          {error ? (
            <div className="rounded-xl border border-[var(--color-bad)]/30 bg-[var(--color-bad)]/10 p-4 text-sm text-[var(--color-bad)]">
              {error}
            </div>
          ) : output ? (
            <ReportMarkdown markdown={output} />
          ) : (
            <div className="h-full grid place-items-center text-center">
              <div className="text-[var(--color-text-faint)]">
                <Sparkles size={28} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Paste a job description and hit{" "}
                  <span className="text-[var(--color-text-muted)]">Evaluate</span>.
                </p>
                <p className="text-xs mt-1">The A–F report streams here in real time.</p>
              </div>
            </div>
          )}
          {running && !output && (
            <div className="space-y-2 mt-4">
              <div className="skeleton h-4 rounded w-1/2" />
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-4 rounded w-2/3" />
            </div>
          )}
        </div>
      </div>
    </div>

    {showSave && (
      <div
        className="fixed inset-0 z-50 grid place-items-center p-4"
        onClick={() => !saving && setShowSave(false)}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative card p-6 w-full max-w-md animate-in"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Save size={18} className="text-[var(--color-brand-soft)]" /> Save to tracker
          </h3>
          {saved ? (
            <div className="mt-4">
              <div className="rounded-xl border border-[var(--color-good)]/30 bg-[var(--color-good)]/10 p-4 text-sm">
                Saved as report <strong>#{saved.reportNum}</strong> and merged into the tracker.
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Link
                  href={`/reports/${saved.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90"
                >
                  Open report <ExternalLink size={14} />
                </Link>
                <button
                  onClick={() => setShowSave(false)}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm hover:bg-[var(--color-surface-2)]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label="Company">
                <input
                  value={sf.company}
                  onChange={(e) => setSf({ ...sf, company: e.target.value })}
                  className="co-input"
                />
              </Field>
              <Field label="Role">
                <input
                  value={sf.role}
                  onChange={(e) => setSf({ ...sf, role: e.target.value })}
                  className="co-input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Score (/5)">
                  <input
                    value={sf.score}
                    onChange={(e) => setSf({ ...sf, score: e.target.value })}
                    placeholder="4.2"
                    className="co-input"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={sf.status}
                    onChange={(e) => setSf({ ...sf, status: e.target.value })}
                    className="co-input"
                  >
                    {["evaluated", "applied", "skip"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="URL (optional)">
                <input
                  value={sf.url}
                  onChange={(e) => setSf({ ...sf, url: e.target.value })}
                  placeholder="https://…"
                  className="co-input"
                />
              </Field>
              {saveErr && (
                <div className="text-xs text-[var(--color-bad)]">{saveErr}</div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={doSave}
                  disabled={saving || !sf.company || !sf.role}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Saving…" : "Save report + tracker entry"}
                </button>
                <button
                  onClick={() => setShowSave(false)}
                  disabled={saving}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm hover:bg-[var(--color-surface-2)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
