import type { Contact, Deal, Priority, OutreachStatus, BankerLevel } from "./types";

const firms = [
  "Houlihan Lokey",
  "Piper Sandler",
  "Goldman Sachs",
  "William Blair",
  "Moelis",
  "Evercore",
  "Lazard",
  "Centerview Partners",
  "Morgan Stanley",
  "J.P. Morgan",
  "BofA Securities",
  "Jefferies",
  "RBC Capital Markets",
  "Guggenheim Securities",
  "Barclays"
];

const firstNames = [
  "Alex",
  "Maya",
  "Daniel",
  "Sophia",
  "Ethan",
  "Avery",
  "Jordan",
  "Priya",
  "Noah",
  "Olivia",
  "Marcus",
  "Claire",
  "Julian",
  "Nina",
  "Ryan",
  "Elena",
  "Cole",
  "Grace",
  "Arjun",
  "Samantha",
  "Tyler"
];

const lastNames = [
  "Bennett",
  "Chen",
  "Walsh",
  "Kapoor",
  "Morrison",
  "Patel",
  "Harrington",
  "Kim",
  "Rosen",
  "Singh",
  "Donovan",
  "Park",
  "Sullivan",
  "Nguyen",
  "Fischer",
  "Ramirez",
  "Goldberg",
  "Mehta",
  "Lawson",
  "Brooks",
  "Shah"
];

const schools = [
  "Wharton",
  "University of Michigan Ross",
  "NYU Stern",
  "Indiana Kelley",
  "UVA McIntire",
  "Georgetown McDonough",
  "Notre Dame Mendoza",
  "Duke",
  "Northwestern",
  "Cornell Dyson",
  "Columbia",
  "UT Austin McCombs"
];

const teams = [
  {
    name: "Technology M&A",
    sectors: ["Vertical SaaS", "Cybersecurity", "Cloud Infrastructure"],
    deals: ["Datadog", "Okta", "ServiceNow", "HashiCorp", "Rubrik"]
  },
  {
    name: "Healthcare Services",
    sectors: ["Provider Services", "HCIT", "Behavioral Health"],
    deals: ["Elevance Health", "R1 RCM", "DaVita", "Option Care", "LifeStance"]
  },
  {
    name: "Financial Sponsors",
    sectors: ["Middle-Market Buyouts", "Continuation Funds", "Portfolio Exits"],
    deals: ["Thoma Bravo", "GTCR", "Vista Equity", "Warburg Pincus", "TPG"]
  },
  {
    name: "Consumer & Retail",
    sectors: ["Beauty", "Specialty Retail", "Food & Beverage"],
    deals: ["Elf Beauty", "Ulta", "Celsius", "On Holding", "Sweetgreen"]
  },
  {
    name: "Industrials",
    sectors: ["Aerospace", "Packaging", "Engineering Services"],
    deals: ["TransDigm", "Veralto", "Amcor", "Jacobs", "Woodward"]
  },
  {
    name: "Restructuring",
    sectors: ["Liability Management", "Distressed M&A", "Creditor Advisory"],
    deals: ["WeWork", "Yellow", "Invacare", "Serta Simmons", "Party City"]
  },
  {
    name: "Energy Transition",
    sectors: ["Renewables", "Grid Technology", "Battery Storage"],
    deals: ["Fluence", "Nextracker", "Stem", "Enphase", "Array Technologies"]
  },
  {
    name: "Media & Telecom",
    sectors: ["Digital Media", "Broadband", "Sports Rights"],
    deals: ["Charter", "Endeavor", "SiriusXM", "TKO Group", "T-Mobile"]
  },
  {
    name: "Real Estate, Gaming & Lodging",
    sectors: ["Gaming", "Hospitality", "REITs"],
    deals: ["MGM Resorts", "Wynn", "Host Hotels", "VICI Properties", "Hyatt"]
  },
  {
    name: "FIG",
    sectors: ["Insurance Brokerage", "Asset Management", "Specialty Finance"],
    deals: ["Ares", "KKR", "Focus Financial", "Ryan Specialty", "Blue Owl"]
  }
];

