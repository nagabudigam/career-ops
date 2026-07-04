"use client";

import { useState } from "react";
import { Radar, Loader2, Play, TriangleAlert } from "lucide-react";

export function ScanRunner() {
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [output, setOutput] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);

  async function run() {
    setRunning(true);
    setOutput("");
    setOk(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      setOk(data.ok);
      setOutput(data.output || "(no output)");
    } catch (e: any) {
      setOk(false);
      setOutput(String(e?.message ?? e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Radar size={16} className="text-[var(--color-brand-soft)]" />
        <h2 className="font-medium">Run scanner</h2>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Hits Greenhouse/Ashby/Lever APIs directly — zero LLM cost. Reads your{" "}
        <code className="font-mono">portals.yml</code>.
      </p>

      <label className="flex items-center gap-2 text-sm mb-3 select-none cursor-pointer">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          className="accent-[var(--color-brand)]"
        />
        Dry run (preview only — don’t write to scan-history / pipeline)
      </label>

      {!dryRun && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/10 p-2.5 text-xs text-[var(--color-warn)] mb-3">
          <TriangleAlert size={14} className="shrink-0 mt-0.5" />
          A live scan appends new findings to your data files.
        </div>
      )}

      <button
        onClick={run}
        disabled={running}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} />}
        {running ? "Scanning…" : dryRun ? "Preview scan" : "Run live scan"}
      </button>

      {output && (
        <pre
          className={`mt-4 max-h-72 overflow-auto rounded-xl border p-3 text-xs font-mono whitespace-pre-wrap ${
            ok === false
              ? "border-[var(--color-bad)]/30 bg-[var(--color-bad)]/5"
              : "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
          }`}
        >
          {output}
        </pre>
      )}
    </div>
  );
}
