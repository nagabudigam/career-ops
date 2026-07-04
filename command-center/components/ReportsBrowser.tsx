"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck, Calendar } from "lucide-react";
import type { ReportMeta } from "@/lib/types";
import { ScoreBadge } from "./badges";
import { Pill } from "./ui";
import { relativeDate } from "@/lib/utils";

function legitTone(l: string | null): "good" | "warn" | "bad" | "default" {
  if (!l) return "default";
  const s = l.toLowerCase();
  if (s.includes("high")) return "good";
  if (s.includes("medium") || s.includes("moderate")) return "warn";
  if (s.includes("low")) return "bad";
  return "default";
}

export function ReportsBrowser({ reports }: { reports: ReportMeta[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return reports;
    return reports.filter((r) =>
      `${r.company ?? ""} ${r.role ?? ""} ${r.slug}`.toLowerCase().includes(n)
    );
  }, [q, reports]);

  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reports…"
          className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50 focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className="card p-4 hover:border-[var(--color-brand)]/40 hover:-translate-y-0.5 transition-all flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.company ?? r.slug}</div>
                <div className="text-xs text-[var(--color-text-faint)] line-clamp-2 mt-0.5">
                  {r.role ?? "—"}
                </div>
              </div>
              <ScoreBadge score={r.score} />
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
              <span className="text-[10px] font-mono text-[var(--color-text-faint)]">
                #{r.id}
              </span>
              {r.legitimacy && (
                <Pill tone={legitTone(r.legitimacy)}>
                  <ShieldCheck size={11} /> {r.legitimacy}
                </Pill>
              )}
              {r.date && (
                <span className="text-[10px] text-[var(--color-text-faint)] inline-flex items-center gap-1 ml-auto">
                  <Calendar size={10} /> {relativeDate(r.date)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="card p-10 text-center text-sm text-[var(--color-text-faint)]">
          No reports match “{q}”.
        </div>
      )}
    </div>
  );
}
