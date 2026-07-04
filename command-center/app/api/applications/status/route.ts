import { NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { num?: number; company?: string; role?: string; status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (
    body.num == null ||
    !body.company ||
    !body.role ||
    !body.status
  ) {
    return NextResponse.json(
      { ok: false, error: "num, company, role, status required" },
      { status: 400 }
    );
  }
  const result = updateApplicationStatus({
    num: body.num,
    company: body.company,
    role: body.role,
    status: body.status,
    note: body.note,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
