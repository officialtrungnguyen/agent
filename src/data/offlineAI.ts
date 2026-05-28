import type { Contact, EmailVariant, ResumeData } from "../types";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function generateIcebreakers(
  contact: Contact,
  resume: ResumeData | null
): string[] {
  const school = resume?.school ?? "your university";
  const deal = contact.recentDeals[0];
  const sector = contact.coverage[0] ?? "industrials";

  return [
    deal
      ? `Congratulations on ${deal.company} — the ${deal.value} transaction is exactly the kind of mandate I'm hoping to learn from on ${contact.team}.`
      : `I've been following ${contact.firm}'s ${sector} franchise and would value 15 minutes on how ${contact.team} sources proprietary ideas.`,
    contact.school === school
      ? `Fellow ${contact.school} alum here — I'd appreciate any perspective on breaking into ${contact.firm}'s ${contact.team} group.`
      : `While we didn't overlap at ${contact.school}, I've spoken with several ${contact.school} alumni who speak highly of your team's culture.`,
    `Your coverage in ${sector} aligns with my ${resume?.targetRole ?? "summer analyst"} focus — particularly after my experience ${resume?.experience[0]?.firm ? `at ${resume.experience[0].firm}` : "in related internships"}.`,
    `${pick(contact.icebreakerSeeds)} — I'd welcome a brief coffee chat if you have bandwidth this month.`,
    `I'm drafting outreach to ${contact.firm} bankers with genuine ${sector} interest; your recent work on ${deal?.company ?? "recent mandates"} stood out.`,
  ];
}

export function generateEmailVariants(
  contact: Contact,
  resume: ResumeData | null
): EmailVariant[] {
  const first = contact.firstName;
  const userName = resume?.name?.split(" ")[0] ?? "Alex";
  const school = resume?.school ?? "State University";
  const role = resume?.targetRole ?? "2026 Investment Banking Summer Analyst";
  const deal = contact.recentDeals[0];
  const sector = contact.coverage[0] ?? "M&A";

  const shortBody = `Hi ${first},

I'm ${userName}, a ${school} student targeting ${role} roles. Your work on ${contact.team} (${sector}) stood out — especially ${deal ? `${deal.company} (${deal.value})` : "recent mandates in your coverage"}.

Would you have 15 minutes for a brief call this week or next?

Best,
${userName}`;

  const relationshipBody = `Hi ${first},

I hope you're having a strong start to the year. I'm ${userName} at ${school}${contact.school === school ? " (fellow alum)" : ""}, exploring ${contact.firm}'s ${contact.team} platform.

Several peers spoke highly of your team's training and deal flow. I'd value any guidance on positioning for ${role} — happy to work around your calendar.

Thank you,
${userName}`;

  const dealBody = `Hi ${first},

${deal ? `Congratulations on the ${deal.company} transaction — impressive execution on a ${deal.value} mandate.` : `I've been tracking ${contact.firm}'s momentum in ${sector}.`}

I'm ${userName} (${school}), focused on ${role}. My background includes ${resume?.achievements[0] ?? "relevant internship and modeling experience"}, and I'm particularly interested in ${contact.coverage.slice(0, 2).join(" / ")}.

If you're open to it, I'd appreciate 15 minutes to learn how your team evaluates candidates.

Best regards,
${userName}`;

  const aggressiveBody = `Hi ${first},

${userName} | ${school} | ${role}. I'm reaching out to the top 20 bankers on my target list — you're on it because of ${contact.team} and ${sector} coverage.

I can share a one-pager on my deals experience and send times that work on your schedule. Worth a quick call?

${userName}`;

  const subjects = [
    `${school} student — ${contact.team} / quick question`,
    deal ? `Question re: ${deal.company} & ${contact.firm} recruiting` : `${sector} recruiting — ${userName}`,
    `15 min coffee chat? (${contact.firm})`,
  ];

  return [
    {
      id: "short",
      label: "Short",
      subject: subjects[0]!,
      body: shortBody,
    },
    {
      id: "relationship",
      label: "Relationship-First",
      subject: `${school}${contact.school === school ? " alum" : ""} — networking`,
      body: relationshipBody,
    },
    {
      id: "deal",
      label: "Deal-Referenced",
      subject: subjects[1]!,
      body: dealBody,
    },
    {
      id: "aggressive",
      label: "Aggressive",
      subject: subjects[2]!,
      body: aggressiveBody,
    },
  ];
}

export function generateFollowUp(
  contact: Contact,
  resume: ResumeData | null,
  days: 7 | 14,
  originalSubject: string
): EmailVariant {
  const userName = resume?.name?.split(" ")[0] ?? "Alex";
  const tone =
    days === 7
      ? "wanted to gently bump my note below in case it got buried."
      : "understand you're incredibly busy — last note on this.";

  return {
    id: `followup_${days}`,
    label: `${days}-Day Follow-up`,
    subject: `Re: ${originalSubject}`,
    body: `Hi ${contact.firstName},

${tone} I'm still very interested in learning about ${contact.firm}'s ${contact.team} group and would welcome any brief guidance when convenient.

Original thread: "${originalSubject}"

Best,
${userName}`,
  };
}

