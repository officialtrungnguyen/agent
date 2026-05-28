import type {
  Contact,
  EmailVariant,
  Metrics,
  OutreachRecord,
  QueuedEmail,
  ResumeProfile,
  StoredAttachment
} from "../types";
import { daysSince, uid } from "./utils";

const defaultResume: ResumeProfile = {
  rawText: "",
  education: ["Target school finance coursework", "Investment banking technical prep"],
  skills: ["DCF", "Comparable companies", "Precedent transactions", "Excel", "PowerPoint"],
  achievements: [
    "Built detailed operating model and valuation case study",
    "Led student investment fund research memo",
    "Completed Wall Street technical interview preparation"
  ],
  experiences: ["Finance internship", "Student investment fund analyst"],
  targetRole: "Investment Banking Summer Analyst",
  personalPitch:
    "I am a finance-focused student preparing for investment banking with strong modeling reps and sector research experience."
};

const skillKeywords = [
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
  "accounting"
];

export function getDefaultResume() {
  return defaultResume;
}

export async function fileToStoredAttachment(file: File): Promise<StoredAttachment> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    base64: btoa(binary)
  };
}

export async function readResumeFile(file: File): Promise<{ text: string; attachment: StoredAttachment }> {
  const attachment = await fileToStoredAttachment(file);
  const buffer = await file.arrayBuffer();
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const printable = decoded
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    text: printable || `${file.name} uploaded. PDF text extraction will use stored attachment metadata.`,
    attachment
  };
}

