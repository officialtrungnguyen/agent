// ─────────────────────────────────────────────────────────────
// BulgeBracket.ai — Alumni Ledger seed data
//
// 240+ high-priority alumni bankers across elite firms. Records are
// produced by a *deterministic* generator seeded from curated pools so
// the dataset is realistic, stable across reloads, and rich enough for
// the AI scoring + intel agents to operate on. A set of hand-curated
// "marquee" contacts at top firms is merged in at the front of the list.
//
// All mutable CRM fields default to a clean slate and are then hydrated
// from localStorage at runtime (see lib/storage.ts).
// ─────────────────────────────────────────────────────────────

import type {
  Contact,
  DealRecord,
  Division,
  Priority,
  SeniorityLevel,
} from "../types";

// ── Curated pools ────────────────────────────────────────────

const FIRMS: {
  name: string;
  domain: string;
  tier: number; // 1 = bulge, 2 = elite boutique, 3 = strong MM
  focus: Division[];
  hqTz: string;
  hqCity: string;
  hqRegion: string;
}[] = [
  { name: "Goldman Sachs", domain: "gs.com", tier: 1, focus: ["M&A", "Technology", "Financial Sponsors", "Equity Capital Markets"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Morgan Stanley", domain: "morganstanley.com", tier: 1, focus: ["M&A", "Technology", "Healthcare", "Equity Capital Markets"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "J.P. Morgan", domain: "jpmorgan.com", tier: 1, focus: ["M&A", "Leveraged Finance", "FIG", "Debt Capital Markets"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Bank of America", domain: "bofa.com", tier: 1, focus: ["M&A", "Leveraged Finance", "Consumer & Retail", "Industrials"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Citi", domain: "citi.com", tier: 1, focus: ["M&A", "Debt Capital Markets", "FIG", "Energy & Power"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Evercore", domain: "evercore.com", tier: 2, focus: ["M&A", "Restructuring", "Financial Sponsors", "Healthcare"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Centerview Partners", domain: "centerview.com", tier: 2, focus: ["M&A", "Healthcare", "Consumer & Retail", "Restructuring"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Lazard", domain: "lazard.com", tier: 2, focus: ["M&A", "Restructuring", "FIG", "Energy & Power"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Moelis & Company", domain: "moelis.com", tier: 2, focus: ["M&A", "Restructuring", "Financial Sponsors", "Real Estate"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Houlihan Lokey", domain: "hl.com", tier: 2, focus: ["Restructuring", "M&A", "Financial Sponsors", "Technology"], hqTz: "America/Los_Angeles", hqCity: "Los Angeles", hqRegion: "CA" },
  { name: "Perella Weinberg Partners", domain: "pwpartners.com", tier: 2, focus: ["M&A", "Restructuring", "Energy & Power", "Industrials"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "PJT Partners", domain: "pjtpartners.com", tier: 2, focus: ["Restructuring", "M&A", "Financial Sponsors", "FIG"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Qatalyst Partners", domain: "qatalyst.com", tier: 2, focus: ["Technology", "M&A"], hqTz: "America/Los_Angeles", hqCity: "San Francisco", hqRegion: "CA" },
  { name: "Jefferies", domain: "jefferies.com", tier: 2, focus: ["Leveraged Finance", "M&A", "Technology", "Healthcare"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Piper Sandler", domain: "psc.com", tier: 3, focus: ["Healthcare", "FIG", "Technology", "Consumer & Retail"], hqTz: "America/Chicago", hqCity: "Minneapolis", hqRegion: "MN" },
  { name: "William Blair", domain: "williamblair.com", tier: 3, focus: ["Technology", "Healthcare", "Industrials", "Consumer & Retail"], hqTz: "America/Chicago", hqCity: "Chicago", hqRegion: "IL" },
  { name: "Baird", domain: "rwbaird.com", tier: 3, focus: ["Industrials", "Consumer & Retail", "Technology", "Healthcare"], hqTz: "America/Chicago", hqCity: "Milwaukee", hqRegion: "WI" },
  { name: "Harris Williams", domain: "harriswilliams.com", tier: 3, focus: ["Industrials", "Technology", "Healthcare", "Consumer & Retail"], hqTz: "America/New_York", hqCity: "Richmond", hqRegion: "VA" },
  { name: "Lincoln International", domain: "lincolninternational.com", tier: 3, focus: ["Industrials", "Consumer & Retail", "Financial Sponsors", "Technology"], hqTz: "America/Chicago", hqCity: "Chicago", hqRegion: "IL" },
  { name: "Raymond James", domain: "raymondjames.com", tier: 3, focus: ["Technology", "Healthcare", "Consumer & Retail", "Real Estate"], hqTz: "America/New_York", hqCity: "St. Petersburg", hqRegion: "FL" },
  { name: "Guggenheim Securities", domain: "guggenheimpartners.com", tier: 2, focus: ["M&A", "Healthcare", "Media & Telecom", "Financial Sponsors"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
  { name: "Rothschild & Co", domain: "rothschildandco.com", tier: 2, focus: ["M&A", "Restructuring", "Industrials", "Consumer & Retail"], hqTz: "America/New_York", hqCity: "New York", hqRegion: "NY" },
];

const FIRST_NAMES = [
  "James", "Michael", "David", "Daniel", "Andrew", "Matthew", "Ryan", "Brian", "Kevin", "Eric",
  "Alexander", "Benjamin", "Christopher", "Jonathan", "Nicholas", "Samuel", "Thomas", "William", "Robert", "Steven",
  "Emily", "Sarah", "Jessica", "Lauren", "Rachel", "Megan", "Hannah", "Olivia", "Sophia", "Grace",
  "Anna", "Catherine", "Elizabeth", "Victoria", "Natalie", "Christina", "Amanda", "Stephanie", "Allison", "Caroline",
  "Aiden", "Ethan", "Mason", "Logan", "Lucas", "Jackson", "Henry", "Owen", "Connor", "Tyler",
  "Priya", "Arjun", "Rohan", "Ananya", "Wei", "Jing", "Hiroshi", "Yuki", "Diego", "Sofia",
  "Marcus", "Julian", "Vincent", "Adrian", "Gabriel", "Nathan", "Patrick", "Sean", "Brandon", "Cameron",
  "Isabella", "Madison", "Chloe", "Ava", "Mia", "Zoe", "Maya", "Leah", "Nora", "Claire",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Patel", "Shah", "Gupta", "Chen", "Wang", "Kim", "Park", "Cho", "Singh", "Kapoor",
  "Goldberg", "Rosenberg", "Feldman", "Katz", "Cohen", "Levine", "Abramson", "Stein", "Weiss", "Bernstein",
  "Hoffman", "Schwartz", "Friedman", "Murphy", "Sullivan", "O'Brien", "Kelly", "Ryan", "Doyle", "Quinn",
];

const SCHOOLS = [
  "University of Pennsylvania (Wharton)",
  "Harvard University",
  "Stanford University",
  "Princeton University",
  "Columbia University",
  "Yale University",
  "Cornell University",
  "Dartmouth College",
  "University of Michigan (Ross)",
  "New York University (Stern)",
  "University of Virginia (McIntire)",
  "Georgetown University (McDonough)",
  "University of Notre Dame (Mendoza)",
  "University of Chicago (Booth)",
  "Duke University",
  "University of California, Berkeley (Haas)",
  "University of Texas at Austin (McCombs)",
  "Indiana University (Kelley)",
  "Boston College (Carroll)",
  "Emory University (Goizueta)",
  "Vanderbilt University",
  "University of Southern California (Marshall)",
  "Washington University in St. Louis (Olin)",
  "University of North Carolina (Kenan-Flagler)",
];

const TEAM_BY_DIVISION: Record<Division, string[]> = {
  "M&A": ["M&A — Strategic Advisory", "M&A — Cross-Border", "M&A Execution", "Global M&A"],
  "Leveraged Finance": ["LevFin — Sponsor Coverage", "Leveraged Finance Origination", "LBO Financing"],
  "Restructuring": ["Restructuring & Liability Management", "Debtor Advisory", "Special Situations"],
  "Equity Capital Markets": ["ECM — IPO Origination", "Equity Capital Markets", "ECM Syndicate"],
  "Debt Capital Markets": ["DCM — Investment Grade", "Debt Capital Markets", "DCM Origination"],
  "Financial Sponsors": ["Financial Sponsors Group", "Sponsors Coverage", "FSG — Buyout Coverage"],
  "Industrials": ["Industrials — Diversified", "Industrials M&A", "Aerospace & Defense", "Business Services"],
  "Technology": ["Technology M&A — Software", "Tech — Internet & Digital Media", "Semiconductors", "Fintech Advisory"],
  "Healthcare": ["Healthcare — Biopharma", "Healthcare Services", "MedTech & Diagnostics", "Healthcare M&A"],
  "Consumer & Retail": ["Consumer & Retail", "Food, Beverage & Restaurants", "Consumer Products M&A"],
  "FIG": ["Financial Institutions Group", "FIG — Banks & Specialty Finance", "Insurance Advisory"],
  "Energy & Power": ["Energy & Power", "Renewables & Energy Transition", "Oil & Gas Advisory"],
  "Real Estate": ["Real Estate, Gaming & Lodging", "REIT Coverage", "Real Estate M&A"],
  "Media & Telecom": ["Media & Telecom", "Communications Infrastructure", "Sports & Entertainment"],
  "Generalist": ["Generalist Advisory", "Coverage & Advisory"],
};

const SECTORS_BY_DIVISION: Record<Division, string[]> = {
  "M&A": ["Software", "Industrials", "Consumer", "Healthcare"],
  "Leveraged Finance": ["Sponsor-backed credits", "High Yield", "Term Loan B"],
  "Restructuring": ["Distressed Debt", "Chapter 11", "Liability Management"],
  "Equity Capital Markets": ["IPOs", "Follow-ons", "Convertibles"],
  "Debt Capital Markets": ["Investment Grade", "High Yield", "Structured Credit"],
  "Financial Sponsors": ["Private Equity", "Buyouts", "Continuation Vehicles"],
  "Industrials": ["Aerospace & Defense", "Building Products", "Business Services", "Transportation"],
  "Technology": ["Application Software", "Infrastructure Software", "Internet", "Fintech", "Semiconductors"],
  "Healthcare": ["Biopharma", "MedTech", "Healthcare Services", "Diagnostics"],
  "Consumer & Retail": ["Food & Beverage", "Restaurants", "Apparel & Footwear", "Beauty & Personal Care"],
  "FIG": ["Banks", "Specialty Finance", "Insurance", "Asset Management"],
  "Energy & Power": ["Renewables", "Oil & Gas", "Power & Utilities", "Energy Transition"],
  "Real Estate": ["REITs", "Gaming", "Lodging", "Data Centers"],
  "Media & Telecom": ["Streaming", "Telecom Infrastructure", "Advertising", "Gaming & Esports"],
  "Generalist": ["Diversified", "Multi-sector"],
};

const LEVELS: { level: SeniorityLevel; titles: string[]; weight: number }[] = [
  { level: "Analyst", titles: ["Analyst", "1st Year Analyst", "2nd Year Analyst", "3rd Year Analyst"], weight: 28 },
  { level: "Associate", titles: ["Associate", "Senior Associate"], weight: 26 },
  { level: "Vice President", titles: ["Vice President"], weight: 22 },
  { level: "Director", titles: ["Director", "Executive Director"], weight: 8 },
  { level: "Senior Vice President", titles: ["Senior Vice President"], weight: 6 },
  { level: "Managing Director", titles: ["Managing Director"], weight: 8 },
  { level: "Partner", titles: ["Partner"], weight: 2 },
];

const PERSONAL_STYLES = [
  "Direct and time-pressed — lead with one sharp, specific question.",
  "Warm and mentorship-minded — responds well to genuine curiosity.",
  "Data-driven — appreciates a crisp, numbers-first hook.",
  "School-loyal — references to the alumni network land well.",
  "Deal-obsessed — open with a recent transaction they ran.",
  "Low-key and humble — keep it short, avoid flattery.",
  "Markets-savvy — a smart sector thesis grabs attention.",
  "Builder mentality — loves analysts who show initiative.",
];

const INTEREST_POOL = [
  "college football", "marathon running", "value investing", "skiing", "golf",
  "fly fishing", "wine collecting", "private aviation", "venture investing", "chess",
  "triathlons", "rowing crew", "fantasy football", "classic cars", "sailing",
  "mentoring", "alumni recruiting", "endurance cycling", "squash", "poker",
];

const COMPANIES = [
  "Datadog", "Snowflake", "Veeva", "Shopify", "Coupa", "Anaplan", "Zendesk", "Okta", "Twilio", "Bill.com",
  "Nestlé", "Kraft Heinz", "Mondelez", "Crocs", "e.l.f. Beauty", "Olaplex", "Chewy", "Wayfair", "Sweetgreen", "Cava",
  "Boeing", "Honeywell", "Emerson", "Parker Hannifin", "Trane", "Carrier", "Caterpillar", "Cummins", "Dover", "Roper",
  "Pfizer", "Merck", "Amgen", "Biogen", "Vertex", "Moderna", "Illumina", "Stryker", "Boston Scientific", "Edwards Lifesciences",
  "NextEra", "Constellation Energy", "Sempra", "Enbridge", "Williams", "Cheniere", "First Solar", "Sunrun", "Plug Power", "Array Technologies",
  "Charles Schwab", "KKR", "Blackstone", "Apollo", "Carlyle", "TPG", "Ares", "Vista Equity", "Thoma Bravo", "Silver Lake",
  "Warner Bros. Discovery", "Paramount", "Roku", "Spotify", "Take-Two", "Electronic Arts", "T-Mobile", "Crown Castle", "American Tower", "Charter",
];

// ── Deterministic PRNG (mulberry32) ──────────────────────────
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}

function weightedLevel(rng: () => number): { level: SeniorityLevel; titles: string[] } {
  const total = LEVELS.reduce((s, l) => s + l.weight, 0);
  let r = rng() * total;
  for (const l of LEVELS) {
    if (r < l.weight) return l;
    r -= l.weight;
  }
  return LEVELS[0];
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildDeals(rng: () => number, division: Division, sector: string): DealRecord[] {
  const count = 2 + Math.floor(rng() * 2); // 2-3 deals
  const deals: DealRecord[] = [];
  const dealTypes: DealRecord["type"][] =
    division === "Restructuring"
      ? ["Restructuring", "Advisory", "Refinancing"]
      : division === "Equity Capital Markets"
      ? ["IPO", "Advisory", "Financing"]
      : division === "Debt Capital Markets" || division === "Leveraged Finance"
      ? ["Financing", "Refinancing", "Advisory"]
      : ["M&A", "Advisory", "Financing"];

  for (let i = 0; i < count; i++) {
    const client = pick(rng, COMPANIES);
    let counterparty = pick(rng, COMPANIES);
    if (counterparty === client) counterparty = pick(rng, COMPANIES);
    const type = pick(rng, dealTypes);
    const undisclosed = rng() < 0.18;
    const valueUsd = undisclosed ? null : Math.round((150 + rng() * 11000) / 25) * 25;
    const valueLabel = valueUsd ? `$${(valueUsd / 1000).toFixed(valueUsd >= 1000 ? 1 : 2)}B` : "undisclosed";
    let headline: string;
    switch (type) {
      case "M&A":
        headline = `Advised ${client} on its ${valueLabel} acquisition of ${counterparty}`;
        break;
      case "IPO":
        headline = `Lead bookrunner on ${client}'s ${valueLabel} initial public offering`;
        break;
      case "Restructuring":
        headline = `Advised ${client} on its ${valueLabel} balance sheet restructuring`;
        break;
      case "Refinancing":
        headline = `Advised ${client} on a ${valueLabel} refinancing`;
        break;
      case "Financing":
        headline = `Arranged ${client}'s ${valueLabel} financing package`;
        break;
      default:
        headline = `Advised ${client} on a strategic ${sector} transaction`;
    }
    deals.push({
      id: `deal_${slug(client)}_${i}_${Math.floor(rng() * 1e6)}`,
      headline,
      client,
      counterparty: type === "M&A" ? counterparty : undefined,
      valueUsd,
      type,
      sector,
      date: isoDaysAgo(20 + Math.floor(rng() * 540)),
    });
  }
  return deals.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function priorityFor(tier: number, level: SeniorityLevel, shared: boolean, rng: () => number): Priority {
  let score = 0;
  if (tier === 1) score += 2;
  else if (tier === 2) score += 3;
  else score += 1;
  if (level === "Analyst" || level === "Associate") score += 2;
  if (level === "Vice President") score += 1;
  if (shared) score += 2;
  score += rng() * 2;
  if (score >= 6.5) return "top";
  if (score >= 5) return "high";
  if (score >= 3.2) return "medium";
  return "low";
}

// ── Marquee, hand-curated contacts ───────────────────────────
const MARQUEE: Partial<Contact>[] = [
  {
    firstName: "Marcus", lastName: "Whitfield", firm: "Houlihan Lokey", title: "Vice President",
    level: "Vice President", division: "Financial Sponsors", team: "Financial Sponsors Group",
    coverageSectors: ["Private Equity", "Continuation Vehicles", "Software Buyouts"],
    school: "University of Michigan (Ross)", city: "Los Angeles", region: "CA", timezone: "America/Los_Angeles",
    personalStyle: "Deal-obsessed — open with a recent sponsor process they ran.",
    interests: ["golf", "venture investing", "alumni recruiting"],
  },
  {
    firstName: "Elena", lastName: "Park", firm: "Piper Sandler", title: "Managing Director",
    level: "Managing Director", division: "Healthcare", team: "Healthcare — Biopharma",
    coverageSectors: ["Biopharma", "Diagnostics", "MedTech"],
    school: "University of Pennsylvania (Wharton)", city: "Boston", region: "MA", timezone: "America/New_York",
    personalStyle: "Mentorship-minded — responds well to genuine sector curiosity.",
    interests: ["marathon running", "mentoring", "value investing"],
  },
  {
    firstName: "Tyler", lastName: "Brennan", firm: "Goldman Sachs", title: "Analyst",
    level: "Analyst", division: "Technology", team: "Technology M&A — Software",
    coverageSectors: ["Application Software", "Infrastructure Software", "Internet"],
    school: "Duke University", city: "New York", region: "NY", timezone: "America/New_York",
    personalStyle: "Direct and time-pressed — lead with one sharp, specific question.",
    interests: ["fantasy football", "endurance cycling", "poker"],
  },
  {
    firstName: "Priya", lastName: "Kapoor", firm: "Moelis & Company", title: "Associate",
    level: "Associate", division: "Restructuring", team: "Restructuring & Liability Management",
    coverageSectors: ["Distressed Debt", "Liability Management", "Chapter 11"],
    school: "New York University (Stern)", city: "New York", region: "NY", timezone: "America/New_York",
    personalStyle: "Data-driven — appreciates a crisp, numbers-first hook.",
    interests: ["chess", "value investing", "rowing crew"],
  },
  {
    firstName: "Connor", lastName: "Walsh", firm: "William Blair", title: "Vice President",
    level: "Vice President", division: "Technology", team: "Tech — Internet & Digital Media",
    coverageSectors: ["Internet", "Fintech", "Vertical Software"],
    school: "University of Notre Dame (Mendoza)", city: "Chicago", region: "IL", timezone: "America/Chicago",
    personalStyle: "School-loyal — references to the alumni network land well.",
    interests: ["college football", "golf", "mentoring"],
  },
];

// ── Build the full ledger ────────────────────────────────────
function buildContact(rng: () => number, index: number, override?: Partial<Contact>): Contact {
  const firm = override?.firm
    ? FIRMS.find((f) => f.name === override.firm) ?? pick(rng, FIRMS)
    : pick(rng, FIRMS);

  const lvl = override?.level
    ? LEVELS.find((l) => l.level === override.level)!
    : weightedLevel(rng);
  const level = override?.level ?? lvl.level;
  const title = override?.title ?? pick(rng, lvl.titles);

  const division: Division = override?.division ?? pick(rng, firm.focus);
  const team = override?.team ?? pick(rng, TEAM_BY_DIVISION[division]);
  const coverageSectors =
    override?.coverageSectors ?? pickN(rng, SECTORS_BY_DIVISION[division], 2 + Math.floor(rng() * 2));

  const firstName = override?.firstName ?? pick(rng, FIRST_NAMES);
  const lastName = override?.lastName ?? pick(rng, LAST_NAMES);
  const school = override?.school ?? pick(rng, SCHOOLS);

  // Shared school relative to the demo user's school (Michigan Ross).
  const userSchool = "University of Michigan (Ross)";
  const sharedSchool = school === userSchool;

  const gradYearBase =
    level === "Analyst" ? 2024 : level === "Associate" ? 2021 : level === "Vice President" ? 2017 : 2010;
  const gradYear = override?.gradYear ?? gradYearBase - Math.floor(rng() * 3);

  const domain = firm.domain;
  const email =
    override?.email ?? `${slug(firstName)}.${slug(lastName)}@${domain}`;

  const city = override?.city ?? firm.hqCity;
  const region = override?.region ?? firm.hqRegion;
  const timezone = override?.timezone ?? firm.hqTz;

  const sector = coverageSectors[0] ?? "Diversified";
  const recentDeals = override?.recentDeals ?? buildDeals(rng, division, sector);

  const priority = override?.priority ?? priorityFor(firm.tier, level, sharedSchool, rng);

  return {
    id: `c${String(index).padStart(4, "0")}`,
    firstName,
    lastName,
    email,
    firm: firm.name,
    title,
    level,
    team,
    division,
    coverageSectors,
    school,
    gradYear,
    city,
    region,
    timezone,
    priority,
    sharedSchool,
    recentDeals,
    personalStyle: override?.personalStyle ?? pick(rng, PERSONAL_STYLES),
    interests: override?.interests ?? pickN(rng, INTEREST_POOL, 3),
    linkedinHint: undefined,
    // CRM defaults (hydrated from localStorage at runtime)
    status: "not_contacted",
    relationshipStrength: 0,
    lastOutreachAt: null,
    lastReplyAt: null,
    notes: [],
    events: [],
  };
}

export const SEED_CONTACTS: Contact[] = (() => {
  const rng = makeRng(20260528);
  const list: Contact[] = [];
  // Marquee first
  MARQUEE.forEach((m, i) => list.push(buildContact(rng, i + 1, m)));
  // Generate the rest up to 248 total.
  for (let i = list.length; i < 248; i++) {
    list.push(buildContact(rng, i + 1));
  }
  return list;
})();

export const USER_DEFAULT_SCHOOL = "University of Michigan (Ross)";

export const FIRM_NAMES = FIRMS.map((f) => f.name);
export const ALL_DIVISIONS = Object.keys(TEAM_BY_DIVISION) as Division[];
export const ALL_LEVELS = LEVELS.map((l) => l.level);
