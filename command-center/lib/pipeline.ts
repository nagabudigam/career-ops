import { P, safeRead } from "./paths";
import type { PipelineItem } from "./types";

export function loadPipeline(): PipelineItem[] {
  const raw = safeRead(P.pipeline());
  if (!raw) return [];
  const items: PipelineItem[] = [];
  let section = "Pending";
  for (const line of raw.split("\n")) {
    const t = line.trim();
    const sec = t.match(/^#{1,3}\s+(.+)$/);
    if (sec) {
      section = sec[1].trim();
      continue;
    }
    const m = t.match(/^- \[( |x|X)\]\s+(.+)$/);
    if (!m) continue;
    const done = m[1].toLowerCase() === "x";
    const rest = m[2];
    // "URL | Company | Role"  (local:jds/foo also possible)
    const parts = rest.split("|").map((s) => s.trim());
    const url = parts[0] ?? "";
    items.push({
      url,
      company: parts[1] ?? "",
      role: parts.slice(2).join(" | ") ?? "",
      done,
      section,
    });
  }
  return items;
}

export function pipelineStats(items: PipelineItem[]) {
  const pending = items.filter((i) => !i.done);
  const byCompany: Record<string, number> = {};
  for (const i of pending) {
    if (i.company) byCompany[i.company] = (byCompany[i.company] ?? 0) + 1;
  }
  const topCompanies = Object.entries(byCompany)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  return {
    total: items.length,
    pending: pending.length,
    done: items.length - pending.length,
    companies: Object.keys(byCompany).length,
    topCompanies,
  };
}
