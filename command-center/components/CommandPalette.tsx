"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, FileText, Briefcase, Inbox, ArrowRight } from "lucide-react";
import { NAV } from "./nav";

interface Item {
  type: string;
  title: string;
  sub?: string;
  href: string;
  external?: boolean;
  score?: number | null;
  status?: string | null;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Item[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen as EventListener);
    };
  }, []);

  // Lazy-load the search index on first open
  useEffect(() => {
    if (open && !index) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((d) => {
          const items: Item[] = [
            ...NAV.map((n) => ({ type: "page", title: n.label, sub: n.desc, href: n.href })),
            ...(d.apps ?? []),
            ...(d.reports ?? []),
            ...(d.pipeline ?? []),
          ];
          setIndex(items);
        })
        .catch(() => setIndex([]));
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open, index]);

  const results = useMemo(() => {
    if (!index) return [];
    const n = q.trim().toLowerCase();
    if (!n) return index.slice(0, 8);
    return index
      .filter((it) => `${it.title} ${it.sub ?? ""}`.toLowerCase().includes(n))
      .slice(0, 30);
  }, [q, index]);

  useEffect(() => setActive(0), [q]);

  function go(it: Item) {
    setOpen(false);
    if (it.external) window.open(it.href, "_blank");
    else router.push(it.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl card !p-0 overflow-hidden shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
          <Search size={18} className="text-[var(--color-text-faint)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
            }}
            placeholder="Search companies, reports, pages…"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none"
          />
          <kbd className="text-[10px] text-[var(--color-text-faint)] border border-[var(--color-border)] rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {results.length ? (
            results.map((it, i) => (
              <button
                key={`${it.type}-${it.href}-${i}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(it)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                  i === active ? "bg-[var(--color-surface-2)]" : ""
                }`}
              >
                <span className="text-[var(--color-text-faint)]">
                  {it.type === "report" ? <FileText size={15} /> : it.type === "application" ? <Briefcase size={15} /> : it.type === "pipeline" ? <Inbox size={15} /> : <ArrowRight size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{it.title}</div>
                  {it.sub && <div className="text-xs text-[var(--color-text-faint)] truncate">{it.sub}</div>}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-faint)]">{it.type}</span>
                {i === active && <CornerDownLeft size={13} className="text-[var(--color-text-faint)]" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-faint)]">
              {index ? "No matches." : "Loading…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
