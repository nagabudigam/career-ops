import { NextResponse } from "next/server";
import path from "node:path";
import { repoRoot } from "@/lib/paths";
import { runNode } from "@/lib/run-script";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const MAX = 12;

/** Check whether job-posting URLs are still live (Playwright via check-liveness.mjs). */
export async function POST(req: Request) {
  let body: { urls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const urls = (body.urls ?? []).filter((u) => /^https?:\/\//.test(u)).slice(0, MAX);
  if (!urls.length) return NextResponse.json({ ok: false, error: "No valid URLs" }, { status: 400 });

  const res = await runNode(
    [path.join(repoRoot(), "check-liveness.mjs"), "--throttle", ...urls],
    { timeoutMs: 170000 }
  );

  // Parse "<icon> <status> <url>" lines.
  const results: { url: string; status: string }[] = [];
  for (const line of res.stdout.split("\n")) {
    const m = line.match(/(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (m) results.push({ status: m[1], url: m[2] });
  }
  // Fill any unparsed as uncertain
  for (const u of urls) {
    if (!results.find((r) => r.url === u)) results.push({ url: u, status: "uncertain" });
  }

  return NextResponse.json({ ok: true, results, checked: urls.length });
}
