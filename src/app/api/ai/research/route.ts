import { NextRequest, NextResponse } from "next/server";
import type { Contact } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact } = body as { contact: Contact };

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json({
        recentDeals: contact.recentDeals || [],
        teamMoves: [
          `${contact.firstName} joined ${contact.firm}'s ${contact.team} in ${contact.graduationYear + 2}`,
          `Previously covered ${contact.coverageSectors[1] || contact.coverageSectors[0]} deals`,
        ],
        icebreakers: contact.icebreakers || [],
        marketContext: `${contact.firm}'s ${contact.team} has been active in ${contact.coverageSectors[0]} M&A throughout 2024, with deal volumes up significantly year-over-year as strategic buyers compete for premium assets.`,
        personalStyle: contact.personalStyle || "Professional and analytical approach to deal-making.",
        source: "offline",
      });
    }

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an investment banking research assistant providing intelligence on bankers for recruiting purposes. Return realistic, professional context.`,
        },
        {
          role: "user",
          content: `Provide research intelligence for this banker:
Name: ${contact.firstName} ${contact.lastName}
Firm: ${contact.firm}
Title: ${contact.title}
Team: ${contact.team}
Coverage: ${contact.coverageSectors.join(", ")}
School: ${contact.school} (MBA), ${contact.undergrad} (undergrad)

Return JSON:
{
  "teamMoves": ["2-3 recent team or coverage developments"],
  "icebreakers": ["3 specific, personalized conversation starters based on their coverage"],
  "marketContext": "2-3 sentences on current market dynamics in their coverage area",
  "personalStyle": "Professional communication style description"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 500,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      recentDeals: contact.recentDeals || [],
      ...parsed,
      source: "openai",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Research error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
