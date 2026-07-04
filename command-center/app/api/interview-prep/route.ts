import { OLLAMA_HOST } from "@/lib/ollama";
import { loadStoryBank } from "@/lib/interview";
import { P, safeRead } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/** Generate a company-specific interview prep guide via a local model (streamed). */
export async function POST(req: Request) {
  let body: { company?: string; role?: string; jd?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const company = (body.company ?? "").trim();
  const role = (body.role ?? "").trim();
  const model = (body.model ?? "").trim();
  if (!company || !model) return new Response("company and model required", { status: 400 });

  const cv = (safeRead(P.cv()) ?? "").slice(0, 9000);
  const bank = (loadStoryBank() ?? "").slice(0, 4000);

  const system =
    "You are an elite interview coach. You produce concrete, company-specific interview preparation for the candidate based on their CV. Output clean Markdown.";
  const prompt = `# CANDIDATE CV (excerpt)
${cv}

# EXISTING STORY BANK (STAR stories)
${bank}

# TARGET
Company: ${company}
Role: ${role || "(not specified)"}
${body.jd ? `\n# JOB DESCRIPTION\n${body.jd}\n` : ""}

# TASK
Produce a focused interview prep guide with these sections:
## Likely interview themes
## Behavioral questions to expect + which of my stories fits each
## Technical / domain topics to review
## Smart questions to ask them
## 30-60-90 day talking points
## Red flags to probe
Be specific to ${company} and this role. Reference the candidate's real achievements.`;

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
        options: { temperature: 0.5, num_ctx: 8192 },
      }),
    });
  } catch (e: any) {
    return new Response(`Could not reach Ollama (${e?.message ?? e})`, { status: 502 });
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
