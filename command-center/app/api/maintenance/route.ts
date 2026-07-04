import { NextResponse } from "next/server";
import path from "node:path";
import { repoRoot } from "@/lib/paths";
import { runNode } from "@/lib/run-script";
import { loadApplications, clearApplicationsCache } from "@/lib/applications";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SCRIPTS: Record<string, { file: string; supportsDry: boolean }> = {
  verify: { file: "verify-pipeline.mjs", supportsDry: false },
  normalize: { file: "normalize-statuses.mjs", supportsDry: true },
  dedup: { file: "dedup-tracker.mjs", supportsDry: true },
  merge: { file: "merge-tracker.mjs", supportsDry: true },
};

export async function POST(req: Request) {
  let body: { task?: string; apply?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const task = body.task ?? "";
  const cfg = SCRIPTS[task];
  if (!cfg) return NextResponse.json({ ok: false, error: "Unknown task" }, { status: 400 });

  const args = [path.join(repoRoot(), cfg.file)];
  const dryRun = cfg.supportsDry && !body.apply;
  if (dryRun) args.push("--dry-run");

  const res = await runNode(args, { timeoutMs: 90000 });
  if (body.apply) clearApplicationsCache();
  return NextResponse.json({
    ok: res.code === 0,
    dryRun,
    output: (res.stdout + (res.stderr ? "\n" + res.stderr : "")).slice(-12000),
  });
}

// Read-only integrity snapshot: tracker entries whose linked report file is missing.
export async function GET() {
  const apps = loadApplications();
  const missing = apps
    .filter((a) => a.reportNum && !a.reportSlug)
    .map((a) => ({ num: a.num, company: a.company, role: a.role, reportNum: a.reportNum }));
  return NextResponse.json({ total: apps.length, missingReports: missing });
}
