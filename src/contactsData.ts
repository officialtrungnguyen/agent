import { Contact, Priority, Seniority, Transaction } from "./types";
import { slugify } from "./lib/utils";

const firms = [
  "Houlihan Lokey",
  "Piper Sandler",
  "Goldman Sachs",
  "William Blair",
  "Moelis",
  "Evercore",
  "Lazard",
  "Morgan Stanley",
  "J.P. Morgan",
  "RBC Capital Markets",
  "Baird",
  "Centerview Partners"
];

const teams = [
  "Technology M&A",
  "Healthcare Services",
  "Consumer & Retail",
  "Industrials",
  "Financial Sponsors",
  "Restructuring",
  "Energy Transition",
  "FinTech",
  "Software",
  "Media & Telecom"
];

const sectorsByTeam: Record<string, string[]> = {
  "Technology M&A": ["Vertical SaaS", "IT services", "Cybersecurity"],
  "Healthcare Services": ["Provider services", "HCIT", "Specialty pharma"],
  "Consumer & Retail": ["Branded consumer", "Restaurants", "E-commerce"],
  Industrials: ["Aerospace", "Packaging", "Specialty manufacturing"],
  "Financial Sponsors": ["Private equity", "Portfolio company exits", "Continuation vehicles"],
  Restructuring: ["Distressed M&A", "Liability management", "Chapter 11 exits"],
  "Energy Transition": ["Renewables", "Grid infrastructure", "Energy services"],
  FinTech: ["Payments", "Wealth technology", "Insurance software"],
  Software: ["Application software", "Infrastructure software", "AI workflow"],
  "Media & Telecom": ["Digital media", "Fiber", "Sports and live events"]
};

const schools = [
  "University of Michigan",
  "Wharton",
  "NYU Stern",
  "UVA McIntire",
  "Indiana Kelley",
  "Georgetown",
  "Northwestern",
  "Duke",
  "UC Berkeley",
  "Notre Dame",
  "Cornell",
  "UT Austin"
];

const firstNames = [
  "Alex",
  "Maya",
  "Daniel",
  "Priya",
  "James",
  "Sofia",
  "Ethan",
  "Nina",
  "Ryan",
  "Olivia",
  "Michael",
  "Anika",
  "David",
  "Isabella",
  "Noah",
  "Leah",
  "Samuel",
  "Grace",
  "Nathan",
  "Ava",
  "Lucas",
  "Mia",
  "Henry",
  "Elena"
];

const lastNames = [
  "Chen",
  "Patel",
  "Miller",
  "Kim",
  "Rodriguez",
  "Lee",
  "Johnson",
  "Shah",
  "Brown",
  "Garcia",
  "Nguyen",
  "Wilson",
  "Singh",
  "Anderson",
  "Martinez",
  "Thompson",
  "Carter",
  "Murphy",
  "Brooks",
  "Cooper",
  "Reed",
  "Morgan",
  "Bennett",
  "Foster"
];

const geographies = ["New York", "Chicago", "San Francisco", "Los Angeles", "Boston", "Houston"];
const seniorities: Seniority[] = ["Analyst", "Associate", "VP", "Director", "MD"];
const priorities: Priority[] = ["Core", "High", "Medium", "Opportunistic"];

const transactionNames = [
  ["Apex Health Partners", "SummitCare", "Healthcare Services"],
  ["Northstar Cloud", "Vista Equity Partners", "Software"],
  ["ForgeGrid Energy", "Brookfield", "Energy Transition"],
  ["Crescent Foods", "Mondelez", "Consumer & Retail"],
  ["Atlas Components", "Parker Hannifin", "Industrials"],
  ["MercuryPay", "Fiserv", "FinTech"],
  ["SignalFiber", "EQT Infrastructure", "Media & Telecom"],
  ["Orion Cyber", "Palo Alto Networks", "Technology M&A"],
  ["Harbor Packaging", "CD&R", "Financial Sponsors"],
  ["Vector Airlines", "Ad hoc lender group", "Restructuring"]
] as const;

function linkedinUrl(firstName: string, lastName: string, firm: string, school: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${firstName} ${lastName} ${firm} ${school}`
  )}`;
}

function googleSearchUrl(firstName: string, lastName: string, firm: string, school: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${firstName} ${lastName} ${firm} ${school} investment banking`
  )}`;
}

