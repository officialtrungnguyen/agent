import type { Contact, ContactStatus, DealTransaction, Priority } from "../types";

const firstNames = [
  "Avery",
  "Jordan",
  "Casey",
  "Riley",
  "Parker",
  "Taylor",
  "Cameron",
  "Drew",
  "Morgan",
  "Quinn",
  "Skyler",
  "Blake",
  "Hayden",
  "Reese",
  "Kendall",
  "Rowan",
  "Elliot",
  "Emerson",
  "Logan",
  "Finley"
] as const;

const lastNames = [
  "Bennett",
  "Sullivan",
  "Reynolds",
  "Parker",
  "Morgan",
  "Hayes",
  "Griffin",
  "Prescott",
  "Langford",
  "Carter",
  "Mitchell",
  "Ellison",
  "Donovan",
  "Whitman",
  "Aldridge",
  "Callahan",
  "Harrington",
  "Monroe",
  "Wellington",
  "Sterling"
] as const;

const firms = [
  "Houlihan Lokey",
  "Piper Sandler",
  "Goldman Sachs",
  "William Blair",
  "Moelis",
  "Evercore",
  "Lazard",
  "Jefferies",
  "Centerview Partners",
  "J.P. Morgan",
  "Morgan Stanley",
  "Bank of America"
] as const;

const desks = [
  "M&A - Industrials",
  "Technology M&A",
  "Healthcare Coverage",
  "Financial Sponsors",
  "Consumer & Retail",
  "FIG Advisory",
  "Restructuring",
  "Energy Transition",
  "Software Coverage",
  "Financial Institutions"
] as const;

const sectorBundles = [
  ["Industrials", "Aerospace", "Transportation"],
  ["Software", "Cybersecurity", "AI Infrastructure"],
  ["Biotech", "MedTech", "Provider Services"],
  ["Private Equity", "Leveraged Finance", "Secondaries"],
  ["Consumer", "Restaurants", "Specialty Retail"],
  ["Banks", "Insurance", "Asset Management"],
  ["Distressed", "Liability Management", "RX M&A"],
  ["Energy", "Power", "Utilities"],
  ["SaaS", "Fintech", "Vertical Applications"],
  ["Specialty Finance", "Payments", "Credit"]
] as const;

const schools = [
  "University of Michigan",
  "NYU Stern",
  "Wharton",
  "Duke",
  "UVA McIntire",
  "Georgetown",
  "Northwestern",
  "Cornell",
  "Notre Dame",
  "USC Marshall",
  "UCLA",
  "Vanderbilt"
] as const;

const locations = ["New York", "Chicago", "San Francisco", "Los Angeles", "Houston", "Charlotte"] as const;
const titles: Contact["title"][] = ["Analyst", "Associate", "VP", "Director", "MD"];
const statuses: ContactStatus[] = ["not_contacted", "queued", "scheduled", "sent", "replied", "no_reply"];
const priorities: Priority[] = ["critical", "high", "medium"];

const pick = <T,>(items: readonly T[], index: number): T => items[index % items.length] as T;

const randomDeal = (bankerId: string, index: number, sector: string): DealTransaction => ({
  id: `${bankerId}-deal-${index}`,
  bankerId,
  company: `${sector} Dynamics ${index + 1}`,
  counterparty: `${sector} Capital Partners`,
  valueUsdBillions: Number((0.7 + ((index * 13) % 40) / 10).toFixed(1)),
  announcedAt: new Date(2025, (index * 2) % 12, ((index * 3) % 27) + 1).toISOString(),
  summary: `Advised on a strategic ${sector.toLowerCase()} merger with cross-border sponsor dynamics.`,
  sector
});

const buildContact = (index: number): Contact => {
  const firstName = pick(firstNames, index);
  const lastName = pick(lastNames, index * 3);
  const firm = pick(firms, index);
  const id = `contact-${index + 1}`;
  const status = pick(statuses, index);
  const priority = pick(priorities, index);
  const teamDesk = pick(desks, index);
  const coverageSectors = pick(sectorBundles, index);
  const lastOutreachAt =
    status === "not_contacted"
      ? undefined
      : new Date(Date.now() - ((index % 20) + 1) * 24 * 60 * 60 * 1000).toISOString();

  const emailDomain = firm.toLowerCase().replaceAll(" ", "").replaceAll(".", "");

  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}.com`,
    firm,
    title: pick(titles, index),
    teamDesk,
    coverageSectors: [...coverageSectors],
    school: pick(schools, index),
    location: pick(locations, index),
    priority,
    status,
    lastOutreachAt,
    lastInteractionAt: lastOutreachAt,
    relationshipStrength: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    notes: [
      `Interested in ${coverageSectors[0]} market structure trends.`,
      "Prefers concise outreach and direct asks for 15-minute networking calls."
    ],
    recentDeals: [randomDeal(id, index, coverageSectors[0]), randomDeal(id, index + 1, coverageSectors[1])]
  };
};

export const seedContacts: Contact[] = Array.from({ length: 264 }, (_, index) => buildContact(index));

export const priorityRank: Record<Priority, number> = {
  critical: 3,
  high: 2,
  medium: 1
};
