import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Contact,
  ContactFilters,
  EmailVariant,
  GeneratedEmail,
  MetricsSnapshot,
  QueueItem,
  ResumeAchievement,
  ResumeProfile,
  StrategyMessage,
  TimelineEvent,
} from "./types";

GlobalWorkerOptions.workerSrc = pdfWorker;

export const cn = (...inputs: Array<string | undefined | false | null>) => twMerge(clsx(inputs));

export const buildLinkedInSearchUrl = (contact: Contact) =>
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    contact.firstName + " " + contact.lastName + " " + contact.firm + " " + contact.school,
  )}`;

export const buildGoogleSearchUrl = (contact: Contact) =>
  `https://www.google.com/search?q=${encodeURIComponent(
    `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} investment banking`,
  )}`;

export const daysSince = (iso: string | null) => {
  if (!iso) return 0;
  const delta = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));
};

export const deriveStatusLabel = (contact: Contact) => {
  const noReplyDays = daysSince(contact.lastOutreach);
  if ((contact.status === "Sent" || contact.status === "Scheduled" || contact.status === "Queued") && noReplyDays >= 7) {
    return `No reply (${noReplyDays} days)`;
  }
  return contact.status;
};

export const computeFitScore = (contact: Contact, resume: ResumeProfile | null) => {
  let score = 46;

  if (contact.priority === "Tier 1") score += 15;
  if (contact.priority === "Tier 2") score += 8;
  if (resume) {
    const target = resume.targetRole.toLowerCase();
    const pitch = resume.personalPitch.toLowerCase();
    const skillsText = resume.skills.join(" ").toLowerCase();
    const achievementsText = resume.achievements.map((item) => item.text).join(" ").toLowerCase();

    if (target.includes("investment banking")) score += 8;
    if (target.includes("restructuring") && contact.teamDesk.toLowerCase().includes("restructuring")) score += 10;
    if (target.includes("m&a") && contact.teamDesk.toLowerCase().includes("m&a")) score += 10;
    if (resume.education.some((entry) => entry.toLowerCase().includes(contact.school.toLowerCase()))) score += 14;
    if (skillsText.match(/valuation|lbo|three-statement|financial modeling/)) score += 8;
    if (achievementsText.includes(contact.coverageSectors[0].toLowerCase())) score += 7;
    if (pitch.includes(contact.coverageSectors[0].toLowerCase())) score += 4;
    if (pitch.includes(contact.firm.toLowerCase())) score += 4;
  }

  score += contact.relationshipStrength * 2;
  score += Math.min(contact.recentTransactions.length * 2, 6);
  return Math.min(100, Math.max(38, score));
};

export const filterContacts = (contacts: Contact[], filters: ContactFilters) => {
  const query = filters.search.trim().toLowerCase();
  return contacts.filter((contact) => {
    const haystack = [
      contact.firstName,
      contact.lastName,
      contact.firm,
      contact.title,
      contact.teamDesk,
      contact.school,
      contact.coverageSectors.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (!filters.firm || contact.firm === filters.firm) &&
      (!filters.school || contact.school === filters.school) &&
      (!filters.status || contact.status === filters.status) &&
      (!filters.priority || contact.priority === filters.priority) &&
      (!filters.coverage || contact.coverageSectors.includes(filters.coverage))
    );
  });
};

const titleWindow: Record<string, { startHour: number; endHour: number }> = {
  analyst: { startHour: 7, endHour: 9 },
  associate: { startHour: 8, endHour: 10 },
  "vice president": { startHour: 8, endHour: 10 },
  "managing director": { startHour: 9, endHour: 11 },
};

export const getOptimalSendTime = (title: string, base = new Date()) => {
  const normalized = title.toLowerCase();
  const window =
    Object.entries(titleWindow).find(([key]) => normalized.includes(key))?.[1] ?? {
      startHour: 8,
      endHour: 10,
    };

  const sendAt = new Date(base);
  const businessDay = sendAt.getDay();
  if (businessDay === 0) sendAt.setDate(sendAt.getDate() + 1);
  if (businessDay === 6) sendAt.setDate(sendAt.getDate() + 2);

  const optimalHour = Math.min(window.endHour, Math.max(window.startHour, sendAt.getHours()));
  if (sendAt.getHours() >= window.endHour || sendAt.getHours() < window.startHour) {
    if (sendAt.getHours() >= window.endHour) {
      sendAt.setDate(sendAt.getDate() + 1);
    }
    sendAt.setHours(window.startHour, 15, 0, 0);
  } else {
    sendAt.setHours(optimalHour, 15, 0, 0);
  }

  const newDay = sendAt.getDay();
  if (newDay === 0) sendAt.setDate(sendAt.getDate() + 1);
  if (newDay === 6) sendAt.setDate(sendAt.getDate() + 2);
  return sendAt.toISOString();
};

const extractSections = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: Record<string, string[]> = {
    education: [],
    experience: [],
    leadership: [],
    skills: [],
    awards: [],
  };
  let current = "experience";

  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (normalized.includes("education")) current = "education";
    else if (normalized.includes("experience")) current = "experience";
    else if (normalized.includes("leadership") || normalized.includes("activities")) current = "leadership";
    else if (normalized.includes("skill")) current = "skills";
    else if (normalized.includes("award") || normalized.includes("honor")) current = "awards";
    else sections[current].push(line);
  }

  return sections;
};

export const parseResumeText = (text: string, fileName: string, targetRole: string, personalPitch: string): ResumeProfile => {
  const sections = extractSections(text);
  const bulletMatcher = /^[-*•]/;
  const achievements: ResumeAchievement[] = [];

  (Object.entries(sections) as Array<[ResumeAchievement["section"], string[]]>).forEach(([section, lines]) => {
    lines.forEach((line) => {
      if (bulletMatcher.test(line) || line.length > 48) {
        achievements.push({ section, text: line.replace(bulletMatcher, "").trim() });
      }
    });
  });

  const summarySeed = [...sections.experience, ...sections.leadership].slice(0, 3).join(" ");
  const skills = sections.skills.join(" ").split(/[|,]/).map((entry) => entry.trim()).filter(Boolean);

  return {
    fileName,
    originalText: text,
    summary: summarySeed || "Ambitious candidate targeting high-caliber investment banking teams with strong execution reps.",
    education: sections.education.slice(0, 6),
    experience: sections.experience.slice(0, 10),
    achievements: achievements.slice(0, 18),
    skills,
    targetRole,
    personalPitch,
    uploadedAt: new Date().toISOString(),
  };
};

export const extractResumeFromFile = async (
  file: File,
  targetRole: string,
  personalPitch: string,
) => {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
    }
    return parseResumeText(text, file.name, targetRole, personalPitch);
  }

  const text = await file.text();
  return parseResumeText(text, file.name, targetRole, personalPitch);
};

const pickStrongAchievement = (resume: ResumeProfile | null, fallback: string) =>
  resume?.achievements[0]?.text ?? resume?.experience[0] ?? fallback;

export const buildTailoredBullets = (contact: Contact, resume: ResumeProfile | null) => {
  const anchor = pickStrongAchievement(
    resume,
    "Built repeatable financial modeling and due diligence reps under tight timelines.",
  );
  return [
    `Translate ${anchor.replace(/\.$/, "")} into a ${contact.teamDesk.toLowerCase()} narrative with a sharper emphasis on ${contact.coverageSectors[0].toLowerCase()} execution.`,
    `Add one results-oriented line that ties your technical work to banker-ready outputs such as valuation synthesis, buyer screening, or management presentation prep.`,
    `Surface one concise proof point showing why your background maps to ${contact.firm}'s ${contact.teamDesk.toLowerCase()} team rather than generic finance recruiting.`,
  ];
};

