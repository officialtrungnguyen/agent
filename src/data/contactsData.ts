import type { Contact, RecentDeal, Seniority } from "../types";
import { FIRMS } from "./firms";

// Realistic name pool (curated for finance-recruiting demo, not real persons).
const FIRST_NAMES = [
  "Alex","Jordan","Taylor","Morgan","Avery","Riley","Cameron","Quinn","Hayden","Reese",
  "Jamie","Drew","Logan","Skyler","Parker","Sawyer","Rowan","Emerson","Finley","Harper",
  "Aidan","Bryce","Carter","Devon","Elliot","Grant","Hudson","Ian","Jasper","Kellan",
  "Liam","Mason","Nolan","Owen","Preston","Quentin","Reid","Spencer","Tucker","Vincent",
  "Wyatt","Xavier","Zachary","Adrian","Brendan","Connor","Dylan","Ethan","Frederick","Garrett",
  "Henry","Isaac","Julian","Kevin","Lucas","Matthew","Nathan","Oliver","Patrick","Ryan",
  "Samuel","Theodore","Andrew","Benjamin","Charles","Daniel","Edward","Francis","George","Harrison",
  "Ava","Bella","Chloe","Diana","Eliza","Fiona","Grace","Hannah","Isabella","Julia",
  "Katherine","Lauren","Madeline","Natalie","Olivia","Penelope","Quinn","Rachel","Sophia","Tessa",
  "Vivian","Willa","Audrey","Brianna","Caroline","Delaney","Eleanor","Faith","Genevieve","Hadley",
  "Ingrid","Josephine","Kennedy","Lillian","Mackenzie","Nora","Ophelia","Phoebe","Quincy","Rebecca",
  "Sasha","Tatiana","Valentina","Wren","Yasmin","Zara","Allison","Brooke","Catherine","Danielle",
  "Emma","Felicity","Gabrielle","Hailey","Imogen","Jasmine"
];

const LAST_NAMES = [
  "Anderson","Bennett","Carter","Davidson","Edwards","Fischer","Gallagher","Hamilton","Iverson","Jacobs",
  "Klein","Lambert","Mitchell","Nakamura","O'Brien","Patel","Quinn","Reynolds","Sullivan","Thompson",
  "Underwood","Vasquez","Walker","Xu","Young","Zhang","Abbott","Brennan","Cunningham","Donovan",
  "Ellington","Foster","Goldberg","Harrington","Inoue","Johansson","Kowalski","Lindgren","Marchetti","Novak",
  "Oduya","Pemberton","Quintero","Rasmussen","Sokolov","Tanaka","Ueda","Vance","Whitfield","Yamamoto",
  "Zimmerman","Adler","Bauer","Castellanos","DeLuca","Eriksson","Ferraro","Greenberg","Hoffmann","Ito",
  "Jordan","Kim","Levine","Mensah","Nguyen","Okafor","Park","Rosenthal","Saito","Tran",
  "Uribe","Vogel","Wagner","Yamada","Zheng","Adebayo","Bhatt","Chen","Dasgupta","Eom",
  "Fernandez","Gupta","Hassan","Iqbal","Joshi","Khan","Liu","Mehta","Nair","Okonkwo",
  "Pereira","Qureshi","Reyes","Singh","Tanaka","Ueno","Varma","Wong","Yadav","Zhao",
  "Acosta","Booker","Calloway","Diaz","Espinoza","Flores","Garcia","Hernandez","Iglesias","Jimenez",
  "Kowalczyk","Lopez","Martinez","Nguyen","Ortega","Perez","Ramirez","Sanchez","Torres","Vega"
];

