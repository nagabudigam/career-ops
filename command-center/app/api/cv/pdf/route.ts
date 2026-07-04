import { NextResponse } from "next/server";
import { generateCvPdf } from "@/lib/cv";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { markdown?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.markdown?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing CV markdown" }, { status: 400 });
  }
  const result = await generateCvPdf(body.markdown, body.name || "tailored");
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
