"use client";

import { useEffect, useState } from "react";
import { Cpu, CircleCheck, CircleAlert, Loader2 } from "lucide-react";
import { SectionTitle } from "./ui";
import type { OllamaModel } from "@/lib/types";

export function OllamaStatus() {
  const [state, setState] = useState<{
    loading: boolean;
    reachable: boolean;
    models: OllamaModel[];
    error?: string;
  }>({ loading: true, reachable: false, models: [] });

  useEffect(() => {
    let alive = true;
    fetch("/api/ollama/models")
      .then((r) => r.json())
      .then((d) => alive && setState({ loading: false, ...d }))
      .catch(() => alive && setState({ loading: false, reachable: false, models: [] }));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="card p-5">
      <SectionTitle
        right={
          state.loading ? (
            <Loader2 size={14} className="animate-spin text-[var(--color-text-faint)]" />
          ) : state.reachable ? (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-good)]">
              <CircleCheck size={13} /> online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-bad)]">
              <CircleAlert size={13} /> offline
            </span>
          )
        }
      >
        Local models
      </SectionTitle>

      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Cpu size={16} className="text-[var(--color-brand-soft)]" />
        <span className="text-sm">Ollama</span>
      </div>

      {state.loading ? (
        <div className="mt-3 space-y-2">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-4 rounded w-1/2" />
        </div>
      ) : state.reachable ? (
        state.models.length ? (
          <ul className="mt-3 space-y-1.5">
            {state.models.slice(0, 4).map((m) => (
              <li key={m.name} className="flex items-center justify-between text-xs">
                <span className="font-mono truncate text-[var(--color-text)]">{m.name}</span>
                <span className="text-[var(--color-text-faint)] tabular-nums shrink-0 ml-2">
                  {(m.size / 1024 ** 3).toFixed(1)} GB
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-[var(--color-text-faint)]">
            No models pulled. Run <code className="font-mono">ollama pull qwen3.6</code>.
          </p>
        )
      ) : (
        <p className="mt-3 text-xs text-[var(--color-text-faint)]">
          Start Ollama with <code className="font-mono">ollama serve</code> to enable evaluations.
        </p>
      )}
    </div>
  );
}
