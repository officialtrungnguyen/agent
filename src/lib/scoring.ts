import type { Contact, UserResume } from "@/types";

/**
 * Recompute an AI fit score on the fly using the live user resume + contact.
 * The numbers below mirror the seed scoring engine but are reactive to the
 * user's targets so updating the resume re-prioritizes the entire ledger.
 */

export interface ScoringResult {
  score: number;
  priority: "S" | "A" | "B" | "C";
  reasoning: string[];
}

export function computeFitScore(contact: Contact, resume: Partial<UserResume> | undefined): ScoringResult {
  const reasoning: string[] = [];
  let score = 55;

  const userSchool = (resume?.education?.[0]?.school ?? "").toLowerCase();
  const sharedSchool =
    userSchool &&
    (userSchool.includes(contact.school.toLowerCase().split(" ")[0] ?? "") ||
      contact.school.toLowerCase().includes(userSchool.split(" ")[0] ?? ""));

  if (sharedSchool) {
    score += 18;
    reasoning.push(`Same alma mater (${contact.school}) — strongest single callback signal`);
  } else {
    reasoning.push("Cross-school outreach — lead with deal specificity and humility");
  }

  const targetRole = (resume?.targetRole ?? "").toLowerCase();
  const targetFirms = (resume?.targetFirms ?? []).map((f) => f.toLowerCase());
  const sectorWords = targetRole.split(/[^a-z]+/).filter(Boolean);
  const sectorFit = contact.coverage.some((c) => sectorWords.some((w) => c.toLowerCase().includes(w)));
  if (sectorFit) {
    score += 12;
    reasoning.push(`Coverage match: ${contact.coverage.join(", ")}`);
  }
  if (targetFirms.some((f) => contact.firm.toLowerCase().includes(f))) {
    score += 10;
    reasoning.push(`${contact.firm} is in your target-firm list`);
  }

  const seniorityBoosts: Record<Contact["seniority"], number> = {
    Analyst: 4,
    Associate: 6,
    "Vice President": 8,
    Director: 7,
    "Senior Vice President": 6,
    "Managing Director": -2,
    Partner: -3,
  };
  score += seniorityBoosts[contact.seniority] ?? 0;
  if (contact.seniority === "Vice President" || contact.seniority === "Director") {
    reasoning.push("VP/Director — high signal-to-noise tier on Wall Street");
  } else if (contact.seniority === "Associate") {
    reasoning.push("Associate — typically the highest responder tier");
  } else if (contact.seniority === "Managing Director" || contact.seniority === "Partner") {
    reasoning.push("Senior MD/Partner — reserve until you have warm intros / momentum");
  }

  if (contact.recentDeals.length >= 3) {
    score += 4;
    reasoning.push(`${contact.recentDeals.length} relevant recent transactions — rich hook material`);
  }

  score = Math.max(40, Math.min(99, Math.round(score)));
  const priority: ScoringResult["priority"] =
    score >= 90 ? "S" : score >= 78 ? "A" : score >= 65 ? "B" : "C";
  return { score, priority, reasoning };
}
