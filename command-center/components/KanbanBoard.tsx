"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical, Loader2 } from "lucide-react";
import type { Application, StateDef } from "@/lib/types";
import { ScoreBadge } from "./badges";

// Columns shown on the board, in funnel order.
const COLUMNS = ["evaluated", "applied", "responded", "interview", "offer", "rejected"];

const COL_ACCENT: Record<string, string> = {
  evaluated: "#60a5fa",
  applied: "#6366f1",
  responded: "#22d3ee",
  interview: "#fbbf24",
  offer: "#34d399",
  rejected: "#f87171",
};

export function KanbanBoard({ apps, states }: { apps: Application[]; states: StateDef[] }) {
  const [items, setItems] = useState(apps);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const labelFor = (id: string) => states.find((s) => s.id === id)?.label ?? id;
  const keyOf = (a: Application, i: number) => `${a.num}-${i}`;

  async function moveTo(item: Application, idx: number, status: string) {
    if (item.status === status) return;
    const k = keyOf(item, idx);
    setSaving(k);
    // optimistic
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, status, statusLabel: labelFor(status) } : x)));
    try {
      const res = await fetch("/api/applications/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num: item.num, company: item.company, role: item.role, status }),
      }).then((r) => r.json());
      if (!res.ok) {
        // revert
        setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, status: item.status, statusLabel: item.statusLabel } : x)));
      }
    } catch {
      setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, status: item.status, statusLabel: item.statusLabel } : x)));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map((col) => {
        const colItems = items
          .map((a, i) => ({ a, i }))
          .filter(({ a }) => a.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col);
            }}
            onDragLeave={() => setDragOver((c) => (c === col ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const payload = e.dataTransfer.getData("text/plain");
              const idx = Number(payload);
              if (!isNaN(idx) && items[idx]) moveTo(items[idx], idx, col);
            }}
            className={`w-72 shrink-0 rounded-2xl border transition-colors ${
              dragOver === col
                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                : "border-[var(--color-border)] bg-[var(--color-bg-soft)]/40"
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border-soft)] sticky top-0">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: COL_ACCENT[col] }} />
                <span className="text-sm font-medium">{labelFor(col)}</span>
              </div>
              <span className="text-xs text-[var(--color-text-faint)] tabular-nums">{colItems.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
              {colItems.map(({ a, i }) => {
                const k = keyOf(a, i);
                return (
                  <div
                    key={k}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(i));
                      setDragging(k);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={`group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 cursor-grab active:cursor-grabbing transition-opacity ${
                      dragging === k ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-[var(--color-text-faint)] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{a.company}</span>
                          {saving === k ? (
                            <Loader2 size={13} className="animate-spin text-[var(--color-text-faint)]" />
                          ) : (
                            <ScoreBadge score={a.score} raw={a.scoreRaw} />
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-faint)] line-clamp-2 mt-0.5">{a.role}</div>
                        {a.reportSlug && (
                          <Link
                            href={`/reports/${a.reportSlug}`}
                            className="text-[11px] text-[var(--color-brand-soft)] hover:underline mt-1 inline-block"
                          >
                            View report →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!colItems.length && (
                <div className="text-center text-xs text-[var(--color-text-faint)] py-6">Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
