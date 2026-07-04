"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink, Activity, Loader2 } from "lucide-react";
import type { PipelineItem } from "@/lib/types";

export function PipelineList({ items }: { items: PipelineItem[] }) {
  const [q, setQ] = useState("");
  const [showDone, setShowDone] = useState(false);

  const companies = useMemo(() => {
    const set = new Set(items.map((i) => i.company).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);
  const [company, setCompany] = useState("all");
  const [liveness, setLiveness] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter((i) => {
      if (!showDone && i.done) return false;
      if (company !== "all" && i.company !== company) return false;
      if (n && !`${i.company} ${i.role} ${i.url}`.toLowerCase().includes(n)) return false;
      return true;
    });
  }, [items, q, showDone, company]);

  async function checkLiveness() {
    setChecking(true);
    const urls = filtered.slice(0, 12).map((i) => i.url);
    try {
      const res = await fetch("/api/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      }).then((r) => r.json());
      if (res.ok) {
        const map: Record<string, string> = { ...liveness };
        for (const r of res.results) map[r.url] = r.status;
        setLiveness(map);
      }
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  }

  const livenessTone: Record<string, string> = {
    active: "text-[var(--color-good)]",
    expired: "text-[var(--color-bad)]",
    uncertain: "text-[var(--color-warn)]",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pending URLs…"
            className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50 focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
        </div>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50 max-w-[180px]"
        >
          <option value="all">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] px-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="accent-[var(--color-brand)]"
          />
          Show processed
        </label>
        <button
          onClick={checkLiveness}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 whitespace-nowrap"
          title="Check if the first 12 visible postings are still live"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
          Check liveness
        </button>
      </div>

      <div className="card !p-0 overflow-hidden divide-y divide-[var(--color-border-soft)]">
        {filtered.map((i, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <span
              className={`size-2 rounded-full shrink-0 ${
                i.done ? "bg-[var(--color-good)]" : "bg-[var(--color-warn)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{i.company || "Unknown"}</span>
              </div>
              <div className="text-xs text-[var(--color-text-faint)] truncate">{i.role}</div>
            </div>
            {liveness[i.url] && (
              <span className={`text-xs font-medium capitalize shrink-0 ${livenessTone[liveness[i.url]] ?? ""}`}>
                {liveness[i.url] === "active" ? "● live" : liveness[i.url] === "expired" ? "● expired" : "● ?"}
              </span>
            )}
            <a
              href={i.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-soft)] hover:underline shrink-0"
            >
              Open <ExternalLink size={12} />
            </a>
          </div>
        ))}
        {!filtered.length && (
          <div className="p-10 text-center text-sm text-[var(--color-text-faint)]">
            Nothing pending matches your filters.
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-faint)] mt-3">
        {filtered.length} shown · processed items are toggled in data/pipeline.md when merged.
      </p>
    </div>
  );
}
