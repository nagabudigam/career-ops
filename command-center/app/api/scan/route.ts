import { NextResponse } from "next/server";
import { runNode } from "@/lib/run-script";
import path from "node:path";
import { repoRoot } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Trigger the zero-token portal scanner (scan.mjs).
 * Body: { dryRun?: boolean, company?: string }
 * Runs with --dry-run by default so nothing is written unless explicitly asked.
 */
export async function POST(req: Request) {
  let body: { dryRun?: boolean; company?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* default to dry run */
  }
  const dryRun = body.dryRun !== false; // default true
  const args = [path.join(repoRoot(), "scan.mjs")];
  if (dryRun) args.push("--dry-run");
  if (body.company) args.push(`--company=${body.company}`);

  const result = await runNode(args, { timeoutMs: 240_000 });
  return NextResponse.json({
    ok: result.code === 0,
    code: result.code,
    dryRun,
    output: (result.stdout + (result.stderr ? "\n" + result.stderr : "")).slice(-20000),
  });
}
