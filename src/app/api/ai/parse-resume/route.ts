import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parseResumeText } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, fileName } = body as { text: string; fileName: string };

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const parsed = parseResumeText(text, fileName);
      return NextResponse.json({ ...parsed, source: "offline" });
    }

    try {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert resume parser for investment banking recruiting. Extract structured data from resumes and return valid JSON.`,
          },
          {
            role: "user",
            content: `Parse this resume and return structured JSON with these fields:
{
  "name": "full name",
  "email": "email if present",
  "phone": "phone if present",
  "education": [{ "institution": "", "degree": "", "field": "", "gpa": "", "graduationYear": 2025, "honors": [], "activities": [] }],
  "experience": [{ "company": "", "title": "", "startDate": "", "endDate": "", "bullets": [], "sector": "", "type": "investment_banking|private_equity|consulting|finance|other" }],
  "skills": [],
  "achievements": ["top 3-5 most impressive accomplishments as strings"],
  "targetRole": "inferred target role",
  "targetSectors": ["inferred sectors of interest"],
  "personalPitch": "2-3 sentence summary of who this candidate is"
}

Resume text:
${text.slice(0, 4000)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || "{}");

      return NextResponse.json({
        ...parsed,
        rawText: text,
        fileName,
        parsedAt: new Date().toISOString(),
        source: "openai",
      });
    } catch (openaiError: unknown) {
      const err = openaiError as { status?: number };
      if (err.status === 429 || err.status === 503) {
        const parsed = parseResumeText(text, fileName);
        return NextResponse.json({ ...parsed, source: "offline_quota" });
      }
      throw openaiError;
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Parse resume error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}
