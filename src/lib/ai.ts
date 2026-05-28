// ─────────────────────────────────────────────────────────────
// AI engine — premium offline-first generation
//
// Every function here returns instantly with high-fidelity, deterministic
// output built from the banker's profile + the user's resume. If a live
// AI endpoint is configured on the backend, callers may optionally try it
// first via `tryLiveAI`, but the offline path is always first-class so the
// app never breaks on quota/429 errors.
// ─────────────────────────────────────────────────────────────

import type {
  Contact,
  EmailVariant,
  GeneratedEmail,
  Icebreaker,
  ResumeProfile,
  UserProfile,
} from "../types";
import { fmtMoney } from "./utils";
import { optimalWindowLabel } from "./scheduler";

// ── Optional live AI bridge (graceful, never required) ───────
export async function tryLiveAI(
  task: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, payload }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; text?: string };
    return data.ok && data.text ? data.text : null;
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────
function topAchievement(resume?: ResumeProfile): string | null {
  if (!resume) return null;
  if (resume.achievements.length) return resume.achievements[0];
  const firstExp = resume.experience[0];
  if (firstExp?.bullets.length) return firstExp.bullets[0];
  return null;
}

function relevantExperience(resume: ResumeProfile | undefined, contact: Contact): string | null {
  if (!resume) return null;
  const sectors = contact.coverageSectors.map((s) => s.toLowerCase());
  const division = contact.division.toLowerCase();
  for (const exp of resume.experience) {
    const blob = `${exp.company} ${exp.role} ${exp.bullets.join(" ")}`.toLowerCase();
    if (sectors.some((s) => blob.includes(s.split(" ")[0])) || blob.includes(division.split(" ")[0])) {
      return `${exp.role} at ${exp.company}`;
    }
  }
  return resume.experience[0] ? `${resume.experience[0].role} at ${resume.experience[0].company}` : null;
}

function dealReference(contact: Contact): { phrase: string; deal: string } {
  const deal = contact.recentDeals[0];
  if (!deal) {
    return {
      phrase: `your work across ${contact.coverageSectors.slice(0, 2).join(" and ")}`,
      deal: `${contact.division} coverage`,
    };
  }
  const val = fmtMoney(deal.valueUsd);
  const dealText =
    deal.type === "M&A" && deal.counterparty
      ? `the ${val} ${deal.client}/${deal.counterparty} deal`
      : deal.type === "IPO"
      ? `the ${deal.client} IPO`
      : `the ${val} ${deal.client} ${deal.type.toLowerCase()}`;
  return { phrase: dealText, deal: deal.headline };
}

function schoolTie(contact: Contact, user: UserProfile): string | null {
  if (contact.school === user.school || contact.sharedSchool) {
    const school = contact.school.replace(/\s*\(.*\)/, "");
    return school;
  }
  return null;
}

// ── Subject lines ────────────────────────────────────────────
export function generateSubjects(contact: Contact, user: UserProfile): string[] {
  const tie = schoolTie(contact, user);
  const schoolShort = (tie ?? user.school).replace(/\s*\(.*\)/, "");
  const subjects = [
    tie ? `${schoolShort} student — quick question on ${contact.division}` : `${contact.division} at ${contact.firm} — quick question`,
    tie ? `Fellow ${schoolShort} grad — 15 min?` : `${contact.firm} ${contact.division} — aspiring analyst`,
    `Aspiring analyst interested in your ${contact.team} work`,
    tie ? `${schoolShort} → ${contact.firm}: a quick coffee chat?` : `Admire your ${contact.division} work — quick chat?`,
    `Quick note from a ${schoolShort} student`,
  ];
  return [...new Set(subjects)];
}

