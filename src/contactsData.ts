import { subDays } from "date-fns";
import type { Contact, DealTransaction, OutreachStatus } from "./types";

const firms = [
  "Houlihan Lokey",
  "Piper Sandler",
  "Goldman Sachs",
  "William Blair",
  "Moelis & Company",
  "J.P. Morgan",
  "Evercore",
  "Lazard",
  "Morgan Stanley",
];

const schools = [
  "University of Pennsylvania",
  "New York University",
  "University of Michigan",
  "Indiana University",
  "Georgetown University",
  "University of Virginia",
  "University of Texas at Austin",
  "Northwestern University",
  "Duke University",
  "Cornell University",
  "University of Notre Dame",
  "University of Chicago",
  "Columbia University",
  "Boston College",
];

const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Avery",
  "Cameron",
  "Parker",
  "Reese",
  "Casey",
  "Blake",
  "Logan",
  "Skyler",
  "Spencer",
  "Riley",
  "Elliot",
  "Hayden",
  "Quinn",
  "Drew",
  "Ryan",
  "Sam",
  "Tyler",
  "Jamie",
  "Kendall",
  "Harper",
  "Rowan",
  "Sawyer",
  "Charlie",
  "Bailey",
  "Emerson",
  "Peyton",
];

const lastNames = [
  "Anderson",
  "Bennett",
  "Caldwell",
  "Donovan",
  "Ellison",
  "Fitzgerald",
  "Gallagher",
  "Hamilton",
  "Iverson",
  "Jamison",
  "Kensington",
  "Langford",
  "Monroe",
  "North",
  "Owens",
  "Prescott",
  "Quincy",
  "Remington",
  "Sinclair",
  "Thompson",
  "Underwood",
  "Valentine",
  "Whitman",
  "York",
  "Zimmerman",
];

const titles = [
  "Investment Banking Analyst",
  "Senior Investment Banking Analyst",
  "Investment Banking Associate",
  "Vice President, Investment Banking",
  "Managing Director",
];

const teamDesks = [
  "M&A Advisory",
  "Healthcare M&A",
  "Technology Group",
  "Financial Sponsors",
  "Consumer & Retail",
  "Industrials",
  "Business Services",
  "Restructuring",
  "Energy Transition",
  "FIG",
];

const sectors = [
  "Software",
  "Healthcare Services",
  "Industrials",
  "Business Services",
  "FinTech",
  "Consumer Retail",
  "Energy Infrastructure",
  "Aerospace & Defense",
  "Education",
  "Telecom",
];

const cities = ["New York", "Chicago", "San Francisco", "Los Angeles", "Charlotte", "Houston"];

const dealTemplates = [
  {
    company: "Atlas Surgical Partners",
    counterparty: "NexaCare Holdings",
    valueUSDMillions: 1320,
    transactionType: "M&A" as const,
    sector: "Healthcare Services",
  },
  {
    company: "Banyan Data Systems",
    counterparty: "Orion Capital",
    valueUSDMillions: 890,
    transactionType: "Private Placement" as const,
    sector: "Software",
  },
  {
    company: "Capstone Components",
    counterparty: "Kensington Industrial Group",
    valueUSDMillions: 2450,
    transactionType: "M&A" as const,
    sector: "Industrials",
  },
  {
    company: "Delta Learning Network",
    counterparty: "Horizon Education Partners",
    valueUSDMillions: 640,
    transactionType: "Capital Markets" as const,
    sector: "Education",
  },
  {
    company: "Everline Broadband",
    counterparty: "Summit Telecom Capital",
    valueUSDMillions: 1710,
    transactionType: "M&A" as const,
    sector: "Telecom",
  },
  {
    company: "Falcon Midstream Logistics",
    counterparty: "Harbor Energy Partners",
    valueUSDMillions: 2100,
    transactionType: "Restructuring" as const,
    sector: "Energy Infrastructure",
  },
];

const styles = [
  "Direct and numbers-first; appreciates concise asks and clear relevance to active transactions.",
  "Warm but selective; responds best to school ties and disciplined cadence.",
  "Highly technical; likes valuation-specific hooks and differentiated process observations.",
  "Execution-oriented; prefers succinct outreach with clear interest in team coverage dynamics.",
];

const statusCycle: OutreachStatus[] = [
  "not_contacted",
  "sent",
  "no_reply",
  "replied",
  "queued",
  "scheduled",
];

function dealFor(index: number, offset: number): DealTransaction {
  const seed = (index + offset) % dealTemplates.length;
  const template = dealTemplates[seed];
  return {
    id: `deal-${index}-${offset}`,
    ...template,
    announcementDate: subDays(new Date(), (seed + 2) * 17 + offset * 9).toISOString(),
  };
}

function icebreakersFor(teamDesk: string, school: string, sector: string): string[] {
  return [
    `Noticed your ${teamDesk} focus and wanted your perspective on where ${sector} valuations are finding support this quarter.`,
    `As a fellow ${school} alum target, I'd value how you think about standing out for your group before interview cycles accelerate.`,
    `Your recent work in ${sector} seems directly aligned with my current deal experience; would love to learn how your team staffs live mandates.`,
    `I have been tracking comparable outcomes in ${sector} and would appreciate your view on what analysts often miss in early process work.`,
    `Your path into ${teamDesk} is exactly the trajectory I am targeting and I would be grateful for quick tactical guidance.`,
  ];
}

const generatedContacts: Contact[] = [];

for (let i = 0; i < 252; i += 1) {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[(i * 3) % lastNames.length];
  const firm = firms[i % firms.length];
  const teamDesk = teamDesks[(i * 5) % teamDesks.length];
  const school = schools[(i * 7) % schools.length];
  const title = titles[(i * 11) % titles.length];
  const primarySector = sectors[(i * 2) % sectors.length];
  const secondarySector = sectors[(i * 2 + 5) % sectors.length];
  const priority = i % 5 === 0 ? "critical" : i % 2 === 0 ? "high" : "medium";
  const status = statusCycle[i % statusCycle.length];
  const relationshipStrength = ((i % 5) + 1) as Contact["relationshipStrength"];

  generatedContacts.push({
    id: `contact-${i + 1}`,
    firstName,
    lastName,
    firm,
    title,
    teamDesk,
    coverageSectors: [primarySector, secondarySector],
    school,
    city: cities[i % cities.length],
    priority,
    status,
    lastOutreach:
      status === "not_contacted" ? undefined : subDays(new Date(), (i % 19) + 1).toISOString(),
    lastInteraction: subDays(new Date(), (i % 24) + 2).toISOString(),
    relationshipStrength,
    notes:
      i % 3 === 0
        ? "Interested in candidates with strong accounting depth and live process exposure."
        : "Prefers concise outreach that links directly to current team activity.",
    fitScore: 0,
    recentDeals: [dealFor(i, 1), dealFor(i, 2), dealFor(i, 3)],
    personalStyle: styles[i % styles.length],
    icebreakers: icebreakersFor(teamDesk, school, primarySector),
    outreachHistory: [],
  });
}

export const contactsData: Contact[] = generatedContacts;
