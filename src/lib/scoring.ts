import { differenceInDays } from "date-fns";
import type { Contact, ResumeProfile } from "@/types";

const roleBoosters: Record<string, string[]> = {
  "investment banking analyst": ["valuation", "lbo", "m&a", "pitchbook", "financial modeling"],
  "investment banking associate": ["deal execution", "diligence", "process", "credit agreements"],
  "private equity analyst": ["lbo", "commercial diligence", "portfolio", "operating model"],
};

function containsAny(text: string, terms: string[]): number {
  return terms.reduce((acc, term) => (text.includes(term) ? acc + 1 : acc), 0);
}

export function computeFitScore(contact: Contact, resume: ResumeProfile | null): number {
  let score = 35;

  if (contact.priority === "critical") score += 18;
  if (contact.priority === "high") score += 10;

  const title = contact.title.toLowerCase();
  if (title.includes("analyst")) score += 7;
  if (title.includes("associate")) score += 10;
  if (title.includes("vice president")) score += 12;
  if (title.includes("managing director")) score += 9;

  if (resume) {
    const raw = `${resume.rawText} ${resume.skills.join(" ")} ${resume.achievements.join(" ")}`.toLowerCase();
    if (raw.includes(contact.school.toLowerCase())) score += 8;

    const sectorMatches = contact.coverageSectors.reduce((acc, sector) => {
      return raw.includes(sector.toLowerCase()) ? acc + 1 : acc;
    }, 0);
    score += sectorMatches * 6;

    const roleKey = resume.targetRole.toLowerCase();
    const boosters = roleBoosters[roleKey] ?? roleBoosters["investment banking analyst"];
    score += containsAny(raw, boosters) * 3;

    const deskKey = contact.teamDesk.toLowerCase().split(" ")[0];
    if (raw.includes(deskKey)) score += 6;
  }

  const recentLargeDeals = contact.recentDeals.filter((deal) => deal.valueUSDMillions >= 1000).length;
  score += Math.min(recentLargeDeals * 4, 12);

  if (contact.lastOutreach) {
    const staleDays = differenceInDays(new Date(), new Date(contact.lastOutreach));
    if (staleDays > 21) score -= 5;
    if (staleDays <= 7) score += 4;
  } else {
    score += 5;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getTopTargets(contacts: Contact[], count = 20): Contact[] {
  return [...contacts]
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
      const priorityOrder = { critical: 3, high: 2, medium: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, count);
}
