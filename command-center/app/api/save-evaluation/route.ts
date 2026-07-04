import { NextResponse } from "next/server";
import { saveEvaluation } from "@/lib/save-evaluation";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.markdown || !body.company || !body.role) {
    return NextResponse.json(
      { ok: false, error: "markdown, company, role required" },
      { status: 400 }
    );
  }
  const result = await saveEvaluation({
    markdown: body.markdown,
    company: body.company,
    role: body.role,
    score: body.score ?? null,
    status: body.status,
    url: body.url,
    note: body.note,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
