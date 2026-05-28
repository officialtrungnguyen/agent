/**
 * BulgeBracket.ai — Alumni Ledger seed dataset.
 *
 * Generates 240+ high-fidelity realistic IB alumni contacts deterministically.
 * Each contact is fully populated with team/desk, coverage sectors, recent
 * deal references (drawn from each firm's real notable transactions), school,
 * priority, fit-score scaffold, status, interests, and icebreakers.
 *
 * This dataset is the primary source of truth for the table, kanban, profile
 * intelligence panel, outreach composer, scheduler, follow-up engine, and
 * analytics dashboard.
 */

import type {
  Contact,
  CoverageSector,
  DealReference,
  Firm,
  OutreachStatus,
  Priority,
  Product,
  Seniority,
} from "@/types";
import { FIRM_CATALOG, getFirmProfile, type FirmProfile } from "@/data/firmCatalog";
import {
  FIRST_NAMES,
  ICEBREAKER_TEMPLATES,
  INTEREST_POOL,
  LAST_NAMES,
  SCHOOL_POOL,
} from "@/data/peopleSeed";

/** Tiny mulberry32 PRNG for deterministic data generation. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xb6_0e_b1_77);

function pick<T>(arr: readonly T[], r = rand): T {
  return arr[Math.floor(r() * arr.length)]!;
}

function pickMany<T>(arr: readonly T[], n: number, r = rand): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(r() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

function weightedPick<T extends { weight: number }>(arr: readonly T[], r = rand): T {
  const total = arr.reduce((a, b) => a + b.weight, 0);
  let n = r() * total;
  for (const item of arr) {
    n -= item.weight;
    if (n <= 0) return item;
  }
  return arr[arr.length - 1]!;
}

const SENIORITY_LADDER: { seniority: Seniority; titles: string[]; weight: number }[] = [
  {
    seniority: "Analyst",
    titles: ["Analyst", "Analyst 2", "Investment Banking Analyst", "1st-Year Analyst", "2nd-Year Analyst"],
    weight: 18,
  },
  {
    seniority: "Associate",
    titles: ["Associate", "Senior Associate", "Investment Banking Associate"],
    weight: 22,
  },
  {
    seniority: "Vice President",
    titles: ["Vice President", "Vice President — Banking"],
    weight: 18,
  },
  {
    seniority: "Director",
    titles: ["Director", "Executive Director"],
    weight: 12,
  },
  {
    seniority: "Senior Vice President",
    titles: ["Senior Vice President"],
    weight: 6,
  },
  {
    seniority: "Managing Director",
    titles: ["Managing Director", "Co-Head", "Group Head"],
    weight: 16,
  },
  {
    seniority: "Partner",
    titles: ["Partner", "Managing Partner"],
    weight: 4,
  },
];

const STATUS_DISTRIBUTION: { status: OutreachStatus; weight: number }[] = [
  { status: "not_contacted", weight: 62 },
  { status: "queued", weight: 4 },
  { status: "scheduled", weight: 4 },
  { status: "sent", weight: 11 },
  { status: "opened", weight: 4 },
  { status: "replied", weight: 6 },
  { status: "no_reply", weight: 7 },
  { status: "meeting_set", weight: 2 },
];

function senioritySalt(seniority: Seniority): number {
  return ({
    Analyst: 0,
    Associate: 2,
    "Vice President": 4,
    Director: 5,
    "Senior Vice President": 6,
    "Managing Director": 8,
    Partner: 9,
  } as Record<Seniority, number>)[seniority];
}

function emailFromName(first: string, last: string, domain: string, idx: number): string {
  const variations = [
    `${first.toLowerCase()}.${last.toLowerCase()}`,
    `${first[0]!.toLowerCase()}${last.toLowerCase()}`,
    `${first.toLowerCase()}${last[0]!.toLowerCase()}`,
    `${first.toLowerCase()}_${last.toLowerCase()}`,
  ];
  const choice = variations[idx % variations.length]!;
  return `${choice.replace(/'/g, "").replace(/[^a-z0-9._]/g, "")}@${domain}`;
}

function buildDeals(profile: FirmProfile, sectors: CoverageSector[]): DealReference[] {
  const relevant = profile.notableDeals.filter((d) => sectors.includes(d.sector));
  const pool = relevant.length > 0 ? relevant : profile.notableDeals;
  const n = Math.min(3, Math.max(2, Math.floor(rand() * 3) + 2));
  return pickMany(pool, n).map((d) => ({
    target: d.target,
    acquirer: d.acquirer,
    value: d.value,
    date: d.date,
    role: d.role,
    product: d.product,
  }));
}

function buildDesk(seniority: Seniority, sectors: CoverageSector[], product: Product, city: string): string {
  const primary = sectors[0] ?? "Generalist";
  if (seniority === "Analyst" || seniority === "Associate") {
    return `${primary} ${product} — ${city}`;
  }
  if (seniority === "Vice President" || seniority === "Director" || seniority === "Senior Vice President") {
    return `${primary} ${product} Coverage — ${city}`;
  }
  return `${primary} ${product} Group — ${city}`;
}

function priorityFor(seniority: Seniority, fitScore: number): Priority {
  const score = fitScore + senioritySalt(seniority) * 2;
  if (score >= 92) return "S";
  if (score >= 80) return "A";
  if (score >= 66) return "B";
  return "C";
}

function buildIcebreakers(
  firm: Firm,
  deals: DealReference[],
  school: string,
  sector: CoverageSector,
): string[] {
  const dealNuances = [
    "the financing structure",
    "the antitrust dynamics",
    "the carve-out workstream",
    "the cross-border tax workstream",
    "the credit-side fulcrum positioning",
    "the second-round process dynamics",
    "the management presentation prep",
    "the sponsor diligence cadence",
  ];
  const prevRoles = [
    "Big 4 audit", "private equity", "consulting", "credit research", "equity research",
    "corporate development", "trading", "asset management",
  ];
  const picked = pickMany(ICEBREAKER_TEMPLATES, 4);
  return picked.map((tpl) => {
    const deal = deals[Math.floor(rand() * deals.length)]!;
    return tpl
      .replace("{firm}", firm)
      .replace("{deal}", `${deal.target}${deal.acquirer ? ` / ${deal.acquirer}` : ""}`)
      .replace("{dealNuance}", pick(dealNuances))
      .replace("{sector}", sector)
      .replace("{school}", school)
      .replace("{prevRole}", pick(prevRoles))
      .replace("{role}", Math.random() > 0.5 ? "buy-side" : "sell-side");
  });
}

function buildFitScore(
  seniority: Seniority,
  isTargetSchool: boolean,
  isTargetCoverage: boolean,
  isTargetFirm: boolean,
  responsiveness: number,
): { score: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 55;

  if (isTargetSchool) {
    score += 18;
    reasoning.push("Same alma mater as you — strongest single signal for callback rates");
  } else {
    reasoning.push("Cross-school outreach — lead with deal specificity");
  }
  if (isTargetCoverage) {
    score += 12;
    reasoning.push("Covers your target sector — directly relevant networking value");
  }
  if (isTargetFirm) {
    score += 10;
    reasoning.push("Firm in your top-5 target list");
  }

  if (seniority === "Vice President" || seniority === "Director") {
    score += 8;
    reasoning.push("VP/Director — high signal-to-noise: enough seniority to refer, still responsive");
  } else if (seniority === "Associate") {
    score += 6;
    reasoning.push("Associate — typically the highest responder tier on Wall Street");
  } else if (seniority === "Analyst") {
    score += 4;
    reasoning.push("Analyst — great for honest tactical advice, lower decision-making power");
  } else if (seniority === "Managing Director" || seniority === "Partner") {
    score -= 2;
    reasoning.push("Senior MD/Partner — calendar-constrained; reserve for warm introductions only");
  }

  score += Math.round(responsiveness * 6);

  score = Math.max(40, Math.min(99, Math.round(score)));
  return { score, reasoning };
}

function pickStatus(): OutreachStatus {
  const total = STATUS_DISTRIBUTION.reduce((a, b) => a + b.weight, 0);
  let n = rand() * total;
  for (const s of STATUS_DISTRIBUTION) {
    n -= s.weight;
    if (n <= 0) return s.status;
  }
  return "not_contacted";
}

function pickSeniority(): Seniority {
  return weightedPick(SENIORITY_LADDER, rand).seniority;
}

function pickTitle(seniority: Seniority): string {
  const tier = SENIORITY_LADDER.find((s) => s.seniority === seniority)!;
  return pick(tier.titles);
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

function buildOutreachTiming(status: OutreachStatus): {
  lastOutreachAt?: string;
  lastReplyAt?: string;
  nextFollowupAt?: string;
} {
  if (status === "not_contacted" || status === "queued") return {};
  if (status === "scheduled") {
    return { nextFollowupAt: daysAgo(-Math.floor(rand() * 4) - 1) };
  }
  if (status === "sent" || status === "opened") {
    const out = Math.floor(rand() * 5) + 1;
    return { lastOutreachAt: daysAgo(out) };
  }
  if (status === "no_reply") {
    const out = Math.floor(rand() * 14) + 8;
    return { lastOutreachAt: daysAgo(out), nextFollowupAt: daysAgo(-2) };
  }
  if (status === "replied" || status === "meeting_set") {
    const out = Math.floor(rand() * 12) + 2;
    return {
      lastOutreachAt: daysAgo(out + Math.floor(rand() * 4)),
      lastReplyAt: daysAgo(out),
    };
  }
  return {};
}

/**
 * User context drives AI scoring + priority logic.
 * These mirror what the user typically fills in via the Resume + Preferences panel.
 */
