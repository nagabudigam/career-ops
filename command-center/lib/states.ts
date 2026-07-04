import yaml from "js-yaml";
import { P, safeRead } from "./paths";
import type { StateDef } from "./types";

let cache: { defs: StateDef[]; aliasMap: Map<string, StateDef> } | null = null;

const FALLBACK: StateDef[] = [
  { id: "evaluated", label: "Evaluated", aliases: [], description: "", group: "evaluated" },
  { id: "applied", label: "Applied", aliases: ["sent"], description: "", group: "applied" },
  { id: "responded", label: "Responded", aliases: [], description: "", group: "responded" },
  { id: "interview", label: "Interview", aliases: [], description: "", group: "interview" },
  { id: "offer", label: "Offer", aliases: [], description: "", group: "offer" },
  { id: "rejected", label: "Rejected", aliases: [], description: "", group: "rejected" },
  { id: "discarded", label: "Discarded", aliases: ["closed"], description: "", group: "discarded" },
  { id: "skip", label: "SKIP", aliases: ["monitor"], description: "", group: "skip" },
];

export function loadStates() {
  if (cache) return cache;
  const raw = safeRead(P.statesYml());
  let defs: StateDef[] = FALLBACK;
  if (raw) {
    try {
      const parsed = yaml.load(raw) as { states?: any[] };
      if (parsed?.states?.length) {
        defs = parsed.states.map((s) => ({
          id: String(s.id).toLowerCase(),
          label: s.label ?? s.id,
          aliases: (s.aliases ?? []).map((a: string) => String(a).toLowerCase()),
          description: s.description ?? "",
          group: s.dashboard_group ?? s.id,
        }));
      }
    } catch {
      defs = FALLBACK;
    }
  }
  const aliasMap = new Map<string, StateDef>();
  for (const d of defs) {
    aliasMap.set(d.id, d);
    aliasMap.set(d.label.toLowerCase(), d);
    for (const a of d.aliases) aliasMap.set(a, d);
  }
  cache = { defs, aliasMap };
  return cache;
}

export function canonicalStatus(raw: string): { id: string; label: string } {
  const { aliasMap } = loadStates();
  const key = raw
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();
  const hit = aliasMap.get(key);
  if (hit) return { id: hit.id, label: hit.label };
  return { id: key || "unknown", label: raw.trim() || "Unknown" };
}

export function allStates(): StateDef[] {
  return loadStates().defs;
}
