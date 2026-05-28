import type {
  Contact,
  EmailVariant,
  ResumeProfile,
} from "@/types";
import { fullName, seniorityLabel } from "@/lib/utils";

/**
 * AI engine. Every function is OFFLINE-FIRST: a high-fidelity local generator
 * always produces premium output. When a server AI key is configured, callers
 * may optionally enrich via /api/ai, but the app NEVER breaks on quota/429.
 */

const firmShort = (firm: string) => firm.split(/\s|&/)[0];

function senderName(resume: ResumeProfile | null): string {
  return resume?.name?.trim() || "[Your Name]";
}

function senderSchool(resume: ResumeProfile | null): string {
  return resume?.school?.trim() || "my university";
}

function senderRole(resume: ResumeProfile | null): string {
  return resume?.targetRole?.trim() || "an Investment Banking Analyst role";
}

function topAchievement(resume: ResumeProfile | null): string | null {
  if (!resume?.achievements?.length) return null;
  return resume.achievements[0];
}

function sharedSchool(contact: Contact, resume: ResumeProfile | null): boolean {
  if (!resume?.school) return false;
  const a = resume.school.toLowerCase();
  const b = contact.school.toLowerCase();
  return a.includes(b.split(" (")[0].toLowerCase()) || b.includes(a.split(" (")[0].toLowerCase());
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

/** Smart subject-line generator with A/B options. */
export function generateSubjects(contact: Contact, resume: ResumeProfile | null): string[] {
  const school = sharedSchool(contact, resume) ? senderSchool(resume).split(" (")[0] : null;
  const deal = contact.recentDeals[0];
  const subjects = [
    school ? `${school} student — quick question on ${firmShort(contact.firm)}` : `Quick question on ${firmShort(contact.firm)} ${contact.group}`,
    `Aspiring IB analyst — 15 minutes?`,
    deal ? `${contact.coverage[0]} coverage — would love your perspective` : `${contact.group} — would love your perspective`,
    school ? `Fellow ${school} grad exploring IB` : `Exploring ${firmShort(contact.firm)} — brief intro?`,
    `Coffee chat? ${firmShort(contact.firm)} ${seniorityLabel[contact.seniority]} path`,
  ];
  return Array.from(new Set(subjects)).slice(0, 5);
}

/**
 * Core local email generator. Strict Wall Street etiquette:
 * <150 words, strong specific hook, low-pressure coffee-chat CTA.
 */
export function generateEmail(
  contact: Contact,
  resume: ResumeProfile | null,
  variant: EmailVariant,
): GeneratedEmail {
  const name = senderName(resume);
  const school = senderSchool(resume).split(" (")[0];
  const role = senderRole(resume);
  const deal = contact.recentDeals[0];
  const sameSchool = sharedSchool(contact, resume);
  const ach = topAchievement(resume);
  const greet = `Hi ${contact.firstName},`;
  const sig = resume?.name
    ? `Best,\n${resume.name}${resume.school ? `\n${resume.school.split(" (")[0]}${resume.gradYear ? ` '${String(resume.gradYear).slice(2)}` : ""}` : ""}${resume.phone ? `\n${resume.phone}` : ""}`
    : `Best,\n${name}`;

  const dealLine = deal
    ? `${firmShort(contact.firm)}'s ${deal.type.toLowerCase()} on ${deal.company} (${deal.value}, ${deal.date})`
    : `${firmShort(contact.firm)}'s work in ${contact.coverage[0]}`;

  let body: string;
  let subject: string;
  const subjects = generateSubjects(contact, resume);

  switch (variant) {
    case "short":
      subject = subjects[1];
      body = [
        greet,
        "",
        `I'm ${name}, a ${school} student targeting ${role}. I've been following ${firmShort(contact.firm)}'s ${contact.group} team and your work across ${contact.coverage.slice(0, 2).join(" and ")} stood out.`,
        "",
        `Would you have 15 minutes for a quick call in the coming weeks? I'd value any advice — no pressure at all if the timing isn't right.`,
        "",
        sig,
      ].join("\n");
      break;

    case "relationship":
      subject = subjects[sameSchool ? 3 : 0];
      body = [
        greet,
        "",
        sameSchool
          ? `As a fellow ${school} grad, I've admired your path to ${seniorityLabel[contact.seniority]} at ${firmShort(contact.firm)}. I'm now navigating IB recruiting and would love to learn from how you broke in.`
          : `I'm ${name}, a ${school} student exploring investment banking. Your trajectory to ${seniorityLabel[contact.seniority]} in ${contact.group} at ${firmShort(contact.firm)} is exactly the path I'm working toward.`,
        "",
        `I'm not looking for anything beyond perspective — would you be open to a short coffee chat? I'm flexible around your schedule and happy to keep it to 15 minutes.`,
        "",
        sig,
      ].join("\n");
      break;

    case "deal_referenced":
      subject = subjects[2];
      body = [
        greet,
        "",
        `I'm ${name}, a ${school} student targeting ${role}. I saw ${dealLine} — I recently did a deep-dive on ${contact.coverage[0]} and found the deal logic fascinating.`,
        "",
        `I'd love to hear how your team is thinking about ${contact.coverage[0]} heading into next year. Could I grab 15 minutes of your time for a brief call?`,
        "",
        sig,
      ].join("\n");
      break;

    case "aggressive":
      subject = subjects[4];
      body = [
        greet,
        "",
        `I'm ${name} (${school}), and I'm going all-in on landing an analyst seat in ${contact.group}.${ach ? ` ${ach}.` : ""} ${firmShort(contact.firm)} is at the very top of my list.`,
        "",
        `I'd be grateful for 15 minutes to hear what separates the candidates who make it. I'll come prepared with specific questions — and I won't waste a minute of your time.`,
        "",
        sig,
      ].join("\n");
      break;
  }

  return { subject, body: body.trim() };
}

/** Polite, high-status follow-up that references the original outreach. */
export function generateFollowUp(
  contact: Contact,
  resume: ResumeProfile | null,
  step: number,
  originalSubject?: string,
): GeneratedEmail {
  const name = senderName(resume);
  const deal = contact.recentDeals[0];
  const subject = originalSubject ? `Re: ${originalSubject.replace(/^re:\s*/i, "")}` : `Following up — ${firmShort(contact.firm)}`;
  const sig = `Best,\n${name}`;

  const body14 = [
    `Hi ${contact.firstName},`,
    "",
    `I know things stay busy on the desk, so I wanted to gently float my note back to the top of your inbox. I remain very interested in learning about your path in ${contact.group} at ${firmShort(contact.firm)}.`,
    "",
    `Even 10 minutes whenever you surface for air would mean a lot. Totally understand if now isn't the moment.`,
    "",
    sig,
  ].join("\n");

  const body7 = [
    `Hi ${contact.firstName},`,
    "",
    `Following up on my note from last week — I imagine your inbox is relentless.${deal ? ` Congrats again on the ${deal.company} ${deal.type.toLowerCase()}.` : ""}`,
    "",
    `Still would love 15 minutes to hear your perspective on breaking into ${contact.group}. Happy to work entirely around your calendar.`,
    "",
    sig,
  ].join("\n");

  return { subject, body: (step >= 2 ? body14 : body7).trim() };
}

/** Word count helper for the etiquette guardrail. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Deep AI Intel Scoping Agent output (offline-first). */
export interface IntelReport {
  summary: string;
  dealMomentum: string;
  teamSignal: string;
  deskMetric: string;
  angles: string[];
}

export function generateIntel(contact: Contact): IntelReport {
  const deal = contact.recentDeals[0];
  const sectors = contact.coverage.join(", ");
  const cadence = contact.recentDeals.length >= 3 ? "high" : "steady";
  return {
    summary: `${fullName(contact)} sits on ${firmShort(contact.firm)}'s ${contact.team} desk, covering ${sectors}. ${contact.careerNote}`,
    dealMomentum: deal
      ? `Most recent flagged transaction: ${deal.type} on ${deal.company} (${deal.value}, ${deal.date})${deal.counterparty ? ` with ${deal.counterparty}` : ""}. Deal cadence reads ${cadence}, suggesting active mandates and live staffing needs.`
      : `No flagged transactions on file — lead with sector curiosity rather than a specific deal.`,
    teamSignal: `${contact.group} groups at ${firmShort(contact.firm)} have been building out ${contact.coverage[0]} coverage. A ${seniorityLabel[contact.seniority]} at this stage is often the warmest entry point for an aspiring analyst.`,
    deskMetric: `Estimated reply propensity: ${replyPropensity(contact)} • Optimal touch window aligns to ${seniorityLabel[contact.seniority]} mornings • Relationship leverage: ${contact.sharedInterests[0]}.`,
    angles: contact.icebreakers.slice(0, 4),
  };
}

function replyPropensity(contact: Contact): string {
  switch (contact.seniority) {
    case "analyst": return "High (35–45%)";
    case "associate": return "High (30–40%)";
    case "vp": return "Moderate (18–25%)";
    case "director": return "Moderate (12–18%)";
    case "md": return "Selective (6–12%)";
  }
}

/** Strategy Advisor — local rules-based coach (offline fallback). */
export function strategyAdvice(
  question: string,
  ctx: {
    resume: ResumeProfile | null;
    totalContacts: number;
    sent: number;
    replied: number;
    queued: number;
    topFirms: string[];
  },
): string {
  const q = question.toLowerCase();
  const replyRate = ctx.sent ? Math.round((ctx.replied / ctx.sent) * 100) : 0;

  if (/follow|no reply|ghost|didn't respond|didnt respond/.test(q)) {
    return `Bankers triage inbox by skim-ability. For your ${ctx.sent} sent notes (${replyRate}% reply rate), send a 7-day follow-up that's two sentences max, references your original, and re-states a 15-minute ask. If still silent after 14 days, move on warmly — never more than two follow-ups per contact.`;
  }
  if (/subject|open rate|opened/.test(q)) {
    return `Your strongest subject lines are specific and low-pressure: lead with a shared school ("Wharton student — quick question") or a coverage hook. Avoid "Networking" or "Opportunity." Keep it under 6 words and never use exclamation points.`;
  }
  if (/who|target|priorit|focus|tier/.test(q)) {
    return `Prioritize Tier-1: analysts and associates at your target firms${ctx.topFirms.length ? ` (${ctx.topFirms.slice(0, 3).join(", ")})` : ""} who share your school. They reply 3–4x more than MDs and can refer you internally. Work the "Top 20 Targets This Week" list — 5 fresh outreaches + 5 follow-ups daily beats a one-time blast.`;
  }
  if (/resume|tailor|bullet/.test(q)) {
    return `Tailor one bullet per banker: mirror their coverage language. If they cover ${ctx.resume?.targetRole ? "your target sector" : "Software M&A"}, surface your most quantified, deal-adjacent achievement first. Attach a clean one-page PDF only after a positive reply — not in the cold email.`;
  }
  if (/coffee|chat|call|meeting|prep/.test(q)) {
    return `For coffee chats: research 2 recent deals, prepare 3 thoughtful questions (one about their path, one about the desk, one about the sector), and end by asking "Is there anyone else on the team I should learn from?" — that's how referrals compound. Send a thank-you within 24 hours.`;
  }
  if (/timing|when|time|schedule/.test(q)) {
    return `Send analysts/associates at 7–9 AM local, VPs 8–10 AM, MDs 9–11 AM — all on Tuesday–Thursday. Avoid Monday mornings (inbox triage) and Friday afternoons. Use Auto-Schedule to hit each contact's optimal window automatically.`;
  }
  return `Here's your play: you've reached ${ctx.sent}/${ctx.totalContacts} contacts with a ${replyRate}% reply rate and ${ctx.queued} queued. Keep a daily rhythm of 5 new + 5 follow-ups, lead every note with a specific hook (shared school or recent deal), and keep each email under 150 words with a single 15-minute ask. Consistency over volume wins IB recruiting.`;
}
