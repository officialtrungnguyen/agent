import type { Contact, ResumeProfile } from "@/types";
import { clamp, seniorityLabel } from "@/lib/utils";

export interface FitResult {
  score: number; // 0–100
  reasons: string[];
}

const ELITE_FIRMS = new Set([
  "Houlihan Lokey", "Piper Sandler", "Goldman Sachs", "William Blair",
  "Moelis & Company", "Evercore", "Centerview Partners", "Lazard", "PJT Partners",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Local, deterministic AI fit score. Combines:
 *  - mutual school tie (strong signal in IB recruiting)
 *  - seniority approachability (analysts/associates respond more)
 *  - coverage/sector overlap with the user's resume + target role
 *  - target-firm match
 *  - recent deal relevance to the user's stated interests
 *  - firm prestige weighting
 */
export function computeFitScore(contact: Contact, resume: ResumeProfile | null): FitResult {
  const reasons: string[] = [];
  let score = 42; // neutral baseline

  // --- Mutual school ---
  if (resume?.school && contact.school) {
    const a = resume.school.toLowerCase();
    const b = contact.school.toLowerCase();
    const aTokens = new Set(tokenize(a));
    const overlap = tokenize(b).filter((t) => aTokens.has(t)).length;
    if (overlap >= 1 && (a.includes(b) || b.includes(a) || overlap >= 2)) {
      score += 22;
      reasons.push(`Mutual alma mater — ${contact.school}`);
    }
  }

  // --- Seniority approachability ---
  switch (contact.seniority) {
    case "analyst":
      score += 14;
      reasons.push("Analyst — highly likely to reply and relate to your stage");
      break;
    case "associate":
      score += 12;
      reasons.push("Associate — strong reply rates, close to the recruiting process");
      break;
    case "vp":
      score += 6;
      reasons.push("VP — influential in pipeline decisions");
      break;
    case "director":
      score += 3;
      break;
    case "md":
      score += 1;
      reasons.push("MD — high value but lower base reply rate; lead with a sharp hook");
      break;
  }

  // --- Coverage / target-role overlap ---
  const resumeBlob = resume
    ? tokenize(
        [
          resume.targetRole,
          resume.major,
          resume.personalPitch,
          resume.skills.join(" "),
          resume.achievements.join(" "),
        ].join(" "),
      )
    : [];
  const resumeSet = new Set(resumeBlob);
  const coverageTokens = tokenize(contact.coverage.join(" ") + " " + contact.group);
  const covMatches = coverageTokens.filter((t) => resumeSet.has(t)).length;
  if (covMatches > 0) {
    const add = clamp(covMatches * 5, 0, 16);
    score += add;
    reasons.push(`Coverage aligns with your profile (${contact.coverage.slice(0, 2).join(", ")})`);
  }

  // --- Target firm ---
  if (resume?.targetFirms?.some((f) => f && contact.firm.toLowerCase().includes(f.toLowerCase()))) {
    score += 12;
    reasons.push(`${contact.firm} is on your target list`);
  } else if (ELITE_FIRMS.has(contact.firm)) {
    score += 6;
    reasons.push(`${contact.firm} is a bulge-bracket / elite-boutique target`);
  }

  // --- Recent deal relevance ---
  if (contact.recentDeals.length) {
    const dealTokens = tokenize(contact.recentDeals.map((d) => `${d.type} ${d.note ?? ""}`).join(" "));
    const dealMatches = dealTokens.filter((t) => resumeSet.has(t)).length;
    if (dealMatches > 0) {
      score += clamp(dealMatches * 3, 0, 9);
      reasons.push(`Recent deals touch themes from your resume`);
    } else {
      reasons.push(`Fresh, referenceable deal flow (${contact.recentDeals[0].company})`);
    }
  }

  // --- Priority nudge ---
  if (contact.priority === "tier_1") score += 4;
  if (contact.priority === "tier_3") score -= 4;

  score = clamp(Math.round(score), 5, 99);

  if (reasons.length === 0) {
    reasons.push(`${seniorityLabel[contact.seniority]} at ${contact.firm} — solid networking target`);
  }
  return { score, reasons: reasons.slice(0, 4) };
}

export function scoreBand(score: number): { label: string; tone: "green" | "blue" | "amber" | "slate" } {
  if (score >= 80) return { label: "Elite fit", tone: "green" };
  if (score >= 65) return { label: "Strong fit", tone: "blue" };
  if (score >= 50) return { label: "Solid fit", tone: "amber" };
  return { label: "Long shot", tone: "slate" };
}