function buildTransactions(seed: number, team: string): Transaction[] {
  return Array.from({ length: 3 }, (_, index) => {
    const source = transactionNames[(seed + index * 3) % transactionNames.length];
    const announcedYear = 2024 + ((seed + index) % 3);
    const announcedMonth = ((seed + index * 2) % 12) + 1;
    const sector = index === 0 ? team : source[2];

    return {
      company: source[0],
      counterparty: source[1],
      role:
        team === "Restructuring"
          ? "Restructuring"
          : index === 2
            ? "Capital raise"
            : index === 1
              ? "Buy-side advisor"
              : "Sell-side advisor",
      value: 280 + ((seed * 137 + index * 415) % 5600),
      announced: `${announcedYear}-${String(announcedMonth).padStart(2, "0")}-15`,
      sector,
      note:
        team === "Financial Sponsors"
          ? "Sponsor-owned asset with recurring revenue and competitive auction dynamics."
          : team === "Restructuring"
            ? "Complex capital structure with creditor negotiation and liquidity runway focus."
            : "Board-level strategic process with cross-border buyer interest and premium valuation."
    };
  });
}

function buildPersonalStyle(title: Seniority, team: string) {
  if (title === "Analyst") {
    return `Execution-heavy ${team} banker who responds to concise, technically prepared notes.`;
  }

  if (title === "MD") {
    return `Senior relationship banker; best approached with a polished thesis and specific market observation.`;
  }

  return `Coverage-focused ${team} banker who appreciates credible curiosity and targeted questions.`;
}

function buildContacts(): Contact[] {
  const contacts: Contact[] = [];
  let cursor = 0;

  for (const firm of firms) {
    for (let firmSlot = 0; firmSlot < 20; firmSlot += 1) {
      const team = teams[(firmSlot + firms.indexOf(firm)) % teams.length];
      const firstName = firstNames[cursor % firstNames.length];
      const lastName = lastNames[(cursor * 5 + firmSlot) % lastNames.length];
      const title = seniorities[(firmSlot + cursor) % seniorities.length];
      const school = schools[(cursor + firmSlot) % schools.length];
      const statusIndex = cursor % 9;
      const status =
        statusIndex === 0
          ? "Sent"
          : statusIndex === 1
            ? "Replied"
            : statusIndex === 2
              ? "No Reply"
              : "Not Contacted";
      const lastOutreach =
        status === "Not Contacted"
          ? undefined
          : new Date(Date.now() - (4 + (cursor % 18)) * 86_400_000).toISOString();

      contacts.push({
        id: `${slugify(firm)}-${firmSlot + 1}`,
        firstName,
        lastName,
        firm,
        title,
        team,
        coverageSectors: sectorsByTeam[team],
        school,
        geography: geographies[(cursor + firmSlot) % geographies.length],
        priority: priorities[(firmSlot + firms.indexOf(firm)) % priorities.length],
        email: `${firstName}.${lastName}@${slugify(firm).replaceAll("-", "")}.com`.toLowerCase(),
        linkedinUrl: linkedinUrl(firstName, lastName, firm, school),
        googleSearchUrl: googleSearchUrl(firstName, lastName, firm, school),
        recentTransactions: buildTransactions(cursor + firmSlot, team),
        alumniInterests: [
          `${school} finance alumni network`,
          `${team} recruiting coffee chats`,
          cursor % 2 === 0 ? "student investment fund mentorship" : "case competitions and stock pitches"
        ],
        personalStyle: buildPersonalStyle(title, team),
        deskMetrics: {
          activeMandates: 3 + ((cursor + firmSlot) % 9),
          trailingDealVolume: 900 + ((cursor * 311 + firmSlot * 97) % 18_500),
          responseWarmth: 52 + ((cursor * 7 + firmSlot * 11) % 43)
        },
        status,
        lastOutreach,
        lastInteraction: lastOutreach,
        notes:
          status === "Replied"
            ? ["Responded warmly; ask about team culture and junior execution reps."]
            : [],
        relationshipStrength: (1 + ((cursor + firmSlot) % 5)) as 1 | 2 | 3 | 4 | 5
      });

      cursor += 1;
    }
  }

  return contacts;
}

export const contactsData: Contact[] = buildContacts();