const USER_TARGETS = {
  school: "Wharton",
  targetSectors: ["Healthcare", "Technology", "Financial Sponsors"] as CoverageSector[],
  targetFirms: ["Houlihan Lokey", "Piper Sandler", "Goldman Sachs", "William Blair", "Moelis & Company"] as Firm[],
};

function generateContact(idx: number, firmProfile: FirmProfile): Contact {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const fullName = `${first} ${last}`;
  const firm = firmProfile.firm;
  const seniority = pickSeniority();
  const title = pickTitle(seniority);
  const city = pick(firmProfile.cities);
  const sectors = pickMany(firmProfile.coverage, Math.min(2, firmProfile.coverage.length));
  const products = pickMany(firmProfile.products, Math.min(2, firmProfile.products.length));
  const product = products[0]!;
  const desk = buildDesk(seniority, sectors, product, city);
  const school = weightedPick(SCHOOL_POOL).short;
  const gradYear = 2003 + Math.floor(rand() * 21);
  const status = pickStatus();
  const interests = pickMany(INTEREST_POOL, 3);
  const deals = buildDeals(firmProfile, sectors);
  const icebreakers = buildIcebreakers(firm, deals, school, sectors[0] ?? "Technology");

  const isTargetSchool = school === USER_TARGETS.school;
  const isTargetCoverage = sectors.some((s) => USER_TARGETS.targetSectors.includes(s));
  const isTargetFirm = USER_TARGETS.targetFirms.includes(firm);
  const responsiveness = rand();

  const { score: fitScore, reasoning } = buildFitScore(
    seniority,
    isTargetSchool,
    isTargetCoverage,
    isTargetFirm,
    responsiveness,
  );
  const priority = priorityFor(seniority, fitScore);
  const timing = buildOutreachTiming(status);

  const stars = (Math.min(5, Math.max(1, Math.round(fitScore / 20))) as 1 | 2 | 3 | 4 | 5);
  const headcount = 8 + Math.floor(rand() * 24);
  const mandates = 4 + Math.floor(rand() * 18);

  return {
    id: `c_${idx.toString().padStart(4, "0")}`,
    firstName: first,
    lastName: last,
    fullName,
    email: emailFromName(first, last, firmProfile.domain, idx),
    firm,
    title,
    seniority,
    desk,
    city,
    coverage: sectors,
    products,
    school,
    gradYear,
    priority,
    fitScore,
    fitReasoning: reasoning,
    recentDeals: deals,
    interests,
    icebreakers,
    desk_metrics: {
      headcount,
      annualMandates: mandates,
      leagueRank: firmProfile.leagueTagline.split("·")[0]?.trim(),
    },
    linkedInHandle: `${first.toLowerCase()}-${last.toLowerCase()}-${(idx + 1000).toString(36)}`,
    status,
    relationshipStars: stars,
    ...timing,
    tags: [
      isTargetSchool ? "Alumni" : null,
      isTargetCoverage ? "Sector-Fit" : null,
      isTargetFirm ? "Target Firm" : null,
      priority === "S" ? "Top 20" : null,
    ].filter((x): x is string => !!x),
  };
}

