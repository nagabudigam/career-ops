import { spawn } from "node:child_process";
import { repoRoot } from "./paths";

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Run a career-ops node script from the repo root.
 * Used for the zero-token deterministic tools (scan, analyze-patterns,
 * followup-cadence, check-liveness, generate-pdf).
 */
export function runNode(
  scriptArgs: string[],
  opts: { timeoutMs?: number } = {}
): Promise<RunResult> {
  return new Promise((resolve) => {
    // In the Electron desktop build, CAREER_OPS_NODE points at the Electron
    // binary and CAREER_OPS_ELECTRON enables Node mode — so the career-ops
    // .mjs scripts run on Electron's bundled Node, with no separate Node
    // install required. In dev/server mode these are unset → plain "node".
    const nodeBin = process.env.CAREER_OPS_NODE || "node";
    const env: NodeJS.ProcessEnv = { ...process.env };
    if (process.env.CAREER_OPS_ELECTRON) env.ELECTRON_RUN_AS_NODE = "1";
    const child = spawn(nodeBin, scriptArgs, {
      cwd: repoRoot(),
      env,
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, opts.timeoutMs ?? 120_000);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ code: 1, stdout, stderr: stderr + String(err) });
    });
  });
}

/** Parse the first JSON object/array found in stdout (scripts print JSON). */
export function extractJson<T = unknown>(stdout: string): T | null {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }
  // try to find a JSON block
  const start = trimmed.search(/[[{]/);
  if (start === -1) return null;
  for (let end = trimmed.length; end > start; end--) {
    const c = trimmed[end - 1];
    if (c !== "}" && c !== "]") continue;
    try {
      return JSON.parse(trimmed.slice(start, end)) as T;
    } catch {
      /* keep shrinking */
    }
  }
  return null;
}
