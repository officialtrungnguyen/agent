import { Contact, PriorityLevel } from "./types";

const firmConfigs = [
  { firm: "Goldman Sachs", slug: "goldmansachs.com", cities: ["New York", "San Francisco", "Chicago"] },
  { firm: "J.P. Morgan", slug: "jpmorgan.com", cities: ["New York", "Houston", "Chicago"] },
  { firm: "Morgan Stanley", slug: "morganstanley.com", cities: ["New York", "Menlo Park", "Los Angeles"] },
  { firm: "Bank of America", slug: "bofa.com", cities: ["New York", "Charlotte", "Chicago"] },
  { firm: "Evercore", slug: "evercore.com", cities: ["New York", "Menlo Park", "Houston"] },
  { firm: "Moelis", slug: "moelis.com", cities: ["New York", "Los Angeles", "Chicago"] },
  { firm: "Houlihan Lokey", slug: "hl.com", cities: ["New York", "Los Angeles", "Chicago"] },
  { firm: "Piper Sandler", slug: "psc.com", cities: ["New York", "Minneapolis", "Boston"] },
  { firm: "William Blair", slug: "williamblair.com", cities: ["Chicago", "New York", "San Francisco"] },
  { firm: "Lazard", slug: "lazard.com", cities: ["New York", "San Francisco", "Chicago"] },
  { firm: "PJT Partners", slug: "pjtpartners.com", cities: ["New York", "Park City", "London"] },
  { firm: "Centerview Partners", slug: "centerviewpartners.com", cities: ["New York", "Palo Alto", "Chicago"] },
  { firm: "Jefferies", slug: "jefferies.com", cities: ["New York", "Charlotte", "San Francisco"] },
  { firm: "Guggenheim", slug: "guggenheimpartners.com", cities: ["New York", "Chicago", "Los Angeles"] },
  { firm: "Baird", slug: "rwbaird.com", cities: ["Chicago", "Milwaukee", "Nashville"] },
  { firm: "Barclays", slug: "barclays.com", cities: ["New York", "San Francisco", "Houston"] },
  { firm: "RBC Capital Markets", slug: "rbccm.com", cities: ["New York", "Minneapolis", "Toronto"] },
  { firm: "Perella Weinberg", slug: "pwpartners.com", cities: ["New York", "San Francisco", "London"] },
  { firm: "Citi", slug: "citi.com", cities: ["New York", "Houston", "Chicago"] },
  { firm: "UBS", slug: "ubs.com", cities: ["New York", "Chicago", "Nashville"] },
];

const teamConfigs = [
  { desk: "Technology M&A", sectors: ["Software", "Internet", "Semiconductors"] },
  { desk: "Financial Sponsors", sectors: ["Sponsor Coverage", "Portfolio M&A", "Leveraged Finance"] },
  { desk: "Healthcare", sectors: ["Biopharma", "MedTech", "HC Services"] },
  { desk: "Industrials", sectors: ["Aerospace", "Transportation", "Building Products"] },
  { desk: "FIG", sectors: ["Insurance", "Asset Managers", "Specialty Finance"] },
  { desk: "Consumer & Retail", sectors: ["Consumer", "Retail", "Food & Beverage"] },
  { desk: "Restructuring", sectors: ["Liability Management", "Creditor Advisory", "RX"] },
  { desk: "Energy", sectors: ["Midstream", "Power", "Energy Transition"] },
  { desk: "Real Estate, Gaming & Lodging", sectors: ["REITs", "Gaming", "Hospitality"] },
  { desk: "Leveraged Finance", sectors: ["Debt Capital Markets", "Sponsor Financing", "Acquisition Finance"] },
  { desk: "Media & Telecom", sectors: ["Telecom", "Cable", "Digital Media"] },
  { desk: "Aerospace & Defense", sectors: ["Defense", "Aviation", "Government Services"] },
];

