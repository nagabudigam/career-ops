import { BarChart3, Target, Lightbulb, TriangleAlert, Gauge } from "lucide-react";
import path from "node:path";
import { repoRoot } from "@/lib/paths";
import { runNode, extractJson } from "@/lib/run-script";
import { PageHeader, Card, SectionTitle, StatCard, Pill, EmptyState } from "@/components/ui";
import { MiniBar, HBar } from "@/components/charts";

export const dynamic = "force-dynamic";

interface PatternData {
  metadata: {
    total: number;
    dateRange: { from: string; to: string };
    byOutcome: Record<string, number>;
  };
  funnel: Record<string, number>;
  scoreComparison: Record<string, { avg: number; min: number; max: number; count: number }>;
  archetypeBreakdown: {
    archetype: string;
    total: number;
    positive: number;
    conversionRate: number;
  }[];
  blockerAnalysis: { blocker: string; frequency: number; percentage: number }[];
  remotePolicy: { policy: string; total: number; conversionRate: number }[];
  scoreThreshold: { recommended: number; reasoning: string; positiveRange: string };
  recommendations: { action: string; reasoning: string; impact: string }[];
}

async function getData(): Promise<PatternData | null> {
  const res = await runNode([path.join(repoRoot(), "analyze-patterns.mjs")], {
    timeoutMs: 30000,
  });
  return extractJson<PatternData>(res.stdout);
}

export default async function AnalyticsPage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="animate-in">
        <PageHeader title="Analytics" subtitle="Rejection & conversion patterns" icon={BarChart3} />
        <EmptyState
          title="Couldn’t compute patterns"
          hint="analyze-patterns.mjs returned no JSON. Make sure you have enough tracker data."
          icon={TriangleAlert}
        />
      </div>
    );
  }

  const funnel = Object.entries(data.funnel).map(([label, count]) => ({ label, count }));
  const scoreByOutcome = Object.entries(data.scoreComparison)
    .filter(([, v]) => v.count > 0)
    .map(([label, v]) => ({ label, count: v.avg }));
  const topArchetypes = [...data.archetypeBreakdown]
    .filter((a) => a.total >= 2)
    .sort((a, b) => b.conversionRate - a.conversionRate || b.total - a.total)
    .slice(0, 8)
    .map((a) => ({ label: a.archetype.slice(0, 22), count: a.conversionRate }));

  const impactTone = (i: string) =>
    i === "high" ? "bad" : i === "medium" ? "warn" : "info";

  return (
    <div className="animate-in">
      <PageHeader
        title="Analytics"
        subtitle={`${data.metadata.total} applications · ${data.metadata.dateRange.from} → ${data.metadata.dateRange.to}`}
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Positive" value={data.metadata.byOutcome.positive ?? 0} tone="good" />
        <StatCard label="Self-filtered" value={data.metadata.byOutcome.self_filtered ?? 0} tone="warn" />
        <StatCard label="Pending" value={data.metadata.byOutcome.pending ?? 0} />
        <StatCard
          label="Score threshold"
          value={data.scoreThreshold.recommended.toFixed(1)}
          tone="brand"
          icon={Gauge}
        />
      </div>

      {/* Threshold callout */}
      <div className="card p-5 mb-4 border-[var(--color-brand)]/30 bg-gradient-to-br from-[var(--color-brand)]/10 to-transparent">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-10 rounded-xl bg-[var(--color-brand)]/15 text-[var(--color-brand-soft)] shrink-0">
            <Target size={18} />
          </span>
          <div>
            <div className="font-medium">
              Apply above <span className="text-[var(--color-brand-soft)]">{data.scoreThreshold.recommended}/5</span>{" "}
              <span className="text-[var(--color-text-faint)] font-normal text-sm">
                (positive range {data.scoreThreshold.positiveRange})
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {data.scoreThreshold.reasoning}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>Conversion funnel</SectionTitle>
          <MiniBar data={funnel} color="#6366f1" />
        </Card>
        <Card>
          <SectionTitle>Avg score by outcome</SectionTitle>
          <MiniBar data={scoreByOutcome} color="#34d399" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle right={<span className="text-xs text-[var(--color-text-faint)]">% conversion</span>}>
            Best-converting archetypes
          </SectionTitle>
          {topArchetypes.length ? (
            <HBar data={topArchetypes} height={280} />
          ) : (
            <p className="text-sm text-[var(--color-text-faint)]">Not enough data.</p>
          )}
        </Card>
        <Card>
          <SectionTitle>Top blockers</SectionTitle>
          <div className="space-y-2.5 mt-1">
            {data.blockerAnalysis.map((b) => (
              <div key={b.blocker}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize">{b.blocker.replace(/-/g, " ")}</span>
                  <span className="text-[var(--color-text-faint)] tabular-nums">
                    {b.frequency}× · {b.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-bad)] rounded-full"
                    style={{ width: `${Math.min(b.percentage * 3, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!data.blockerAnalysis.length && (
              <p className="text-sm text-[var(--color-text-faint)]">No blockers detected.</p>
            )}
          </div>

          <SectionTitle right={<span className="text-xs text-[var(--color-text-faint)]">conv. %</span>}>
            <span className="mt-4 block">Remote policy</span>
          </SectionTitle>
          <div className="space-y-1.5">
            {data.remotePolicy.map((r) => (
              <div key={r.policy} className="flex items-center justify-between text-sm">
                <span className="capitalize text-[var(--color-text-muted)]">{r.policy}</span>
                <span className="tabular-nums">
                  {r.total} <span className="text-[var(--color-text-faint)]">· {r.conversionRate}%</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <SectionTitle>Recommendations</SectionTitle>
        <div className="space-y-3">
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="grid place-items-center size-8 rounded-lg bg-[var(--color-warn)]/12 text-[var(--color-warn)] shrink-0">
                <Lightbulb size={15} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{r.action}</span>
                  <Pill tone={impactTone(r.impact) as any}>{r.impact}</Pill>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{r.reasoning}</p>
              </div>
            </div>
          ))}
          {!data.recommendations.length && (
            <p className="text-sm text-[var(--color-text-faint)]">No recommendations yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
