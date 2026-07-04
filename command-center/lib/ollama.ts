import fs from "node:fs";
import { P } from "./paths";
import type { OllamaModel } from "./types";

export const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export async function listOllamaModels(): Promise<{
  reachable: boolean;
  models: OllamaModel[];
  error?: string;
}> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return { reachable: false, models: [], error: `HTTP ${res.status}` };
    const data = (await res.json()) as { models?: any[] };
    const models: OllamaModel[] = (data.models ?? []).map((m) => ({
      name: m.name,
      size: m.size ?? 0,
      family: m.details?.family,
      parameterSize: m.details?.parameter_size,
      modified: m.modified_at,
    }));
    models.sort((a, b) => b.size - a.size);
    return { reachable: true, models };
  } catch (e: any) {
    return {
      reachable: false,
      models: [],
      error: e?.name === "TimeoutError" ? "Ollama not responding" : String(e?.message ?? e),
    };
  }
}

function readTrim(file: string, max = 16000): string {
  try {
    const s = fs.readFileSync(file, "utf8");
    return s.length > max ? s.slice(0, max) + "\n…[truncated]" : s;
  } catch {
    return "";
  }
}

/**
 * Build the evaluation prompt from the user's real modes + CV + profile,
 * mirroring the CLI `oferta` flow as closely as a single-shot prompt allows.
 */
export function buildEvalPrompt(jd: string): { system: string; prompt: string } {
  // Keep the prompt comfortably under an 8k-token context so the model
  // doesn't truncate the (essential) CV and so first-token latency stays
  // reasonable on local hardware. The CV + JD carry the most signal.
  const cv = readTrim(P.cv(), 11000);
  const shared = readTrim(P.modesShared(), 4500);
  const oferta = readTrim(P.modeOferta(), 4500);
  const profileMode = readTrim(P.modeProfile(), 2500);

  const system = [
    "You are Career-Ops, an elite AI job-search analyst. You evaluate a job description against the candidate's CV and produce a rigorous, honest report.",
    "Be specific and critical. Never inflate scores. Cite concrete CV evidence. Use the exact block structure requested.",
    "Output GitHub-flavored Markdown only.",
  ].join(" ");

  const prompt = `# SYSTEM CONTEXT (modes/_shared.md)
${shared}

# USER PROFILE OVERRIDES (modes/_profile.md)
${profileMode}

# EVALUATION INSTRUCTIONS (modes/oferta.md)
${oferta}

# CANDIDATE CV (cv.md)
${cv}

# JOB DESCRIPTION TO EVALUATE
${jd}

---
Produce the full evaluation report now. Start with a header that includes:
- A one-line role/company title
- **Date**, **Archetype**, **Score:** (X.X/5), **Legitimacy:**
Then Blocks A–F (Role Summary, Match with CV, Level & Strategy, Comp & Demand, Customization Plan, Interview Plan) and a final Block G legitimacy assessment.
End with a fenced \`\`\`yaml Machine Summary block containing: company, role, score, archetype, recommendation (APPLY/CONSIDER/SKIP).`;

  return { system, prompt };
}
