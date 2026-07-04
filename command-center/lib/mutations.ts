import fs from "node:fs";
import { P } from "./paths";
import { canonicalStatus, allStates } from "./states";
import { clearApplicationsCache } from "./applications";

function isDataRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  if (/^\|\s*#\s*\|/.test(t)) return false;
  if (/^\|[\s|:-]+\|$/.test(t)) return false;
  return true;
}

function cellsOf(line: string): string[] {
  return line.trim().split("|").slice(1, -1).map((c) => c.trim());
}

/**
 * Update the Status (and optionally Notes) of an EXISTING tracker row.
 * Matches on num + company + role to disambiguate non-unique numbers.
 * Editing existing rows is permitted by the data contract; ADDING new rows
 * must go through the TSV + merge-tracker flow (see saveEvaluation).
 */
export function updateApplicationStatus(opts: {
  num: number;
  company: string;
  role: string;
  status: string;
  note?: string;
}): { ok: boolean; matched: number; error?: string } {
  const valid = allStates().some((s) => s.id === opts.status.toLowerCase());
  if (!valid) return { ok: false, matched: 0, error: `Unknown status: ${opts.status}` };
  const { label } = canonicalStatus(opts.status);

  const file = P.applications();
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e: any) {
    return { ok: false, matched: 0, error: String(e?.message ?? e) };
  }

  const lines = raw.split("\n");
  let matched = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!isDataRow(lines[i])) continue;
    const cells = cellsOf(lines[i]);
    if (cells.length < 9) continue;
    if (
      cells[0] === String(opts.num) &&
      cells[2] === opts.company &&
      cells[3] === opts.role
    ) {
      cells[5] = label; // Status column
      if (opts.note != null) cells[8] = opts.note.replace(/\|/g, "/"); // Notes
      lines[i] = `| ${cells.join(" | ")} |`;
      matched++;
    }
  }

  if (!matched) return { ok: false, matched: 0, error: "Row not found" };
  fs.writeFileSync(file, lines.join("\n"));
  clearApplicationsCache();
  return { ok: true, matched };
}
