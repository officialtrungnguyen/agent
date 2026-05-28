export interface OfflineIntelSnapshot {
  id: string;
  firm: string;
  desk: string;
  marketPulse: string[];
  teamMoves: string[];
  deskMetrics: string[];
}

export const offlineIntelSnapshots: OfflineIntelSnapshot[] = [
  {
    id: "intel-hl-rx",
    firm: "Houlihan Lokey",
    desk: "Restructuring",
    marketPulse: [
      "Mid-market liability management mandates increased through Q1 2026.",
      "Sponsor-backed issuers are extending maturities with amend-and-extend structures."
    ],
    teamMoves: [
      "Senior VP promoted into co-head of RX execution in New York.",
      "Expanded analyst class focused on stressed consumer and healthcare."
    ],
    deskMetrics: [
      "Average deal size: $1.4B enterprise value.",
      "Typical live process window: 8-12 weeks."
    ]
  },
  {
    id: "intel-gs-tech",
    firm: "Goldman Sachs",
    desk: "Technology M&A",
    marketPulse: [
      "Strategic buyers remain selective but active in AI infrastructure tuck-ins.",
      "Cross-border software carve-outs are returning."
    ],
    teamMoves: [
      "Added new partner focused on vertical SaaS consolidation.",
      "Increased associate hiring for Menlo Park and NYC coverage overlap."
    ],
    deskMetrics: [
      "Median disclosed transaction: $3.2B.",
      "High outbound cadence to founder-led platform assets."
    ]
  },
  {
    id: "intel-ps-sponsors",
    firm: "Piper Sandler",
    desk: "Financial Sponsors",
    marketPulse: [
      "Lower middle-market sponsors emphasizing add-on acquisitions.",
      "Sponsor sell-side timetables shortening for software and healthcare services."
    ],
    teamMoves: [
      "Rotational analyst program expanded into Chicago office.",
      "Coverage alignment between sponsors and healthcare services teams tightened."
    ],
    deskMetrics: [
      "Average sponsor-backed process has 7-9 indications of interest.",
      "Most active sectors: HCIT, specialty distribution, B2B services."
    ]
  }
];
