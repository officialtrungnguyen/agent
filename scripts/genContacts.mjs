// Deterministic generator for a rich, realistic alumni ledger.
// Produces src/lib/contactsData.ts with 240+ high-quality contacts.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- seeded RNG (mulberry32) for stable output ---
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260528);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const c = [...arr];
  const out = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]);
  return out;
};
const chance = (p) => rng() < p;
const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1));

const firms = [
  "Houlihan Lokey", "Piper Sandler", "Goldman Sachs", "William Blair", "Moelis & Company",
  "Evercore", "Centerview Partners", "Lazard", "Jefferies", "PJT Partners",
  "Perella Weinberg Partners", "Morgan Stanley", "J.P. Morgan", "Bank of America",
  "Citigroup", "Barclays", "Guggenheim Partners", "Rothschild & Co", "Harris Williams",
  "Robert W. Baird", "Stifel", "Raymond James", "Truist Securities", "Wells Fargo Securities",
  "RBC Capital Markets", "Deutsche Bank", "Qatalyst Partners", "Greenhill & Co",
  "Lincoln International", "UBS", "Allen & Company", "Solomon Partners", "DC Advisory",
];

const groups = [
  { group: "Technology, Media & Telecom", sectors: ["Software", "Internet", "Semiconductors", "Media", "Fintech", "IT Services"] },
  { group: "Healthcare", sectors: ["Biotech", "Medtech", "Pharma Services", "Healthcare IT", "Providers & Services", "Diagnostics"] },
  { group: "Industrials", sectors: ["Aerospace & Defense", "Building Products", "Capital Goods", "Transportation & Logistics", "Industrial Tech"] },
  { group: "Consumer & Retail", sectors: ["Food & Beverage", "Restaurants", "Apparel", "E-commerce", "Consumer Products", "Beauty & Wellness"] },
  { group: "Financial Institutions", sectors: ["Banks", "Insurance", "Asset Management", "Specialty Finance", "Payments"] },
  { group: "Energy & Power", sectors: ["Renewables", "Oil & Gas", "Power & Utilities", "Energy Transition", "Midstream"] },
  { group: "Real Estate, Gaming & Lodging", sectors: ["REITs", "Gaming", "Lodging", "Homebuilders", "Real Estate Services"] },
  { group: "Financial Sponsors", sectors: ["Private Equity", "Sponsor Coverage", "Continuation Vehicles"] },
  { group: "Leveraged Finance", sectors: ["High Yield", "Leveraged Loans", "Direct Lending"] },
  { group: "Restructuring", sectors: ["Liability Management", "Distressed M&A", "Chapter 11 Advisory", "Creditor Advisory"] },
  { group: "Equity Capital Markets", sectors: ["IPOs", "Follow-ons", "Convertibles"] },
  { group: "Natural Resources", sectors: ["Metals & Mining", "Chemicals", "Agriculture"] },
];

const deskRegions = ["", "", "", " — West Coast", " — East Coast", " — Midwest", " — Texas", " — EMEA"];

const schools = [
  ["University of Pennsylvania (Wharton)", "Philadelphia, PA"],
  ["Harvard University", "Cambridge, MA"],
  ["Princeton University", "Princeton, NJ"],
  ["Yale University", "New Haven, CT"],
  ["Columbia University", "New York, NY"],
  ["New York University (Stern)", "New York, NY"],
  ["University of Virginia (McIntire)", "Charlottesville, VA"],
  ["University of Michigan (Ross)", "Ann Arbor, MI"],
  ["Georgetown University (McDonough)", "Washington, DC"],
  ["University of Notre Dame", "Notre Dame, IN"],
  ["Cornell University", "Ithaca, NY"],
  ["Duke University", "Durham, NC"],
  ["Northwestern University", "Evanston, IL"],
  ["University of Chicago", "Chicago, IL"],
  ["UC Berkeley (Haas)", "Berkeley, CA"],
  ["UT Austin (McCombs)", "Austin, TX"],
  ["Indiana University (Kelley)", "Bloomington, IN"],
  ["Boston College", "Chestnut Hill, MA"],
  ["USC (Marshall)", "Los Angeles, CA"],
  ["Emory University (Goizueta)", "Atlanta, GA"],
  ["Vanderbilt University", "Nashville, TN"],
  ["UNC Chapel Hill (Kenan-Flagler)", "Chapel Hill, NC"],
  ["Washington University in St. Louis", "St. Louis, MO"],
  ["Villanova University", "Villanova, PA"],
  ["Fordham University", "New York, NY"],
  ["Lehigh University", "Bethlehem, PA"],
  ["Boston University", "Boston, MA"],
  ["University of Texas A&M", "College Station, TX"],
  ["UCLA (Anderson)", "Los Angeles, CA"],
  ["Stanford University", "Stanford, CA"],
];