export function parseResume(rawText: string, fileName?: string, attachment?: StoredAttachment): ResumeProfile {
  const compact = rawText.replace(/\s+/g, " ").trim();
  const sentences = compact
    .split(/(?<=[.!?])\s+|;|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const skills = skillKeywords.filter((keyword) => new RegExp(keyword, "i").test(compact));
  const education =
    compact.match(/(Wharton|Stern|Ross|Kelley|McIntire|Georgetown|Notre Dame|Duke|Northwestern|Cornell|Columbia|McCombs|University|College|School)[^.!?]{0,90}/gi) ??
    defaultResume.education;
  const achievements = sentences
    .filter((line) => /\b(led|built|created|modeled|analyzed|managed|ranked|selected|won|increased|reduced)\b/i.test(line))
    .slice(0, 6);

  return {
    ...defaultResume,
    rawText: compact,
    fileName,
    education: Array.from(new Set(education)).slice(0, 5),
    skills: Array.from(new Set([...skills, ...defaultResume.skills])).slice(0, 10),
    achievements: achievements.length ? achievements : defaultResume.achievements,
    experiences: sentences
      .filter((line) => /\b(intern|analyst|associate|fund|club|research|finance)\b/i.test(line))
      .slice(0, 5)
      .concat(defaultResume.experiences)
      .slice(0, 6),
    uploadedAt: new Date().toISOString(),
    originalAttachment: attachment
  };
}

export function contactStatus(contact: Contact, records: OutreachRecord[]) {
  const latest = records
    .filter((record) => record.contactId === contact.id)
    .sort((a, b) => new Date(b.sentAt ?? b.scheduledFor ?? 0).getTime() - new Date(a.sentAt ?? a.scheduledFor ?? 0).getTime())[0];
  const status = latest?.status ?? contact.status;
  const lastOutreach = latest?.sentAt ?? latest?.scheduledFor ?? contact.lastOutreach;
  const days = daysSince(lastOutreach);
  if ((status === "Sent" || status === "Delivered") && days !== undefined && days >= 7) {
    return { status: "No Reply" as const, lastOutreach, days };
  }
  return { status, lastOutreach, days };
}

export function calculateFitScore(contact: Contact, resume: ResumeProfile = defaultResume) {
  let score = 42;
  const resumeText = `${resume.rawText} ${resume.skills.join(" ")} ${resume.achievements.join(" ")}`.toLowerCase();
  contact.coverageSectors.forEach((sector) => {
    if (resumeText.includes(sector.toLowerCase().split(" ")[0])) score += 8;
  });
  if (resume.education.some((edu) => edu.toLowerCase().includes(contact.school.toLowerCase().split(" ")[0]))) score += 18;
  if (contact.priority === "A+") score += 14;
  if (contact.priority === "A") score += 10;
  if (contact.level === "Analyst" || contact.level === "Associate") score += 7;
  if (contact.level === "VP") score += 5;
  if (/m&a|valuation|model|dcf|lbo/i.test(resumeText) && /M&A|Restructuring|Financial Sponsors/.test(contact.team)) score += 9;
  score += Math.min(10, contact.relationshipStrength * 2);
  return Math.max(0, Math.min(100, score));
}

export function getOptimalSendTime(contact: Contact, base = new Date()) {
  const date = new Date(base);
  date.setSeconds(0, 0);
  if (date.getHours() >= 11) date.setDate(date.getDate() + 1);
  const hourByLevel: Record<string, number> = {
    Analyst: 7,
    Associate: 8,
    VP: 8,
    Director: 9,
    MD: 9,
    Partner: 9
  };
  date.setHours(hourByLevel[contact.level] ?? 8, contact.level === "Analyst" ? 35 : 15, 0, 0);
  return date.toISOString();
}

export function buildIcebreakers(contact: Contact, resume: ResumeProfile = defaultResume) {
  const deal = contact.recentDeals[0];
  return [
    `I noticed your ${contact.team} work around ${deal.company}/${deal.counterparty}; the ${deal.angle.toLowerCase()} is exactly the kind of transaction context I have been studying.`,
    `As a fellow ${contact.school} connection, I would value your perspective on how students can best prepare for ${contact.firm}'s ${contact.team} group.`,
    `Your coverage across ${contact.coverageSectors.slice(0, 2).join(" and ")} stood out because my background includes ${resume.achievements[0].toLowerCase()}.`,
    `I saw ${contact.firm}'s recent ${deal.type.toLowerCase()} activity in ${contact.coverageSectors[0]}; I would love to understand what makes analysts useful on that desk.`,
    `Your path in ${contact.location} maps closely to the recruiting lane I am targeting, especially ${resume.targetRole}.`
  ];
}

export function generateEmail(
  contact: Contact,
  resume: ResumeProfile = defaultResume,
  variant: EmailVariant = "Deal-Referenced"
) {
  const hook = buildIcebreakers(contact, resume)[variant === "Relationship-First" ? 1 : 0];
  const achievement = resume.achievements[0] ?? defaultResume.achievements[0];
  const subjectOptions = [
    `${contact.school} student interested in ${contact.firm} ${contact.team}`,
    `Quick question on ${contact.team}`,
    `${contact.firstName}, advice on IB recruiting?`
  ];

  const bodies: Record<EmailVariant, string> = {
    Short: `Hi ${contact.firstName},\n\nI am targeting ${resume.targetRole} roles and noticed your work in ${contact.firm}'s ${contact.team} group. ${hook}\n\nI have been preparing through ${achievement.toLowerCase()} and would be grateful for 15 minutes to hear how you recommend approaching the process.\n\nBest,\n[Your Name]`,
    "Relationship-First": `Hi ${contact.firstName},\n\nI am a ${contact.school}-connected student recruiting for ${resume.targetRole}. Your path at ${contact.firm} stood out because I am focused on ${contact.coverageSectors.slice(0, 2).join(" and ")} and trying to learn from people close to the work.\n\nIf you are open to it, I would really appreciate a brief coffee chat and will come prepared with specific questions.\n\nBest,\n[Your Name]`,
    "Deal-Referenced": `Hi ${contact.firstName},\n\n${hook}\n\nI am recruiting for ${resume.targetRole} roles and have built reps through ${achievement.toLowerCase()}. If you have 15 minutes, I would value your advice on preparing for ${contact.firm}'s ${contact.team} interviews and making a strong first impression.\n\nBest,\n[Your Name]`,
    Aggressive: `Hi ${contact.firstName},\n\nI am preparing intensely for ${resume.targetRole} recruiting and believe ${contact.firm}'s ${contact.team} group is one of the best fits for my interests in ${contact.coverageSectors.join(", ")}.\n\nGiven your seat, I would be grateful for 15 minutes to pressure-test my preparation and understand what top candidates do differently.\n\nBest,\n[Your Name]`
  };

  return {
    subjectOptions,
    subject: subjectOptions[0],
    body: bodies[variant],
    hook
  };
}

export function generateFollowUp(contact: Contact, original?: OutreachRecord, day = 7) {
  return {
    subject: original?.subject.startsWith("Re:") ? original.subject : `Re: ${original?.subject ?? `Quick question on ${contact.team}`}`,
    body: `Hi ${contact.firstName},\n\nI wanted to briefly follow up on my note from last week. I know your schedule is packed, so no worries if timing is difficult.\n\nI remain very interested in ${contact.firm}'s ${contact.team} group and would be grateful for any advice you are willing to share, even a quick pointer by email.\n\nBest,\n[Your Name]`,
    day
  };
}

export function createQueuedEmail(
  contact: Contact,
  resume: ResumeProfile,
  variant: EmailVariant,
  attachResume: boolean
): QueuedEmail {
  const generated = generateEmail(contact, resume, variant);
  return {
    id: uid("queue"),
    contactId: contact.id,
    to: contact.email,
    subject: generated.subject,
    body: generated.body,
    status: "Queued",
    variant,
    attachment: attachResume ? resume.originalAttachment : undefined
  };
}

export function calculateMetrics(records: OutreachRecord[]): Metrics {
  const sentRecords = records.filter((record) => ["Sent", "Delivered", "Replied", "Positive", "No Reply"].includes(record.status));
  const replies = records.filter((record) => record.status === "Replied" || record.status === "Positive").length;
  const positives = records.filter((record) => record.status === "Positive").length;
  const hooks = records
    .filter((record) => record.hook)
    .slice(-6)
    .map((record) => record.hook);
  return {
    sent: sentRecords.length,
    replies,
    positives,
    replyRate: sentRecords.length ? Math.round((replies / sentRecords.length) * 100) : 0,
    bestHooks: hooks.length ? hooks : ["Deal-specific opener", "Alumni tie", "Analyst preparation question"],
    bestSendTimes: ["Analyst: 7:35 AM", "VP: 8:15 AM", "MD: 9:15 AM"]
  };
}

export function buildTailoredBullets(contact: Contact, resume: ResumeProfile = defaultResume) {
  return [
    `Reframed ${resume.achievements[0].replace(/\.$/, "")} for ${contact.team} conversations, emphasizing ${contact.coverageSectors[0]} transaction judgment.`,
    `Prepared banker-specific research packet on ${contact.recentDeals[0].company}/${contact.recentDeals[0].counterparty} ${contact.recentDeals[0].type} rationale and valuation implications.`,
    `Built concise technical pitch connecting ${resume.skills.slice(0, 3).join(", ")} to analyst responsibilities at ${contact.firm}.`
  ];
}