// ── Email body variants ──────────────────────────────────────
export function generateEmail(
  contact: Contact,
  user: UserProfile,
  variant: EmailVariant,
): GeneratedEmail {
  const tie = schoolTie(contact, user);
  const { phrase: dealPhrase } = dealReference(contact);
  const exp = relevantExperience(user.resume, contact);
  const ach = topAchievement(user.resume);
  const role = user.targetRole || "an investment banking analyst role";
  const greeting = `Hi ${contact.firstName},`;
  const sign = user.signature?.trim() || `Best,\n${user.fullName}`;

  let body = "";
  let rationale = "";

  const tieClause = tie
    ? `I'm a fellow ${tie} ${user.gradYear ? `('${String(user.gradYear).slice(2)}) ` : ""}student`
    : `I'm a ${user.school.replace(/\s*\(.*\)/, "")} student`;

  switch (variant) {
    case "short":
      body = [
        greeting,
        "",
        `${tieClause} targeting ${role}. I've been following ${contact.firm}'s ${contact.division} group and would love to learn how you approach ${contact.coverageSectors[0] ?? "the space"}.`,
        "",
        `Could I grab 15 minutes on a call in the next couple of weeks? Happy to work entirely around your schedule.`,
        "",
        sign,
      ].join("\n");
      rationale = "Tight, respectful, single low-pressure ask. Best opening message for cold outreach.";
      break;

    case "relationship":
      body = [
        greeting,
        "",
        `${tieClause}, and the ${tie ?? user.school.replace(/\s*\(.*\)/, "")} network is a big reason I reached out. I'm focused on ${role} and have been especially drawn to ${contact.firm}'s ${contact.team} group.`,
        "",
        exp
          ? `Through my time as ${exp}, I've started to build a foundation I'd love to grow toward a seat like yours.`
          : `I'm working hard to build the right foundation and would value your perspective on the path.`,
        "",
        `Would you be open to a quick 15-minute chat? I'd be grateful for any advice, and I promise to keep it brief.`,
        "",
        sign,
      ].join("\n");
      rationale = "Leads with the alumni relationship and curiosity — ideal when you share a school tie.";
      break;

    case "deal":
      body = [
        greeting,
        "",
        `${tieClause} targeting ${role}. I've been tracking your team's recent work — ${dealPhrase} caught my attention as a great example of ${contact.division} execution.`,
        "",
        ach
          ? `On my end, ${ach.replace(/\.$/, "")}, which is part of why ${contact.coverageSectors[0] ?? contact.division} appeals to me.`
          : `It's exactly the kind of work that drew me to ${contact.coverageSectors[0] ?? contact.division}.`,
        "",
        `Could I ask you a couple of questions over a 15-minute call? I'll come prepared and keep it tight.`,
        "",
        sign,
      ].join("\n");
      rationale = "References a real, recent transaction — signals genuine homework. High open + reply rate.";
      break;

    case "aggressive":
      body = [
        greeting,
        "",
        `I'll be direct: I want to break into ${contact.firm}'s ${contact.division} group, and I'm reaching out to the people I most respect there. ${tie ? `As a fellow ${tie} grad, ` : ""}your work on ${dealPhrase} is exactly the standard I'm chasing.`,
        "",
        ach
          ? `Quick proof I'm serious: ${ach.replace(/\.$/, "")}.`
          : `I'm putting in the reps — modeling, deal reading, and outreach — to earn a seat.`,
        "",
        `Any chance you'd give me 15 minutes? I'll make it worth your time with sharp, specific questions.`,
        "",
        sign,
      ].join("\n");
      rationale = "High-conviction and confident. Use sparingly with junior bankers who reward hustle.";
      break;
  }

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const subjects = generateSubjects(contact, user);
  return {
    subject: subjects[0],
    body,
    variant,
    altSubjects: subjects.slice(1),
    wordCount,
    rationale,
  };
}

export const VARIANT_META: Record<EmailVariant, { label: string; blurb: string }> = {
  short: { label: "Short", blurb: "Tight & respectful" },
  relationship: { label: "Relationship-first", blurb: "Lean on the alumni tie" },
  deal: { label: "Deal-referenced", blurb: "Cite a recent transaction" },
  aggressive: { label: "High-conviction", blurb: "Confident & direct" },
};

// ── Icebreakers ──────────────────────────────────────────────
export function generateIcebreakers(contact: Contact, user: UserProfile): Icebreaker[] {
  const tie = schoolTie(contact, user);
  const deal = contact.recentDeals[0];
  const list: Icebreaker[] = [];

  if (deal) {
    list.push({
      id: "ib_deal",
      angle: "deal",
      text: `I saw your team advised on ${deal.headline.replace(/^Advised |^Lead |^Arranged /, "")} — what was the most interesting part of running that ${deal.type.toLowerCase()}?`,
    });
  }
  if (tie) {
    list.push({
      id: "ib_school",
      angle: "school",
      text: `As a fellow ${tie} grad, I'd love to hear how the alumni network helped you break into ${contact.firm}.`,
    });
  }
  list.push({
    id: "ib_team",
    angle: "team",
    text: `Your group sits in ${contact.team} — how does ${contact.firm} differentiate its ${contact.division} coverage from peers?`,
  });
  list.push({
    id: "ib_career",
    angle: "career",
    text: `If you were recruiting for ${user.targetRole || "an analyst seat"} today, what's the one thing you'd want a candidate to nail?`,
  });
  list.push({
    id: "ib_market",
    angle: "market",
    text: `How are you thinking about deal flow in ${contact.coverageSectors[0] ?? contact.division} over the next few quarters?`,
  });

  const personal = contact.interests[0];
  if (personal) {
    list.push({
      id: "ib_personal",
      angle: "career",
      text: `I noticed you're into ${personal} — always looking to connect with people who balance the desk with that. How do you make time for it?`,
    });
  }
  return list.slice(0, 5);
}

// ── Intel scoping agent ──────────────────────────────────────
export interface IntelReport {
  summary: string;
  deskMetrics: { label: string; value: string }[];
  recentMoves: string[];
  talkingPoints: string[];
}

export function generateIntelReport(contact: Contact, user: UserProfile): IntelReport {
  const deals = contact.recentDeals;
  const totalValue = deals.reduce((s, d) => s + (d.valueUsd ?? 0), 0);
  const tie = schoolTie(contact, user);

  return {
    summary: `${contact.firstName} ${contact.lastName} is a ${contact.level} on ${contact.firm}'s ${contact.team} desk, covering ${contact.coverageSectors.join(", ")}. The desk has been active recently with ${deals.length} notable mandates totaling ~${fmtMoney(totalValue)} in disclosed value. ${tie ? `You share a ${tie} background — a strong, warm entry point.` : "No shared school, so lead with genuine interest in their coverage."} Optimal outreach window: ${optimalWindowLabel(contact.level)} ${contact.timezone.split("/")[1]?.replace("_", " ")} time.`,
    deskMetrics: [
      { label: "Disclosed deal value (LTM)", value: fmtMoney(totalValue) },
      { label: "Active mandates tracked", value: String(deals.length) },
      { label: "Primary coverage", value: contact.coverageSectors[0] ?? contact.division },
      { label: "Reply likelihood", value: contact.level === "Analyst" || contact.level === "Associate" ? "High" : contact.level === "Vice President" ? "Moderate" : "Selective" },
    ],
    recentMoves: deals.map((d) => `${d.headline} (${d.date})`),
    talkingPoints: [
      `Reference ${deals[0]?.client ?? contact.coverageSectors[0]} to show you've done homework.`,
      tie ? `Open with the ${tie} connection — it materially lifts reply rates.` : `Lead with a specific ${contact.division} question, not a generic ask.`,
      `Mirror their style: ${contact.personalStyle}`,
      `Keep the ask to a single 15-minute coffee chat — never request a referral up front.`,
    ],
  };
}

// ── Follow-up generator ──────────────────────────────────────
export function generateFollowUp(
  contact: Contact,
  user: UserProfile,
  daysSince: number,
  originalSubject: string,
): GeneratedEmail {
  const sign = user.signature?.trim() || `Best,\n${user.fullName}`;
  const is14 = daysSince >= 14;
  const body = is14
    ? [
        `Hi ${contact.firstName},`,
        "",
        `Following up one last time on my note below — I know your calendar is relentless. If now isn't the right time, no worries at all, and I'd welcome the chance to reconnect down the road.`,
        "",
        `If you do have 15 minutes in the coming weeks, I'd still be grateful to hear your perspective on ${contact.coverageSectors[0] ?? contact.division}.`,
        "",
        sign,
      ].join("\n")
    : [
        `Hi ${contact.firstName},`,
        "",
        `Wanted to gently float my earlier note back to the top of your inbox. I completely understand how busy ${contact.division} desks are right now.`,
        "",
        `Still very much hoping to grab 15 minutes to learn about your work on the ${contact.team} desk — happy to work around any window that's easy for you.`,
        "",
        sign,
      ].join("\n");

  return {
    subject: originalSubject.startsWith("Re:") ? originalSubject : `Re: ${originalSubject}`,
    body,
    variant: "short",
    altSubjects: [`Following up — ${contact.firstName}`, `Quick bump on my note`],
    wordCount: body.split(/\s+/).filter(Boolean).length,
    rationale: is14
      ? "Polished 14-day final touch — gracious, low-pressure, leaves the door open."
      : "7-day nudge that references the original thread without nagging.",
  };
}

// ── Strategy Advisor (offline reasoning) ─────────────────────
export interface AdvisorContext {
  totalContacts: number;
  contacted: number;
  replied: number;
  topTargets: Contact[];
  user: UserProfile;
}

export function strategyAdvisorReply(question: string, ctx: AdvisorContext): string {
  const q = question.toLowerCase();
  const replyRate = ctx.contacted ? Math.round((ctx.replied / ctx.contacted) * 100) : 0;
  const names = ctx.topTargets.slice(0, 3).map((c) => `${c.firstName} ${c.lastName} (${c.firm})`).join(", ");

  if (q.includes("who") || q.includes("target") || q.includes("next") || q.includes("priorit")) {
    return `Based on your fit scores and reply likelihood, prioritize: ${names || "your Top 20 list"}. Hit analysts and associates first — they reply ~2x more than VPs+ and become your internal champions. Aim for 8–10 high-fit sends this week, all in the optimal morning windows.`;
  }
  if (q.includes("reply") || q.includes("response") || q.includes("rate") || q.includes("working")) {
    return `Your current reply rate is ${replyRate}% across ${ctx.contacted} sends. Top of funnel: ${replyRate < 15 ? "tighten subject lines and lead with a specific recent deal — generic asks die." : "you're tracking well; double down on the deal-referenced variant and start booking calls."} Always follow up at day 7, then once more at day 14.`;
  }
  if (q.includes("follow") || q.includes("bump")) {
    return `Follow up exactly twice: a light day-7 nudge on the same thread, then a gracious day-14 close. Never more than that on a cold thread. Reference the original note, keep it under 60 words, and never sound frustrated.`;
  }
  if (q.includes("email") || q.includes("write") || q.includes("subject") || q.includes("template")) {
    return `Wall Street etiquette: under 150 words, one sharp hook (ideally a real deal they ran), one low-pressure ask (15-min coffee chat), zero flattery. A/B test two subject lines — a school-tie angle vs. a coverage-specific angle — and keep whichever opens better.`;
  }
  if (q.includes("resume") || q.includes("cv")) {
    return `Tailor a one-pager per desk: surface the bullets that map to their coverage (${ctx.topTargets[0]?.coverageSectors.join(", ") ?? "their sectors"}), quantify everything, and lead with deal/transaction-flavored experience. Attach it only after you've built a little rapport, or when explicitly relevant.`;
  }
  if (q.includes("time") || q.includes("when") || q.includes("schedule")) {
    return `Send analysts/associates at 7–9 AM their time, VPs at 8–10 AM, and MDs at 9–11 AM. Tuesday–Thursday outperform Mondays and Fridays. Use Execute Pipeline to auto-stagger your queue into these windows.`;
  }
  return `Here's the playbook: (1) Send 8–10 high-fit, hyper-personalized emails this week to juniors first. (2) Lead every note with a specific recent deal or the alumni tie. (3) Schedule into the optimal morning window per seniority. (4) Follow up at day 7 and day 14. (5) Track replies and reinvest in the hooks that land. Your strongest current targets: ${names || "see the Top 20 list"}.`;
}

// ── Resume parsing (offline heuristic) ───────────────────────
export function parseResumeText(rawText: string, fileName?: string): ResumeProfile {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = rawText.match(/(\+?\d[\d\s().-]{7,}\d)/);

  // Name heuristic: first non-empty line that looks like a name.
  let name: string | undefined;
  for (const l of lines.slice(0, 4)) {
    if (/^[A-Z][a-zA-Z.'-]+(\s+[A-Z][a-zA-Z.'-]+){1,3}$/.test(l) && !/@|\d/.test(l)) {
      name = l;
      break;
    }
  }

  const KNOWN_SCHOOLS = [
    "Wharton", "Harvard", "Stanford", "Princeton", "Columbia", "Yale", "Cornell", "Dartmouth",
    "Michigan", "Ross", "Stern", "NYU", "McIntire", "Virginia", "Georgetown", "Notre Dame",
    "Booth", "Chicago", "Duke", "Berkeley", "Haas", "McCombs", "Texas", "Kelley", "Indiana",
    "Boston College", "Emory", "Vanderbilt", "USC", "Marshall", "Olin", "Kenan-Flagler",
  ];
  const education: ResumeProfile["education"] = [];
  for (const l of lines) {
    if (KNOWN_SCHOOLS.some((s) => l.includes(s))) {
      const yr = l.match(/(20\d{2})/);
      const gpa = l.match(/GPA[:\s]*([0-4]\.\d{1,2})/i);
      education.push({
        school: l.slice(0, 80),
        gradYear: yr ? parseInt(yr[1], 10) : undefined,
        gpa: gpa ? gpa[1] : undefined,
      });
    }
  }

  // Skills heuristic
  const SKILL_KEYWORDS = [
    "Excel", "PowerPoint", "Financial Modeling", "DCF", "LBO", "Valuation", "Bloomberg",
    "Capital IQ", "FactSet", "Python", "SQL", "VBA", "Comparable", "M&A", "Accounting",
  ];
  const skills = SKILL_KEYWORDS.filter((s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(rawText));

  // Achievements / bullets: lines starting with bullet markers or strong verbs.
  const verbRe = /^(•|-|\*|–|\u2022)?\s*(Built|Led|Developed|Analyzed|Created|Managed|Drove|Increased|Reduced|Launched|Modeled|Conducted|Spearheaded|Designed|Executed|Generated|Improved|Achieved|Won|Founded|Presented|Researched|Advised)/i;
  const achievements = lines.filter((l) => verbRe.test(l)).map((l) => l.replace(/^[•\-*–\u2022]\s*/, "")).slice(0, 12);

  // Experience grouping — crude: find lines that look like "Company — Role" or "Company, Role"
  const experience: ResumeProfile["experience"] = [];
  let current: ResumeProfile["experience"][number] | null = null;
  for (const l of lines) {
    const isHeader = /(Intern|Analyst|Associate|Trainee|Fellow|Consultant|Assistant|Manager)/i.test(l) && l.length < 90 && !verbRe.test(l);
    if (isHeader) {
      if (current) experience.push(current);
      const parts = l.split(/[—\-,|]/).map((p) => p.trim());
      current = {
        company: parts[0] || l,
        role: parts.find((p) => /(Intern|Analyst|Associate|Trainee|Fellow|Consultant|Assistant|Manager)/i.test(p)) || parts[1] || "Role",
        bullets: [],
      };
    } else if (current && verbRe.test(l)) {
      current.bullets.push(l.replace(/^[•\-*–\u2022]\s*/, ""));
    }
  }
  if (current) experience.push(current);

  return {
    rawText,
    fileName,
    name,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0].trim() : undefined,
    education,
    experience: experience.slice(0, 6),
    skills,
    achievements,
    uploadedAt: new Date().toISOString(),
  };
}

/** Generate tailored resume bullets for a specific banker/desk. */
export function tailorBulletsFor(contact: Contact, resume?: ResumeProfile): string[] {
  const sector = contact.coverageSectors[0] ?? contact.division;
  const base = resume?.achievements.length
    ? resume.achievements.slice(0, 3)
    : [
        "Built a 3-statement operating model with integrated DCF and LBO outputs",
        "Analyzed comparable companies and precedent transactions across the sector",
        "Synthesized research into a concise investment thesis for senior review",
      ];
  return base.map(
    (b) => `${b.replace(/\.$/, "")} — directly relevant to ${contact.firm}'s ${sector} coverage.`,
  );
}
