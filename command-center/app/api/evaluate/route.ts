import { buildEvalPrompt, OLLAMA_HOST } from "@/lib/ollama";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Stream a job-description evaluation from a local Ollama model.
 * Body: { jd: string, model: string }
 * Returns: text/plain stream of the generated markdown.
 */
export async function POST(req: Request) {
  let body: { jd?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const jd = (body.jd ?? "").trim();
  const model = (body.model ?? "").trim();
  if (!jd) return new Response("Missing job description", { status: 400 });
  if (!model) return new Response("Missing model", { status: 400 });

  const { system, prompt } = buildEvalPrompt(jd);

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
        options: { temperature: 0.4, num_ctx: 8192 },
      }),
    });
  } catch (e: any) {
    return new Response(
      `Could not reach Ollama at ${OLLAMA_HOST}. Is it running? (${e?.message ?? e})`,
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return new Response(`Ollama error (${upstream.status}): ${t}`, { status: 502 });
  }

  // Ollama streams NDJSON lines: {response: "...", done: false}
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        // flush any trailing complete object
        const t = buffer.trim();
        if (t) {
          try {
            const obj = JSON.parse(t);
            if (obj.response) controller.enqueue(encoder.encode(obj.response));
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
          const obj = JSON.parse(line);
          if (obj.response) controller.enqueue(encoder.encode(obj.response));
        } catch {
          /* partial/non-JSON line; ignore */
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
