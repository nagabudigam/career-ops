"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileBadge,
  Sparkles,
  Loader2,
  FileDown,
  RotateCcw,
  Cpu,
  Eye,
  Pencil,
  CircleAlert,
} from "lucide-react";
import type { OllamaModel } from "@/lib/types";
import { ReportMarkdown } from "./ReportMarkdown";
import { Pill } from "./ui";

export function CvClient() {
  const [original, setOriginal] = useState("");
  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState("");
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("preview");
  const [pdf, setPdf] = useState<{ url: string } | null>(null);
  const [genning, setGenning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/cv")
      .then((r) => r.json())
      .then((d) => {
        setOriginal(d.markdown || "");
        setCv(d.markdown || "");
      });
    fetch("/api/ollama/models")
      .then((r) => r.json())
      .then((d) => {
        setReachable(d.reachable);
        setModels(d.models ?? []);
        if (d.models?.length) setModel(d.models[0].name);
      })
      .catch(() => setReachable(false));
  }, []);

  async function tailor() {
    if (!jd.trim() || !model || tailoring) return;
    setTailoring(true);
    setErr(null);
    setCv("");
    setTab("preview");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, model, cv: original }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setErr(await res.text());
        setCv(original);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setCv((c) => c + dec.decode(value, { stream: true }));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(String(e?.message ?? e));
    } finally {
      setTailoring(false);
    }
  }

  async function generatePdf() {
    setGenning(true);
    setErr(null);
    setPdf(null);
    try {
      const res = await fetch("/api/cv/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: cv, name: jd ? "tailored" : "cv" }),
      }).then((r) => r.json());
      if (res.ok) setPdf({ url: `/api/output/${res.pdf}` });
      else setErr(res.error + (res.log ? `\n${res.log}` : ""));
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setGenning(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: tailor controls + editor */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-[var(--color-brand-soft)]" />
            <h2 className="font-medium">Tailor to a job (optional)</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Paste a JD and your local model reorders & re-emphasizes your CV for it — facts preserved, nothing invented.
          </p>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the target job description (optional)…"
            className="w-full min-h-[110px] resize-y rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)] p-3 text-sm font-mono outline-none focus:border-[var(--color-brand)]/50"
          />
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
              <Cpu size={14} />
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!models.length}
              className="co-input flex-1 !py-2"
            >
              {reachable === false && <option>Ollama offline</option>}
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              onClick={tailor}
              disabled={!jd.trim() || !model || tailoring}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand)] text-white px-3.5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              {tailoring ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Tailor
            </button>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-lg p-0.5">
              <TabBtn active={tab === "preview"} onClick={() => setTab("preview")} icon={Eye}>
                Preview
              </TabBtn>
              <TabBtn active={tab === "edit"} onClick={() => setTab("edit")} icon={Pencil}>
                Edit
              </TabBtn>
            </div>
            <div className="flex items-center gap-2">
              {cv !== original && (
                <button
                  onClick={() => { setCv(original); setPdf(null); }}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              {tailoring && <Pill tone="brand"><Loader2 size={11} className="animate-spin" /> tailoring</Pill>}
            </div>
          </div>
          {tab === "edit" ? (
            <textarea
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              className="w-full min-h-[460px] resize-y bg-[var(--color-bg-soft)] p-4 text-sm font-mono outline-none border-0"
            />
          ) : (
            <div className="p-5 max-h-[520px] overflow-y-auto">
              {cv ? (
                <ReportMarkdown markdown={cv} />
              ) : (
                <p className="text-sm text-[var(--color-text-faint)]">Loading CV…</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: export + PDF preview */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileBadge size={16} className="text-[var(--color-brand-soft)]" />
            <h2 className="font-medium">Export PDF</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Renders an ATS-clean PDF via Playwright (<code className="font-mono">generate-pdf.mjs</code>) into your <code className="font-mono">output/</code> folder.
          </p>
          <button
            onClick={generatePdf}
            disabled={genning || !cv.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 w-full sm:w-auto"
          >
            {genning ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {genning ? "Generating…" : "Generate PDF"}
          </button>

          {pdf && (
            <a
              href={pdf.url}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm hover:bg-[var(--color-surface-2)]"
            >
              <FileDown size={15} /> Download
            </a>
          )}

          {err && (
            <pre className="mt-3 rounded-lg border border-[var(--color-bad)]/30 bg-[var(--color-bad)]/5 p-3 text-xs text-[var(--color-bad)] whitespace-pre-wrap max-h-40 overflow-auto">
              {err}
            </pre>
          )}
        </div>

        {pdf && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] text-sm font-medium">
              PDF preview
            </div>
            <iframe src={pdf.url} className="w-full h-[600px] bg-white" title="CV PDF" />
          </div>
        )}
        {!pdf && reachable === false && (
          <div className="card p-4 flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
            <CircleAlert size={15} className="shrink-0 mt-0.5 text-[var(--color-warn)]" />
            Ollama is offline, so tailoring is disabled — but you can still edit the CV and export a PDF.
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
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
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"
      }`}
    >
      <Icon size={13} /> {children}
    </button>
  );
}
