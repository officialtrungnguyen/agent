import type { Contact, ContactPriority, Deal } from "../types";

const FIRMS = [
  "Goldman Sachs",
  "Morgan Stanley",
  "J.P. Morgan",
  "Bank of America",
  "Citi",
  "Barclays",
  "UBS",
  "Deutsche Bank",
  "Credit Suisse",
  "Lazard",
  "Evercore",
  "Moelis & Company",
  "PJT Partners",
  "Centerview Partners",
  "Guggenheim",
  "Houlihan Lokey",
  "William Blair",
  "Piper Sandler",
  "Jefferies",
  "RBC Capital Markets",
  "Baird",
  "Stifel",
  "Raymond James",
  "Lincoln International",
  "DC Advisory",
  "Greenhill",
  "Perella Weinberg",
  "Liontree",
  "Qatalyst",
  "Allen & Company",
];

const SCHOOLS = [
  "Wharton",
  "Harvard",
  "Columbia",
  "NYU Stern",
  "Chicago Booth",
  "Michigan Ross",
  "Duke Fuqua",
  "UVA McIntire",
  "Georgetown McDonough",
  "Notre Dame Mendoza",
  "USC Marshall",
  "UCLA Anderson",
  "Berkeley Haas",
  "Cornell Dyson",
  "Yale SOM",
  "Northwestern Kellogg",
  "Indiana Kelley",
  "Texas McCombs",
  "Emory Goizueta",
  "Vanderbilt Owen",
];

const TEAMS = [
  "M&A",
  "Healthcare",
  "Technology",
  "Industrials",
  "Consumer",
  "Financial Sponsors",
  "FIG",
  "Energy & Power",
  "Real Estate",
  "TMT",
];

const COVERAGE_MAP: Record<string, string[]> = {
  "M&A": ["General M&A", "Cross-border", "Activism defense"],
  Healthcare: ["Biotech", "MedTech", "Healthcare Services"],
  Technology: ["Software", "Semiconductors", "Internet"],
  Industrials: ["Aerospace", "Building Products", "Automation"],
  Consumer: ["Retail", "Food & Beverage", "Luxury"],
  "Financial Sponsors": ["Sponsor coverage", "Portfolio add-ons"],
  "FIG": ["Banks", "Insurance", "Fintech"],
  "Energy & Power": ["Upstream", "Midstream", "Renewables"],
  "Real Estate": ["REITs", "Lodging", "Industrial RE"],
  "TMT": ["Media", "Telecom", "Digital infrastructure"],
};

const FIRST_NAMES = [
  "James", "Michael", "Sarah", "Emily", "David", "Jennifer", "Robert",
  "Jessica", "William", "Ashley", "Richard", "Amanda", "Joseph", "Stephanie",
  "Thomas", "Nicole", "Christopher", "Elizabeth", "Daniel", "Lauren",
  "Matthew", "Megan", "Andrew", "Rachel", "Ryan", "Katherine", "Brian",
  "Victoria", "Kevin", "Olivia", "Jason", "Sophia", "Justin", "Hannah",
  "Brandon", "Alexandra", "Nathan", "Grace", "Eric", "Chloe", "Jonathan",
  "Madison", "Steven", "Natalie", "Timothy", "Abigail", "Gregory", "Samantha",
];

const LAST_NAMES = [
  "Anderson", "Martinez", "Thompson", "Garcia", "Robinson", "Clark", "Lewis",
  "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott",
  "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell", "Perez", "Roberts",
  "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell",
  "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward",
];

const TITLES = [
  "Analyst",
  "Associate",
  "Vice President",
  "Director",
  "Managing Director",
  "Partner",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function sample<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function makeDeals(rand: () => number, sector: string): Deal[] {
  const count = 2 + Math.floor(rand() * 2);
  const deals: Deal[] = [];
  for (let i = 0; i < count; i++) {
    const val = ["$450M", "$780M", "$1.2B", "$2.1B", "$3.5B", "$620M"][
      Math.floor(rand() * 6)
    ]!;
    deals.push({
      company: `${sector.split(" ")[0]} Co ${i + 1}`,
      value: val,
      date: ["Jan 2025", "Nov 2024", "Sep 2024", "Jul 2024"][i % 4]!,
      role: sample(
        ["Sell-side advisor", "Buy-side advisor", "Co-advisor", "Fairness opinion"],
        rand
      ),
    });
  }
  return deals;
}

function generateContacts(count: number): Contact[] {
  const contacts: Contact[] = [];
  const rand = seededRandom(42);

  for (let i = 0; i < count; i++) {
    const firstName = sample(FIRST_NAMES, rand);
    const lastName = sample(LAST_NAMES, rand);
    const firm = sample(FIRMS, rand);
    const team = sample(TEAMS, rand);
    const school = sample(SCHOOLS, rand);
    const title = sample(TITLES, rand);
    const coverage = COVERAGE_MAP[team] ?? ["General M&A"];
    const priority: ContactPriority =
      rand() > 0.7 ? "high" : rand() > 0.4 ? "medium" : "low";

    const id = `c-${String(i + 1).padStart(4, "0")}`;

    contacts.push({
      id,
      firstName,
      lastName,
      firm,
      title,
      team: `${team} Group`,
      coverage,
      school,
      priority,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firm
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .slice(0, 12) || "bank"}.com`,
      recentDeals: makeDeals(rand, coverage[0] ?? "M&A"),
      personalStyle: sample(
        [
          "Direct, values brevity and specific deal knowledge",
          "Relationship-oriented; responds well to alumni angles",
          "Analytical; appreciates technical questions on valuation",
          "Mentorship-focused; open to students with clear prep",
        ],
        rand
      ),
      icebreakerSeeds: [
        `Noticed strong momentum in ${coverage[0]}`,
        `Admire the team's reputation for analyst development`,
        `Impressed by recent sponsor-backed activity`,
      ],
      alumniInterests: [
        `${school} alumni events`,
        "Golf / tennis",
        "Charity finance panels",
      ],
      deskMetrics: `${team} desk — active in ${coverage.slice(0, 2).join(" & ")}`,
    });
  }

  return contacts;
}

/** 240+ high-priority IB alumni and banker contacts */
export const CONTACTS: Contact[] = generateContacts(248);

export function getContactById(id: string): Contact | undefined {
  return CONTACTS.find((c) => c.id === id);
}

export function searchContacts(
  contacts: Contact[],
  query: string
): Contact[] {
  const q = query.toLowerCase().trim();
  if (!q) return contacts;
  return contacts.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.firm.toLowerCase().includes(q) ||
      c.team.toLowerCase().includes(q) ||
      c.school.toLowerCase().includes(q) ||
      c.coverage.some((s) => s.toLowerCase().includes(q))
  );
}
