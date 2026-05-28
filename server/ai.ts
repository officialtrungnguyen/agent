/**
 * AI-feature endpoints.
 *
 * Optional OpenAI integration is supported through OPENAI_API_KEY. If the env
 * var is absent OR if OpenAI returns a quota / 429 error, we always serve a
 * high-fidelity, hand-crafted offline response so the product never feels
 * broken. The offline templates use the rich Contact + UserResume context to
 * produce hyper-personalized output that is good enough to send as-is.
 */

import { env, HAS_OPENAI } from "./env.js";

export interface ResumeContext {
  headline?: string;
  targetRole?: string;
  achievements?: string[];
  education?: { school?: string; degree?: string; graduation?: string }[];
  skills?: string[];
  pitch?: string;
  userName?: string;
}

export interface ContactContext {
  fullName: string;
  firstName: string;
  firm: string;
  title: string;
  seniority: string;
  desk: string;
  city: string;
  coverage: string[];
  school: string;
  recentDeals: { target: string; acquirer?: string; value: string; product: string }[];
  interests?: string[];
}

export type EmailVariant = "short" | "relationship" | "deal" | "aggressive";

async function callOpenAI(prompt: string): Promise<string | null> {
  if (!HAS_OPENAI) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are an elite Wall Street networking coach. Produce concise, polished, low-pressure, status-aware outreach emails. Never exceed 150 words. Always include a strong specific hook in line 1, reference one concrete recent deal or coverage detail, anchor a shared school or background tie when present, and end with a single low-pressure coffee-chat CTA. Use plain text, no markdown, no emojis, no exclamation points.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

function userSchoolMatch(resume: ResumeContext, contact: ContactContext): boolean {
  const u = (resume.education?.[0]?.school ?? "").toLowerCase();
  const c = contact.school.toLowerCase();
  if (!u || !c) return false;
  return u.includes(c.split(" ")[0]!.toLowerCase()) || c.includes(u.split(" ")[0]!.toLowerCase());
}

function tightenAchievements(resume: ResumeContext, n = 2): string[] {
  return (resume.achievements ?? [])
    .slice(0, n)
    .map((a) => a.replace(/\s+/g, " ").trim());
}

function pickDeal(contact: ContactContext) {
  return contact.recentDeals?.[0];
}

export function offlineEmail(
  variant: EmailVariant,
  resume: ResumeContext,
  contact: ContactContext,
): { subject: string; body: string } {
  const deal = pickDeal(contact);
  const dealLabel = deal
    ? `${deal.target}${deal.acquirer ? ` / ${deal.acquirer}` : ""} ${deal.value} ${deal.product}`
    : `${contact.firm}'s recent ${contact.coverage[0] ?? ""} work`;
  const sharedSchool = userSchoolMatch(resume, contact);
  const userName = resume.userName ?? "[Your Name]";
  const targetRole = resume.targetRole ?? "Summer Investment Banking Analyst";
  const userSchool = resume.education?.[0]?.school ?? "[Your School]";
  const sector = contact.coverage[0] ?? "your group";
  const headlineAchievements = tightenAchievements(resume, 2);
  const bullet1 = headlineAchievements[0] ?? "consistent top-decile academic performance";
  const bullet2 = headlineAchievements[1] ?? "prior internship in financial analysis";

  const variants: Record<EmailVariant, { subject: string; body: string }> = {
    short: {
      subject: `${contact.firm} — ${sector} — 15 min?`,
      body: [
        `Hi ${contact.firstName},`,
        ``,
        `${sharedSchool ? `Fellow ${contact.school} grad reaching out` : `Wanted to introduce myself`}. I'm a ${userSchool} student targeting ${targetRole} roles and a long-time follower of ${contact.firm}'s ${sector} franchise — the ${dealLabel} mandate was particularly impressive.`,
        ``,
        `Would you have 15 minutes in the next two weeks for a quick coffee chat? Happy to work around your calendar.`,
        ``,
        `Best,`,
        userName,
      ].join("\n"),
    },
    relationship: {
      subject: sharedSchool
        ? `From a fellow ${contact.school} grad`
        : `Reaching out from ${userSchool}`,
      body: [
        `Hi ${contact.firstName},`,
        ``,
        `${sharedSchool ? `I'm a ${contact.school} student and noticed you walked the same path before landing on ${contact.desk} at ${contact.firm}.` : `I came across your background at ${contact.firm} and was struck by your trajectory in ${sector}.`} ${resume.pitch ?? `I'm currently targeting ${targetRole} roles and trying to be deliberate about the bankers I learn from.`}`,
        ``,
        `A few quick highlights of my own background:`,
        `• ${bullet1}`,
        `• ${bullet2}`,
        ``,
        `Would value 15 minutes of your time to learn how you positioned yourself for ${contact.firm}. I'm flexible — happy to come to you on your schedule.`,
        ``,
        `Best,`,
        userName,
      ].join("\n"),
    },
    deal: {
      subject: `${deal?.target ?? sector} — quick question on the process`,
      body: [
        `Hi ${contact.firstName},`,
        ``,
        `Caught the ${dealLabel} mandate — congrats to the team. From the outside the structuring looked tight, and I'd love to learn how a banker at your stage thinks about scoping a deal like that.`,
        ``,
        `${sharedSchool ? `I'm a fellow ${contact.school} student` : `I'm a ${userSchool} student`} targeting ${targetRole} roles. My background includes ${bullet1.toLowerCase()} and ${bullet2.toLowerCase()}.`,
        ``,
        `Would you be open to a 15-minute coffee chat in the next two weeks? Completely understand if calendars are tight — happy to work around yours.`,
        ``,
        `Best,`,
        userName,
      ].join("\n"),
    },
    aggressive: {
      subject: `${contact.firm} ${sector} — want to earn a seat next summer`,
      body: [
        `Hi ${contact.firstName},`,
        ``,
        `I'll be direct: ${contact.firm}'s ${sector} team is at the top of my list for summer recruiting, and I'm doing the homework needed to earn a seat. The ${dealLabel} mandate stood out, and I have specific questions about how the desk approaches ${contact.coverage[1] ?? "the broader vertical"}.`,
        ``,
        `${sharedSchool ? `As a ${contact.school} student` : `As a ${userSchool} student`} I've already ${bullet1.toLowerCase()} and ${bullet2.toLowerCase()}, and I'm currently sharpening my deal modeling on real M&A precedents.`,
        ``,
        `Could I steal 15 minutes? I'll come prepared with specific questions — no fluff.`,
        ``,
        `Best,`,
        userName,
      ].join("\n"),
    },
  };

  return variants[variant];
}

export async function generateEmail(
  variant: EmailVariant,
  resume: ResumeContext,
  contact: ContactContext,
): Promise<{ subject: string; body: string; offline: boolean }> {
  const offline = offlineEmail(variant, resume, contact);
  if (!HAS_OPENAI) return { ...offline, offline: true };

  const prompt = [
    `Generate one networking email for an Investment Banking student.`,
    `Variant: ${variant}`,
    `User: ${JSON.stringify({
      name: resume.userName,
      school: resume.education?.[0]?.school,
      targetRole: resume.targetRole,
      achievements: tightenAchievements(resume, 4),
      skills: resume.skills?.slice(0, 6),
      pitch: resume.pitch,
    })}`,
    `Contact: ${JSON.stringify({
      name: contact.fullName,
      first: contact.firstName,
      firm: contact.firm,
      title: contact.title,
      desk: contact.desk,
      city: contact.city,
      coverage: contact.coverage,
      school: contact.school,
      deal: pickDeal(contact),
    })}`,
    `Constraints:`,
    `- Under 150 words.`,
    `- Plain text, no markdown.`,
    `- Subject line on first line prefixed with "Subject: ", then a blank line, then the body.`,
    `- End with low-pressure CTA + sign off "Best, ${resume.userName ?? "[Your Name]"}"`,
  ].join("\n");

  const raw = await callOpenAI(prompt);
  if (!raw) return { ...offline, offline: true };

  const subjectMatch = raw.match(/^\s*Subject:\s*(.+)$/im);
  if (subjectMatch) {
    const subject = subjectMatch[1]!.trim();
    const body = raw.replace(subjectMatch[0]!, "").replace(/^\s+/, "").trim();
    return { subject, body, offline: false };
  }
  return { subject: offline.subject, body: raw, offline: false };
}

export interface DealIntelResult {
  highlights: string[];
  teamMoves: string[];
  deskMetrics: { label: string; value: string }[];
  icebreakers: string[];
  offline: boolean;
}

export function offlineDealIntel(contact: ContactContext): DealIntelResult {
  const deal = pickDeal(contact);
  const highlights = contact.recentDeals.slice(0, 5).map((d) => {
    const counterparty = d.acquirer ? ` → ${d.acquirer}` : "";
    return `${d.target}${counterparty} · ${d.value} · ${d.product}`;
  });
  return {
    highlights,
    teamMoves: [
      `${contact.firm} added 3 ${contact.coverage[0] ?? "sector"} bankers in ${contact.city} this year`,
      `${contact.firm}'s ${contact.coverage[0] ?? "sector"} desk has a top-tier league-table position year-to-date`,
      `Group reported elevated activity in ${contact.coverage[1] ?? "adjacent verticals"} over the last two quarters`,
    ],
    deskMetrics: [
      { label: "Desk Focus", value: contact.desk },
      { label: "Coverage", value: contact.coverage.join(", ") },
      { label: "Office", value: contact.city },
      { label: "Recent Deals (12mo)", value: String(contact.recentDeals.length) },
    ],
    icebreakers: deal
      ? [
          `Saw the ${deal.target}${deal.acquirer ? ` / ${deal.acquirer}` : ""} mandate — would love to learn how the team scoped the ${deal.product} workstream.`,
          `Big admirer of how ${contact.firm} approaches ${contact.coverage[0] ?? "the sector"} — your group's recent activity has been a clinic.`,
          `Curious how you think about positioning in ${contact.coverage[1] ?? "the broader vertical"} given current market conditions.`,
        ]
      : [
          `Curious how the desk is thinking about ${contact.coverage[0] ?? "the sector"} pipeline into next year.`,
          `Would value 15 minutes to learn how you approached the ${contact.firm} interview process.`,
        ],
    offline: true,
  };
}

export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

export function offlineAdvisorReply(
  history: AdvisorMessage[],
  context: { resume?: ResumeContext; pipelineSummary?: string },
): string {
  const last = history[history.length - 1]?.content?.toLowerCase() ?? "";
  const userName = context.resume?.userName ?? "there";
  if (last.includes("subject") || last.includes("hook")) {
    return [
      `Best subject lines I've seen convert on Wall Street, ${userName}:`,
      ``,
      `1. Specific deal reference: "Saw the Splunk mandate — quick question"`,
      `2. School tie: "From a fellow Wharton grad"`,
      `3. Short and humble: "15 minutes?"`,
      `4. Sector + city: "Healthcare M&A — NYC — coffee?"`,
      ``,
      `Avoid anything with exclamation points, emojis, or buzzwords like "passionate" or "rockstar". MDs delete those on sight.`,
    ].join("\n");
  }
  if (last.includes("follow up") || last.includes("no reply") || last.includes("ghost")) {
    return [
      `Tactical 7-day follow-up rules:`,
      ``,
      `• Reply on the original thread, never a new email.`,
      `• Open with "Bumping this in case it got buried — completely understand if calendars are tight."`,
      `• Add one *new* signal: a new deal in their coverage, a recent earnings note, an article you read.`,
      `• Re-affirm the low-pressure CTA: 15 min, flexible.`,
      `• If still no reply at 14 days: one final, gracious sign-off — "Will stop reaching out, but appreciated the consideration. Always happy to reconnect down the road."`,
      ``,
      `Don't burn the bridge — you'll be in this industry for 30 years.`,
    ].join("\n");
  }
  if (last.includes("priority") || last.includes("top") || last.includes("target")) {
    return [
      `Use this priority framework, ${userName}:`,
      ``,
      `S-tier: alumni + sector fit + VP/Director seniority. Hit these first.`,
      `A-tier: alumni only OR perfect sector + VP/MD. Hit in week 2.`,
      `B-tier: same-firm Analyst/Associate. Use them for honest tactical advice.`,
      `C-tier: senior MD/Partner without warm intro. Reserve until you have momentum.`,
      ``,
      `The "Top 20 Targets This Week" list in your ledger filters this automatically.`,
    ].join("\n");
  }
  return [
    `Three sharp moves for your pipeline:`,
    ``,
    `1. Run the "Top 20 Targets" filter and aim for 8-10 hyper-personalized emails this week. Quality dominates quantity at the bulge-bracket level.`,
    `2. Schedule sends to land at: Analysts 7-9am, VPs 8-10am, MDs 9-11am — in their local timezone. Inbox-zero windows.`,
    `3. After every coffee chat, add a Note to the contact card with one concrete next-step the banker mentioned. Reference it in your follow-up.`,
    ``,
    `Want me to draft a 7-day cadence for your top 5 right now?`,
  ].join("\n");
}

export async function strategyAdvisorReply(
  history: AdvisorMessage[],
  context: { resume?: ResumeContext; pipelineSummary?: string },
): Promise<{ reply: string; offline: boolean }> {
  if (!HAS_OPENAI) return { reply: offlineAdvisorReply(history, context), offline: true };
  const sys =
    "You are an elite Wall Street recruiting coach. Speak with calm authority, no hype, no exclamation points, no emojis. Provide tactical specific advice. Reference the user's resume + pipeline when relevant.";
  const prompt = [
    `Pipeline summary: ${context.pipelineSummary ?? "n/a"}`,
    `Resume: ${JSON.stringify({
      name: context.resume?.userName,
      role: context.resume?.targetRole,
      school: context.resume?.education?.[0]?.school,
      achievements: context.resume?.achievements?.slice(0, 4),
    })}`,
    ``,
    `Conversation so far:`,
    ...history.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
  ].join("\n");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return { reply: offlineAdvisorReply(history, context), offline: true };
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return { reply: offlineAdvisorReply(history, context), offline: true };
    return { reply: text, offline: false };
  } catch {
    return { reply: offlineAdvisorReply(history, context), offline: true };
  }
}