const transactionPool = [
  {
    company: "SailPoint",
    counterparty: "TPG",
    value: "$6.9B",
    date: "2026-03-12",
    description: "Advised on sponsor-led take-private for identity software leader.",
  },
  {
    company: "Staar Surgical",
    counterparty: "Zimmer Biomet",
    value: "$4.1B",
    date: "2026-02-18",
    description: "Supported strategic combination in medtech growth assets.",
  },
  {
    company: "AeroSystems Solutions",
    counterparty: "RTX",
    value: "$3.7B",
    date: "2026-01-24",
    description: "Ran sell-side process focused on defense electronics synergies.",
  },
  {
    company: "BrightWave Fiber",
    counterparty: "Brookfield Infrastructure",
    value: "$2.6B",
    date: "2025-12-11",
    description: "Helped structure a fiber infrastructure carve-out and strategic sale.",
  },
  {
    company: "Northshore Insurance Services",
    counterparty: "Arthur J. Gallagher",
    value: "$1.9B",
    date: "2025-11-04",
    description: "Advised on specialty broker consolidation within insurance distribution.",
  },
  {
    company: "North Peak Foods",
    counterparty: "L Catterton",
    value: "$1.3B",
    date: "2025-10-08",
    description: "Executed sponsor recapitalization for premium packaged foods platform.",
  },
  {
    company: "Atlas Data Centers",
    counterparty: "DigitalBridge",
    value: "$5.2B",
    date: "2025-09-17",
    description: "Advised hyperscale data center operator on growth capital transaction.",
  },
  {
    company: "Riverside Lodging",
    counterparty: "Blackstone",
    value: "$2.2B",
    date: "2025-08-29",
    description: "Structured sale process across select-service hospitality assets.",
  },
  {
    company: "Helix Specialty Pharma",
    counterparty: "Novartis",
    value: "$7.4B",
    date: "2025-07-21",
    description: "Supported strategic acquisition tied to late-stage rare disease pipeline.",
  },
  {
    company: "Crescent Renewables",
    counterparty: "NextEra Energy",
    value: "$3.1B",
    date: "2025-06-19",
    description: "Power and renewables sell-side including tax equity and project debt.",
  },
  {
    company: "Mercury Payments",
    counterparty: "Fiserv",
    value: "$4.8B",
    date: "2025-05-28",
    description: "Advised fintech processor on strategic alternatives review.",
  },
  {
    company: "Summit Packaging",
    counterparty: "Apollo",
    value: "$1.6B",
    date: "2025-04-14",
    description: "Delivered sponsor financing package for industrial packaging platform.",
  },
];

const schools = [
  "Wharton",
  "Cornell",
  "NYU Stern",
  "Michigan Ross",
  "Duke",
  "Georgetown",
  "Notre Dame",
  "UVA McIntire",
  "Northwestern",
  "Vanderbilt",
  "UNC Kenan-Flagler",
  "Berkeley Haas",
  "USC Marshall",
  "Indiana Kelley",
  "Emory Goizueta",
  "Texas McCombs",
];

const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Ryan",
  "Morgan",
  "Avery",
  "Cameron",
  "Parker",
  "Casey",
  "Blake",
  "Drew",
  "Sydney",
  "Reese",
  "Logan",
  "Hayden",
  "Quinn",
  "Bailey",
  "Devon",
  "Peyton",
  "Sage",
  "Rowan",
  "Skyler",
  "Noah",
  "Elliot",
];

const lastNames = [
  "Carter",
  "Mitchell",
  "Sullivan",
  "Brooks",
  "Morrison",
  "Bennett",
  "Hayes",
  "Sinclair",
  "Callahan",
  "Foster",
  "Reynolds",
  "Donovan",
];

const sharedInterestsPool = [
  "Campus investment fund",
  "Student-managed endowment",
  "Distressed investing",
  "Varsity athletics",
  "Alpha Fund",
  "Wall Street prep mentorship",
  "Private equity case competitions",
  "Alumni coffee chats",
  "Volunteer tutoring",
  "Emerging markets club",
];

