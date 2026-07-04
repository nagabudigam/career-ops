import { P, safeRead } from "./paths";
import type { ScanRow } from "./types";

export function loadScanHistory(): ScanRow[] {
  const raw = safeRead(P.scanHistory());
  if (!raw) return [];
  const rows: ScanRow[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const c = line.split("\t");
    if (c.length < 5) continue;
    rows.push({
      url: c[0] ?? "",
      date: c[1] ?? "",
      provider: c[2] ?? "",
      title: c[3] ?? "",
      company: c[4] ?? "",
      status: c[5] ?? "",
      location: c[6] ?? "",
    });
  }
  // newest first
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows;
}

export function scanStats(rows: ScanRow[]) {
  const byProvider: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  const companies = new Set<string>();
  for (const r of rows) {
    byProvider[r.provider] = (byProvider[r.provider] ?? 0) + 1;
    if (r.date) byDate[r.date] = (byDate[r.date] ?? 0) + 1;
    if (r.company) companies.add(r.company);
  }
  const lastDate = rows[0]?.date ?? null;
  return {
    total: rows.length,
    companies: companies.size,
    providers: Object.entries(byProvider)
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count),
    lastDate,
    timeline: Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-30),
  };
}
