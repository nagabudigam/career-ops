import fs from "node:fs";
import path from "node:path";
import { P } from "@/lib/paths";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** Safely serve a file from the repo's output/ directory (no path traversal). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;
  const outDir = P.outputDir();
  const target = path.resolve(outDir, ...file.map((p) => decodeURIComponent(p)));
  // Containment check
  if (target !== outDir && !target.startsWith(outDir + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return new Response("Not found", { status: 404 });
  }
  const ext = path.extname(target).toLowerCase();
  const data = fs.readFileSync(target);
  return new Response(data, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