const TARGET_SCHOOLS = [
  "University of Pennsylvania (Wharton)",
  "Harvard University",
  "Stanford University",
  "Princeton University",
  "Yale University",
  "Columbia University",
  "Cornell University",
  "Dartmouth College",
  "Brown University",
  "MIT",
  "University of Chicago (Booth)",
  "Northwestern University (Kellogg)",
  "Duke University",
  "University of Michigan (Ross)",
  "University of Virginia (McIntire)",
  "University of California, Berkeley (Haas)",
  "UCLA (Anderson)",
  "USC (Marshall)",
  "Georgetown University (McDonough)",
  "NYU (Stern)",
  "University of Notre Dame (Mendoza)",
  "University of Texas at Austin (McCombs)",
  "Indiana University (Kelley)",
  "Boston College (Carroll)",
  "Emory University (Goizueta)",
  "Washington University in St. Louis (Olin)",
  "Vanderbilt University (Owen)",
  "Carnegie Mellon (Tepper)",
  "University of North Carolina (Kenan-Flagler)",
  "University of Illinois (Gies)",
  "University of Wisconsin (Madison)",
  "Tufts University",
  "Johns Hopkins University",
  "Rice University",
  "Williams College",
  "Amherst College",
];

const SECTORS = [
  "Technology",
  "Software",
  "FinTech",
  "Healthcare",
  "Biotech & Pharma",
  "MedTech",
  "Financial Institutions",
  "Insurance",
  "Consumer & Retail",
  "Consumer Products",
  "Restaurants & Leisure",
  "Industrials",
  "Aerospace & Defense",
  "Transportation & Logistics",
  "Power & Utilities",
  "Energy",
  "Oilfield Services",
  "Renewables & Clean Tech",
  "Metals & Mining",
  "Chemicals",
  "Real Estate",
  "Gaming & Lodging",
  "Media & Entertainment",
  "Telecom",
  "Sports & Live Events",
  "Sponsors / Financial Sponsors",
  "Education",
  "Business Services",
];

const PRODUCTS = ["M&A", "ECM", "DCM", "LevFin", "Restructuring", "Private Capital", "Sponsors"];

const CITIES = [
  "New York, NY","Chicago, IL","San Francisco, CA","Los Angeles, CA","Houston, TX","Dallas, TX",
  "Boston, MA","Atlanta, GA","Charlotte, NC","Minneapolis, MN","Menlo Park, CA","Miami, FL",
  "Washington, DC","Stamford, CT","London, UK","Hong Kong",
];

const SENIORITY_TITLES: Record<Seniority, string[]> = {
  Analyst: ["Investment Banking Analyst", "Analyst — Investment Banking"],
  Associate: ["Investment Banking Associate", "Associate — Investment Banking"],
  "Vice President": ["Vice President", "Vice President — Investment Banking"],
  Director: ["Director", "Executive Director"],
  "Managing Director": ["Managing Director"],
  Partner: ["Partner", "Senior Partner"],
};

