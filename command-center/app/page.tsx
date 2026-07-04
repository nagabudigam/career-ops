import Link from "next/link";
import {
  Briefcase,
  Inbox,
  Radar,
  Trophy,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { loadApplications, trackerStats } from "@/lib/applications";
import { loadPipeline, pipelineStats } from "@/lib/pipeline";
import { loadScanHistory, scanStats } from "@/lib/scan-history";
import { loadProfile } from "@/lib/profile";
import { allStates } from "@/lib/states";
import { StatCard, Card, SectionTitle } from "@/components/ui";
import { StatusBadge, ScoreBadge } from "@/components/badges";
import { DonutChart, MiniBar } from "@/components/charts";
import { OllamaStatus } from "@/components/OllamaStatus";
import { InboxAlert } from "@/components/InboxAlert";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  evaluated: "#60a5fa",
  applied: "#6366f1",
  responded: "#22d3ee",
  interview: "#fbbf24",
  offer: "#34d399",
  rejected: "#f87171",
  discarded: "#4b5563",
  skip: "#6b7280",
};

export default function DashboardPage() {
  const apps = loadApplications();
  const stats = trackerStats(apps);
  const pipe = pipelineStats(loadPipeline());
  const scan = scanStats(loadScanHistory());
  const profile = loadProfile();
  const states = allStates();

  const donut = states
    .map((s) => ({
      name: s.label,
      value: stats.byStatus[s.id] ?? 0,
      color: STATUS_COLORS[s.id] ?? "#6366f1",
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="animate-in">
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          {profile.fullName ? `Welcome back, ${profile.fullName.split(" ")[0]}` : "Welcome back"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Command Center
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Applications"
          value={stats.total}
          sub={`${stats.withPdf} with CV/PDF`}
          icon={Briefcase}
          href="/applications"
        />
        <StatCard
          label="High-fit (≥4.0)"
          value={stats.highFit}
          sub={`of ${stats.scoredCount} scored`}
          tone="good"
          icon={Target}
          href="/applications?min=4"
        />
        <StatCard
          label="Avg score"
          value={stats.avgScore ? stats.avgScore.toFixed(2) : "—"}
          sub="across evaluations"
          tone="brand"
          icon={TrendingUp}
        />
        <StatCard
          label="Pipeline"
          value={pipe.pending}
          sub={`${pipe.companies} companies`}
          icon={Inbox}
          href="/pipeline"
        />
      </div>

      {/* Funnel pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <StatCard label="Evaluated" value={stats.evaluated} />
        <StatCard label="Applied" value={stats.applied} tone="brand" />
        <StatCard label="Interview" value={stats.interview} tone="warn" />
        <StatCard label="Offers" value={stats.offer} tone="good" icon={Trophy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Status donut */}
        <Card className="lg:col-span-1">
          <SectionTitle>Status breakdown</SectionTitle>
          {donut.length ? (
            <>
              <DonutChart data={donut} />
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4">
                {donut.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-[var(--color-text-muted)] flex-1 truncate">
                      {d.name}
                    </span>
                    <span className="tabular-nums font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-faint)]">No data yet.</p>
          )}
        </Card>

        {/* Score distribution */}
        <Card className="lg:col-span-2">
          <SectionTitle right={<span className="text-xs text-[var(--color-text-faint)]">{stats.scoredCount} scored</span>}>
            Score distribution
          </SectionTitle>
          <MiniBar data={stats.scoreBuckets} />
          <p className="text-xs text-[var(--color-text-faint)] mt-2">
            Scores ≥ 4.0 are recommended-to-apply; the engine discourages applying below 4.0.
          </p>
        </Card>
      </div>

      {/* Recent + side rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <SectionTitle>Recent evaluations</SectionTitle>
            <Link
              href="/applications"
              className="text-xs text-[var(--color-brand-soft)] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border-soft)]">
            {stats.topRecent.map((a, i) => (
              <Link
                key={`${a.num}-${i}`}
                href={a.reportSlug ? `/reports/${a.reportSlug}` : "/applications"}
                className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <ScoreBadge score={a.score} raw={a.scoreRaw} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{a.company}</div>
                  <div className="text-xs text-[var(--color-text-faint)] truncate">
                    {a.role}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <StatusBadge status={a.status} label={a.statusLabel} />
                </div>
                <span className="text-xs text-[var(--color-text-faint)] w-16 text-right shrink-0">
                  {relativeDate(a.date)}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <InboxAlert />
          <OllamaStatus />
          <Card>
            <SectionTitle>Scanner</SectionTitle>
            <div className="text-3xl font-semibold tabular-nums">{scan.total}</div>
            <div className="text-xs text-[var(--color-text-faint)]">
              jobs scanned · {scan.companies} companies
            </div>
            {scan.lastDate && (
              <div className="text-xs text-[var(--color-text-muted)] mt-2">
                Last scan {relativeDate(scan.lastDate)}
              </div>
            )}
            <Link
              href="/scan"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-soft)] hover:underline"
            >
              <Radar size={14} /> Open scanner
            </Link>
          </Card>
          <Link href="/evaluate" className="block">
            <div className="card p-5 bg-gradient-to-br from-[var(--color-brand)]/15 to-[var(--color-accent)]/8 border-[var(--color-brand)]/30 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles size={18} className="text-[var(--color-brand-soft)]" />
                Evaluate a job
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                Paste a JD and get a full A–F report from your local Ollama model — fully private.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
