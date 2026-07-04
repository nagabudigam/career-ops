import { NextResponse } from "next/server";
import { fetchResponses, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const classify = url.searchParams.get("classify") === "true";
  const force = url.searchParams.get("force") === "true";
  const days = Number(url.searchParams.get("days") || 30);

  if (!emailConfigured()) {
    return NextResponse.json({ configured: false, emails: [] });
  }
  const result = await fetchResponses({ classify, force, days });
  return NextResponse.json(result);
}
