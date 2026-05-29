import type { Contact, ResumeData, EmailGenerationResult, EmailVariant } from "@/types";

// ─── Offline Fallback Email Templates ─────────────────────────────────────────

function buildShortEmail(contact: Contact, resume: ResumeData | null): EmailGenerationResult {
  const userName = resume?.name || "a student";
  const userSchool = resume?.education?.[0]?.institution || "my university";
  const sharedSchool =
    contact.school.toLowerCase().includes(userSchool.toLowerCase().split(" ")[0]) ||
    contact.undergrad?.toLowerCase().includes(userSchool.toLowerCase().split(" ")[0]);

  const schoolLine = sharedSchool
    ? `As a fellow ${userSchool} alum, I wanted to reach out directly.`
    : `I'm a ${userSchool} student passionate about investment banking.`;

  const dealLine =
    contact.recentDeals?.length > 0
      ? `I've been following your work on ${contact.recentDeals[0].title} and find ${contact.coverageSectors[0]} advisory fascinating.`
      : `I've been studying ${contact.coverageSectors[0]} M&A extensively and ${contact.firm}'s work in this space stands out.`;

  const body = `Hi ${contact.firstName},

${schoolLine} I'm targeting ${contact.coverageSectors[0]} investment banking and ${contact.firm}'s ${contact.team} is exactly where I want to be.

${dealLine}

Would you have 20 minutes for a quick call in the coming weeks? I'm eager to learn from your experience and would be grateful for any guidance.

Best,
${resume?.name || "Your Name"}`;

  const subject = sharedSchool
    ? `${userSchool} → ${contact.firm} — Quick Question`
    : `${contact.firm} ${contact.team} — Brief Intro`;

  return {
    subject,
    body,
    alternativeSubjects: [
      `${contact.team} at ${contact.firm} — Informational Chat`,
      `Aspiring ${contact.coverageSectors[0]} Banker — 20-Minute Call?`,
      `${contact.firm} — Quick Introduction`,
    ],
    wordCount: body.split(/\s+/).length,
    confidenceScore: 82,
  };
}

function buildRelationshipEmail(contact: Contact, resume: ResumeData | null): EmailGenerationResult {
  const userName = resume?.name || "a student";
  const userSchool = resume?.education?.[0]?.institution || "my university";
  const userExp = resume?.experience?.[0];
  const expLine = userExp
    ? `My background includes ${userExp.title} at ${userExp.company}, which deepened my interest in ${contact.coverageSectors[0]} advisory.`
    : `I've been building my financial modeling and valuation skills in preparation for a career in investment banking.`;

  const body = `Hi ${contact.firstName},

My name is ${resume?.name || "Your Name"}, a student at ${userSchool} studying finance and targeting a career in investment banking. Your path to ${contact.firm}'s ${contact.team} is one I've been studying closely.

${expLine}

${contact.recentDeals?.length > 0 ? `Your work on ${contact.recentDeals[0].title} is particularly interesting — I've been following the strategic rationale closely.` : `${contact.firm}'s ${contact.coverageSectors[0]} practice consistently produces landmark transactions.`}

I would be incredibly grateful for 20 minutes of your time to learn about your experience at ${contact.firm} and any advice you'd share for someone earlier in the journey.

Thank you for considering — I look forward to hopefully connecting.

Warmly,
${resume?.name || "Your Name"}`;

  return {
    subject: `${contact.firm} ${contact.team} — Informational Chat Request`,
    body,
    alternativeSubjects: [
      `A ${userSchool} Student Eager to Learn from Your Journey`,
      `Investment Banking Informational — ${contact.firm}`,
    ],
    wordCount: body.split(/\s+/).length,
    confidenceScore: 79,
  };
}

function buildDealReferencedEmail(contact: Contact, resume: ResumeData | null): EmailGenerationResult {
  const deal = contact.recentDeals?.[0];
  const userName = resume?.name || "Your Name";
  const userSchool = resume?.education?.[0]?.institution || "my university";

  if (!deal) return buildShortEmail(contact, resume);

  const body = `Hi ${contact.firstName},

I've been closely following the ${deal.title} transaction — the ${deal.type} dynamics involved in a ${deal.value} deal are exactly the type of work I'm targeting in my career.

My name is ${userName}, a ${userSchool} student studying finance with a focus on ${contact.coverageSectors[0]} M&A. The complexity of the ${deal.sector} sector — particularly the ${deal.companies.join(" / ")} combination — is what drew me to investment banking specifically.

Would you be open to a brief 20-minute call? I'd love to hear your perspective on how the ${contact.firm} team approached this transaction and any insight on breaking into this space.

Best regards,
${userName}`;

  return {
    subject: `Re: ${deal.title} — ${userSchool} Student Reaching Out`,
    body,
    alternativeSubjects: [
      `${deal.title} — Quick Question from ${userSchool}`,
      `${contact.coverageSectors[0]} M&A Research — Brief Chat?`,
    ],
    wordCount: body.split(/\s+/).length,
    confidenceScore: 88,
  };
}

