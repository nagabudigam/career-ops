import path from "node:path";
import fs from "node:fs";

/**
 * Resolve the career-ops repo root.
 *
 * Priority:
 *   1. CAREER_OPS_ROOT env var (for future remote/Vercel deploys where the
 *      data is mounted or synced to a known location).
 *   2. The parent of this web app (the default local layout: career-ops/web).
 *   3. The current working directory as a last resort.
 */
export function repoRoot(): string {
  const env = process.env.CAREER_OPS_ROOT;
  if (env && fs.existsSync(env)) return env;

  const parent = path.resolve(process.cwd(), "..");
  if (fs.existsSync(path.join(parent, "data", "applications.md"))) return parent;
  if (fs.existsSync(path.join(process.cwd(), "data", "applications.md")))
    return process.cwd();
  return parent;
}

export const P = {
  root: () => repoRoot(),
  applications: () => path.join(repoRoot(), "data", "applications.md"),
  pipeline: () => path.join(repoRoot(), "data", "pipeline.md"),
  scanHistory: () => path.join(repoRoot(), "data", "scan-history.tsv"),
  followUps: () => path.join(repoRoot(), "data", "follow-ups.md"),
  reportsDir: () => path.join(repoRoot(), "reports"),
  statesYml: () => path.join(repoRoot(), "templates", "states.yml"),
  cv: () => path.join(repoRoot(), "cv.md"),
  profilePrimary: () => path.join(repoRoot(), "config", "naga_profile.yml"),
  profileFallback: () => path.join(repoRoot(), "config", "profile.yml"),
  modesShared: () => path.join(repoRoot(), "modes", "_shared.md"),
  modeOferta: () => path.join(repoRoot(), "modes", "oferta.md"),
  modeProfile: () => path.join(repoRoot(), "modes", "_profile.md"),
  outputDir: () => path.join(repoRoot(), "output"),
};

export function safeRead(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}
