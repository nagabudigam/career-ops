import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { P, repoRoot, safeRead } from "./paths";
import { runNode } from "./run-script";
import { slugify } from "./utils";

export function loadCv(): string {
  return safeRead(P.cv()) ?? "";
}

const PRINT_CSS = `
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.45;font-size:10.5pt;margin:0;padding:0}
.wrap{max-width:760px;margin:0 auto;padding:28px 34px}
h1{font-size:22pt;margin:0 0 2px;letter-spacing:-.5px}
h2{font-size:12pt;text-transform:uppercase;letter-spacing:.5px;color:#1a4fd6;border-bottom:1.5px solid #1a4fd6;padding-bottom:3px;margin:18px 0 8px}
h3{font-size:11pt;margin:12px 0 2px}
p{margin:5px 0}
ul{margin:5px 0;padding-left:18px}
li{margin:2px 0}
a{color:#1a4fd6;text-decoration:none}
strong{color:#000}
hr{border:none;border-top:1px solid #ddd;margin:12px 0}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:9.5pt}
th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}
th{background:#f3f5f9}
code{background:#f3f5f9;padding:1px 4px;border-radius:3px;font-size:9pt}
@page{margin:14mm}
`;

export function buildCvHtml(markdown: string, name = "CV"): string {
  const bodyHtml = marked.parse(markdown, { async: false }) as string;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${name}</title><style>${PRINT_CSS}</style></head><body><div class="wrap">${bodyHtml}</div></body></html>`;
}

export async function generateCvPdf(
  markdown: string,
  baseName: string
): Promise<{ ok: boolean; pdf?: string; html?: string; error?: string; log?: string }> {
  try {
    const outDir = P.outputDir();
    fs.mkdirSync(outDir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const slug = `cv-${slugify(baseName || "tailored")}-${date}`;
    const htmlPath = path.join(outDir, `${slug}.html`);
    const pdfPath = path.join(outDir, `${slug}.pdf`);
    fs.writeFileSync(htmlPath, buildCvHtml(markdown, baseName));

    const res = await runNode(
      [path.join(repoRoot(), "generate-pdf.mjs"), htmlPath, pdfPath, "--format=letter"],
      { timeoutMs: 90000 }
    );
    if (res.code !== 0 || !fs.existsSync(pdfPath)) {
      return {
        ok: false,
        html: `${slug}.html`,
        error: "PDF generation failed",
        log: (res.stdout + res.stderr).slice(-3000),
      };
    }
    return { ok: true, pdf: `${slug}.pdf`, html: `${slug}.html` };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
