import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Calendar, Tag } from "lucide-react";
import { getReport } from "@/lib/reports";
import { ReportMarkdown } from "@/components/ReportMarkdown";
import { ScoreRing } from "@/components/badges";
import { Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = getReport(id);
  if (!report) notFound();

  return (
    <div className="animate-in">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
      >
        <ArrowLeft size={15} /> All reports
      </Link>

      {/* Header card */}
      <div className="card p-5 mb-4 flex flex-col sm:flex-row gap-4 items-start">
        <ScoreRing score={report.score} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {report.company ?? report.slug}
          </h1>
          {report.role && (
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{report.role}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[11px] font-mono text-[var(--color-text-faint)]">
              report #{report.id}
            </span>
            {report.legitimacy && (
              <Pill tone="default">
                <ShieldCheck size={12} /> {report.legitimacy}
              </Pill>
            )}
            {report.archetype && (
              <Pill tone="brand">
                <Tag size={12} /> {report.archetype}
              </Pill>
            )}
            {report.date && (
              <Pill tone="default">
                <Calendar size={12} /> {report.date}
              </Pill>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        <article className="card p-5 sm:p-7 min-w-0 order-2 lg:order-1">
          <ReportMarkdown markdown={report.markdown} />
        </article>

        {/* Sticky TOC */}
        {report.headings.length > 0 && (
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-6">
              <div className="card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  On this page
                </div>
                <nav className="space-y-0.5 text-sm max-h-[60vh] overflow-y-auto no-scrollbar">
                  {report.headings.map((h, i) => (
                    <a
                      key={i}
                      href={`#${h.id}`}
                      className={`block py-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand-soft)] truncate ${
                        h.level === 3 ? "pl-3 text-xs" : ""
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
