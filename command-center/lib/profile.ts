import yaml from "js-yaml";
import fs from "node:fs";
import { P } from "./paths";
import type { Profile } from "./types";

export function loadProfile(): Profile {
  let file = P.profilePrimary();
  if (!fs.existsSync(file)) file = P.profileFallback();
  let doc: any = {};
  try {
    doc = yaml.load(fs.readFileSync(file, "utf8")) ?? {};
  } catch {
    return {};
  }

  const c = doc.candidate ?? {};
  const n = doc.narrative ?? {};
  const t = doc.target_roles ?? doc.targets ?? {};
  const comp = doc.target_compensation ?? doc.compensation ?? {};

  const proofPoints = Array.isArray(n.proof_points)
    ? n.proof_points.map((p: any) =>
        typeof p === "string"
          ? { name: p }
          : { name: p.name, heroMetric: p.hero_metric, detail: p.detail }
      )
    : [];

  return {
    fullName: c.full_name,
    email: c.email,
    location: c.location,
    linkedin: c.linkedin,
    github: c.github,
    huggingface: c.huggingface,
    headline: typeof n.headline === "string" ? n.headline.trim() : undefined,
    exitStory: typeof n.exit_story === "string" ? n.exit_story.trim() : undefined,
    superpowers: Array.isArray(n.superpowers) ? n.superpowers : [],
    proofPoints,
    targetRoles: Array.isArray(t.primary)
      ? t.primary
      : t.primary
        ? [t.primary]
        : [],
    archetypes: Array.isArray(t.archetypes) ? t.archetypes : [],
    compMin: comp.min != null ? String(comp.min) : undefined,
    compMax: comp.max != null ? String(comp.max) : undefined,
    compCurrency: comp.currency,
  };
}
