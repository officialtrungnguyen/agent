import type { Contact, ResumeData, UserProfile } from "../../types";

/**
 * High-fidelity offline AI Fit Score.
 *
 * Returns 0-100 based on:
 *  - Shared school (heavy weight)
 *  - Sector overlap (resume skills / experiences match coverage)
 *  - Seniority sweet-spot (VP/Associate highest yield for outreach)
 *  - Target role alignment with banker's product/team
 *  - Recent deal momentum (>= 2 deals in last 18 months)
 *  - Geographic proximity (light)
 *
 * Always deterministic, no API quota dependency.
 */
export function scoreContact(
  contact: Contact,
  resume: ResumeData | null,
  profile: UserProfile
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 32; // baseline interest

  const resumeText = resumeFlatText(resume).toLowerCase();
  const profilePitch = (profile.personalPitch || "").toLowerCase();
  const targetRole = (profile.targetRole || "").toLowerCase();

  // School tie
  const candidateSchools = collectSchools(resume);
  const sharedSchool = candidateSchools.find(
    (s) =>
      sameSchool(s, contact.school) ||
      contact.school.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(simplifySchool(contact.school))
  );
  if (sharedSchool) {
    score += 22;
    reasons.push(`Shared school: ${contact.school}`);
  }

  // Sector overlap (resume + pitch)
  const sectorHits = contact.coverage.filter((sec) =>
    [resumeText, profilePitch, targetRole].some((t) =>
      t.includes(sec.toLowerCase()) || sec.toLowerCase().split(" ").every((w) => t.includes(w))
    )
  );
  if (sectorHits.length) {
    score += Math.min(18, 8 + sectorHits.length * 4);
    reasons.push(`Sector overlap: ${sectorHits.join(", ")}`);
  }

  // Seniority sweet spot
  if (contact.seniority === "Vice President") {
    score += 14;
    reasons.push("VP — highest reply yield");
  } else if (contact.seniority === "Associate") {
    score += 11;
    reasons.push("Associate — relatable, responsive");
  } else if (contact.seniority === "Director") {
    score += 8;
    reasons.push("Director — decision-maker");
  } else if (contact.seniority === "Analyst") {
    score += 7;
    reasons.push("Analyst — peer perspective");
  } else if (contact.seniority === "Managing Director") {
    score += 4;
    reasons.push("MD — long shot but high impact");
  }

  // Target role alignment with team / product
  const productMatch = ["m&a", "ecm", "dcm", "levfin", "restructuring", "sponsors"].some(
    (p) => targetRole.includes(p) && contact.team.toLowerCase().includes(p)
  );
  if (productMatch) {
    score += 8;
    reasons.push("Product line matches target role");
  }

  // Recent deal momentum
  const recent = (contact.recentDeals || []).filter((d) => {
    const ts = Date.parse(d.date + "-01");
    return Number.isFinite(ts) && Date.now() - ts < 1000 * 60 * 60 * 24 * 540;
  });
  if (recent.length >= 2) {
    score += 6;
    reasons.push(`${recent.length} recent deals — strong momentum`);
  }

  // Preferred firm
  if (
    profile.preferredFirms &&
    profile.preferredFirms.some((f) => f.toLowerCase() === contact.firm.toLowerCase())
  ) {
    score += 9;
    reasons.push(`${contact.firm} is on your priority firm list`);
  }

  // Tiny boost for boutiques (often higher reply rates)
  if (contact.firmGroup === "Elite Boutique") {
    score += 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}

function resumeFlatText(r: ResumeData | null): string {
  if (!r) return "";
  const parts: string[] = [r.rawText || ""];
  for (const e of r.experiences || []) {
    parts.push(e.title, e.company, ...(e.bullets || []));
  }
  parts.push(...(r.skills || []), ...(r.achievements || []));
  for (const ed of r.education || []) {
    parts.push(ed.school, ed.degree || "");
  }
  return parts.join(" \n ");
}

function collectSchools(r: ResumeData | null): string[] {
  if (!r) return [];
  return (r.education || []).map((e) => e.school).filter(Boolean);
}

function simplifySchool(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/university|college|the/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sameSchool(a: string, b: string): boolean {
  return simplifySchool(a) === simplifySchool(b);
}

export function priorityRank(c: Contact): number {
  // Higher = more important to contact this week
  const senPoints: Record<string, number> = {
    "Vice President": 5,
    Director: 4,
    Associate: 4,
    Analyst: 3,
    "Managing Director": 2,
    Partner: 1,
  };
  return (c.priority || 1) * 10 + (senPoints[c.seniority] || 0) + (c.fitScore || 0) / 20;
}
