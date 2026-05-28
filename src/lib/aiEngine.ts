import {
  Contact,
  ContactScore,
  DraftEmail,
  EmailVariant,
  ParsedResume,
  StrategyMessage,
  UserProfile
} from "../types";

const fallbackAchievements = [
  "built a three-statement model and DCF for a public software company",
  "led a student investment fund pitch with clear catalysts and valuation work",
  "completed comparable company and precedent transaction analysis",
  "managed outreach for a finance club mentorship program"
];

function normalize(value: string) {
  return value.toLowerCase();
}

function resumeText(resume?: ParsedResume) {
  return normalize(
    [
      resume?.rawText,
      resume?.targetRole,
      resume?.personalPitch,
      ...(resume?.skills ?? []),
      ...(resume?.achievements ?? []),
      ...(resume?.experience ?? [])
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function scoreContact(
  contact: Contact,
  resume: ParsedResume | undefined,
  profile: UserProfile
): ContactScore {
  const text = resumeText(resume);
  const reasons: string[] = [];
  let score = 42;

  if (contact.school === profile.school || text.includes(normalize(contact.school))) {
    score += 18;
    reasons.push(`shared ${contact.school} alumni tie`);
  }

  for (const sector of contact.coverageSectors) {
    const tokens = sector.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.some((token) => text.includes(token))) {
      score += 8;
      reasons.push(`${sector} appears in resume/pitch`);
      break;
    }
  }

  if (profile.targetRole.toLowerCase().includes("analyst") && contact.title !== "MD") {
    score += 7;
    reasons.push("junior-friendly access point");
  }

  if (contact.priority === "Core") {
    score += 12;
    reasons.push("core priority firm");
  } else if (contact.priority === "High") {
    score += 8;
    reasons.push("high-priority firm/team");
  }

  if (contact.deskMetrics.responseWarmth > 75) {
    score += 7;
    reasons.push("historically warm response pattern");
  }

  if (contact.recentTransactions.some((deal) => text.includes(normalize(deal.sector)))) {
    score += 6;
    reasons.push("recent deal sector maps to candidate story");
  }

  return {
    contactId: contact.id,
    score: Math.min(100, score),
    reasons: reasons.length ? reasons.slice(0, 3) : ["strong platform relevance", "credible IB learning angle"]
  };
}

export function parseResumeText(
  rawText: string,
  fileName?: string,
  fileType?: string,
  fileDataUrl?: string
): ParsedResume {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lower = rawText.toLowerCase();
  const education = lines.filter((line) =>
    /(university|college|school|gpa|bachelor|bs |ba |b\.s\.|b\.a\.)/i.test(line)
  );
  const skills = Array.from(
    new Set(
      [
        "DCF",
        "LBO",
        "Excel",
        "PowerPoint",
        "Python",
        "SQL",
        "valuation",
        "M&A",
        "financial modeling",
        "capital markets",
        "restructuring"
      ].filter((skill) => lower.includes(skill.toLowerCase()))
    )
  );
  const achievements = lines
    .filter((line) => /^[-*•]|(led|built|created|analyzed|managed|ranked|selected|achieved)/i.test(line))
    .slice(0, 8);
  const experience = lines.filter((line) => /(intern|analyst|associate|fund|club|research)/i.test(line)).slice(0, 8);
  const leadership = lines.filter((line) => /(president|captain|mentor|volunteer|leader|founded)/i.test(line)).slice(0, 5);

  return {
    rawText,
    fileName,
    fileType,
    fileDataUrl,
    education: education.slice(0, 5),
    achievements: achievements.length ? achievements : fallbackAchievements,
    skills: skills.length ? skills : ["valuation", "financial modeling", "M&A research"],
    experience,
    leadership,
    targetRole: "Investment Banking Summer Analyst",
    personalPitch:
      "I can bring technical preparation, sector curiosity, and disciplined follow-through to investment banking recruiting.",
    updatedAt: new Date().toISOString()
  };
}

export function generateIcebreakers(contact: Contact, resume?: ParsedResume) {
  const topDeal = contact.recentTransactions[0];
  const achievement = resume?.achievements[0] ?? fallbackAchievements[0];

  return [
    `I noticed your ${contact.team} team advised on ${topDeal.company}/${topDeal.counterparty}; the ${topDeal.sector} angle maps closely to my interest in ${contact.coverageSectors[0]}.`,
    `As a ${contact.school} student/alum connection, I would value hearing how you translated campus preparation into ${contact.firm}'s ${contact.team} execution environment.`,
    `Your team seems active across ${contact.coverageSectors.slice(0, 2).join(" and ")}, and I have been building a thesis around that market through ${achievement}.`,
    `The ${topDeal.note.toLowerCase()} dynamic on ${topDeal.company} is exactly the type of transaction judgment I am trying to understand before recruiting.`,
    `I am reaching out because your path combines the alumni connection, ${contact.firm}'s platform, and a very specific ${contact.team} learning angle.`
  ];
}

export function generateSubjectLines(contact: Contact) {
  return [
    `${contact.school} student interested in ${contact.firm} ${contact.team}`,
    `Quick question on ${contact.team} recruiting`,
    `${contact.firm} ${contact.team} coffee chat`,
    `${contact.school} / ${contact.firm} IB perspective`
  ];
}

function pickAchievement(resume?: ParsedResume) {
  return resume?.achievements[0] ?? fallbackAchievements[0];
}

export function generateEmailDraft(
  contact: Contact,
  resume: ParsedResume | undefined,
  profile: UserProfile,
  variant: EmailVariant,
  attachResume: boolean
): DraftEmail {
  const first = contact.firstName;
  const userName = profile.name || "Candidate";
  const school = profile.school || contact.school;
  const topDeal = contact.recentTransactions[0];
  const achievement = pickAchievement(resume);
  const subject = generateSubjectLines(contact)[variant === "Deal-Referenced" ? 1 : 0];
  const hook =
    variant === "Deal-Referenced"
      ? `I saw your ${contact.team} team advised on ${topDeal.company}/${topDeal.counterparty}, and the ${topDeal.sector} angle caught my attention.`
      : variant === "Relationship-First"
        ? `I found your background through the ${contact.school} finance network and was interested in your path to ${contact.firm}.`
        : variant === "Aggressive"
          ? `I am preparing intensely for IB recruiting and have been studying ${contact.firm}'s ${contact.team} franchise.`
          : `I am a ${school} student targeting ${profile.targetRole}.`;

  const body = `Hi ${first},

${hook} My relevant preparation includes ${achievement}, and I am trying to sharpen my understanding of ${contact.coverageSectors[0]} banking before recruiting.

Would you be open to a brief 15-minute coffee chat next week? I would be grateful for any perspective on your team, junior banker expectations, and how to prepare well for ${contact.firm}.

Best,
${userName}`;

  return {
    id: crypto.randomUUID(),
    contactId: contact.id,
    variant,
    subject,
    body,
    createdAt: new Date().toISOString(),
    attachResume,
    attachmentName: attachResume ? resume?.fileName ?? "Tailored_IB_One_Pager.txt" : undefined
  };
}

export function generateFollowUp(contact: Contact, profile: UserProfile, day: 7 | 14) {
  return {
    subject: `Re: ${contact.school} student interested in ${contact.firm} ${contact.team}`,
    body: `Hi ${contact.firstName},

I wanted to politely follow up on my note from last week. I know your schedule is busy, so no pressure at all, but I would still be very grateful for 15 minutes to learn about ${contact.firm}'s ${contact.team} group and how I should prepare for recruiting.

Thanks again,
${profile.name || "Candidate"}`,
    label: `${day}-day follow-up`
  };
}

export function generateTailoredBullets(contact: Contact, resume?: ParsedResume) {
  const base = resume?.achievements.length ? resume.achievements : fallbackAchievements;
  return base.slice(0, 4).map((achievement) => {
    const cleaned = achievement.replace(/^[-*•]\s*/, "");
    return `${cleaned}; framed for ${contact.team} by emphasizing ${contact.coverageSectors[0]} market research, valuation judgment, and client-ready communication.`;
  });
}

export function strategyAdvice(
  prompt: string,
  contacts: Contact[],
  resume: ParsedResume | undefined,
  profile: UserProfile,
  history: StrategyMessage[]
) {
  const lower = prompt.toLowerCase();
  const topTargets = contacts
    .filter((contact) => contact.status === "Not Contacted")
    .slice(0, 5)
    .map((contact) => `${contact.firstName} ${contact.lastName} (${contact.firm} ${contact.team})`);

  if (lower.includes("follow")) {
    return `Use a concise ${history.length > 2 ? "second-touch" : "first-follow-up"} note: one sentence of context, one low-pressure CTA, and no apology. Prioritize contacts with sent dates older than 7 days, then move to 14-day notes only for Core/High targets.`;
  }

  if (lower.includes("target") || lower.includes("top")) {
    return `Your highest-leverage next targets are ${topTargets.join(", ")}. Lead with the alumni tie when available, otherwise lead with a recent transaction and ask one precise question about junior banker execution.`;
  }

  if (lower.includes("resume")) {
    return `Your current pitch should emphasize ${(resume?.skills ?? ["valuation", "modeling"]).slice(0, 3).join(", ")} for ${profile.targetRole}. Convert every bullet into action + analytical method + result, then tailor the top bullet to the banker's coverage sector.`;
  }

  return `Recommended strategy: send 8-12 highly tailored emails in this batch, split subjects between alumni-led and deal-led hooks, schedule analysts for 7-9 AM local time, and review replies daily. Keep every CTA to a 15-minute coffee chat.`;
}
