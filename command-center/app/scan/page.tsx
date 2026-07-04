import { Radar, Building2, Calendar, Layers } from "lucide-react";
import { loadScanHistory, scanStats } from "@/lib/scan-history";
import { PageHeader, StatCard, Card, SectionTitle } from "@/components/ui";
import { HBar, TimelineArea } from "@/components/charts";
import { ScanRunner } from "@/components/ScanRunner";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function ScanPage() {
  const rows = loadScanHistory();
  const stats = scanStats(rows);
  const recent = rows.slice(0, 25);

  return (
    <div className="animate-in">
      <PageHeader
        title="Portal scanner"
        subtitle="Zero-token job discovery across tracked company boards"
        icon={Radar}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Jobs scanned" value={stats.total} icon={Layers} />
        <StatCard label="Companies" value={stats.companies} icon={Building2} />
        <StatCard label="Providers" value={stats.providers.length} />
        <StatCard
          label="Last scan"
          value={stats.lastDate ? relativeDate(stats.lastDate) : "—"}
          sub={stats.lastDate ?? ""}
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-1">
          <ScanRunner />
        </div>
        <Card className="lg:col-span-2">
          <SectionTitle>Scan activity</SectionTitle>
          {stats.timeline.length ? (
            <TimelineArea data={stats.timeline} />
          ) : (
            <p className="text-sm text-[var(--color-text-faint)]">No scan history yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionTitle>By provider</SectionTitle>
          <HBar data={stats.providers.map((p) => ({ label: p.provider, count: p.count }))} />
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-5 pb-3">
            <SectionTitle>Recently discovered</SectionTitle>
          </div>
          <div className="divide-y divide-[var(--color-border-soft)] max-h-[420px] overflow-y-auto">
            {recent.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-xs text-[var(--color-text-faint)] truncate">
                    {r.company} {r.location ? `· ${r.location}` : ""}
                  </div>
                </div>
                <span className="text-[10px] text-[var(--color-text-faint)] shrink-0">
                  {relativeDate(r.date)}
                </span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