// Deterministic pseudo-random for reproducibility across reloads.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickMany<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function emailFor(first: string, last: string, domain: string, rng: () => number) {
  const variants = [
    `${first}.${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
    `${first}_${last}@${domain}`,
    `${first}.${last[0]}@${domain}`,
  ];
  return pick(variants, rng).toLowerCase();
}

const DEAL_TARGETS = [
  "Veridian Health","Northwind Industrials","Caldera Energy","Stratos Software","Polaris Logistics",
  "Halcyon Brands","Atlas Aerospace","BlueRiver Capital","Ironwood Materials","Helix Therapeutics",
  "Mosaic Foods","Quantum Optics","Saturn Semis","Tidewater Power","Vertex Banking","Whitestone REIT",
  "Cascade Chemicals","Granite Insurance","Lumen Robotics","Apex Payments","Zenith Auto",
  "Cornerstone Insurance","Riverbend Hospitals","Crescent Restaurants","Beacon Biotech","Catalyst Cloud",
  "Pinnacle Plastics","Summit Logistics","Forge Industrials","Lattice Networks","Beacon Renewables",
];

const DEAL_VERBS = [
  "Advised on $X sale to",
  "Lead-left on $X IPO of",
  "Sole advisor on $X take-private of",
  "Joint bookrunner on $X notes offering for",
  "Restructuring advisor on $X balance-sheet recapitalization of",
  "Sell-side advisor on $X carve-out divestiture by",
  "Buy-side advisor on $X strategic acquisition of",
];

const DEAL_BUYERS = [
  "Apollo","KKR","Blackstone","Carlyle","Thoma Bravo","Vista Equity","Bain Capital","TPG","Silver Lake",
  "Hellman & Friedman","Berkshire Partners","Madison Dearborn","GTCR","Warburg Pincus","Permira",
];

function makeDeals(rng: () => number, sectors: string[]): RecentDeal[] {
  const n = 2 + Math.floor(rng() * 3); // 2-4 deals
  const out: RecentDeal[] = [];
  for (let i = 0; i < n; i++) {
    const value = `$${(0.4 + rng() * 6).toFixed(1)}B`;
    const verb = pick(DEAL_VERBS, rng).replace("$X", value);
    const target = pick(DEAL_TARGETS, rng);
    const buyer = pick(DEAL_BUYERS, rng);
    const year = 2024 + Math.floor(rng() * 2);
    const month = 1 + Math.floor(rng() * 12);
    out.push({
      title: `${verb} ${target} (acquirer: ${buyer})`,
      value,
      date: `${year}-${String(month).padStart(2, "0")}`,
      sector: pick(sectors, rng),
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function makePersonalStyle(rng: () => number) {
  const styles = [
    "Direct, asks sharp deal questions; respects brevity.",
    "Mentor-minded; loves talking about origination and client work.",
    "Process-driven; appreciates clear, structured asks.",
    "Energetic and casual; responds to authentic, curious notes.",
    "Sector-passionate; opens up when you cite a specific recent deal.",
    "Pragmatic and busy; replies to short, well-researched outreach only.",
    "Alumni-loyal; will always make time for someone from their school.",
    "Heavy traveler; calendar opens early-morning slots.",
  ];
  return pick(styles, rng);
}

const SENIORITY_WEIGHTS: [Seniority, number][] = [
  ["Analyst", 0.18],
  ["Associate", 0.22],
  ["Vice President", 0.26],
  ["Director", 0.16],
  ["Managing Director", 0.16],
  ["Partner", 0.02],
];

function rollSeniority(rng: () => number): Seniority {
  const r = rng();
  let acc = 0;
  for (const [s, w] of SENIORITY_WEIGHTS) {
    acc += w;
    if (r <= acc) return s;
  }
  return "Vice President";
}

function priorityFor(seniority: Seniority, group: string, rng: () => number): 1 | 2 | 3 | 4 | 5 {
  let base = 3;
  if (seniority === "Vice President") base = 5;
  else if (seniority === "Associate") base = 4;
  else if (seniority === "Director") base = 4;
  else if (seniority === "Managing Director") base = 3;
  else if (seniority === "Analyst") base = 4;
  else if (seniority === "Partner") base = 2;
  if (group === "Elite Boutique") base = Math.min(5, base + 1);
  if (rng() < 0.15) base = Math.max(1, base - 1);
  return Math.max(1, Math.min(5, base)) as 1 | 2 | 3 | 4 | 5;
}

function buildContact(i: number): Contact {
  const rng = makeRng(i * 7919 + 31);
  const firm = pick(FIRMS, rng);
  const first = pick(FIRST_NAMES, rng);
  const last = pick(LAST_NAMES, rng);
  const seniority = rollSeniority(rng);
  const titlePool = SENIORITY_TITLES[seniority];
  const title = pick(titlePool, rng);
  const sectorCount = 1 + Math.floor(rng() * 3);
  const coverage = pickMany(SECTORS, sectorCount, rng);
  const product = pick(PRODUCTS, rng);
  const team = `${product} — ${coverage[0]}`;
  const school = pick(TARGET_SCHOOLS, rng);
  const gradYear = 2002 + Math.floor(rng() * 22);
  const city =
    firm.hqCity && rng() < 0.7 ? firm.hqCity : pick(CITIES, rng);
  const recentDeals = makeDeals(rng, coverage);
  const priority = priorityFor(seniority, firm.group, rng);
  const yearsAtFirm = 1 + Math.floor(rng() * 14);
  const previousFirm = rng() < 0.4 ? pick(FIRMS, rng).name : undefined;

  return {
    id: `c_${i.toString(36)}`,
    firstName: first,
    lastName: last,
    email: emailFor(first, last, firm.domain, rng),
    firm: firm.name,
    firmGroup: firm.group,
    title,
    seniority,
    team,
    desk: rng() < 0.5 ? `${city.split(",")[0]} ${coverage[0]}` : undefined,
    coverage,
    school,
    gradYear,
    city,
    priority,
    status: "not_contacted",
    relationshipStars: 0,
    recentDeals,
    bio: `${seniority} in ${team} at ${firm.name}. ${yearsAtFirm} years at firm${previousFirm ? `, previously at ${previousFirm}` : ""}. Based in ${city}.`,
    personalStyle: makePersonalStyle(rng),
    yearsAtFirm,
    previousFirm,
    tags: [firm.group, product, ...coverage.slice(0, 2)],
  };
}

const TOTAL = 252;
const list: Contact[] = [];
for (let i = 1; i <= TOTAL; i++) list.push(buildContact(i));

// Anchor a few well-known firm clusters to feel curated.
function findIdx(pred: (c: Contact) => boolean) {
  return list.findIndex(pred);
}

(function curateAnchors() {
  const anchors: Array<Partial<Contact> & { firm: string; seniority: Seniority }> = [
    { firm: "Houlihan Lokey", seniority: "Vice President", firstName: "Jordan", lastName: "Reyes", team: "Restructuring — Industrials", priority: 5, school: "University of Notre Dame (Mendoza)" },
    { firm: "Piper Sandler", seniority: "Associate", firstName: "Avery", lastName: "Klein", team: "Healthcare — MedTech", priority: 5, school: "University of Michigan (Ross)" },
    { firm: "Goldman Sachs", seniority: "Vice President", firstName: "Harper", lastName: "Sullivan", team: "TMT — Software", priority: 5, school: "University of Pennsylvania (Wharton)" },
    { firm: "Moelis & Company", seniority: "Director", firstName: "Riley", lastName: "Park", team: "M&A — Consumer & Retail", priority: 5, school: "Stanford University" },
    { firm: "William Blair", seniority: "Associate", firstName: "Mason", lastName: "Gallagher", team: "M&A — Industrials", priority: 5, school: "University of Notre Dame (Mendoza)" },
    { firm: "Lazard", seniority: "Vice President", firstName: "Sophia", lastName: "Levine", team: "M&A — Financial Institutions", priority: 5, school: "Harvard University" },
    { firm: "Evercore", seniority: "Director", firstName: "Owen", lastName: "Marchetti", team: "M&A — Healthcare", priority: 5, school: "Princeton University" },
    { firm: "Centerview Partners", seniority: "Vice President", firstName: "Eleanor", lastName: "Fischer", team: "M&A — Consumer", priority: 5, school: "Yale University" },
    { firm: "J.P. Morgan", seniority: "Associate", firstName: "Carter", lastName: "Anderson", team: "Sponsors", priority: 5, school: "University of Virginia (McIntire)" },
    { firm: "Morgan Stanley", seniority: "Vice President", firstName: "Olivia", lastName: "Chen", team: "TMT — Internet & New Media", priority: 5, school: "Columbia University" },
    { firm: "PJT Partners", seniority: "Vice President", firstName: "Spencer", lastName: "Whitfield", team: "Strategic Advisory — Industrials", priority: 5, school: "Dartmouth College" },
    { firm: "Perella Weinberg Partners", seniority: "Director", firstName: "Genevieve", lastName: "Hoffmann", team: "M&A — Energy Transition", priority: 5, school: "Duke University" },
  ];

  anchors.forEach((a, idx) => {
    const i = findIdx((c) => c.firm === a.firm && c.seniority === a.seniority);
    if (i >= 0) {
      const c = list[i];
      Object.assign(c, a);
      // refresh helpful derived fields
      c.coverage = c.team.includes("—")
        ? [c.team.split("—")[1].trim(), ...c.coverage.slice(1)]
        : c.coverage;
      c.tags = [c.firmGroup, c.team.split("—")[0].trim(), ...c.coverage.slice(0, 2)];
      // email regen
      const meta = FIRMS.find((f) => f.name === c.firm);
      if (meta) {
        c.email = `${c.firstName}.${c.lastName}@${meta.domain}`.toLowerCase();
      }
    }
    // suppress unused-warning
    void idx;
  });
})();

export const CONTACTS: Contact[] = list;