export const generateEmailDraft = (
  contact: Contact,
  resume: ResumeProfile | null,
  variant: EmailVariant,
) : GeneratedEmail => {
  const achievement = pickStrongAchievement(
    resume,
    "recent internships focused on modeling, diligence support, and transaction process work",
  );
  const firstDeal = contact.recentTransactions[0];
  const sharedSchool = resume?.education.find((entry) =>
    entry.toLowerCase().includes(contact.school.toLowerCase()),
  );
  const hook =
    sharedSchool ??
    `I have been following ${contact.firm}'s ${contact.teamDesk.toLowerCase()} work and especially the ${firstDeal.company} transaction`;
  const closer = "If you might have 15 minutes for a quick coffee chat, I would be grateful for the chance to learn from your path.";

  const bodies: Record<EmailVariant, string> = {
    Short: `Hi ${contact.firstName},\n\n${hook}. I am recruiting for ${resume?.targetRole ?? "investment banking"} roles and thought your path from ${contact.school} into ${contact.teamDesk.toLowerCase()} stood out. My background includes ${achievement}. ${closer}\n\nBest,\nCandidate`,
    "Relationship-First": `Hi ${contact.firstName},\n\nI hope you are doing well. I am a ${contact.school} alumni network-driven candidate recruiting for ${resume?.targetRole ?? "investment banking"} and wanted to reach out because your move into ${contact.firm}'s ${contact.teamDesk.toLowerCase()} team is exactly the path I am trying to learn from. My recent work includes ${achievement}. ${closer}\n\nBest,\nCandidate`,
    "Deal-Referenced": `Hi ${contact.firstName},\n\nI saw your team's work on ${firstDeal.company}'s ${firstDeal.value} transaction with ${firstDeal.counterparty} and thought the strategic angle around ${contact.coverageSectors[0].toLowerCase()} was especially compelling. I am currently recruiting for ${resume?.targetRole ?? "investment banking"} roles, and my experience includes ${achievement}. ${closer}\n\nBest,\nCandidate`,
    Aggressive: `Hi ${contact.firstName},\n\nI am reaching out because I am targeting ${contact.teamDesk.toLowerCase()} groups and believe my background in ${achievement} aligns well with the execution profile your team values. I have followed ${contact.firm}'s work in ${contact.coverageSectors[0].toLowerCase()} and would appreciate the chance to ask a few focused questions. ${closer}\n\nBest,\nCandidate`,
  };

  return {
    variant,
    body: bodies[variant],
    subjectOptions: [
      `${contact.school} student interested in ${contact.teamDesk}`,
      `Quick question on ${contact.firm}'s ${contact.coverageSectors[0]} work`,
      `${contact.firstName}, would value your advice on IB recruiting`,
    ],
    optimalSendAt: getOptimalSendTime(contact.title),
  };
};

