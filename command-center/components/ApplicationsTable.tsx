"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, FileText, Mail } from "lucide-react";
import type { Application, StateDef } from "@/lib/types";
import { StatusBadge, ScoreBadge } from "./badges";
import { relativeDate, cn } from "@/lib/utils";

type SortKey = "date" | "score" | "company" | "num";

export function ApplicationsTable({
  apps,
  states,
  initialMin = 0,
}: {
  apps: Application[];
  states: StateDef[];
  initialMin?: number;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(initialMin);
  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [replied, setReplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Surface companies that have replied (from the Inbox match index).
    fetch("/api/inbox?classify=false")
      .then((r) => r.json())
      .then((d) => {
        if (d?.configured && Array.isArray(d.emails))
          setReplied(new Set(d.emails.map((e: any) => e.company)));
      })
      .catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of apps) m[a.status] = (m[a.status] ?? 0) + 1;
    return m;
  }, [apps]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = apps.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (minScore > 0 && (a.score === null || a.score < minScore)) return false;
      if (needle) {
        const hay = `${a.company} ${a.role} ${a.notes}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sort === "date") cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : a.num - b.num;
      else if (sort === "score") cmp = (a.score ?? -1) - (b.score ?? -1);
      else if (sort === "company") cmp = a.company.localeCompare(b.company);
      else cmp = a.num - b.num;
      return dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [apps, q, status, minScore, sort, dir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "company" ? "asc" : "desc");
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, role, notes…"
            className="w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50 focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]/50"
          >
            <option value={0}>Any score</option>
            <option value={4.5}>≥ 4.5</option>
            <option value={4}>≥ 4.0</option>
            <option value={3.5}>≥ 3.5</option>
            <option value={3}>≥ 3.0</option>
          </select>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip active={status === "all"} onClick={() => setStatus("all")}>
          All <span className="opacity-60">{apps.length}</span>
        </Chip>
        {states
          .filter((s) => (counts[s.id] ?? 0) > 0)
          .map((s) => (
            <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
              {s.label} <span className="opacity-60">{counts[s.id]}</span>
            </Chip>
          ))}
      </div>

      {/* Desktop table */}
      <div className="card !p-0 overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-faint)]">
              <Th onClick={() => toggleSort("num")} className="w-16 pl-5">#</Th>
              <Th onClick={() => toggleSort("company")}>Company / Role</Th>
              <Th onClick={() => toggleSort("score")} className="w-24">Score</Th>
              <th className="py-3 px-3 font-medium w-32">Status</th>
              <Th onClick={() => toggleSort("date")} className="w-24">Date</Th>
              <th className="py-3 px-3 font-medium w-20 text-center">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-soft)]">
            {filtered.map((a, i) => (
              <tr key={`${a.num}-${i}`} className="hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="py-3 pl-5 pr-2 text-[var(--color-text-faint)] tabular-nums">
                  {a.num}
                </td>
                <td className="py-3 px-3">
                  <div className="font-medium flex items-center gap-1.5">
                    {a.company}
                    {replied.has(a.company) && (
                      <span title="A reply matched this company in your inbox" className="text-[var(--color-good)]">
                        <Mail size={12} />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-faint)] line-clamp-1">
                    {a.role}
                  </div>
                  {a.notes && (
                    <div className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5 max-w-xl">
                      {a.notes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <ScoreBadge score={a.score} raw={a.scoreRaw} />
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={a.status} label={a.statusLabel} />
                </td>
                <td className="py-3 px-3 text-xs text-[var(--color-text-faint)] whitespace-nowrap">
                  {a.date}
                </td>
                <td className="py-3 px-3 text-center">
                  {a.reportSlug ? (
                    <Link
                      href={`/reports/${a.reportSlug}`}
                      className="inline-grid place-items-center size-8 rounded-lg text-[var(--color-brand-soft)] hover:bg-[var(--color-surface)]"
                      title="Open report"
                    >
                      <FileText size={15} />
                    </Link>
                  ) : (
                    <span className="text-[var(--color-text-faint)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="p-10 text-center text-sm text-[var(--color-text-faint)]">
            No applications match your filters.
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((a, i) => (
          <Link
            key={`${a.num}-${i}`}
            href={a.reportSlug ? `/reports/${a.reportSlug}` : "#"}
            className="card p-4 flex gap-3 items-start"
          >
            <ScoreBadge score={a.score} raw={a.scoreRaw} />
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{a.company}</div>
              <div className="text-xs text-[var(--color-text-faint)] line-clamp-2">
                {a.role}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={a.status} label={a.statusLabel} />
                <span className="text-xs text-[var(--color-text-faint)]">
                  {relativeDate(a.date)}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {!filtered.length && (
          <div className="card p-8 text-center text-sm text-[var(--color-text-faint)]">
            No applications match your filters.
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--color-text-faint)] mt-3">
        Showing {filtered.length} of {apps.length} applications.
      </p>
    </div>
  );
}

function Th({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th className={cn("py-3 px-3 font-medium", className)}>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-[var(--color-text)]"
      >
        {children}
        <ArrowUpDown size={12} className="opacity-50" />
      </button>
    </th>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
      )}
    >
      {children}
    </button>
  );
}
