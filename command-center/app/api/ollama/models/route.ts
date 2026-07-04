import { NextResponse } from "next/server";
import { listOllamaModels } from "@/lib/ollama";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await listOllamaModels();
  return NextResponse.json(result);
}