export const buildFollowUpDraft = (contact: Contact, days: 7) =>
  `Hi ${contact.firstName},\n\nI wanted to briefly follow up on my prior note in case it got buried. I remain very interested in learning more about your path into ${contact.firm}'s ${contact.teamDesk.toLowerCase()} team and would be grateful for any advice when convenient.\n\nBest,\nCandidate`;

export const buildMetricsSnapshot = (
  contacts: Contact[],
  timeline: TimelineEvent[],
  queue: QueueItem[],
): MetricsSnapshot => {
  const sent = contacts.filter((contact) => contact.status === "Sent").length;
  const replied = contacts.filter((contact) => contact.status === "Replied").length;
  const noReply = contacts.filter((contact) => deriveStatusLabel(contact).startsWith("No reply")).length;
  const scheduled = queue.filter((item) => item.status === "Scheduled").length;
  const queued = queue.filter((item) => item.status === "Queued").length;
  const positiveResponses = timeline.filter((event) => event.type === "reply").length;
  const replyRate = sent + replied === 0 ? 0 : Math.round((replied / (sent + replied)) * 100);

  return {
    totalContacts: contacts.length,
    sent,
    replied,
    noReply,
    scheduled,
    queued,
    positiveResponses,
    replyRate,
    bestHooks: [
      "Alumni school tie + current team",
      "Recent transaction reference",
      "Specific modeling proof point",
    ],
    bestSendWindows: ["7:15 AM analysts", "8:30 AM VPs", "9:15 AM MDs"],
  };
};

export const buildTopTargets = (contacts: Contact[]) =>
  [...contacts]
    .sort((left, right) => right.fitScore - left.fitScore || left.relationshipStrength - right.relationshipStrength)
    .slice(0, 20);

export const buildStrategyReply = (
  prompt: string,
  contacts: Contact[],
  resume: ResumeProfile | null,
  queue: QueueItem[],
) => {
  const topTargets = buildTopTargets(contacts).slice(0, 3);
  const queuedNames = queue.slice(0, 3).map((item) => item.contactName).join(", ") || "no one yet";
  const targetRole = resume?.targetRole ?? "investment banking";
  const focus = prompt.toLowerCase();

  if (focus.includes("follow")) {
    return `Prioritize 7-day follow-ups for any amber-flag contacts before adding more cold outreach. A clean sequence is: nudge Tier 1 contacts first, then queue two fresh Tier 2 names so your pipeline stays balanced.`;
  }

  if (focus.includes("interview") || focus.includes("technical")) {
    return `Use your current ${targetRole} messaging to open doors, but pair it with two technical proof points: one valuation rep and one transaction process rep. Your strongest targets right now are ${topTargets.map((contact) => `${contact.firstName} ${contact.lastName} (${contact.firm})`).join(", ")}.`;
  }

  return `Your weekly networking wedge should be ${topTargets[0]?.teamDesk ?? "high-fit execution teams"} because it overlaps with ${resume?.personalPitch ?? "your stated pitch"} and your strongest experience bullets. Queue looks healthy with ${queuedNames}. This week, send early-morning notes to ${topTargets.map((contact) => contact.firstName).join(", ")}, then ask one deal-specific question and one culture question on calls.`;
};

export const exportContactsCsv = (contacts: Contact[]) => {
  const rows = [
    [
      "firstName",
      "lastName",
      "firm",
      "title",
      "teamDesk",
      "school",
      "priority",
      "status",
      "email",
      "location",
    ],
    ...contacts.map((contact) => [
      contact.firstName,
      contact.lastName,
      contact.firm,
      contact.title,
      contact.teamDesk,
      contact.school,
      contact.priority,
      contact.status,
      contact.email,
      contact.location,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "bulgebracket-contacts.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

export const buildInitialStrategyMessages = (): StrategyMessage[] => [
  {
    id: "strategy-system",
    role: "assistant",
    content:
      "I’m your BulgeBracket.ai strategy advisor. Ask me which bankers to prioritize, how to refine your pitch, or how to sequence follow-ups this week.",
    createdAt: new Date().toISOString(),
  },
];

export const toTimelineEvent = (
  contactId: string,
  type: TimelineEvent["type"],
  title: string,
  body: string,
): TimelineEvent => ({
  id: `${contactId}-${type}-${Date.now()}`,
  contactId,
  type,
  title,
  body,
  timestamp: new Date().toISOString(),
});
