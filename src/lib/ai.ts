import { offlineIntelSnapshots } from "../data/offlineIntelData";
import type {
  AnalyticsSnapshot,
  Contact,
  ContactIntel,
  EmailVariant,
  OutreachEmail,
  StrategyAdvice,
  UserProfile
} from "../types";
import { clamp, daysSince } from "./utils";

const pick = <T,>(array: readonly T[], index: number): T => array[index % array.length] as T;

const variantOpeners: Record<EmailVariant, string> = {
  short: "I know your inbox is crowded, so I will keep this concise.",
  relationship_first:
    "I have followed your team's trajectory and would value your perspective on breaking into your group.",
  deal_referenced:
    "Your recent execution stood out to me, especially how your team framed the strategic rationale.",
  aggressive:
    "I am targeting your desk specifically and would appreciate a direct calibration on where I can create value."
};

export const computeFitScore = (contact: Contact, profile: UserProfile): number => {
  const resume = profile.resume;
  if (!resume) {
    return 60;
  }

  const schoolToken = contact.school.toLowerCase().split(" ")[0] ?? "";
  const schoolMatch = resume.education.some((edu) => edu.school.toLowerCase().includes(schoolToken)) ? 15 : 0;
  const sectorMatch = contact.coverageSectors.some((sector) =>
    resume.parsedText.toLowerCase().includes(sector.toLowerCase())
  )
    ? 22
    : 8;
  const targetRoleMatch = profile.resume?.targetRole.toLowerCase().includes(contact.title.toLowerCase()) ? 12 : 6;
  const priorityBoost = contact.priority === "critical" ? 18 : contact.priority === "high" ? 12 : 6;
  const recencyPenalty = daysSince(contact.lastOutreachAt) > 14 ? -8 : 3;
  const relationshipBoost = contact.relationshipStrength * 4;

  return clamp(20 + schoolMatch + sectorMatch + targetRoleMatch + priorityBoost + relationshipBoost + recencyPenalty, 0, 100);
};

export const buildLinkedInSearchUrl = (contact: Contact) =>
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school}`
  )}`;

export const buildGoogleSearchUrl = (contact: Contact) =>
  `https://www.google.com/search?q=${encodeURIComponent(
    `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} M&A`
  )}`;

export const buildContactIntel = (contact: Contact): ContactIntel => {
  const snapshot =
    offlineIntelSnapshots.find(
      (candidate) =>
        candidate.firm === contact.firm &&
        contact.teamDesk.toLowerCase().includes((candidate.desk.split(" ")[0] ?? "").toLowerCase())
    ) ?? pick(offlineIntelSnapshots, contact.id.length);

  const transactions = contact.recentDeals.slice(0, 3);
  const sharedAlumniInterests = [
    `${contact.school} alumni mentorship`,
    `${contact.coverageSectors[0]} market mapping`,
    "Execution process training for aspiring analysts"
  ];
  const styleInsights = [
    "Responds best to concise asks with explicit agenda.",
    "References to recent mandates increase reply likelihood.",
    ...snapshot.marketPulse.slice(0, 1)
  ];

  const firstDeal = transactions[0];

  const icebreakers = [
    `Saw your ${firstDeal?.company ?? "recent"} mandate in ${firstDeal?.sector ?? contact.coverageSectors[0]}; would love your view on what differentiated the winning buyer thesis.`,
    `As a fellow ${contact.school} alum candidate, I would value your advice on standing out for ${contact.teamDesk}.`,
    `Your ${contact.coverageSectors[0]} coverage mix aligns closely with my recent coursework and deal experience.`,
    `I noticed your desk's focus on ${contact.coverageSectors[1]}; curious how analysts can add value early in process prep.`,
    `Your progression at ${contact.firm} is exactly the path I am preparing for this cycle.`
  ].map((text, index) => ({ id: `${contact.id}-ice-${index}`, text }));

  return {
    teamDesk: contact.teamDesk,
    coverageSectors: contact.coverageSectors,
    transactions,
    sharedAlumniInterests,
    styleInsights: [...styleInsights, ...snapshot.teamMoves.slice(0, 1)],
    icebreakers
  };
};

