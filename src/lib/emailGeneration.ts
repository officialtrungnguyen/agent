import { format } from "date-fns";
import type { Contact, EmailDraft, OutreachTone, ResumeProfile } from "@/types";
import { buildCompanyEmail, formatCurrencyMillions } from "@/lib/utils";

function trimmedUnder150Words(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 150) {
    return text.trim();
  }
  return `${words.slice(0, 149).join(" ")}…`;
}

function latestDealSnippet(contact: Contact): string {
  const latest = [...contact.recentDeals].sort(
    (a, b) => new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime(),
  )[0];
  if (!latest) {
    return `${contact.teamDesk} work at ${contact.firm}`;
  }
  return `${latest.company}'s ${latest.transactionType.toLowerCase()} with ${latest.counterparty} (${formatCurrencyMillions(latest.valueUSDMillions)})`;
}

function openingLine(contact: Contact, resume: ResumeProfile | null, tone: OutreachTone): string {
  const schoolTie = resume?.education.some((line) =>
    line.toLowerCase().includes(contact.school.toLowerCase()),
  )
    ? `as a fellow ${contact.school} alum`
    : "while targeting investment banking roles";

  switch (tone) {
    case "relationship_first":
      return `I hope your week is going well. I am reaching out ${schoolTie} and would value a brief perspective on your path in ${contact.teamDesk}.`;
    case "deal_referenced":
      return `Your recent involvement in ${latestDealSnippet(contact)} stood out to me, and I wanted to connect as I position for ${resume?.targetRole || "IB analyst"} recruiting.`;
    case "aggressive":
      return `I am executing a focused outreach sprint for ${resume?.targetRole || "IB analyst"} opportunities and your ${contact.teamDesk} seat at ${contact.firm} is one of my highest-priority targets.`;
    case "short":
    default:
      return `I am reaching out ${schoolTie} and would appreciate a quick perspective on recruiting into ${contact.teamDesk}.`;
  }
}

export function generateEmailDraft(
  contact: Contact,
  resume: ResumeProfile | null,
  variant: OutreachTone,
): EmailDraft {
  const topAchievement =
    resume?.achievements[0] ??
    "Built detailed valuation and operating models across live and simulated M&A situations.";
  const coverageAlignment = contact.coverageSectors.slice(0, 2).join(" and ");
  const outreachBody = trimmedUnder150Words(
    [
      `Hi ${contact.firstName},`,
      "",
      openingLine(contact, resume, variant),
      "",
      `Quick context: ${topAchievement}`,
      `I am especially interested in ${coverageAlignment} and would appreciate any advice on how candidates can add value early on your team.`,
      "If you have 15 minutes next week, I would be grateful for a brief coffee chat at your convenience.",
      "",
      "Best regards,",
      resume?.personalPitch
        ? `${resume.personalPitch.split(" ").slice(0, 6).join(" ")}`
        : "A motivated candidate preparing for IB recruiting",
    ].join("\n"),
  );

  const latestDeal = contact.recentDeals[0];
  const subjectA = `${contact.school} candidate interested in ${contact.teamDesk}`;
  const subjectB = latestDeal
    ? `${latestDeal.company} deal insight + quick intro`
    : `${contact.firm} ${contact.teamDesk} recruiting question`;

  return {
    id: `${contact.id}-${Date.now()}`,
    contactId: contact.id,
    variant,
    to: buildCompanyEmail(contact),
    subjectOptions: [subjectA, subjectB],
    chosenSubject: subjectA,
    body: outreachBody,
    includeTailoredResume: true,
    createdAt: new Date().toISOString(),
  };
}

export function suggestOptimalSendTime(contact: Contact, timezone: string): string {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + (now.getHours() >= 11 ? 1 : 0));
  next.setSeconds(0);
  next.setMilliseconds(0);

  const title = contact.title.toLowerCase();
  if (title.includes("analyst")) {
    next.setHours(8, 10, 0, 0);
  } else if (title.includes("vice president")) {
    next.setHours(9, 5, 0, 0);
  } else if (title.includes("managing director")) {
    next.setHours(10, 0, 0, 0);
  } else {
    next.setHours(8, 40, 0, 0);
  }

  // Keep timezone awareness visible and deterministic in payloads.
  const formatted = format(next, "yyyy-MM-dd'T'HH:mm:ss");
  return `${formatted} (${timezone})`;
}
