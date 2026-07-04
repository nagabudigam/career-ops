"use client";

import { useState } from "react";
import { Table, Columns3 } from "lucide-react";
import type { Application, StateDef } from "@/lib/types";
import { ApplicationsTable } from "./ApplicationsTable";
import { KanbanBoard } from "./KanbanBoard";

export function ApplicationsView({
  apps,
  states,
  initialMin = 0,
}: {
  apps: Application[];
  states: StateDef[];
  initialMin?: number;
}) {
  const [view, setView] = useState<"table" | "board">("table");

  return (
    <div>
      <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-lg p-0.5 w-fit mb-4">
        <button
          onClick={() => setView("table")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "table" ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"
          }`}
        >
          <Table size={14} /> Table
        </button>
        <button
          onClick={() => setView("board")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "board" ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"
          }`}
        >
          <Columns3 size={14} /> Board
        </button>
      </div>

      {view === "table" ? (
        <ApplicationsTable apps={apps} states={states} initialMin={initialMin} />
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-faint)] mb-3">
            Drag cards between columns to update status — writes back to <code className="font-mono">applications.md</code>.
          </p>
          <KanbanBoard apps={apps} states={states} />
        </>
      )}
    </div>
  );
}
