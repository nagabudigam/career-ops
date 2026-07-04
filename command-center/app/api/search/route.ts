import { NextResponse } from "next/server";
import { loadApplications } from "@/lib/applications";
import { listReports } from "@/lib/reports";
import { loadPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** Lightweight combined index for the ⌘K palette. */
export async function GET() {
  const apps = loadApplications().map((a) => ({
    type: "application" as const,
    title: a.company,
    sub: a.role,
    score: a.score,
    status: a.statusLabel,
    href: a.reportSlug ? `/reports/${a.reportSlug}` : "/applications",
  }));

  const reports = listReports().map((r) => ({
    type: "report" as const,
    title: r.company ?? r.slug,
    sub: r.role ?? "",
    score: r.score,
    status: null,
    href: `/reports/${r.slug}`,
  }));

  const pipeline = loadPipeline()
    .filter((p) => !p.done && p.company)
    .map((p) => ({
      type: "pipeline" as const,
      title: p.company,
      sub: p.role,
      score: null,
      status: null,
      href: p.url,
      external: true,
    }));

  return NextResponse.json({ apps, reports, pipeline });
}