const cities = ["New York, NY", "San Francisco, CA", "Chicago, IL", "Los Angeles, CA",
  "Boston, MA", "Houston, TX", "Charlotte, NC", "Menlo Park, CA", "Dallas, TX",
  "Atlanta, GA", "Minneapolis, MN", "Miami, FL", "London, UK"];

const firstNames = ["James", "Olivia", "Michael", "Emma", "William", "Ava", "Benjamin", "Sophia",
  "Daniel", "Isabella", "Matthew", "Mia", "Andrew", "Charlotte", "David", "Amelia", "Joseph",
  "Harper", "Christopher", "Evelyn", "Ryan", "Abigail", "Nathan", "Grace", "Jonathan", "Chloe",
  "Alexander", "Lily", "Nicholas", "Zoe", "Samuel", "Hannah", "Ethan", "Natalie", "Tyler",
  "Madison", "Brandon", "Lauren", "Justin", "Victoria", "Kevin", "Brooke", "Patrick", "Catherine",
  "Connor", "Rachel", "Sean", "Julia", "Aaron", "Megan", "Priya", "Arjun", "Wei", "Mei",
  "Diego", "Sofia", "Omar", "Layla", "Jordan", "Sydney", "Marcus", "Elena", "Caleb", "Nora",
  "Henry", "Audrey", "Luke", "Vivian", "Eric", "Hailey", "Adam", "Paige", "Spencer", "Reese",
  "Trevor", "Morgan", "Cole", "Quinn", "Blake", "Skylar"];
const lastNames = ["Anderson", "Bennett", "Caldwell", "Donovan", "Ellison", "Fairchild", "Gallagher",
  "Harrington", "Iverson", "Jennings", "Kowalski", "Lambert", "Mercer", "Nakamura", "Osborne",
  "Pemberton", "Quinn", "Rosenthal", "Sullivan", "Thornton", "Underwood", "Vasquez", "Whitman",
  "Xiong", "Yates", "Zimmerman", "Abbott", "Brennan", "Castellano", "Delgado", "Easton",
  "Fitzgerald", "Goldberg", "Hawthorne", "Ishikawa", "Kapoor", "Lindgren", "Montgomery",
  "Novak", "Okafor", "Patel", "Reyes", "Steinberg", "Tanaka", "Valenti", "Wallace", "Yoon",
  "Zhao", "Booker", "Cho", "Devereaux", "Engel", "Fontaine", "Greenwood", "Holloway", "Ahmadi",
  "Bianchi", "Crawford", "Dunlap", "Esposito", "Forsythe", "Guerrero", "Hutchinson", "Ramirez",
  "Sandoval", "Trent", "Voss", "Weatherly", "Zhang", "Albright", "Beaumont", "Cortez"];

// company name pools per sector keyword
const techCos = ["Nimbus Cloud", "Vertex Labs", "Quanta Systems", "BrightFin", "Helio Software",
  "Cobalt AI", "Streamline", "PixelForge", "Datawave", "Northstar Semiconductors", "Lumen Media",
  "Cipher Security", "Orbit Networks", "Foundry Apps", "Vela Analytics"];
const healthCos = ["Helix Biosciences", "Meridian Health", "Caltrust Pharma", "Vita Diagnostics",
  "CareBridge", "NovaMed Devices", "Genome Therapeutics", "PulsePoint Health", "Atlas Biologics",
  "Cardinal Clinics", "Beacon Oncology", "Verity Labs"];
const indCos = ["Apex Aerospace", "Ironclad Industrial", "Titan Components", "Summit Logistics",
  "Frontier Defense", "Keystone Building", "Vanguard Transport", "Precision Castings",
  "Granite Equipment", "Pinnacle Robotics"];
const consCos = ["Harvest Foods", "Cobalt Beverages", "Maison Apparel", "Cartwheel Commerce",
  "Evergreen Snacks", "Lumiere Beauty", "Hearthside Brands", "Pacific Provisions",
  "Stride Athletics", "Golden Spoon Restaurants"];
const figCos = ["Sentinel Insurance", "Meridian Bancorp", "Cornerstone Capital", "BlueLedger Bank",
  "Apex Asset Mgmt", "Paywell Payments", "Liberty Specialty Finance", "Crestline Insurance"];
const energyCos = ["SolarPeak", "Cascade Power", "Permian Energy", "GreenGrid Renewables",
  "Helios Energy", "Tundra Midstream", "Voltaic Utilities", "Carbon Free Holdings"];
const reCos = ["Skyline REIT", "Harborview Lodging", "Crown Gaming", "Beacon Residential",
  "Summit Hospitality", "Atlas Property Group", "Meadowbrook Homes"];
