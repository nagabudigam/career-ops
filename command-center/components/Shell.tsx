"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Sun, Command, Github, Search } from "lucide-react";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";

function openPalette() {
  window.dispatchEvent(new Event("cmdk:open"));
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [badges, setBadges] = useState<{ inbox?: number }>({});

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
    // Inbox badge: count matched responses (no classify → fast, cached).
    fetch("/api/inbox?classify=false")
      .then((r) => r.json())
      .then((d) => {
        if (d?.configured && Array.isArray(d.emails))
          setBadges({ inbox: d.emails.length });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("co-theme", next ? "light" : "dark");
    } catch {}
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-soft)]/60 glass sticky top-0 h-dvh">
        <Brand />
        <div className="px-3 pt-3">
          <button
            onClick={openPalette}
            className="w-full flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-faint)] hover:border-[var(--color-brand)]/40"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="text-[10px] border border-[var(--color-border)] rounded px-1.5 py-0.5">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
          <NavList isActive={isActive} badges={badges} />
        </nav>
        <Footer light={light} toggleTheme={toggleTheme} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-[var(--color-border)] flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid place-items-center size-7 rounded-lg bg-[var(--color-brand)] text-white">
            <Command size={16} />
          </span>
          <span className="text-sm">Career-Ops</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={openPalette}
            aria-label="Search"
            className="grid place-items-center size-9 rounded-lg hover:bg-[var(--color-surface-2)]"
          >
            <Search size={18} />
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid place-items-center size-9 rounded-lg hover:bg-[var(--color-surface-2)]"
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            className="grid place-items-center size-9 rounded-lg hover:bg-[var(--color-surface-2)]"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute top-14 left-0 bottom-0 w-72 glass border-r border-[var(--color-border)] p-3 overflow-y-auto animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <NavList isActive={isActive} badges={badges} />
          </aside>
        </div>
      )}

      <CommandPalette />

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--color-border)]"
    >
      <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-brand)]/20">
        <Command size={18} />
      </span>
      <div className="leading-tight">
        <div className="font-semibold text-[15px]">Career-Ops</div>
        <div className="text-[11px] text-[var(--color-text-faint)]">Command Center</div>
      </div>
    </Link>
  );
}

function NavList({
  isActive,
  badges,
}: {
  isActive: (href: string) => boolean;
  badges: { inbox?: number };
}) {
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const count = item.badge ? badges[item.badge] : undefined;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              )}
            >
              <span
                className={cn(
                  "grid place-items-center size-8 rounded-lg transition-colors",
                  active
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                )}
              >
                <Icon size={16} />
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              {count != null && count > 0 && (
                <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-brand)] text-white text-[11px] font-semibold tabular-nums">
                  {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer({
  light,
  toggleTheme,
}: {
  light: boolean;
  toggleTheme: () => void;
}) {
  return (
    <div className="border-t border-[var(--color-border)] p-3 flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        {light ? <Moon size={16} /> : <Sun size={16} />}
        {light ? "Dark" : "Light"}
      </button>
      <a
        href="https://github.com/santifer/career-ops"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="grid place-items-center size-9 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        <Github size={16} />
      </a>
    </div>
  );
}
