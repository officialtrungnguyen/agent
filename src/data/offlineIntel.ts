import type { Contact, Deal } from "../types";

const DEAL_TEMPLATES: Omit<Deal, "company">[] = [
  { value: "$2.4B", date: "Mar 2025", role: "Sell-side advisor" },
  { value: "$890M", date: "Jan 2025", role: "Buy-side advisor" },
  { value: "$1.1B", date: "Nov 2024", role: "Fairness opinion" },
  { value: "$650M", date: "Oct 2024", role: "Lead left bookrunner" },
  { value: "$3.2B", date: "Aug 2024", role: "Sell-side advisor" },
];

const COMPANIES = [
  "Vertex Health Systems",
  "Northbridge Software",
  "Cascade Industrial",
  "Meridian Logistics",
  "Apex Consumer Brands",
  "Summit Energy Partners",
  "Horizon MedTech",
  "Pinnacle Fintech",
  "Sterling Defense Tech",
  "BlueRiver Packaging",
];

export function enrichContactIntel(contact: Contact): Contact {
  const deals: Deal[] = contact.recentDeals.length
    ? contact.recentDeals
    : COMPANIES.slice(0, 3).map((company, i) => ({
        company,
        ...DEAL_TEMPLATES[i % DEAL_TEMPLATES.length]!,
      }));

  const deskMetrics =
    contact.deskMetrics ??
    `${contact.team} closed ${deals.length}+ mandates YTD; active pipeline in ${contact.coverage.slice(0, 2).join(", ")}`;

  return { ...contact, recentDeals: deals, deskMetrics };
}

export function getTeamMoves(firm: string, team: string): string[] {
  return [
    `${firm} promoted two VPs on ${team} in Q1 2025 (per league tables)`,
    `Desk expanded healthcare coverage with lateral MD hire from bulge bracket`,
    `${team} ranked top-5 in ${firm.split(" ")[0]} internal productivity metrics`,
  ];
}

export function getLiveEnrichmentStatus(): "offline" | "live" {
  return "offline";
}
