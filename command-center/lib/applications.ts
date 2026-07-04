import { P, safeRead } from "./paths";
import { canonicalStatus } from "./states";
import { reportFileIndex } from "./reports";
import type { Application } from "./types";

function parseScore(cell: string): { score: number | null; raw: string } {
  const raw = cell.trim();
  const m = raw.match(/([\d.]+)\s*\/\s*5/);
  if (m) return { score: parseFloat(m[1]), raw };
  const n = raw.match(/^([\d.]+)$/);
  if (n) return { score: parseFloat(n[1]), raw };
  return { score: null, raw };
}

function parseReport(cell: string): { num: string | null; file: string | null } {
  // "[663](../reports/663-google-2026-06-19.md)" or "[663](reports/...)"
  const num = cell.match(/\[(\d+)\]/);
  const path = cell.match(/\(([^)]*reports\/([^)]+?\.md))\)/);
  return { num: num ? num[1] : null, file: path ? path[2] : null };
}

let cache: Application[] | null = null;

export function clearApplicationsCache() {
  cache = null;
}

export function loadApplications(): Application[] {
  if (cache) return cache;
  const raw = safeRead(P.applications());
  if (!raw) {
    cache = [];
    return cache;
  }
  const idx = reportFileIndex();
  const existing = new Set(idx.values());
  const apps: Application[] = [];

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    // skip header + separator rows (test the ORIGINAL line: a separator
    // contains only pipes, dashes, colons and spaces — no letters/digits).
    if (/^\|\s*#\s*\|/.test(t)) continue;
    if (/^\|[\s|:-]+\|$/.test(t)) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 9) continue;
    const num = parseInt(cells[0], 10);
    if (isNaN(num)) continue;

    const { score, raw: scoreRaw } = parseScore(cells[4]);
    const { id: statusId, label: statusLabel } = canonicalStatus(cells[5]);
    const { num: reportNum, file: reportFile } = parseReport(cells[7]);
    // Prefer the exact filename the tracker points at (handles non-unique
    // report numbers); fall back to resolving by number; null if neither exists.
    let reportSlug: string | null = null;
    if (reportFile && existing.has(reportFile)) {
      reportSlug = reportFile.replace(/\.md$/, "");
    } else if (reportNum && idx.has(reportNum)) {
      reportSlug = idx.get(reportNum)!.replace(/\.md$/, "");
    }

    apps.push({
      num,
      date: cells[1],
      company: cells[2],
      role: cells[3],
      score,
      scoreRaw,
      status: statusId,
      statusLabel,
      pdf: /✅|yes|true/i.test(cells[6]),
      reportNum,
      reportSlug,
      notes: cells[8],
    });
  }

  apps.sort((a, b) => {
    // sort by date desc, then num desc
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.num - a.num;
  });
  cache = apps;
  return cache;
}

export interface TrackerStats {
  total: number;
  byStatus: Record<string, number>;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  evaluated: number;
  withPdf: number;
  avgScore: number | null;
  scoredCount: number;
  highFit: number; // score >= 4
  scoreBuckets: { label: string; count: number }[];
  topRecent: Application[];
}

export function trackerStats(apps: Application[]): TrackerStats {
  const byStatus: Record<string, number> = {};
  let scoreSum = 0;
  let scoredCount = 0;
  let withPdf = 0;
  let highFit = 0;
  const buckets = { "<2": 0, "2–3": 0, "3–4": 0, "4–4.5": 0, "4.5+": 0 };

  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    if (a.pdf) withPdf++;
    if (a.score !== null) {
      scoreSum += a.score;
      scoredCount++;
      if (a.score >= 4) highFit++;
      if (a.score < 2) buckets["<2"]++;
      else if (a.score < 3) buckets["2–3"]++;
      else if (a.score < 4) buckets["3–4"]++;
      else if (a.score < 4.5) buckets["4–4.5"]++;
      else buckets["4.5+"]++;
    }
  }

  return {
    total: apps.length,
    byStatus,
    applied: byStatus["applied"] ?? 0,
    interview: byStatus["interview"] ?? 0,
    offer: byStatus["offer"] ?? 0,
    rejected: byStatus["rejected"] ?? 0,
    evaluated: byStatus["evaluated"] ?? 0,
    withPdf,
    avgScore: scoredCount ? scoreSum / scoredCount : null,
    scoredCount,
    highFit,
    scoreBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
    topRecent: apps.slice(0, 8),
  };
}