const levels: BankerLevel[] = ["Analyst", "Associate", "VP", "Director", "MD", "Partner"];
const locations = ["New York", "Chicago", "San Francisco", "Boston", "Charlotte", "Houston"];
const statuses: OutreachStatus[] = [
  "Not Contacted",
  "Not Contacted",
  "Sent",
  "Replied",
  "No Reply"
];

const styles = [
  "Concise operator who values precise preparation",
  "Relationship-first banker with strong campus mentorship history",
  "Deal practitioner who responds to thoughtful transaction observations",
  "Technical interviewer who appreciates clean valuation thinking",
  "Coverage specialist with an active alumni networking footprint"
];

function priorityFor(index: number): Priority {
  if (index % 11 === 0) return "A+";
  if (index % 3 === 0) return "A";
  if (index % 3 === 1) return "B";
  return "C";
}

function buildDeals(teamIndex: number, contactIndex: number): Deal[] {
  const team = teams[teamIndex % teams.length];
  return [0, 1, 2].map((offset) => {
    const company = team.deals[(contactIndex + offset) % team.deals.length];
    const counterparty = team.deals[(contactIndex + offset + 2) % team.deals.length];
    const values = ["$420M", "$875M", "$1.2B", "$2.6B", "$5.4B", "$730M"];
    const types: Deal["type"][] = ["M&A", "Sell-side", "Buy-side", "IPO", "Debt", "Restructuring"];
    return {
      company,
      counterparty,
      value: values[(contactIndex + offset) % values.length],
      date: `202${3 + ((contactIndex + offset) % 3)} Q${1 + ((contactIndex + offset) % 4)}`,
      type: types[(teamIndex + offset) % types.length],
      angle: `${team.name} angle around ${team.sectors[offset % team.sectors.length].toLowerCase()} and sponsor appetite.`
    };
  });
}

export function createLinkedInSearchUrl(contact: Pick<Contact, "firstName" | "lastName" | "firm" | "school">) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school}`
  )}`;
}

export const contactsData: Contact[] = Array.from({ length: 252 }, (_, index) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index * 7) % lastNames.length];
  const firm = firms[(index * 5) % firms.length];
  const teamIndex = (index * 3) % teams.length;
  const team = teams[teamIndex];
  const school = schools[(index * 4) % schools.length];
  const level = levels[index % levels.length];
  const status = statuses[index % statuses.length];
  const pastDays = 2 + (index % 24);
  const lastOutreach =
    status === "Not Contacted"
      ? undefined
      : new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `bb-${String(index + 1).padStart(3, "0")}`,
    firstName,
    lastName,
    firm,
    title: `${level}, ${team.name}`,
    level,
    team: team.name,
    coverageSectors: team.sectors,
    school,
    location: locations[(index * 2) % locations.length],
    email: `${firstName}.${lastName}@${firm.replace(/[^a-z0-9]/gi, "").toLowerCase()}.example`,
    priority: priorityFor(index),
    status,
    lastOutreach,
    lastInteraction: lastOutreach,
    notes: [
      `${school} alum with visible ${team.name} activity.`,
      `Best opener: ask about ${team.sectors[index % team.sectors.length]} deal flow.`
    ],
    relationshipStrength: ((index % 5) + 1) as Contact["relationshipStrength"],
    personalStyle: [
      styles[index % styles.length],
      index % 2 === 0 ? "Likely to reward specific deal preparation" : "Likely to respond to warm alumni context"
    ],
    sharedInterests: [
      `${school} finance alumni network`,
      `${team.sectors[(index + 1) % team.sectors.length]} market research`,
      index % 2 === 0 ? "Student investment fund" : "Wall Street prep mentorship"
    ],
    recentDeals: buildDeals(teamIndex, index)
  };
});

export const coverageUniverse = Array.from(
  new Set(contactsData.flatMap((contact) => contact.coverageSectors))
).sort();

export const firmUniverse = Array.from(new Set(contactsData.map((contact) => contact.firm))).sort();
export const schoolUniverse = Array.from(new Set(contactsData.map((contact) => contact.school))).sort();