function buildAggressiveEmail(contact: Contact, resume: ResumeData | null): EmailGenerationResult {
  const userName = resume?.name || "Your Name";
  const userSchool = resume?.education?.[0]?.institution || "my university";
  const gpa = resume?.education?.[0]?.gpa;
  const achievements = resume?.achievements?.slice(0, 2) || [];

  const achievementLine =
    achievements.length > 0
      ? `${achievements[0]}`
      : `I have a strong GPA, completed relevant finance coursework, and have been building my technical skills in LBO modeling and DCF valuation.`;

  const body = `Hi ${contact.firstName},

I'll keep this brief: I'm ${userName}, a ${userSchool} student with a 3.9 GPA${gpa ? ` (${gpa})` : ""} targeting investment banking. ${contact.firm}'s ${contact.team} is my top choice.

${achievementLine}

I've specifically prepared for ${contact.coverageSectors[0]} coverage — I can walk through a ${contact.recentDeals?.[0]?.type || "M&A"} valuation, discuss current sector dynamics, and I'm ready to contribute immediately as a summer analyst.

15 minutes of your time would mean everything. Are you free next week for a quick call?

${userName}`;

  return {
    subject: `${contact.firm} SA 2025 — Direct Ask from ${userSchool} Top Student`,
    body,
    alternativeSubjects: [
      `${userSchool} → ${contact.firm} — I'm Prepared and Ready`,
      `Strong Candidate Seeking ${contact.team} Guidance`,
    ],
    wordCount: body.split(/\s+/).length,
    confidenceScore: 75,
  };
}

// ─── Main Email Generator (Offline-First) ─────────────────────────────────────

export async function generateEmail(
  contact: Contact,
  resume: ResumeData | null,
  variant: EmailVariant,
  customInstructions?: string
): Promise<EmailGenerationResult> {
  // Try OpenAI if key is available (client-side won't have this — goes through API route)
  // This function is the offline fallback used directly when API fails

  switch (variant) {
    case "short":
      return buildShortEmail(contact, resume);
    case "relationship":
      return buildRelationshipEmail(contact, resume);
    case "deal_referenced":
      return buildDealReferencedEmail(contact, resume);
    case "aggressive":
      return buildAggressiveEmail(contact, resume);
    default:
      return buildShortEmail(contact, resume);
  }
}

// ─── Follow-up Email Generator ────────────────────────────────────────────────

export function generateFollowUp(
  contact: Contact,
  originalSubject: string,
  daysSince: number,
  resume: ResumeData | null
): { subject: string; body: string } {
  const userName = resume?.name || "Your Name";

  const body = `Hi ${contact.firstName},

I hope you're having a great week. I wanted to follow up on my email from ${daysSince} days ago — I completely understand how busy things get, especially with the deal activity at ${contact.firm}.

I'm still very interested in learning about your experience in ${contact.team} and would be grateful for any time you can spare.

If you're not the right person to connect with, I'd appreciate any guidance on who might be.

Thanks again,
${userName}`;

  return {
    subject: `Re: ${originalSubject}`,
    body,
  };
}

// ─── Strategy Advisor ─────────────────────────────────────────────────────────

export interface StrategyAdvice {
  recommendation: string;
  actions: string[];
  insights: string[];
  priority: "high" | "medium" | "low";
}

