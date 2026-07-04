import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  evaluated: "bg-[var(--color-info)]/12 text-[var(--color-info)] border-[var(--color-info)]/25",
  applied: "bg-[var(--color-brand)]/15 text-[var(--color-brand-soft)] border-[var(--color-brand)]/30",
  responded: "bg-[var(--color-accent)]/12 text-[var(--color-accent)] border-[var(--color-accent)]/25",
  interview: "bg-[var(--color-warn)]/15 text-[var(--color-warn)] border-[var(--color-warn)]/30",
  offer: "bg-[var(--color-good)]/15 text-[var(--color-good)] border-[var(--color-good)]/30",
  rejected: "bg-[var(--color-bad)]/12 text-[var(--color-bad)] border-[var(--color-bad)]/25",
  discarded: "bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border-[var(--color-border)]",
  skip: "bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border-[var(--color-border)]",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const tone = STATUS_TONE[status] ?? STATUS_TONE.discarded;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label ?? status}
    </span>
  );
}

export function ScoreBadge({ score, raw }: { score: number | null; raw?: string }) {
  const tone = scoreTone(score);
  const color = {
    good: "var(--color-good)",
    warn: "var(--color-warn)",
    bad: "var(--color-bad)",
    faint: "var(--color-text-faint)",
  }[tone];
  return (
    <span
      className="inline-flex items-center rounded-lg px-2 py-0.5 text-sm font-semibold tabular-nums border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {score !== null ? score.toFixed(1) : raw ?? "—"}
    </span>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number | null; size?: number }) {
  const tone = scoreTone(score);
  const color = {
    good: "var(--color-good)",
    warn: "var(--color-warn)",
    bad: "var(--color-bad)",
    faint: "var(--color-text-faint)",
  }[tone];
  const pct = score !== null ? Math.min(score / 5, 1) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        {score !== null ? score.toFixed(1) : "—"}
      </div>
    </div>
  );
}