const styleNotesPool = [
  "Prefers concise intros with a specific reason for outreach.",
  "Responds well to thoughtful questions anchored in current deal flow.",
  "Values students who connect technical reps to a genuine long-term story.",
  "Appreciates low-pressure asks and a clear one-line personal pitch.",
  "Often references execution intensity and team culture during conversations.",
  "Likes a quick mention of a recent transaction before broader career questions.",
];

const getPriority = (index: number): PriorityLevel => {
  if (index % 6 === 0) return "Tier 1";
  if (index % 3 === 0) return "Tier 2";
  return "Tier 3";
};

const getStatus = (index: number): Contact["status"] => {
  if (index % 17 === 0) return "Replied";
  if (index % 11 === 0) return "No Reply";
  if (index % 9 === 0) return "Sent";
  if (index % 7 === 0) return "Scheduled";
  if (index % 5 === 0) return "Queued";
  return "Not Contacted";
};

const getLastOutreach = (status: Contact["status"], index: number) => {
  if (status === "Not Contacted") return null;
  const daysAgo =
    status === "Replied" ? (index % 4) + 1 : status === "Scheduled" ? 0 : (index % 12) + 2;

  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const buildEmail = (firstName: string, lastName: string, domain: string) =>
  `${firstName}.${lastName}`.toLowerCase() + `@${domain}`;

export const contactsData: Contact[] = Array.from({ length: 240 }, (_, index) => {
  const firmConfig = firmConfigs[index % firmConfigs.length];
  const teamConfig = teamConfigs[index % teamConfigs.length];
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const school = schools[index % schools.length];
  const titleCycle = ["Investment Banking Analyst", "Investment Banking Associate", "Vice President", "Managing Director"];
  const title = titleCycle[index % titleCycle.length];
  const status = getStatus(index);
  const transactionA = transactionPool[index % transactionPool.length];
  const transactionB = transactionPool[(index + 3) % transactionPool.length];
  const transactionC = transactionPool[(index + 7) % transactionPool.length];
  const contactName = `${firstName} ${lastName}`;
  const sharedInterest = sharedInterestsPool[index % sharedInterestsPool.length];
  const notes =
    index % 8 === 0
      ? [`Warm alumni path through ${school} finance club.`, `Likely receptive to ${teamConfig.sectors[0].toLowerCase()} discussion.`]
      : [];

  return {
    id: `contact-${index + 1}`,
    firstName,
    lastName,
    firm: firmConfig.firm,
    title,
    location: firmConfig.cities[index % firmConfig.cities.length],
    teamDesk: teamConfig.desk,
    coverageSectors: teamConfig.sectors,
    school,
    priority: getPriority(index),
    relationshipStrength: (index % 5) + 1,
    email: buildEmail(firstName, lastName, firmConfig.slug),
    status,
    lastOutreach: getLastOutreach(status, index),
    fitScore: 0,
    sharedInterests: [sharedInterest, "Bulge bracket recruiting", teamConfig.sectors[0]],
    styleNotes: [
      styleNotesPool[index % styleNotesPool.length],
      `${contactName} has spent time in ${teamConfig.desk.toLowerCase()} and often discusses ${teamConfig.sectors[1].toLowerCase()} trends.`,
    ],
    icebreakers: [
      `I noticed your path from ${school} into ${firmConfig.firm}'s ${teamConfig.desk} team and wanted to ask how that alumni base still helps on live deals.`,
      `Your recent ${transactionA.company} / ${transactionA.counterparty} work stood out, especially the ${transactionA.description.toLowerCase()}`,
      `I'm targeting ${teamConfig.desk.toLowerCase()} seats and would value your view on how students can stand out for ${teamConfig.sectors[0].toLowerCase()} coverage.`,
    ],
    recentTransactions: [transactionA, transactionB, transactionC],
    notes,
  };
});

export const firmOptions = [...new Set(contactsData.map((contact) => contact.firm))].sort();
export const schoolOptions = [...new Set(contactsData.map((contact) => contact.school))].sort();
export const coverageOptions = [
  ...new Set(contactsData.flatMap((contact) => contact.coverageSectors)),
].sort();
