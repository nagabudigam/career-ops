import { OLLAMA_HOST } from "@/lib/ollama";
import { loadCv } from "@/lib/cv";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Tailor the CV markdown to a specific JD via a local Ollama model.
 * Streams the rewritten markdown back as text/plain.
 * Body: { jd: string, model: string, cv?: string }
 */
export async function POST(req: Request) {
  let body: { jd?: string; model?: string; cv?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const jd = (body.jd ?? "").trim();
  const model = (body.model ?? "").trim();
  const cv = (body.cv ?? loadCv()).trim();
  if (!jd) return new Response("Missing job description", { status: 400 });
  if (!model) return new Response("Missing model", { status: 400 });

  const system =
    "You are an expert résumé editor. You tailor a candidate's CV to a specific job description WITHOUT inventing facts. You reorder, re-emphasize, and rephrase existing content to mirror the JD's priorities and keywords. Output clean Markdown only — no commentary.";
  const prompt = `# CURRENT CV (Markdown)
${cv}

# TARGET JOB DESCRIPTION
${jd}

# TASK
Rewrite the CV in Markdown, tailored to this JD:
- Lead the summary with the candidate's strongest JD-relevant positioning.
- Reorder bullets so the most JD-relevant achievements come first.
- Surface keywords/skills the JD asks for, but ONLY if supported by existing CV content. Never fabricate.
- Keep it truthful, concise, and ATS-friendly. Preserve all real metrics.
Output ONLY the tailored CV markdown.`;

  let upstream: Response;
  try {
    upstream = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system,
        prompt,
        stream: true,
        options: { temperature: 0.3, num_ctx: 8192 },
      }),
    });
  } catch (e: any) {
    return new Response(`Could not reach Ollama at ${OLLAMA_HOST} (${e?.message ?? e})`, {
      status: 502,
    });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(`Ollama error (${upstream.status})`, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = "";
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        const t = buffer.trim();
        if (t) {
          try {
            const o = JSON.parse(t);
            if (o.response) controller.enqueue(encoder.encode(o.response));
          } catch {}
        }
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const o = JSON.parse(line);
          if (o.response) controller.enqueue(encoder.encode(o.response));
        } catch {}
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
