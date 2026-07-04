import { CalendarClock, Flame, Clock, Snowflake, TriangleAlert } from "lucide-react";
import path from "node:path";
import { repoRoot } from "@/lib/paths";
import { runNode, extractJson } from "@/lib/run-script";
import { PageHeader, Card, StatCard, EmptyState, Pill } from "@/components/ui";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

interface FollowupEntry {
  num: number;
  company: string;
  role: string;
  status: string;
  score: string;
  appliedDate: string;
  daysSinceApplication: number;
  followupCount: number;
  urgency: string;
  nextFollowupDate: string;
  daysUntilNext: number;
}

interface FollowupData {
  metadata: {
    totalTracked: number;
    actionable: number;
    overdue: number;
    urgent: number;
    cold: number;
    waiting: number;
  };
  entries: FollowupEntry[];
}

async function getData(): Promise<FollowupData | null> {
  const res = await runNode([path.join(repoRoot(), "followup-cadence.mjs")], {
    timeoutMs: 30000,
  });
  return extractJson<FollowupData>(res.stdout);
}

const URGENCY: Record<string, { tone: "bad" | "warn" | "info" | "default"; label: string }> = {
  overdue: { tone: "bad", label: "Overdue" },
  urgent: { tone: "warn", label: "Urgent" },
  waiting: { tone: "info", label: "Waiting" },
  cold: { tone: "default", label: "Cold" },
};

export default async function FollowupsPage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="animate-in">
        <PageHeader title="Follow-ups" subtitle="Outreach cadence & overdue alerts" icon={CalendarClock} />
        <EmptyState
          title="No cadence data"
          hint="followup-cadence.mjs returned nothing. Mark applications as 'applied' to start tracking cadence."
          icon={TriangleAlert}
        />
      </div>
    );
  }

  const actionable = data.entries
    .filter((e) => e.urgency in URGENCY)
    .sort((a, b) => a.daysUntilNext - b.daysUntilNext);

  return (
    <div className="animate-in">
      <PageHeader
        title="Follow-ups"
        subtitle={`${data.metadata.actionable} actionable of ${data.metadata.totalTracked} tracked`}
        icon={CalendarClock}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Overdue" value={data.metadata.overdue} tone="bad" icon={TriangleAlert} />
        <StatCard label="Urgent" value={data.metadata.urgent} tone="warn" icon={Flame} />
        <StatCard label="Waiting" value={data.metadata.waiting} icon={Clock} />
        <StatCard label="Cold" value={data.metadata.cold} icon={Snowflake} />
      </div>

      {actionable.length ? (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-[var(--color-border-soft)]">
            {actionable.map((e) => {
              const u = URGENCY[e.urgency] ?? { tone: "default" as const, label: e.urgency };
              return (
                <div
                  key={e.num}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{e.company}</div>
                    <div className="text-xs text-[var(--color-text-faint)] truncate">{e.role}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-[var(--color-text-muted)]">
                      <span className="text-[var(--color-text-faint)]">applied</span>{" "}
                      {e.daysSinceApplication}d ago
                    </div>
                    <div className="text-[var(--color-text-muted)] hidden sm:block">
                      <span className="text-[var(--color-text-faint)]">f/u</span> {e.followupCount}
                    </div>
                    <div className="text-[var(--color-text-muted)] tabular-nums w-24">
                      <span className="text-[var(--color-text-faint)]">due</span>{" "}
                      {e.nextFollowupDate}
                    </div>
                    <StatusBadge status={e.status} />
                    <Pill tone={u.tone}>{u.label}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="All caught up"
          hint="No overdue or urgent follow-ups right now."
          icon={CalendarClock}
        />
      )}
    </div>
  );
}