const pickHook = (contact: Contact) =>
  `I am a ${contact.school} student focused on ${contact.coverageSectors[0]} and was impressed by your ${contact.teamDesk} execution track record`;

const subjectOptions = (contact: Contact) => [
  `${contact.school} -> ${contact.firm} ${contact.teamDesk} | quick coffee chat`,
  `${contact.coverageSectors[0]} aspiring analyst - would value your insight`,
  `15-minute networking request (${contact.school} / ${contact.teamDesk})`
];

export const generateEmailDraft = (
  contact: Contact,
  profile: UserProfile,
  variant: EmailVariant
): { subjectOptions: string[]; draft: string } => {
  const resume = profile.resume;
  const achievements = resume?.achievements.slice(0, 2).join("; ") ?? "built foundational valuation and modeling repetition";
  const opener = variantOpeners[variant];
  const hook = pickHook(contact);

  const draft = `${opener}

${hook}. I am recruiting for ${resume?.targetRole ?? "investment banking analyst"} roles and preparing intentionally for ${contact.teamDesk}.

A quick line on my background: ${achievements}. If useful, I would be grateful for 15 minutes to learn how you approach execution and what differentiates top candidates for your group.

Thank you for considering it,
${profile.fullName}`;

  return { subjectOptions: subjectOptions(contact), draft };
};

export const generateFollowUpDraft = (contact: Contact, days: 7 | 14) =>
  `Hi ${contact.firstName},

I wanted to follow up ${days === 14 ? "again" : ""} on my prior note in case it got buried. I remain very interested in learning from your experience in ${contact.teamDesk} at ${contact.firm}.

If you have 15 minutes in the coming days, I would really appreciate the opportunity to connect.

Best,\n`;

export const analyticsSnapshot = (emails: OutreachEmail[]): AnalyticsSnapshot => {
  const sent = emails.filter((item) => item.status === "sent" || item.status === "delivered").length;
  const replies = emails.filter((item) => item.status === "delivered").length;
  const positiveResponses = Math.max(0, Math.floor(replies * 0.72));
  const replyRate = sent === 0 ? 0 : Number(((replies / sent) * 100).toFixed(1));
  return {
    sent,
    replies,
    positiveResponses,
    replyRate,
    bestHooks: [
      "Shared alumni tie + concise CTA",
      "Deal-referenced opener under 130 words",
      "Specific desk coverage mention"
    ],
    bestSendTimes: ["07:30", "08:15", "09:05"]
  };
};

export const topTargetsThisWeek = (contacts: Contact[], profile: UserProfile) =>
  [...contacts]
    .sort((a, b) => computeFitScore(b, profile) - computeFitScore(a, profile))
    .slice(0, 20);

export const strategyAdvisor = (
  profile: UserProfile,
  contacts: Contact[],
  sentCount: number
): StrategyAdvice => {
  const topFirm = contacts.reduce<Record<string, number>>((acc, contact) => {
    acc[contact.firm] = (acc[contact.firm] ?? 0) + 1;
    return acc;
  }, {});
  const bestFirm = Object.entries(topFirm).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "top firms";
  const advice =
    sentCount < 12
      ? `Increase cadence this week: send 12-15 high-fit emails with a deal-referenced opener, focused on ${bestFirm}.`
      : `Your volume is healthy. Shift to precision follow-ups and prioritize warm alumni ties in ${bestFirm}.`;

  return {
    id: `advice-${Date.now()}`,
    createdAt: new Date().toISOString(),
    summary: `${advice} Keep each ask clear, respectful, and under 150 words. Resume anchor: ${
      profile.resume?.targetRole ?? "IB Analyst"
    }.`
  };
};

export const bestSendSlot = (title: Contact["title"], timezone: string): string => {
  const now = new Date();
  const local = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const hourByTitle = title === "Analyst" ? 7 : title === "VP" ? 8 : title === "MD" ? 9 : 8;
  return `${local.year}-${local.month}-${local.day}T${String(hourByTitle).padStart(2, "0")}:30:00`;
};