const acquirers = ["Blackstone", "KKR", "Apollo Global", "Carlyle Group", "Thoma Bravo",
  "Vista Equity", "TPG", "Bain Capital", "Advent International", "Hellman & Friedman",
  "Warburg Pincus", "Silver Lake", "Permira", "General Atlantic", "Leonard Green",
  "a strategic acquirer", "a consortium of investors", "a leading industry player"];

function companyForSector(sector) {
  const s = sector.toLowerCase();
  if (/soft|internet|semi|media|fintech|it ser|payment/.test(s)) return pick(techCos);
  if (/bio|med|pharma|health|diagnos|provider/.test(s)) return pick(healthCos);
  if (/aero|build|capital goods|transport|industrial/.test(s)) return pick(indCos);
  if (/food|restaurant|apparel|commerce|consumer|beauty/.test(s)) return pick(consCos);
  if (/bank|insurance|asset|finance|payment/.test(s)) return pick(figCos);
  if (/renew|oil|power|energy|midstream/.test(s)) return pick(energyCos);
  if (/reit|gaming|lodging|homebuild|real estate/.test(s)) return pick(reCos);
  return pick([...techCos, ...indCos, ...consCos]);
}

const dealTypes = ["Sell-side advisory", "Buy-side advisory", "Strategic merger",
  "Recapitalization", "Carve-out divestiture", "Take-private", "IPO", "Growth equity raise",
  "Debt refinancing", "Liability management"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function makeDeal(sector) {
  const type = pick(dealTypes);
  const company = companyForSector(sector);
  const magnitude = pick(["M", "M", "M", "B"]);
  const value = magnitude === "B"
    ? `$${(randInt(11, 95) / 10).toFixed(1)}B`
    : `$${randInt(120, 980)}M`;
  const year = pick([2024, 2024, 2025, 2025, 2025]);
  const date = `${pick(months)} ${year}`;
  const isMA = /advisory|merger|carve|take-private/.test(type);
  return {
    type,
    company,
    counterparty: isMA ? pick(acquirers) : undefined,
    value,
    date,
    note: isMA
      ? `${company}'s ${type.toLowerCase()} in the ${sector} space`
      : `${sector} ${type.toLowerCase()} for ${company}`,
  };
}

const interestsPool = ["college football", "marathon running", "wine collecting", "golf",
  "fly fishing", "skiing in Park City", "youth mentorship", "value investing book club",
  "alumni interview committee", "triathlons", "classic cars", "jazz", "venture scouting",
  "rowing crew alumni", "fantasy football league", "chess", "scommercial real estate investing",
  "coaching little league", "podcasting on markets", "sustainable investing"];

const stylePool = [
  "Direct and time-poor — lead with a crisp, specific hook and one clear ask.",
  "Relationship-driven — warms up to shared alumni connections and genuine curiosity.",
  "Deal-obsessed — responds best when you reference a specific recent transaction.",
  "Mentor at heart — appreciates students who show they've done real homework.",
  "Numbers-first — keep it tight, quantified, and free of fluff.",
  "Approachable and candid — a low-pressure coffee-chat framing lands well.",
];

const titlesBySeniority = {
  analyst: ["Analyst", "Investment Banking Analyst", "Senior Analyst"],
  associate: ["Associate", "Investment Banking Associate"],
  vp: ["Vice President", "Senior Vice President"],
  director: ["Director", "Executive Director", "Principal"],
  md: ["Managing Director", "Managing Director & Group Head", "Partner"],
};
// rough distribution
const seniorityRoll = () => {
  const r = rng();
  if (r < 0.34) return "analyst";
  if (r < 0.6) return "associate";
  if (r < 0.8) return "vp";
  if (r < 0.92) return "director";
  return "md";
};

function gradYearFor(seniority) {
  const base = 2026;
  switch (seniority) {
    case "analyst": return base - randInt(1, 3);
    case "associate": return base - randInt(4, 7);
    case "vp": return base - randInt(8, 12);
    case "director": return base - randInt(12, 16);
    case "md": return base - randInt(16, 24);
  }
}

function priorityFor(firm, seniority, sharedSchool) {
  const eliteFirms = ["Houlihan Lokey", "Piper Sandler", "Goldman Sachs", "William Blair",
    "Moelis & Company", "Evercore", "Centerview Partners", "Lazard", "PJT Partners"];
  let score = 0;
  if (eliteFirms.includes(firm)) score += 2;
  if (seniority === "analyst" || seniority === "associate") score += 2;
  if (seniority === "vp") score += 1;
  if (sharedSchool) score += 1;
  if (score >= 4) return "tier_1";
  if (score >= 2) return "tier_2";
  return "tier_3";
}

function emailFor(first, last, firm) {
  const domains = {
    "Houlihan Lokey": "hl.com", "Piper Sandler": "psc.com", "Goldman Sachs": "gs.com",
    "William Blair": "williamblair.com", "Moelis & Company": "moelis.com", "Evercore": "evercore.com",
    "Centerview Partners": "centerview.com", "Lazard": "lazard.com", "Jefferies": "jefferies.com",
    "PJT Partners": "pjtpartners.com", "Perella Weinberg Partners": "pwpartners.com",
    "Morgan Stanley": "morganstanley.com", "J.P. Morgan": "jpmorgan.com",
    "Bank of America": "bofa.com", "Citigroup": "citi.com", "Barclays": "barclays.com",
    "Guggenheim Partners": "guggenheimpartners.com", "Rothschild & Co": "rothschildandco.com",
    "Harris Williams": "harriswilliams.com", "Robert W. Baird": "rwbaird.com", "Stifel": "stifel.com",
    "Raymond James": "raymondjames.com", "Truist Securities": "truist.com",
    "Wells Fargo Securities": "wellsfargo.com", "RBC Capital Markets": "rbccm.com",
    "Deutsche Bank": "db.com", "Qatalyst Partners": "qatalyst.com", "Greenhill & Co": "greenhill.com",
    "Lincoln International": "lincolninternational.com", "UBS": "ubs.com",
    "Allen & Company": "allenco.com", "Solomon Partners": "solomonpartners.com",
    "DC Advisory": "dcadvisory.com",
  };
  const domain = domains[firm] || "example.com";
  return `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
}

const contacts = [];
const used = new Set();
const TARGET = 248;
let i = 0;
while (contacts.length < TARGET) {
  i++;
  const first = pick(firstNames);
  const last = pick(lastNames);
  const firm = pick(firms);
  const key = `${first}|${last}|${firm}`;
  if (used.has(key)) continue;
  used.add(key);

  const seniority = seniorityRoll();
  const title = pick(titlesBySeniority[seniority]);
  const g = pick(groups);
  const team = `${g.group}${pick(deskRegions)}`;
  const coverage = pickN(g.sectors, randInt(2, 3));
  const [school, schoolCity] = pick(schools);
  const gradYear = gradYearFor(seniority);
  const city = pick(cities);
  const sharedSchool = chance(0.35);
  const priority = priorityFor(firm, seniority, sharedSchool);
  const recentDeals = Array.from({ length: randInt(2, 3) }, () => makeDeal(pick(coverage)));
  const sharedInterests = pickN(interestsPool, randInt(2, 3));
  const personalStyle = pick(stylePool);
  const firmShort = firm.split(" ")[0];
  const topDeal = recentDeals[0];
  const icebreakers = [
    `I saw ${firmShort} advised on the ${topDeal.company} ${topDeal.type.toLowerCase()} (${topDeal.value}) — would love to hear how the ${coverage[0]} team is thinking about deal flow heading into next year.`,
    `As a fellow ${school.split(" (")[0]} grad, I'd really value 15 minutes to learn how you broke into ${g.group}.`,
    `Your work across ${coverage.slice(0, 2).join(" and ")} is exactly the kind of coverage I'm targeting — I'd be grateful for any advice on positioning for ${firmShort}.`,
    `I noticed your team has been active in ${coverage[0]} — I just finished a deep-dive on the sector and would love your read on where the next wave of consolidation hits.`,
    `Quick note from a ${school.split(" (")[0]} student headed into IB recruiting — your path from ${school.split(" (")[0]} to ${title} at ${firmShort} is the exact trajectory I'm working toward.`,
  ];
  const careerNote = `${school.split(" (")[0]} '${String(gradYear).slice(2)} → ${title} at ${firmShort}, ${g.group} (${city}).`;

  contacts.push({
    id: `c${String(contacts.length + 1).padStart(3, "0")}`,
    firstName: first,
    lastName: last,
    firm,
    title,
    seniority,
    team,
    coverage,
    group: g.group,
    school,
    gradYear,
    city,
    email: emailFor(first, last, firm),
    priority,
    recentDeals,
    sharedInterests,
    personalStyle,
    icebreakers,
    careerNote,
  });
}

const header = `// AUTO-GENERATED by scripts/genContacts.mjs — high-fidelity alumni ledger.
// 240+ realistic, varied contacts spanning elite IB firms, groups, desks, and schools.
// Regenerate with: node scripts/genContacts.mjs
import type { Contact } from "@/types";

export const contactsData: Contact[] = `;

const body = JSON.stringify(contacts, null, 2);
const footer = `;\n\nexport default contactsData;\n`;

const outPath = join(__dirname, "..", "src", "lib", "contactsData.ts");
writeFileSync(outPath, header + body + footer, "utf8");
console.log(`Wrote ${contacts.length} contacts to ${outPath}`);
