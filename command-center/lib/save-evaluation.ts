import fs from "node:fs";
import path from "node:path";
import { P, repoRoot } from "./paths";
import { reportFileIndex } from "./reports";
import { loadApplications, clearApplicationsCache } from "./applications";
import { slugify } from "./utils";
import { runNode } from "./run-script";

function nextReportNumber(): number {
  let max = 0;
  for (const k of reportFileIndex().keys()) max = Math.max(max, Number(k) || 0);
  for (const a of loadApplications()) max = Math.max(max, a.num || 0);
  return max + 1;
}

export interface SaveInput {
  markdown: string;
  company: string;
  role: string;
  score: number | null;
  status?: string; // canonical id, default "evaluated"
  url?: string;
  note?: string;
}

export async function saveEvaluation(input: SaveInput): Promise<{
  ok: boolean;
  reportNum?: number;
  slug?: string;
  error?: string;
  mergeOutput?: string;
}> {
  try {
    const num = nextReportNumber();
    const padded = String(num).padStart(3, "0");
    const date = new Date().toISOString().slice(0, 10);
    const slug = `${padded}-${slugify(input.company || "company")}-${date}`;
    const status = input.status || "evaluated";
    const scoreStr = input.score != null ? `${input.score}/5` : "N/A";

    // 1) Write the report file (user layer: reports/).
    const reportPath = path.join(P.reportsDir(), `${slug}.md`);
    fs.mkdirSync(P.reportsDir(), { recursive: true });
    const header = `# Evaluation: ${input.company} — ${input.role}\n\n**Date:** ${date}\n**URL:** ${input.url || "(not provided)"}\n**Score:** ${scoreStr}\n**Legitimacy:** Unconfirmed (local-model eval)\n**Source:** Generated locally via Ollama in the Command Center\n\n---\n\n`;
    // Prepend our metadata header unless the model already emitted one.
    const md = input.markdown.trim();
    const content = /^#\sEvaluation:/.test(md) ? md : header + md;
    fs.writeFileSync(reportPath, content + "\n");

    // 2) Write the tracker-addition TSV (ADD via merge flow, never edit directly).
    const tsvDir = path.join(repoRoot(), "batch", "tracker-additions");
    fs.mkdirSync(tsvDir, { recursive: true });
    const note = (input.note || `Local-model evaluation (${date})`).replace(/[\t\n]/g, " ");
    const reportLink = `[${num}](reports/${slug}.md)`;
    const tsv = [
      num,
      date,
      input.company,
      input.role,
      status,
      scoreStr,
      "❌",
      reportLink,
      note,
    ].join("\t");
    fs.writeFileSync(path.join(tsvDir, `${slug}.tsv`), tsv + "\n");

    // 3) Merge into applications.md.
    const merge = await runNode([path.join(repoRoot(), "merge-tracker.mjs")], {
      timeoutMs: 60000,
    });
    clearApplicationsCache();

    return {
      ok: merge.code === 0,
      reportNum: num,
      slug,
      mergeOutput: (merge.stdout + merge.stderr).slice(-4000),
      error: merge.code === 0 ? undefined : "merge-tracker exited non-zero",
    };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
