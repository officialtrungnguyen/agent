import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Optional AI enrichment. If OPENAI_API_KEY is set, we call the model and
 * return improved copy. On ANY failure (no key, quota/429, network), we return
 * { ok: false } and the client transparently uses its rich offline generator.
 */
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, reason: "no_key" });
  }

  let payload: { system?: string; prompt?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" });
  }
  if (!payload.prompt) return NextResponse.json({ ok: false, reason: "no_prompt" });

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              payload.system ||
              "You are an elite investment banking recruiting coach. Write concise, high-status, Wall Street-appropriate copy. Never exceed 150 words for emails.",
          },
          { role: "user", content: payload.prompt },
        ],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, reason: `status_${resp.status}` });
    }
    const data = await resp.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return NextResponse.json({ ok: false, reason: "empty" });
    return NextResponse.json({ ok: true, text });
  } catch {
    return NextResponse.json({ ok: false, reason: "exception" });
  }
}
