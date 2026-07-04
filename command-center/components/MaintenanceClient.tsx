"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Loader2,
  Play,
  TriangleAlert,
  FileX,
  Wand2,
  Copy,
  Combine,
} from "lucide-react";
import { Card, SectionTitle, Pill } from "./ui";

const TASKS = [
  { id: "verify", label: "Verify pipeline", icon: ShieldCheck, desc: "Health check: statuses, dupes, report links", apply: false },
  { id: "normalize", label: "Normalize statuses", icon: Wand2, desc: "Map non-canonical statuses to canonical", apply: true },
  { id: "dedup", label: "Dedup tracker", icon: Copy, desc: "Remove duplicate rows (keeps best)", apply: true },
  { id: "merge", label: "Merge additions", icon: Combine, desc: "Merge batch/tracker-additions into the tracker", apply: true },
] as const;

export function MaintenanceClient() {
  const [missing, setMissing] = useState<{ num: number; company: string; role: string; reportNum: string }[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput] = useState<{ task: string; dryRun: boolean; ok: boolean; text: string } | null>(null);
  const [applyMap, setApplyMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/maintenance")
      .then((r) => r.json())
      .then((d) => setMissing(d.missingReports ?? []))
      .catch(() => {});
  }, []);

  async function run(task: string) {
    setRunning(task);
    setOutput(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, apply: applyMap[task] ?? false }),
      }).then((r) => r.json());
      setOutput({ task, dryRun: res.dryRun, ok: res.ok, text: res.output || "(no output)" });
    } catch (e: any) {
      setOutput({ task, dryRun: false, ok: false, text: String(e?.message ?? e) });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TASKS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center size-9 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-brand-soft)] shrink-0">
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-[var(--color-text-faint)]">{t.desc}</div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => run(t.id)}
                      disabled={running !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {running === t.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                      Run
                    </button>
                    {t.apply && (
                      <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={applyMap[t.id] ?? false}
                          onChange={(e) => setApplyMap({ ...applyMap, [t.id]: e.target.checked })}
                          className="accent-[var(--color-brand)]"
                        />
                        Apply (write changes)
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {output && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <span className="text-sm font-medium capitalize">{output.task} output</span>
            {output.dryRun && <Pill tone="info">dry run</Pill>}
            <Pill tone={output.ok ? "good" : "bad"}>{output.ok ? "ok" : "failed"}</Pill>
          </div>
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto">{output.text}</pre>
        </Card>
      )}

      <Card>
        <SectionTitle right={<Pill tone={missing.length ? "warn" : "good"}>{missing.length} missing</Pill>}>
          Missing report files
        </SectionTitle>
        {missing.length ? (
          <>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              These tracker rows reference a report file that doesn’t exist in <code className="font-mono">reports/</code>.
              Re-evaluate them (Evaluate → Save) or remove the dangling link.
            </p>
            <div className="divide-y divide-[var(--color-border-soft)]">
              {missing.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                  <FileX size={15} className="text-[var(--color-warn)] shrink-0" />
                  <span className="font-mono text-xs text-[var(--color-text-faint)] w-12">#{m.reportNum}</span>
                  <div className="min-w-0">
                    <span className="font-medium">{m.company}</span>{" "}
                    <span className="text-[var(--color-text-faint)]">— {m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--color-good)]">
            <ShieldCheck size={16} /> Every tracker report link resolves to a real file.
          </div>
        )}
      </Card>
    </div>
  );
}
