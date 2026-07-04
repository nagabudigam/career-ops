import { NextResponse } from "next/server";
import { loadCv } from "@/lib/cv";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ markdown: loadCv() });
}