export function getOfflineStrategyAdvice(
  question: string,
  contactCount: number,
  sentCount: number,
  replyCount: number
): StrategyAdvice {
  const replyRate = sentCount > 0 ? (replyCount / sentCount) * 100 : 0;

  const q = question.toLowerCase();

  if (q.includes("who") || q.includes("target") || q.includes("prioritize")) {
    return {
      recommendation: "Focus on analysts and associates first — they have more time, remember what recruiting felt like, and can forward you to MDs.",
      actions: [
        "Filter contacts to Analyst/Associate seniority",
        "Sort by school match to identify warm connections",
        "Reach out to top 20 school-match contacts this week",
        "Set follow-up reminders for all unanswered emails at 7 days",
      ],
      insights: [
        "Alumni who graduated within 5 years are 3× more likely to respond",
        "Tuesday-Thursday 8-10am have the highest open rates for IB outreach",
        "Referrals from analysts to MDs have a 60% higher conversion rate",
      ],
      priority: "high",
    };
  }

  if (q.includes("email") || q.includes("write") || q.includes("message")) {
    return {
      recommendation: "Use the Deal-Referenced variant for MDs and the Short variant for analysts. Always stay under 150 words.",
      actions: [
        "Reference a specific recent transaction in your email",
        "Lead with a hook that shows you've done your research",
        "Include ONE clear call-to-action (coffee chat or 20-min call)",
        "Send at 8am on Tuesday or Wednesday for best open rates",
      ],
      insights: [
        `Your current reply rate is ${replyRate.toFixed(0)}% — industry average is 8-12%`,
        "Emails with deal references get 2× more replies than generic ones",
        "Subject lines with the person's school outperform by 40%",
      ],
      priority: "high",
    };
  }

  if (q.includes("follow") || q.includes("no reply") || q.includes("silence")) {
    return {
      recommendation: "Follow up once at 7 days and once at 14 days. After that, move on and focus energy on new contacts.",
      actions: [
        "Check your 'No Reply' contacts and send 7-day follow-ups today",
        "Use a brief, non-pushy follow-up (2-3 sentences max)",
        "Reference your original email subject line",
        "Add a different hook or deal reference in the follow-up",
      ],
      insights: [
        "25% of replies come after the first follow-up",
        "Over-following up (3+ times) damages your personal brand",
        "The best follow-ups add new value, not just 'checking in'",
      ],
      priority: "medium",
    };
  }

  if (q.includes("firm") || q.includes("goldman") || q.includes("moelis") || q.includes("boutique") || q.includes("bank")) {
    return {
      recommendation: "Elite boutiques (Centerview, Moelis, Evercore) offer the best deal experience. Bulge brackets offer brand recognition and exit options.",
      actions: [
        "Research each firm's recent deal volume in your target sector",
        "Identify which firms have the most alumni from your school",
        "Focus 60% of outreach on your top 5 target firms",
        "Build relationships at 2-3 backup firms as alternatives",
      ],
      insights: [
        "Elite boutiques have 40% smaller analyst classes — more competitive",
        "BB banks offer stronger exit ops to PE due to brand recognition",
        "Mid-market boutiques (HL, William Blair) offer more deal execution early",
      ],
      priority: "medium",
    };
  }

  // Default advice based on pipeline state
  return {
    recommendation: `You've contacted ${sentCount} people with a ${replyRate.toFixed(0)}% reply rate. Focus on quality over quantity — deeper personalization beats volume.`,
    actions: [
      "Increase personalization by referencing specific deals in each email",
      "Contact 5-10 new high-priority targets this week",
      "Send follow-ups to any contact past 7 days without reply",
      "Update your notes after every conversation to track insights",
    ],
    insights: [
      "Top recruiters send 20-30 personalized emails over 8 weeks",
      "A 10-15% reply rate is excellent for cold IB outreach",
      "Every conversation is practice for the actual interview",
    ],
    priority: "medium",
  };
}

// ─── Resume Parser (Offline) ──────────────────────────────────────────────────

export function parseResumeText(text: string, fileName: string) {
  const lines = text.split("\n").filter((l) => l.trim());

  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const phoneRegex = /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const gpaRegex = /GPA[:\s]+(\d\.\d{1,2})/i;

  const email = text.match(emailRegex)?.[0] || "";
  const phone = text.match(phoneRegex)?.[0] || "";
  const gpaMatch = text.match(gpaRegex);
  const gpa = gpaMatch ? gpaMatch[1] : undefined;

  const name = lines[0] || "Your Name";

  return {
    name,
    email,
    phone,
    rawText: text,
    fileName,
    parsedAt: new Date().toISOString(),
    education: [
      {
        institution: "University",
        degree: "Bachelor of Science",
        field: "Finance",
        gpa,
        graduationYear: 2025,
        honors: [],
        activities: [],
      },
    ],
    experience: [],
    skills: ["Financial Modeling", "Valuation", "DCF", "LBO", "Excel", "PowerPoint"],
    achievements: [],
    targetRole: "Investment Banking Summer Analyst",
    targetFirms: [],
    targetSectors: [],
    personalPitch: `I am a motivated finance student with strong technical skills and a passion for investment banking. I am targeting summer analyst roles at elite investment banks and boutiques.`,
  };
}
