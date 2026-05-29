import { NextRequest, NextResponse } from "next/server";
import { getOfflineStrategyAdvice } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, contactCount = 0, sentCount = 0, replyCount = 0, resume } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const advice = getOfflineStrategyAdvice(question, contactCount, sentCount, replyCount);
      return NextResponse.json({ ...advice, source: "offline" });
    }

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(0) : "0";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite investment banking recruiting advisor — the best in the world. You give highly specific, actionable advice to students targeting IB roles at top firms. You know Wall Street culture deeply. You are direct, honest, and strategic. Never give generic advice.`,
        },
        {
          role: "user",
          content: `Student question: "${question}"

Student pipeline stats:
- Total contacts: ${contactCount}
- Emails sent: ${sentCount}
- Replies received: ${replyCount} (${replyRate}% reply rate)
- Target role: ${resume?.targetRole || "IB Summer Analyst"}
- Background: ${resume?.education?.map((e: { institution: string }) => e.institution).join(", ") || "Finance student"}

Return JSON:
{
  "recommendation": "specific, direct main recommendation (2-3 sentences)",
  "actions": ["4-5 specific, immediately actionable steps"],
  "insights": ["3 data-driven insights relevant to their situation"],
  "priority": "high|medium|low"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 600,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json({ ...parsed, source: "openai" });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      const body2 = await req.json().catch(() => ({})) as { question?: string; contactCount?: number; sentCount?: number; replyCount?: number };
      const advice = getOfflineStrategyAdvice(
        body2.question || "",
        body2.contactCount || 0,
        body2.sentCount || 0,
        body2.replyCount || 0
      );
      return NextResponse.json({ ...advice, source: "offline_quota" });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
