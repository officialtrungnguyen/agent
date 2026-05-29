import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateEmail } from "@/lib/ai";
import type { Contact, ResumeData, EmailVariant } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact, resume, variant, customInstructions } = body as {
      contact: Contact;
      resume: ResumeData | null;
      variant: EmailVariant;
      customInstructions?: string;
    };

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const result = await generateEmail(contact, resume, variant, customInstructions);
      return NextResponse.json({ ...result, source: "offline" });
    }

    try {
      const openai = new OpenAI({ apiKey });

      const variantInstructions: Record<EmailVariant, string> = {
        short: "Write a very concise email under 120 words. Lead with a strong hook.",
        relationship: "Focus on building genuine connection. Be warm and personal. Under 150 words.",
        deal_referenced: "Reference a specific recent deal from the contact's firm. Show deep research. Under 150 words.",
        aggressive: "Be direct and confident. Lead with credentials. Under 100 words.",
      };

      const systemPrompt = `You are an expert investment banking recruiting coach helping students write cold outreach emails to bankers. 
Write professional, concise, Wall Street-appropriate emails that get replies.
Rules:
- Always under 150 words
- Strong opening hook (not "My name is...")  
- Reference something specific about the contact's work or firm
- ONE clear call-to-action (20-minute coffee chat or call)
- Professional but human tone
- No desperation, no flattery
- Always sign with the user's name

${variantInstructions[variant]}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}`;

      const userPrompt = `Write a cold outreach email from ${resume?.name || "a finance student"} at ${resume?.education?.[0]?.institution || "a top university"} to ${contact.firstName} ${contact.lastName}, a ${contact.title} at ${contact.firm} in their ${contact.team}.

Contact details:
- Coverage sectors: ${contact.coverageSectors.join(", ")}
- Recent deals: ${contact.recentDeals?.slice(0, 2).map((d) => `${d.title} (${d.value})`).join(", ") || "Various M&A transactions"}
- School: ${contact.school}
- Shared school connection: ${contact.school === resume?.education?.[0]?.institution ? "YES - strong alumni tie" : "No direct connection"}

User's background:
- Education: ${resume?.education?.map((e) => `${e.degree} from ${e.institution}${e.gpa ? `, GPA ${e.gpa}` : ""}`).join("; ") || "Finance student"}
- Experience: ${resume?.experience?.slice(0, 2).map((e) => `${e.title} at ${e.company}`).join("; ") || "Building relevant experience"}
- Target role: ${resume?.targetRole || "Investment Banking Analyst"}
- Target sectors: ${resume?.targetSectors?.join(", ") || contact.coverageSectors[0]}

Return JSON with: { subject: string, body: string, alternativeSubjects: string[] }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 600,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      const wordCount = parsed.body?.split(/\s+/).length || 0;

      return NextResponse.json({
        subject: parsed.subject || "Investment Banking Informational Chat",
        body: parsed.body || "",
        alternativeSubjects: parsed.alternativeSubjects || [],
        wordCount,
        confidenceScore: 95,
        source: "openai",
      });
    } catch (openaiError: unknown) {
      const err = openaiError as { status?: number; message?: string };
      if (err.status === 429 || err.status === 503) {
        const result = await generateEmail(contact, resume, variant, customInstructions);
        return NextResponse.json({ ...result, source: "offline_quota" });
      }
      throw openaiError;
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Generate email error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to generate email" },
      { status: 500 }
    );
  }
}