function buildAll(): Contact[] {
  const contacts: Contact[] = [];
  // Allocation per firm — biased toward target firms.
  const allocation: Record<string, number> = {
    "Houlihan Lokey": 22,
    "Piper Sandler": 22,
    "Goldman Sachs": 20,
    "William Blair": 18,
    "Moelis & Company": 18,
    "Morgan Stanley": 14,
    JPMorgan: 14,
    Evercore: 12,
    Lazard: 12,
    Centerview: 10,
    "PJT Partners": 10,
    Jefferies: 10,
    Guggenheim: 8,
    "Lincoln International": 8,
    "Harris Williams": 8,
    Stifel: 6,
    "Raymond James": 6,
    Baird: 6,
    Cowen: 4,
    "Perella Weinberg": 6,
    "Rothschild & Co": 4,
    Greenhill: 4,
    "Bank of America": 6,
    Citi: 6,
  };

  let idx = 1;
  for (const profile of FIRM_CATALOG) {
    const n = allocation[profile.firm] ?? 8;
    for (let i = 0; i < n; i++) {
      contacts.push(generateContact(idx++, profile));
    }
  }
  return contacts;
}

export const SEED_CONTACTS: Contact[] = buildAll();
export const TOTAL_SEED_CONTACTS = SEED_CONTACTS.length;

/** Lookup helpers exported for use by stores, scoring engine, etc. */
export function findContactById(id: string, list: Contact[] = SEED_CONTACTS): Contact | undefined {
  return list.find((c) => c.id === id);
}

export { getFirmProfile };
