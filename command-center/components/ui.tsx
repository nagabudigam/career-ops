import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="grid place-items-center size-11 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] text-white shrink-0 shadow-lg shadow-[var(--color-brand)]/20">
            <Icon size={20} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon: Icon,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad" | "brand";
  icon?: React.ComponentType<{ size?: number | string }>;
  href?: string;
}) {
  const toneColor = {
    default: "var(--color-text)",
    good: "var(--color-good)",
    warn: "var(--color-warn)",
    bad: "var(--color-bad)",
    brand: "var(--color-brand-soft)",
  }[tone];

  const inner = (
    <div className="card p-5 h-full transition-all hover:border-[var(--color-brand)]/40 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
        {Icon && (
          <span className="text-[var(--color-text-faint)]">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div
        className="mt-2 text-3xl font-semibold tracking-tight tabular-nums"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--color-text-faint)]">{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "info" | "brand";
  className?: string;
}) {
  const map = {
    default: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]",
    good: "bg-[var(--color-good)]/12 text-[var(--color-good)] border-[var(--color-good)]/25",
    warn: "bg-[var(--color-warn)]/12 text-[var(--color-warn)] border-[var(--color-warn)]/25",
    bad: "bg-[var(--color-bad)]/12 text-[var(--color-bad)] border-[var(--color-bad)]/25",
    info: "bg-[var(--color-info)]/12 text-[var(--color-info)] border-[var(--color-info)]/25",
    brand: "bg-[var(--color-brand)]/12 text-[var(--color-brand-soft)] border-[var(--color-brand)]/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        map[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
        {children}
      </h2>
      {right}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number | string }>;
}) {
  return (
    <div className="card p-10 text-center">
      {Icon && (
        <span className="inline-grid place-items-center size-12 rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-faint)] mb-3">
          <Icon size={22} />
        </span>
      )}
      <div className="font-medium">{title}</div>
      {hint && (
        <div className="text-sm text-[var(--color-text-faint)] mt-1 max-w-md mx-auto">
          {hint}
        </div>
      )}
    </div>
  );
}
