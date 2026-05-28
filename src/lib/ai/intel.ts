import type { Contact, ResumeData } from "../../types";

/**
 * Deep Intel agent — high-fidelity OFFLINE data first.
 * Generates icebreakers, talking points, deal commentary,
 * desk metrics, and shared interests.
 */

export interface IntelReport {
  summary: string;
  deskMetrics: Array<{ label: string; value: string }>;
  teamMoves: string[];
  sharedAlumniInterests: string[];
  icebreakers: string[];
  questions: string[];
  warnings: string[];
}

const SECTOR_TRENDS: Record<string, string[]> = {
  Technology: [
    "Software M&A multiples compressed ~15% vs 2022 peak but stabilizing into 2025.",
    "AI infrastructure carve-outs accelerating; sponsors deploying record dry powder.",
    "Sponsor-to-sponsor secondary buyouts dominating tech LBO activity.",
  ],
  Software: [
    "Vertical SaaS consolidation is the dominant 2025 theme.",
    "Take-privates returning as public multiples stay below private benchmarks.",
  ],
  Healthcare: [
    "Mid-cap MedTech bolt-ons resurgent; strategics chasing growth assets.",
    "Biotech IPO window cracked open again — quality names oversubscribed.",
  ],
  "Biotech & Pharma": [
    "Big Pharma replenishing pipelines aggressively post-2024 patent cliffs.",
    "Series of $1-3B oncology bolt-ons reshaping the sector.",
  ],
  Energy: [
    "Permian consolidation entering late innings; midstream M&A heating up.",
    "Capital discipline plus FCF returns driving public-co buyer behavior.",
  ],
  "Renewables & Clean Tech": [
    "IRA-fueled tax-equity volumes at record highs into 2026.",
    "Battery storage developers attracting strategic and sponsor capital.",
  ],
  "Financial Institutions": [
    "Regional bank M&A unfrozen; deposit-rich franchises trading at premiums.",
    "Specialty finance roll-ups continuing across SBL, equipment, and consumer.",
  ],
  Industrials: [
    "Defense and aerospace consolidation underway as backlogs grow.",
    "Industrial-tech crossover deals attracting both strategics and sponsors.",
  ],
  "Sponsors / Financial Sponsors": [
    "Sponsors holding portfolios longer; continuation funds increasingly common.",
    "Mega-cap take-privates returning with creative debt structures.",
  ],
  "Consumer & Retail": [
    "Premium brand carve-outs dominating activity; sponsors selective on bets.",
  ],
  Restructuring: [
    "2025 default activity ticking up in healthcare services and consumer.",
    "Liability-management exercises (LMEs) are the new normal before Chapter 11.",
  ],
};

function pickTrends(coverage: string[]): string[] {
  const out: string[] = [];
  for (const s of coverage) {
    const arr = SECTOR_TRENDS[s];
    if (arr) out.push(...arr);
  }
  if (out.length === 0) out.push("Strategic activity in this sector is steady with selective consolidation.");
  return out.slice(0, 4);
}

export function generateIntel(contact: Contact, resume: ResumeData | null): IntelReport {
  const trends = pickTrends(contact.coverage);
  const deals = contact.recentDeals || [];

  const deskMetrics = [
    { label: "Seniority", value: contact.seniority },
    { label: "Years at firm", value: String(contact.yearsAtFirm ?? "—") },
    { label: "Coverage", value: contact.coverage.join(", ") },
    { label: "Recent deals (24m)", value: String(deals.length) },
    {
      label: "Largest recent deal",
      value: deals[0]?.value || "—",
    },
    {
      label: "Group product",
      value: contact.team.split("—")[0].trim(),
    },
  ];

  const teamMoves: string[] = [];
  if (contact.previousFirm) {
    teamMoves.push(`${contact.firstName} ${contact.lastName} moved from ${contact.previousFirm} to ${contact.firm} ${contact.yearsAtFirm} years ago.`);
  }
  if (contact.seniority === "Vice President" || contact.seniority === "Director") {
    teamMoves.push(`The ${contact.team} group at ${contact.firm} has been actively hiring at the Associate/VP level.`);
  }
  if (contact.firmGroup === "Elite Boutique") {
    teamMoves.push(`${contact.firm} continues to win out-sized advisory mandates relative to headcount.`);
  }

  const sharedAlumniInterests: string[] = [];
  const mySchool = resume?.education?.[0]?.school;
  if (mySchool && (mySchool.toLowerCase().includes(simplify(contact.school)) || simplify(contact.school).includes(simplify(mySchool)))) {
    sharedAlumniInterests.push(`Shared alma mater: ${contact.school} — strong basis for an authentic warm intro.`);
  }
  sharedAlumniInterests.push(`${contact.school} has a notable alumni cluster on the ${contact.team} side of the Street.`);
  if (resume?.skills?.length) {
    const matched = resume.skills.filter((s) => contact.coverage.some((c) => c.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(c.toLowerCase())));
    if (matched.length) sharedAlumniInterests.push(`Resume keyword overlap with coverage: ${matched.slice(0, 5).join(", ")}.`);
  }

  const icebreakers: string[] = [];
  if (deals[0]) {
    icebreakers.push(`I saw your team's ${deals[0].title}. I'd love to hear what made that process unique.`);
    icebreakers.push(`Curious how the ${deals[0].sector || contact.coverage[0]} dynamic shaped the ${deals[0].title}.`);
  }
  icebreakers.push(`What's the most counterintuitive thing you've learned covering ${contact.coverage[0]} from the ${contact.firm} seat?`);
  if (mySchool) icebreakers.push(`As a fellow ${shortSchool(contact.school)} alum, I'd value your perspective on positioning for the ${contact.team} group.`);
  icebreakers.push(`If you had 60 seconds to give a junior recruiter one pointed piece of advice on breaking into ${contact.team}, what would it be?`);

  const questions = [
    `How is the ${contact.team} team thinking about ${contact.coverage[0]} valuations heading into the back half of the year?`,
    `What separates analysts who get repeat staffings on the most interesting deals from those who don't?`,
    `Which two or three skills would you tell me to over-invest in before day one?`,
    `Are there any specific subsectors within ${contact.coverage[0]} you'd be excited about as a junior?`,
  ];

  const warnings: string[] = [];
  if (contact.seniority === "Managing Director" || contact.seniority === "Partner") {
    warnings.push("Senior banker — keep the ask exceptionally tight and respect calendar.");
  }
  if (contact.lastOutreachAt) {
    warnings.push("You've already reached out — confirm before re-sending to avoid double-touch.");
  }

  const summary = `${contact.firstName} ${contact.lastName} is a ${contact.seniority} on the ${contact.team} team at ${contact.firm}, covering ${contact.coverage.join(", ")}. Based in ${contact.city}, ${contact.yearsAtFirm} years at firm${contact.previousFirm ? ` (previously ${contact.previousFirm})` : ""}. Sector posture: ${trends[0]}`;

  return {
    summary,
    deskMetrics,
    teamMoves,
    sharedAlumniInterests,
    icebreakers,
    questions,
    warnings,
  };
}

function simplify(s: string): string {
  return s.toLowerCase().replace(/\(.*?\)/g, "").replace(/university|college|the/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}
function shortSchool(s: string): string {
  return s.replace(/\s*\(.*?\)/, "").replace(/University|College/g, "").trim();
}