export function generateSubjectLines(
  contact: Contact,
  resume: ResumeData | null
): string[] {
  const school = resume?.school ?? "University";
  const deal = contact.recentDeals[0];
  return [
    `${school} — ${contact.team} coffee chat?`,
    deal ? `Quick Q on ${deal.company}` : `${contact.coverage[0]} recruiting question`,
    `${resume?.name?.split(" ")[0] ?? "Student"} / ${contact.firm} networking`,
    `15 minutes — ${contact.firm} ${contact.team}`,
    `Fellow ${contact.school === school ? contact.school + " " : ""}candidate intro`,
  ];
}

export function generateTailoredBullets(
  contact: Contact,
  resume: ResumeData
): string[] {
  const sector = contact.coverage[0] ?? "M&A";
  return [
    `Supported ${sector}-focused analyses aligned with ${contact.firm} ${contact.team} coverage priorities`,
    `Built LBO and merger models for transactions comparable to ${contact.recentDeals[0]?.value ?? "$500M+"} mandates`,
    ...resume.achievements.slice(0, 2).map((a) => `Highlighted: ${a}`),
  ];
}

export function strategyAdvisorReply(
  userMessage: string,
  resume: ResumeData | null,
  pipelineStats: { sent: number; replies: number; noReply: number }
): string {
  const lower = userMessage.toLowerCase();
  const name = resume?.name?.split(" ")[0] ?? "there";

  if (lower.includes("follow") || lower.includes("no reply")) {
    return `${name}, you have ${pipelineStats.noReply} contacts flagged for no-reply. Prioritize high-fit scores with school ties — send 7-day follow-ups Tuesday–Thursday 8–9 AM. Keep under 120 words and reference the original subject line.`;
  }
  if (lower.includes("top") || lower.includes("target")) {
    return `Focus on your Top 20 list: batch 5 outreach emails per day, alternate firms to avoid clustering, and lead with deal-referenced variants for MDs and relationship-first for VPs. Your reply rate improves when you mention a specific transaction from the last 90 days.`;
  }
  if (lower.includes("resume") || lower.includes("attach")) {
    return `Attach tailored one-pagers only after a positive reply or when the banker is VP-level or below. For MDs, keep the email body tight and offer to send materials if interested. Use the Resume panel to generate desk-specific bullets before attaching.`;
  }
  return `${name}, based on your pipeline (${pipelineStats.sent} sent, ${pipelineStats.replies} replies): double down on alumni at your priority firms, schedule sends in optimal windows (Analyst 7–9 AM, VP 8–10 AM, MD 9–11 AM), and log notes after every call. Ask me about follow-ups, Top 20 strategy, or resume attachments anytime.`;
}

export function parseResumeText(text: string, fileName?: string): ResumeData {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/\+?[\d\s().-]{10,}/);

  const name = lines[0] ?? "Candidate Name";
  const schoolLine =
    lines.find((l) =>
      /university|college|school|wharton|stern|ross|booth/i.test(l)
    ) ?? "Target University";

  const experience: ResumeData["experience"] = [];
  const achievements: string[] = [];
  const skills: string[] = [];

  let currentExp: ResumeData["experience"][0] | null = null;
  for (const line of lines) {
    if (/^[-•*]/.test(line)) {
      const bullet = line.replace(/^[-•*]\s*/, "");
      if (currentExp) currentExp.bullets.push(bullet);
      else achievements.push(bullet);
    } else if (
      /intern|analyst|associate|summer|bank|capital|advisory/i.test(line) &&
      line.length < 80
    ) {
      if (currentExp) experience.push(currentExp);
      currentExp = { firm: line, title: "", dates: "", bullets: [] };
    } else if (/excel|modeling|valuation|python|m&a|lbo|dcf/i.test(line)) {
      skills.push(line);
    }
  }
  if (currentExp) experience.push(currentExp);

  return {
    rawText: text,
    fileName,
    parsedAt: new Date().toISOString(),
    name,
    email: emailMatch?.[0] ?? "student@university.edu",
    phone: phoneMatch?.[0],
    school: schoolLine.replace(/.*at\s+/i, "").slice(0, 60) || schoolLine,
    graduationYear: "2026",
    targetRole: "2026 Investment Banking Summer Analyst",
    personalPitch:
      "Motivated finance student seeking bulge bracket and elite boutique IB roles with strong modeling and deal exposure.",
    education: [schoolLine],
    experience: experience.length
      ? experience
      : [
          {
            firm: "Regional Advisory Internship",
            title: "Summer Analyst",
            dates: "Summer 2024",
            bullets: [
              "Built DCF and trading comps for middle-market sell-side mandates",
              "Prepared CIM sections and buyer outreach lists",
            ],
          },
        ],
    skills: skills.length
      ? skills
      : ["Financial modeling", "LBO", "M&A", "Excel", "PowerPoint"],
    achievements: achievements.length
      ? achievements
      : [
          "Dean's List",
          "Investment club portfolio lead",
          "Case competition finalist",
        ],
  };
}
