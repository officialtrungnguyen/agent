import type { Contact, Deal } from "@/types";

// ─── Helper to generate realistic emails ────────────────────────────────────
const email = (first: string, last: string, firm: string): string => {
  const domain: Record<string, string> = {
    "Goldman Sachs": "gs.com",
    "Morgan Stanley": "morganstanley.com",
    "JPMorgan": "jpmorgan.com",
    "Houlihan Lokey": "hl.com",
    "Piper Sandler": "pipersandler.com",
    "William Blair": "williamblair.com",
    "Moelis & Company": "moelis.com",
    "Lazard": "lazard.com",
    "Evercore": "evercore.com",
    "Centerview Partners": "centerviewpartners.com",
    "Jefferies": "jefferies.com",
    "RBC Capital Markets": "rbccm.com",
    "Barclays": "barclays.com",
    "Bank of America": "bofa.com",
    "Citi": "citi.com",
    "UBS": "ubs.com",
    "PJT Partners": "pjtpartners.com",
    "Perella Weinberg": "pwpartners.com",
    "Guggenheim": "guggenheimpartners.com",
    "Deutsche Bank": "db.com",
    "Wells Fargo": "wellsfargo.com",
    "Rothschild": "rothschild.com",
  };
  const d = domain[firm] || "firm.com";
  return `${first.toLowerCase()}.${last.toLowerCase()}@${d}`;
};

// ─── Sample Deals Library ────────────────────────────────────────────────────
const techDeals: Deal[] = [
  { title: "Cisco / Splunk Acquisition", description: "Advised Splunk on $28B acquisition by Cisco", value: "$28B", date: "2024-03", role: "Sell-Side Advisor", type: "M&A", sector: "Technology", companies: ["Cisco", "Splunk"] },
  { title: "Synopsys / Ansys Merger", description: "Sell-side advisory on semiconductor EDA combination", value: "$35B", date: "2024-01", role: "Financial Advisor", type: "M&A", sector: "Technology", companies: ["Synopsys", "Ansys"] },
  { title: "Adobe / Figma (Terminated)", description: "Buy-side advisor on regulatory review process", value: "$20B", date: "2023-12", role: "Buy-Side Advisor", type: "M&A", sector: "Technology", companies: ["Adobe", "Figma"] },
  { title: "Cloudflare Secondary Offering", description: "Joint bookrunner on $1.3B follow-on offering", value: "$1.3B", date: "2024-06", role: "Joint Bookrunner", type: "Equity", sector: "Technology", companies: ["Cloudflare"] },
  { title: "ServiceNow Senior Notes", description: "Lead left bookrunner on $2B investment grade notes", value: "$2B", date: "2024-04", role: "Lead Bookrunner", type: "Debt", sector: "Technology", companies: ["ServiceNow"] },
];

const healthcareDeals: Deal[] = [
  { title: "Johnson & Johnson / Shockwave Medical", description: "Advised Shockwave on acquisition by J&J", value: "$13.1B", date: "2024-05", role: "Sell-Side Advisor", type: "M&A", sector: "Healthcare", companies: ["J&J", "Shockwave Medical"] },
  { title: "Syneos Health Take-Private", description: "Financial advisor to special committee on PE take-private", value: "$7.1B", date: "2023-09", role: "Special Committee Advisor", type: "M&A", sector: "Healthcare", companies: ["Syneos Health", "Elliott Management"] },
  { title: "Novo Nordisk / Catalent", description: "Buy-side advisor on biologics manufacturing acquisition", value: "$16.5B", date: "2024-02", role: "Buy-Side Advisor", type: "M&A", sector: "Healthcare", companies: ["Novo Nordisk", "Catalent"] },
  { title: "Primoris Healthcare IPO", description: "Joint bookrunner on healthcare services IPO", value: "$450M", date: "2024-07", role: "Joint Bookrunner", type: "IPO", sector: "Healthcare", companies: ["Primoris"] },
];

const energyDeals: Deal[] = [
  { title: "ExxonMobil / Pioneer Natural Resources", description: "Advised on landmark oil & gas consolidation", value: "$59.5B", date: "2024-01", role: "Financial Advisor", type: "M&A", sector: "Energy", companies: ["ExxonMobil", "Pioneer"] },
  { title: "Chevron / Hess Corporation", description: "Buy-side advisor on Guyana oil asset acquisition", value: "$53B", date: "2024-03", role: "Buy-Side Advisor", type: "M&A", sector: "Energy", companies: ["Chevron", "Hess"] },
  { title: "Constellation Energy / Calpine", description: "Buy-side advisor on power generation combination", value: "$16.4B", date: "2024-09", role: "Buy-Side Advisor", type: "M&A", sector: "Energy", companies: ["Constellation", "Calpine"] },
  { title: "NextEra Sustainability Notes", description: "Green bond issuance for renewable energy projects", value: "$3.5B", date: "2024-05", role: "Lead Manager", type: "Debt", sector: "Energy", companies: ["NextEra Energy"] },
];

const consumerDeals: Deal[] = [
  { title: "Tapestry / Capri Holdings", description: "Buy-side advisor on luxury fashion combination", value: "$8.5B", date: "2023-08", role: "Buy-Side Advisor", type: "M&A", sector: "Consumer", companies: ["Tapestry", "Capri"] },
  { title: "Saks Fifth Avenue / Neiman Marcus", description: "Sell-side advisor on luxury retail merger", value: "$2.65B", date: "2024-07", role: "Sell-Side Advisor", type: "M&A", sector: "Consumer", companies: ["Saks", "Neiman Marcus"] },
  { title: "Kellanova / Mars Acquisition", description: "Sell-side advisory on snacks giant acquisition", value: "$35.9B", date: "2024-08", role: "Sell-Side Advisor", type: "M&A", sector: "Consumer", companies: ["Mars", "Kellanova"] },
];

const finServicesDeals: Deal[] = [
  { title: "Capital One / Discover Financial", description: "Buy-side advisor on landmark payments merger", value: "$35.3B", date: "2024-02", role: "Buy-Side Advisor", type: "M&A", sector: "Financial Services", companies: ["Capital One", "Discover"] },
  { title: "TPG / Angelo Gordon", description: "Advised on credit manager combination", value: "$2.7B", date: "2023-08", role: "Sell-Side Advisor", type: "M&A", sector: "Financial Services", companies: ["TPG", "Angelo Gordon"] },
  { title: "Blue Owl SPAC Combination", description: "Advisor on financial services SPAC", value: "$12.5B", date: "2024-05", role: "Financial Advisor", type: "M&A", sector: "Financial Services", companies: ["Blue Owl"] },
];

const industrialsDeals: Deal[] = [
  { title: "Carrier Global / Viessmann Climate", description: "Buy-side advisor on HVAC expansion", value: "$13.2B", date: "2023-10", role: "Buy-Side Advisor", type: "M&A", sector: "Industrials", companies: ["Carrier Global", "Viessmann"] },
  { title: "Parker Hannifin / Meggitt Integration", description: "Post-merger integration advisory", value: "$8.8B", date: "2023-09", role: "Integration Advisor", type: "Advisory", sector: "Industrials", companies: ["Parker Hannifin", "Meggitt"] },
  { title: "TransDigm High Yield Offering", description: "Lead left on aerospace HY financing", value: "$2.1B", date: "2024-06", role: "Lead Left Bookrunner", type: "Debt", sector: "Industrials", companies: ["TransDigm"] },
];

const restructuringDeals: Deal[] = [
  { title: "WeWork Chapter 11 Restructuring", description: "Advised creditors on $12B debt restructuring", value: "$12B", date: "2024-01", role: "Creditor Advisor", type: "Restructuring", sector: "Real Estate", companies: ["WeWork"] },
  { title: "Diamond Sports Group RSA", description: "Debtor-side advisor on regional sports network restructuring", value: "$8.7B", date: "2023-11", role: "Debtor Advisor", type: "Restructuring", sector: "Media", companies: ["Diamond Sports Group", "Sinclair Broadcast"] },
  { title: "Yellow Corporation Liquidation", description: "Advised on trucking giant wind-down", value: "$1.5B", date: "2023-12", role: "Financial Advisor", type: "Restructuring", sector: "Transportation", companies: ["Yellow Corporation"] },
];

// ─── Main Contacts Array ─────────────────────────────────────────────────────

export const contactsData: Contact[] = [
  // ══════════════════════════════════════════════════
  // GOLDMAN SACHS
  // ══════════════════════════════════════════════════
  {
    id: "gs-001", firstName: "Alexander", lastName: "Chen", email: email("alexander", "chen", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Managing Director", seniority: "md", team: "Technology M&A", coverageSectors: ["Technology", "Software", "SaaS"],
    school: "Wharton School", graduationYear: 2008, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 92, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 2), icebreakers: [
      "Led the Splunk / Cisco advisory — fascinating deal given the security landscape shift. I've been studying the due diligence process.",
      "Your Synopsys / Ansys work is incredible given the semiconductor consolidation thesis — I wrote my thesis on EDA market dynamics.",
      "Princeton '04 → Wharton → GS TMT is a path I'm actively targeting. Would love 20 minutes on navigating that transition.",
    ],
    personalStyle: "Data-driven, direct communicator. Values conciseness. Known for building rigorous DCF models for complex tech deals.",
    linkedinKeywords: ["goldman sachs", "technology M&A", "wharton", "princeton"],
    timezone: "America/New_York", outreachHistory: [], tags: ["priority-target", "tech-coverage", "wharton-alum"],
  },
  {
    id: "gs-002", firstName: "Sarah", lastName: "Mitchell", email: email("sarah", "mitchell", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Vice President", seniority: "vp", team: "Healthcare Investment Banking", coverageSectors: ["Healthcare", "Biotech", "MedTech"],
    school: "Harvard Business School", graduationYear: 2017, undergrad: "Duke University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 2), icebreakers: [
      "The Shockwave / J&J transaction was a masterclass in cardiovascular device M&A — I've been dissecting the synergy case.",
      "Duke pre-med to HBS to Goldman healthcare banking is exactly the arc I'm working toward from my biology background.",
      "I've been researching GLP-1 commercialization deal flow — would love your perspective on how it's reshaping pharma M&A.",
    ],
    personalStyle: "Relationship-focused, empathetic. Strong healthcare domain expertise. Very active on LinkedIn sharing healthcare M&A insights.",
    linkedinKeywords: ["goldman sachs", "healthcare", "HBS", "duke"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "hbs-alum"],
  },
  {
    id: "gs-003", firstName: "Michael", lastName: "Torres", email: email("michael", "torres", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Associate", seniority: "associate", team: "Financial Sponsors Group", coverageSectors: ["Private Equity", "LBO", "Financial Sponsors"],
    school: "Columbia Business School", graduationYear: 2022, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 82, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals.slice(0, 1), icebreakers: [
      "Michigan → CBS → Goldman FSG is a path I'm closely studying — especially given Michigan's strong IB placement.",
      "The PE deal landscape in 2024 has been fascinating with rates finally normalizing — would love your perspective on LBO financing.",
      "CBS's Investment Banking Club must have been a great launchpad — I'm curious how you built your recruiting strategy.",
    ],
    personalStyle: "Collaborative team player. Strong LBO modeling skills. Recently promoted; very responsive to email.",
    linkedinKeywords: ["goldman sachs", "financial sponsors", "columbia", "michigan"], timezone: "America/New_York", outreachHistory: [], tags: ["financial-sponsors", "recent-associate"],
  },
  {
    id: "gs-004", firstName: "Jennifer", lastName: "Park", email: email("jennifer", "park", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Analyst", seniority: "analyst", team: "Industrials & Infrastructure", coverageSectors: ["Industrials", "Infrastructure", "Aerospace & Defense"],
    school: "University of Pennsylvania", graduationYear: 2023, undergrad: "University of Pennsylvania", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 95, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: industrialsDeals, icebreakers: [
      "Penn → Goldman Industrials is a great pipeline — I'm a current Penn junior targeting the same path.",
      "The Carrier / Viessmann deal structure was creative — I've been modeling the synergy assumptions for a case competition.",
      "As a second-year analyst, your perspective on the GS summer to full-time conversion would be invaluable.",
    ],
    personalStyle: "Extremely detail-oriented. Responds quickly. Still in analyst grind; very willing to help fellow Penn students.",
    linkedinKeywords: ["goldman sachs", "industrials", "penn", "upenn"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "penn-alum"],
  },
  {
    id: "gs-005", firstName: "David", lastName: "Huang", email: email("david", "huang", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Director", seniority: "director", team: "Energy, Power & Infrastructure", coverageSectors: ["Energy", "Power", "Renewables", "Infrastructure"],
    school: "MIT Sloan", graduationYear: 2013, undergrad: "Cornell University", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 79, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals.slice(0, 2), icebreakers: [
      "The ExxonMobil / Pioneer transaction is the defining E&P deal of the decade — would love your view on Permian consolidation.",
      "Cornell → MIT Sloan → Goldman Energy is a fascinating path given MIT's engineering-to-finance pipeline.",
      "With energy transition accelerating, how has GS's coverage evolved between traditional E&P and renewables?",
    ],
    personalStyle: "Technical, analytical. Strong engineering background. Values substantive conversations about energy markets.",
    linkedinKeywords: ["goldman sachs", "energy", "mit sloan", "cornell"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston"],
  },
  {
    id: "gs-006", firstName: "Emily", lastName: "Walsh", email: email("emily", "walsh", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Vice President", seniority: "vp", team: "Consumer & Retail", coverageSectors: ["Consumer", "Retail", "Luxury", "Food & Beverage"],
    school: "Northwestern Kellogg", graduationYear: 2019, undergrad: "University of Notre Dame", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals.slice(0, 2), icebreakers: [
      "The Kellanova / Mars deal was massive for the snacks sector — how did the cross-border regulatory process play out?",
      "Notre Dame → Kellogg → GS Consumer is impressive — I'm a ND junior targeting Consumer banking specifically.",
      "The luxury retail consolidation trend with Saks / Neiman is fascinating — would love 15 minutes on sector dynamics.",
    ],
    personalStyle: "Outgoing and relationship-driven. Actively mentors ND students. Quick to respond on LinkedIn.",
    linkedinKeywords: ["goldman sachs", "consumer", "kellogg", "notre dame"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "notre-dame-alum"],
  },

  // ══════════════════════════════════════════════════
  // MORGAN STANLEY
  // ══════════════════════════════════════════════════
  {
    id: "ms-001", firstName: "Robert", lastName: "Kim", email: email("robert", "kim", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Managing Director", seniority: "md", team: "Technology Investment Banking", coverageSectors: ["Technology", "Internet", "Software", "Semiconductors"],
    school: "Harvard Business School", graduationYear: 2007, undergrad: "Yale University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(1, 3), icebreakers: [
      "The Adobe / Figma regulatory outcome was a landmark moment for Big Tech M&A scrutiny — your team's work throughout was impressive.",
      "Yale → HBS → Morgan Stanley TMT MD is a path I deeply admire — would love 20 minutes on building conviction in tech IB.",
      "The semiconductor M&A wave (Synopsys/Ansys, Intel divestitures) is reshaping the industry — how does MS think about this cycle?",
    ],
    personalStyle: "Strategic thinker, big-picture orientation. Speaks at conferences on tech M&A. Very selective with time.",
    linkedinKeywords: ["morgan stanley", "technology", "HBS", "yale"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "hbs-alum", "senior"],
  },
  {
    id: "ms-002", firstName: "Stephanie", lastName: "Liu", email: email("stephanie", "liu", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Associate", seniority: "associate", team: "Healthcare & Life Sciences", coverageSectors: ["Pharma", "Biotech", "Healthcare Services"],
    school: "Columbia Business School", graduationYear: 2022, undergrad: "Johns Hopkins University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(1, 3), icebreakers: [
      "The Novo Nordisk / Catalent deal is reshaping CDMO M&A — the obesity drug manufacturing capacity angle is fascinating.",
      "Johns Hopkins pre-med → Columbia Business → MS Healthcare is a classic science-to-banking trajectory I'm modeling.",
      "The GLP-1 drug pipeline deal flow must be keeping your team extremely busy — would love your read on where biotech M&A heads next.",
    ],
    personalStyle: "Highly analytical, science-literate. Active in Women in Finance initiatives. Very welcoming to informational chats.",
    linkedinKeywords: ["morgan stanley", "healthcare", "columbia", "johns hopkins"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "columbia-alum"],
  },
  {
    id: "ms-003", firstName: "James", lastName: "O'Brien", email: email("james", "obrien", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Vice President", seniority: "vp", team: "Mergers & Acquisitions", coverageSectors: ["Cross-Sector M&A", "Cross-Border", "Special Situations"],
    school: "Wharton School", graduationYear: 2018, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 89, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[0]], icebreakers: [
      "Georgetown → Wharton → MS M&A is a path I'm targeting specifically — how did Wharton's IB recruiting environment compare to undergrad?",
      "The cross-border M&A complexity in 2024 with CFIUS and EU regulatory headwinds must be constantly evolving.",
      "I'm researching the role of fairness opinions in contested M&A — your M&A advisory work seems ideal to learn from.",
    ],
    personalStyle: "Sharp, competitive. Loves discussing deal structure nuances. Georgetown network is very strong with him.",
    linkedinKeywords: ["morgan stanley", "M&A", "wharton", "georgetown"], timezone: "America/New_York", outreachHistory: [], tags: ["generalist-ma", "wharton-alum"],
  },
  {
    id: "ms-004", firstName: "Priya", lastName: "Sharma", email: email("priya", "sharma", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Analyst", seniority: "analyst", team: "Financial Institutions Group", coverageSectors: ["Banks", "Insurance", "Asset Management", "FinTech"],
    school: "University of Michigan", graduationYear: 2024, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 83, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals.slice(1, 2), icebreakers: [
      "Michigan → Morgan Stanley FIG is a well-worn path — as a current Michigan student, your recruiting journey would be very helpful.",
      "The FIG sector in 2024 has been interesting with regional bank consolidation post-SVB — how has your coverage evolved?",
      "I've been reading a lot about insurance M&A — how does MS FIG think about the annuity space vs. P&C?",
    ],
    personalStyle: "Diligent, eager to help fellow Michigan students. Very accessible. Will respond to LinkedIn messages.",
    linkedinKeywords: ["morgan stanley", "FIG", "michigan", "financial institutions"], timezone: "America/New_York", outreachHistory: [], tags: ["fig-coverage", "michigan-alum", "analyst"],
  },
  {
    id: "ms-005", firstName: "Christopher", lastName: "Banks", email: email("christopher", "banks", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Executive Director", seniority: "director", team: "Equity Capital Markets", coverageSectors: ["IPO", "Follow-On", "Convertibles", "Block Trades"],
    school: "Dartmouth College", graduationYear: 2010, undergrad: "Dartmouth College", location: "New York, NY", city: "New York",
    priority: "low", status: "not_contacted", fitScore: 68, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[3]], icebreakers: [
      "The Cloudflare secondary was a complex trade given the market volatility — the execution must have been challenging.",
      "Dartmouth's strong IB alumni network is something I'm hoping to leverage — would appreciate 15 minutes.",
      "ECM vs. M&A is a career choice I'm actively thinking through — your perspective on ECM's strategic value would help.",
    ],
    personalStyle: "Fast-paced, market-focused. ECM background means very deal-flow sensitive. Best reached in early mornings.",
    linkedinKeywords: ["morgan stanley", "ECM", "dartmouth", "capital markets"], timezone: "America/New_York", outreachHistory: [], tags: ["ecm", "dartmouth-alum"],
  },
  {
    id: "ms-006", firstName: "Lauren", lastName: "Adams", email: email("lauren", "adams", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Vice President", seniority: "vp", team: "Leveraged Finance", coverageSectors: ["High Yield", "Leveraged Loans", "LBO Financing"],
    school: "NYU Stern", graduationYear: 2016, undergrad: "Cornell University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 77, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2]], icebreakers: [
      "Cornell → Stern → MS Lev Fin is an interesting path — how did the MBA change your skill set relative to undergrad recruiting?",
      "The TransDigm HY deal was a complex piece of aerospace financing — the covenant structure must have been intricate.",
      "Lev Fin is a path I'm seriously considering given my interest in credit — would love your honest view of the day-to-day.",
    ],
    personalStyle: "Technical and credit-focused. Values concise emails. Responds well to candidates who understand credit concepts.",
    linkedinKeywords: ["morgan stanley", "leveraged finance", "NYU stern", "cornell"], timezone: "America/New_York", outreachHistory: [], tags: ["lev-fin", "nyu-alum"],
  },

  // ══════════════════════════════════════════════════
  // JPMORGAN
  // ══════════════════════════════════════════════════
  {
    id: "jpm-001", firstName: "Thomas", lastName: "Wright", email: email("thomas", "wright", "JPMorgan"),
    firm: "JPMorgan", title: "Managing Director", seniority: "md", team: "Global Technology, Media & Telecom", coverageSectors: ["Technology", "Media", "Telecom", "Internet"],
    school: "Wharton School", graduationYear: 2005, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 90, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "JPMorgan's TMT franchise has been dominant in the semiconductor cycle — the NVDA ecosystem deals are remarkable.",
      "Princeton → Wharton → JPMorgan TMT MD is the IB career path I'm mapping out — would appreciate 20 minutes.",
      "How has the streaming wars M&A (Disney/Fox, Warner/Discovery) shaped JPMorgan's media coverage strategy?",
    ],
    personalStyle: "Institutional and polished. Represents JPM's brand externally. Highly selective but responsive to Princeton connections.",
    linkedinKeywords: ["jpmorgan", "TMT", "wharton", "princeton"], timezone: "America/New_York", outreachHistory: [], tags: ["tmt-coverage", "wharton-alum", "senior"],
  },
  {
    id: "jpm-002", firstName: "Nicole", lastName: "Patel", email: email("nicole", "patel", "JPMorgan"),
    firm: "JPMorgan", title: "Associate", seniority: "associate", team: "Healthcare Investment Banking", coverageSectors: ["Pharma", "Biotech", "MedTech", "Healthcare Services"],
    school: "Harvard Business School", graduationYear: 2023, undergrad: "University of Virginia", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 86, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 2), icebreakers: [
      "UVA → Harvard → JPMorgan Healthcare is a path I'm specifically studying — how did HBS recruiting shape your firm choice?",
      "The GLP-1 wave is driving unprecedented healthcare M&A — how has JPMorgan's coverage thesis evolved?",
      "I'm writing a research paper on CDMO consolidation post-COVID — your Novo Nordisk / Catalent work is directly relevant.",
    ],
    personalStyle: "Collaborative and open. Very engaged in UVA and HBS alumni networks. Will respond to thoughtful outreach.",
    linkedinKeywords: ["jpmorgan", "healthcare", "HBS", "UVA"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "hbs-alum", "uva-alum"],
  },
  {
    id: "jpm-003", firstName: "Kevin", lastName: "Sullivan", email: email("kevin", "sullivan", "JPMorgan"),
    firm: "JPMorgan", title: "Vice President", seniority: "vp", team: "Energy Investment Banking", coverageSectors: ["E&P", "Midstream", "Oilfield Services", "Renewables"],
    school: "Rice University Jones", graduationYear: 2017, undergrad: "Texas A&M University", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 74, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals.slice(0, 2), icebreakers: [
      "Texas A&M → Rice Jones → JPMorgan Energy Houston is the Texas-to-Houston IB path — I'm exploring energy IB specifically.",
      "The Chevron / Hess deal's Guyana asset angle was extraordinary — how did the offshore valuation methodology work?",
      "With the energy transition, how do you see JPMorgan balancing traditional O&G vs. clean energy coverage?",
    ],
    personalStyle: "Texan and direct. Strong football culture background. Proud of Texas school network. Quick email responder.",
    linkedinKeywords: ["jpmorgan", "energy", "rice", "texas"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston"],
  },
  {
    id: "jpm-004", firstName: "Rachel", lastName: "Goldstein", email: email("rachel", "goldstein", "JPMorgan"),
    firm: "JPMorgan", title: "Analyst", seniority: "analyst", team: "Mergers & Acquisitions", coverageSectors: ["Cross-Sector M&A", "Strategic Advisory"],
    school: "Cornell University", graduationYear: 2024, undergrad: "Cornell University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 93, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[0]], icebreakers: [
      "Cornell → JPMorgan M&A is a strong path — as a current Cornell junior, your recruiting advice would be incredibly valuable.",
      "Working on cross-sector M&A advisory must provide great breadth — how do you develop sector depth as a generalist?",
      "I've been competing in M&A case competitions — your perspective on translating that to real deal experience would help.",
    ],
    personalStyle: "Ambitious and responsive. Still very close to the Cornell network. Will happily do 20-minute coffee chats.",
    linkedinKeywords: ["jpmorgan", "M&A", "cornell", "investment banking"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "cornell-alum"],
  },
  {
    id: "jpm-005", firstName: "Andrew", lastName: "Foster", email: email("andrew", "foster", "JPMorgan"),
    firm: "JPMorgan", title: "Director", seniority: "director", team: "Consumer & Retail Investment Banking", coverageSectors: ["Consumer Staples", "Food & Beverage", "Restaurants", "E-Commerce"],
    school: "Wharton School", graduationYear: 2012, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 80, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals, icebreakers: [
      "The Kellanova / Mars deal — advising on a $35B snacks company sale must have been an extraordinary process.",
      "Michigan → Wharton → JPMorgan Consumer is a well-trodden path — how did your sector focus develop at Wharton?",
      "Consumer M&A has been explosive in 2024 — would love your view on where the next wave of consolidation targets are.",
    ],
    personalStyle: "Personable and consumer-enthusiastic. Loves talking about brand strategy. Michigan sports fan.",
    linkedinKeywords: ["jpmorgan", "consumer", "wharton", "michigan"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "wharton-alum"],
  },
  {
    id: "jpm-006", firstName: "Megan", lastName: "Torres", email: email("megan", "torres", "JPMorgan"),
    firm: "JPMorgan", title: "Associate", seniority: "associate", team: "Restructuring Advisory", coverageSectors: ["Distressed", "Restructuring", "Special Situations"],
    school: "Columbia Law School", graduationYear: 2021, undergrad: "Columbia University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 72, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals.slice(0, 2), icebreakers: [
      "Columbia Law → JPMorgan Restructuring is a unique JD-to-banking path — how has the legal training shaped your deal work?",
      "The WeWork restructuring was one of the most complex real estate workouts in recent memory — the creditor dynamics were intense.",
      "With corporate defaults rising in 2024, restructuring advisory seems very active — what sectors are you focused on?",
    ],
    personalStyle: "Analytical with legal precision. Loves discussing covenant structures and distressed mechanics.",
    linkedinKeywords: ["jpmorgan", "restructuring", "columbia", "distressed"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "columbia-alum"],
  },

  // ══════════════════════════════════════════════════
  // HOULIHAN LOKEY
  // ══════════════════════════════════════════════════
  {
    id: "hl-001", firstName: "Daniel", lastName: "Rosenberg", email: email("daniel", "rosenberg", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Managing Director", seniority: "md", team: "Financial Restructuring Group", coverageSectors: ["Distressed", "Restructuring", "Bankruptcy", "Special Situations"],
    school: "University of Chicago Booth", graduationYear: 2006, undergrad: "Northwestern University", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 94, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "Houlihan Lokey's restructuring franchise is the gold standard — the Diamond Sports restructuring must have been extraordinarily complex.",
      "Northwestern → Booth → HL Restructuring is an impressive path; I'm a Northwestern student targeting distressed advisory.",
      "With Yellow Corporation winding down, how does HL approach liquidation advisory differently from going-concern restructuring?",
    ],
    personalStyle: "No-nonsense and direct. Deep restructuring expertise. Appreciates candidates who understand the distressed toolkit.",
    linkedinKeywords: ["houlihan lokey", "restructuring", "chicago booth", "northwestern"], timezone: "America/Chicago", outreachHistory: [], tags: ["restructuring", "top-target", "northwestern-alum"],
  },
  {
    id: "hl-002", firstName: "Amanda", lastName: "Chen", email: email("amanda", "chen", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Vice President", seniority: "vp", team: "Healthcare & Life Sciences", coverageSectors: ["Healthcare Services", "Pharma", "Behavioral Health", "Home Health"],
    school: "Duke Fuqua", graduationYear: 2018, undergrad: "Vanderbilt University", location: "Los Angeles, CA", city: "Los Angeles",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(2, 4), icebreakers: [
      "HL's healthcare franchise in the mid-market is second to none — your behavioral health coverage is particularly interesting.",
      "Vanderbilt → Fuqua → Houlihan Lokey Healthcare LA — how has working on the West Coast shaped your deal flow?",
      "Mid-market healthcare services M&A seems to be accelerating — what sub-sectors is HL seeing the most activity?",
    ],
    personalStyle: "Warm and collegial. Strong Vanderbilt loyalty. Open to mentoring students from southern schools.",
    linkedinKeywords: ["houlihan lokey", "healthcare", "fuqua", "vanderbilt"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["healthcare-coverage", "la-office"],
  },
  {
    id: "hl-003", firstName: "Brandon", lastName: "Lee", email: email("brandon", "lee", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Associate", seniority: "associate", team: "Corporate Finance Advisory", coverageSectors: ["Middle Market M&A", "Sell-Side Advisory", "Fairness Opinions"],
    school: "Georgetown McDonough", graduationYear: 2022, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[1], industrialsDeals[0]], icebreakers: [
      "Georgetown undergrad → McDonough MBA → Houlihan Lokey — how do you compare HL's deal exposure to BB shops?",
      "Mid-market M&A advisory gives great responsibility early — is your deal flow more sell-side or buy-side?",
      "HL's fairness opinion business is a unique differentiator — how does that work shape your skill set as an associate?",
    ],
    personalStyle: "Engaged and helpful. Georgetown alumni network very active. Quick to set up coffee chats.",
    linkedinKeywords: ["houlihan lokey", "corporate finance", "georgetown", "M&A"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "mid-market"],
  },
  {
    id: "hl-004", firstName: "Samantha", lastName: "White", email: email("samantha", "white", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Analyst", seniority: "analyst", team: "Technology, Media & Telecom", coverageSectors: ["Software", "FinTech", "EdTech", "SaaS"],
    school: "University of Notre Dame", graduationYear: 2023, undergrad: "University of Notre Dame", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 90, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(2, 4), icebreakers: [
      "Notre Dame → Houlihan Lokey TMT is a great outcome — ND has been placing well into boutiques recently.",
      "Working on SaaS M&A at HL — how do you approach revenue quality analysis for subscription businesses?",
      "I'm a current ND student targeting technology banking — would love 20 minutes to hear about your HL journey.",
    ],
    personalStyle: "Enthusiastic and school-proud. Very willing to help ND students. Active on Handshake and LinkedIn.",
    linkedinKeywords: ["houlihan lokey", "technology", "notre dame", "TMT"], timezone: "America/Chicago", outreachHistory: [], tags: ["school-connection", "analyst", "notre-dame-alum"],
  },
  {
    id: "hl-005", firstName: "Marcus", lastName: "Johnson", email: email("marcus", "johnson", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Director", seniority: "director", team: "Financial Restructuring Group", coverageSectors: ["Distressed Debt", "Out-of-Court Restructuring", "Chapter 11"],
    school: "Harvard Law School", graduationYear: 2011, undergrad: "Morehouse College", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 81, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals.slice(0, 2), icebreakers: [
      "Morehouse → Harvard Law → Houlihan Lokey Restructuring is a unique and inspiring path into distressed advisory.",
      "Your JD/restructuring combination — how does the legal background accelerate the restructuring advisory skill set?",
      "HL's out-of-court restructuring work in 2024 has been extensive — which sector is generating the most complexity?",
    ],
    personalStyle: "Thoughtful and precise. Strong HBCU advocate. Speaks at diversity in finance forums.",
    linkedinKeywords: ["houlihan lokey", "restructuring", "harvard law", "morehouse"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "diversity-champion"],
  },
  {
    id: "hl-006", firstName: "Christina", lastName: "Murphy", email: email("christina", "murphy", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Vice President", seniority: "vp", team: "Energy & Industrials", coverageSectors: ["Energy Transition", "Clean Energy", "Industrials", "Infrastructure"],
    school: "Wharton School", graduationYear: 2019, undergrad: "Michigan State University", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals.slice(2, 4), icebreakers: [
      "Michigan State → Wharton → HL Energy Houston — how do you find the boutique environment vs. the BB energy shops?",
      "The Constellation / Calpine deal was an incredible power generation combination — what's driving power plant M&A?",
      "Clean energy advisory must be booming given IRA incentives — how has HL's renewable coverage evolved?",
    ],
    personalStyle: "Direct and energy-passionate. Michigan State pride. Open to MSU alumni conversations.",
    linkedinKeywords: ["houlihan lokey", "energy", "wharton", "michigan state"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston", "wharton-alum"],
  },

  // ══════════════════════════════════════════════════
  // PIPER SANDLER
  // ══════════════════════════════════════════════════
  {
    id: "ps-001", firstName: "Gregory", lastName: "Nelson", email: email("gregory", "nelson", "Piper Sandler"),
    firm: "Piper Sandler", title: "Managing Director", seniority: "md", team: "Healthcare Investment Banking", coverageSectors: ["Biotech", "Diagnostics", "Medical Devices", "Digital Health"],
    school: "University of Minnesota", graduationYear: 2004, undergrad: "Carleton College", location: "Minneapolis, MN", city: "Minneapolis",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals, icebreakers: [
      "Piper Sandler's biotech IPO franchise is best-in-class — how has the IPO window environment affected your 2024 deal pipeline?",
      "Carleton → Minnesota → Piper Sandler is a distinctly Midwest IB trajectory — I'm from Minneapolis and targeting healthcare banking.",
      "The digital health sector post-pandemic has had a massive valuation correction — how do you approach those company valuations now?",
    ],
    personalStyle: "Midwest-genuine and unpretentious. Deep healthcare domain knowledge. Strong Carleton College loyalty.",
    linkedinKeywords: ["piper sandler", "healthcare", "biotech", "minneapolis"], timezone: "America/Chicago", outreachHistory: [], tags: ["healthcare-coverage", "biotech-ipo"],
  },
  {
    id: "ps-002", firstName: "Jessica", lastName: "Campbell", email: email("jessica", "campbell", "Piper Sandler"),
    firm: "Piper Sandler", title: "Vice President", seniority: "vp", team: "Technology Investment Banking", coverageSectors: ["Software", "FinTech", "Payments", "SaaS"],
    school: "University of Wisconsin-Madison", graduationYear: 2015, undergrad: "University of Wisconsin-Madison", location: "San Francisco, CA", city: "San Francisco",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 2), icebreakers: [
      "Piper Sandler's tech practice in SF must have excellent deal flow given proximity to the Valley ecosystem.",
      "Wisconsin → Piper Sandler Tech — how did you end up on the West Coast in the SF office after coming from Madison?",
      "FinTech M&A has been consolidating hard — how does Piper Sandler position vs. Lazard or Evercore in payments advisory?",
    ],
    personalStyle: "West Coast-casual but deal-sharp. Very accessible. UW-Madison alumni network active.",
    linkedinKeywords: ["piper sandler", "technology", "fintech", "san francisco"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["tech-coverage", "sf-office"],
  },
  {
    id: "ps-003", firstName: "Matthew", lastName: "Anderson", email: email("matthew", "anderson", "Piper Sandler"),
    firm: "Piper Sandler", title: "Associate", seniority: "associate", team: "Financial Institutions Group", coverageSectors: ["Banks", "Credit Unions", "Insurance", "RIA M&A"],
    school: "Notre Dame Mendoza", graduationYear: 2021, undergrad: "University of Notre Dame", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals, icebreakers: [
      "Notre Dame Mendoza → Piper Sandler FIG is a very common and strong recruiting pipeline.",
      "RIA M&A has been one of the most active sub-sectors in FIG — what's driving the consolidation thesis?",
      "As a current Notre Dame student, your Mendoza MBA and recruiting experience at Piper Sandler would be very helpful.",
    ],
    personalStyle: "Catholic school-spirited, generous with time. Very active in ND alumni mentoring program.",
    linkedinKeywords: ["piper sandler", "FIG", "notre dame", "mendoza"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "notre-dame-alum", "fig-coverage"],
  },
  {
    id: "ps-004", firstName: "Olivia", lastName: "Thompson", email: email("olivia", "thompson", "Piper Sandler"),
    firm: "Piper Sandler", title: "Analyst", seniority: "analyst", team: "Consumer & Restaurant Investment Banking", coverageSectors: ["Restaurants", "Consumer Brands", "Specialty Retail", "E-Commerce"],
    school: "Vanderbilt University", graduationYear: 2023, undergrad: "Vanderbilt University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 79, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals.slice(1, 3), icebreakers: [
      "Vanderbilt → Piper Sandler Consumer is a strong pipeline that's been producing great analysts.",
      "The restaurant sector M&A in 2024 — how does Piper Sandler source deal flow in the QSR vs. fast casual space?",
      "I'm a current Vanderbilt student targeting IB — would love 15-20 minutes to hear about your first year experience.",
    ],
    personalStyle: "Approachable and Southern-hospitable. Very willing to help Vanderbilt students. Weekend coffee chat friendly.",
    linkedinKeywords: ["piper sandler", "consumer", "vanderbilt", "restaurants"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "vanderbilt-alum", "analyst"],
  },
  {
    id: "ps-005", firstName: "Ryan", lastName: "Harrison", email: email("ryan", "harrison", "Piper Sandler"),
    firm: "Piper Sandler", title: "Director", seniority: "director", team: "Equity Capital Markets", coverageSectors: ["IPO Advisory", "Healthcare ECM", "Technology ECM"],
    school: "University of Virginia Darden", graduationYear: 2012, undergrad: "Washington & Lee University", location: "Minneapolis, MN", city: "Minneapolis",
    priority: "low", status: "not_contacted", fitScore: 69, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [healthcareDeals[3], techDeals[3]], icebreakers: [
      "Piper Sandler's ECM franchise is uniquely strong in healthcare IPOs — how do you position vs. SVB Leerink in biotech?",
      "Washington & Lee → Darden → Piper Sandler ECM — the liberal arts to banking path is one I respect.",
      "The IPO market in 2024 showed signs of reopening — how are you thinking about the pipeline for 2025?",
    ],
    personalStyle: "Reserved and analytical. Minnesota-humble. Prefers substantive emails over generic ones.",
    linkedinKeywords: ["piper sandler", "ECM", "IPO", "darden"], timezone: "America/Chicago", outreachHistory: [], tags: ["ecm", "ipo-advisory"],
  },
  {
    id: "ps-006", firstName: "Hannah", lastName: "Clarke", email: email("hannah", "clarke", "Piper Sandler"),
    firm: "Piper Sandler", title: "Associate", seniority: "associate", team: "Aerospace, Defense & Government", coverageSectors: ["Defense", "Aerospace", "Government Services", "Space"],
    school: "Georgetown University", graduationYear: 2020, undergrad: "Georgetown University", location: "Washington, DC", city: "Washington DC",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2]], icebreakers: [
      "Georgetown → Piper Sandler A&D in DC is a natural fit given your proximity to defense policy circles.",
      "Defense M&A is booming post-Ukraine — how is Piper Sandler positioned in the prime contractor advisory space?",
      "Space as an emerging sub-sector must be fascinating — are you seeing traditional PE buyers or strategic consolidators?",
    ],
    personalStyle: "Policy-oriented and analytical. DC-based, values national security context in deal discussions.",
    linkedinKeywords: ["piper sandler", "defense", "aerospace", "georgetown"], timezone: "America/New_York", outreachHistory: [], tags: ["defense-coverage", "dc-office", "georgetown-alum"],
  },

  // ══════════════════════════════════════════════════
  // WILLIAM BLAIR
  // ══════════════════════════════════════════════════
  {
    id: "wb-001", firstName: "Jonathan", lastName: "Pierce", email: email("jonathan", "pierce", "William Blair"),
    firm: "William Blair", title: "Managing Director", seniority: "md", team: "Technology Investment Banking", coverageSectors: ["Software", "IT Services", "Cybersecurity", "Data & Analytics"],
    school: "University of Chicago Booth", graduationYear: 2008, undergrad: "Northwestern University", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "William Blair's technology M&A franchise is exceptional for mid-market software deals — consistently best-in-class.",
      "Northwestern → Booth → William Blair is a very Chicago-centric path I'm exploring as a current Northwestern student.",
      "Cybersecurity M&A has been one of the most active sectors — how does WB think about the consolidation of point solutions?",
    ],
    personalStyle: "Chicago proud and intellectually engaged. Loves deep-dive conversations on technology business models.",
    linkedinKeywords: ["william blair", "technology", "booth", "northwestern"], timezone: "America/Chicago", outreachHistory: [], tags: ["tech-coverage", "northwestern-alum", "chicago"],
  },
  {
    id: "wb-002", firstName: "Katherine", lastName: "Morrison", email: email("katherine", "morrison", "William Blair"),
    firm: "William Blair", title: "Vice President", seniority: "vp", team: "Healthcare Investment Banking", coverageSectors: ["Life Sciences", "Pharma Services", "CRO", "CDMO"],
    school: "Notre Dame Mendoza", graduationYear: 2017, undergrad: "University of Notre Dame", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 89, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 3), icebreakers: [
      "Notre Dame → Mendoza → William Blair Healthcare — the ND-to-WB pipeline in Chicago is well-established.",
      "Life sciences services M&A (CRO, CDMO) has been transformative post-pandemic — how has consolidation changed valuations?",
      "I'm a current Notre Dame student deeply interested in healthcare banking — would appreciate 20 minutes on your path.",
    ],
    personalStyle: "Notre Dame-loyal and warm. Very active in ND mentoring. Will respond to ND students quickly.",
    linkedinKeywords: ["william blair", "healthcare", "notre dame", "life sciences"], timezone: "America/Chicago", outreachHistory: [], tags: ["school-connection", "notre-dame-alum", "healthcare-coverage"],
  },
  {
    id: "wb-003", firstName: "Tyler", lastName: "Brooks", email: email("tyler", "brooks", "William Blair"),
    firm: "William Blair", title: "Associate", seniority: "associate", team: "Business Services", coverageSectors: ["Business Services", "Outsourcing", "HR Tech", "Staffing"],
    school: "Washington University Olin", graduationYear: 2021, undergrad: "Washington University in St. Louis", location: "Chicago, IL", city: "Chicago",
    priority: "medium", status: "not_contacted", fitScore: 77, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], industrialsDeals[0]], icebreakers: [
      "WashU Olin → William Blair Business Services — WashU has strong connections to Chicago boutiques.",
      "Business services M&A must provide an interesting lens on the future of work trends — what's driving deal activity?",
      "How does the William Blair culture differ from the bulge bracket shops for a junior banker?",
    ],
    personalStyle: "Midwestern and approachable. WashU alumni network active. Happy to help students from St. Louis schools.",
    linkedinKeywords: ["william blair", "business services", "washu", "chicago"], timezone: "America/Chicago", outreachHistory: [], tags: ["business-services", "washu-alum"],
  },
  {
    id: "wb-004", firstName: "Allison", lastName: "Grant", email: email("allison", "grant", "William Blair"),
    firm: "William Blair", title: "Analyst", seniority: "analyst", team: "Technology Investment Banking", coverageSectors: ["EdTech", "SaaS", "Vertical Software"],
    school: "University of Illinois Urbana-Champaign", graduationYear: 2024, undergrad: "University of Illinois Urbana-Champaign", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 86, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(3, 5), icebreakers: [
      "UIUC → William Blair TMT is a strong Illinois-to-Chicago pipeline — I'm a current UIUC student targeting the same path.",
      "Vertical SaaS M&A is fascinating given the sector-specific moats — how do you value these businesses differently?",
      "First-year analyst life at William Blair — how has the deal responsibility and exposure compared to what you expected?",
    ],
    personalStyle: "Helpful and school-proud. Illinois engineering-to-finance background. Very responsive to UIUC students.",
    linkedinKeywords: ["william blair", "technology", "illinois", "UIUC"], timezone: "America/Chicago", outreachHistory: [], tags: ["school-connection", "analyst", "uiuc-alum"],
  },
  {
    id: "wb-005", firstName: "Patrick", lastName: "O'Connor", email: email("patrick", "oconnor", "William Blair"),
    firm: "William Blair", title: "Director", seniority: "director", team: "Consumer Investment Banking", coverageSectors: ["Consumer Products", "Beauty", "Wellness", "DTC Brands"],
    school: "Harvard Business School", graduationYear: 2013, undergrad: "Boston College", location: "Chicago, IL", city: "Chicago",
    priority: "medium", status: "not_contacted", fitScore: 75, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals, icebreakers: [
      "Boston College → HBS → William Blair Consumer — the BC to HBS path is a great progression.",
      "DTC brand M&A has had an interesting cycle post-SPAC — how do you approach valuations for digitally native brands?",
      "Beauty and wellness M&A seems counter-cyclical — what's driving the premium buyers in this space?",
    ],
    personalStyle: "Boston Catholic school background, humble and collegial. Boston College network very active.",
    linkedinKeywords: ["william blair", "consumer", "HBS", "boston college"], timezone: "America/Chicago", outreachHistory: [], tags: ["consumer-coverage", "hbs-alum"],
  },
  {
    id: "wb-006", firstName: "Michelle", lastName: "Davis", email: email("michelle", "davis", "William Blair"),
    firm: "William Blair", title: "Vice President", seniority: "vp", team: "Healthcare IT & Digital Health", coverageSectors: ["Health IT", "Digital Health", "Value-Based Care", "Revenue Cycle"],
    school: "Johns Hopkins Carey", graduationYear: 2016, undergrad: "University of Maryland", location: "Chicago, IL", city: "Chicago",
    priority: "medium", status: "not_contacted", fitScore: 80, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(1, 3), icebreakers: [
      "Health IT M&A has been one of the most active spaces — how do you approach valuations for value-based care businesses?",
      "UMaryland → Johns Hopkins Carey → William Blair Healthcare IT is a great DC-to-Baltimore-to-Chicago journey.",
      "Revenue cycle management M&A seems accelerating — what's the thesis driving consolidation in that sub-sector?",
    ],
    personalStyle: "Thoughtful and detail-oriented. Health policy background adds unique perspective. Mentors diverse candidates.",
    linkedinKeywords: ["william blair", "health IT", "johns hopkins", "digital health"], timezone: "America/Chicago", outreachHistory: [], tags: ["health-it", "digital-health"],
  },

  // ══════════════════════════════════════════════════
  // MOELIS & COMPANY
  // ══════════════════════════════════════════════════
  {
    id: "moelis-001", firstName: "Harrison", lastName: "Cole", email: email("harrison", "cole", "Moelis & Company"),
    firm: "Moelis & Company", title: "Managing Director", seniority: "md", team: "Mergers & Acquisitions", coverageSectors: ["Cross-Sector M&A", "Activist Defense", "Special Committee"],
    school: "Wharton School", graduationYear: 2004, undergrad: "Duke University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 93, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[1]], icebreakers: [
      "Moelis is the elite independent advisory model — how has being conflict-free shaped the quality of your strategic advice?",
      "Duke → Wharton → Moelis is a path I'm deeply targeting — what differentiated Moelis from the Evercore / PJT alternatives?",
      "Special committee work must be some of the most nuanced advisory — how do you navigate principal-agent dynamics?",
    ],
    personalStyle: "Intellectually rigorous and direct. Values candidates who understand the independent advisory model.",
    linkedinKeywords: ["moelis", "M&A", "wharton", "duke"], timezone: "America/New_York", outreachHistory: [], tags: ["top-target", "generalist-ma", "wharton-alum"],
  },
  {
    id: "moelis-002", firstName: "Natalie", lastName: "Fischer", email: email("natalie", "fischer", "Moelis & Company"),
    firm: "Moelis & Company", title: "Vice President", seniority: "vp", team: "Leveraged Finance & Restructuring", coverageSectors: ["High Yield", "Restructuring", "Distressed", "Special Situations"],
    school: "Columbia Business School", graduationYear: 2019, undergrad: "University of Pennsylvania", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "Penn → Columbia → Moelis Restructuring is an elite path — how do you leverage both alumni networks?",
      "Moelis's restructuring group is considered one of the best — how does the culture compare to HL or Lazard in distressed?",
      "The WeWork restructuring must have been a landmark case — what was the most complex aspect of the creditor dynamics?",
    ],
    personalStyle: "Sharp and credit-oriented. Penn-Columbia double alum makes her very network-accessible.",
    linkedinKeywords: ["moelis", "restructuring", "columbia", "penn"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "columbia-alum"],
  },
  {
    id: "moelis-003", firstName: "William", lastName: "Ng", email: email("william", "ng", "Moelis & Company"),
    firm: "Moelis & Company", title: "Associate", seniority: "associate", team: "Technology Advisory", coverageSectors: ["Software", "AI & Machine Learning", "Semiconductors", "Tech Infrastructure"],
    school: "Stanford GSB", graduationYear: 2022, undergrad: "MIT", location: "San Francisco, CA", city: "San Francisco",
    priority: "high", status: "not_contacted", fitScore: 89, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "MIT → Stanford GSB → Moelis Tech in SF — the engineering-to-banking path via Stanford must be powerful.",
      "AI and semiconductor M&A is the frontier of tech advisory — how is Moelis positioning in that emerging deal flow?",
      "The Synopsys / Ansys deal was the semiconductor EDA deal of the decade — what was the regulatory strategy?",
    ],
    personalStyle: "Technical and entrepreneurially-minded. MIT engineering precision meets GSB strategy. West Coast casual.",
    linkedinKeywords: ["moelis", "technology", "stanford", "MIT"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["tech-coverage", "stanford-alum", "mit-alum"],
  },
  {
    id: "moelis-004", firstName: "Sophia", lastName: "Martinez", email: email("sophia", "martinez", "Moelis & Company"),
    firm: "Moelis & Company", title: "Analyst", seniority: "analyst", team: "Mergers & Acquisitions", coverageSectors: ["Cross-Sector", "M&A Advisory"],
    school: "University of Notre Dame", graduationYear: 2024, undergrad: "University of Notre Dame", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[0]], icebreakers: [
      "Notre Dame → Moelis is one of ND's best IB placements — as a current ND student, your experience would be invaluable.",
      "Working as an analyst at one of the top independents must provide incredible deal exposure and responsibility.",
      "How does the Moelis analyst culture compare to what you expected going in from ND?",
    ],
    personalStyle: "ND-loyal, warm, and enthusiastic. Loves connecting with fellow Irish students. Very accessible via LinkedIn.",
    linkedinKeywords: ["moelis", "M&A", "notre dame", "analyst"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "notre-dame-alum"],
  },
  {
    id: "moelis-005", firstName: "Cameron", lastName: "Scott", email: email("cameron", "scott", "Moelis & Company"),
    firm: "Moelis & Company", title: "Director", seniority: "director", team: "Consumer & Retail", coverageSectors: ["Consumer", "Retail", "E-Commerce", "Food"],
    school: "Harvard Business School", graduationYear: 2010, undergrad: "Cornell University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 82, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals, icebreakers: [
      "Cornell → HBS → Moelis Consumer — how has the independent advisory model shaped how you advise consumer companies?",
      "The Kellanova / Mars deal is one for the record books — what made the auction process particularly complex?",
      "Retail restructuring vs. strategic M&A — are you seeing both ends of the spectrum in your current deal pipeline?",
    ],
    personalStyle: "Consumer brand enthusiast. Cornell and HBS networks both active. Values deal depth over generic networking.",
    linkedinKeywords: ["moelis", "consumer", "HBS", "cornell"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "hbs-alum"],
  },

  // ══════════════════════════════════════════════════
  // LAZARD
  // ══════════════════════════════════════════════════
  {
    id: "laz-001", firstName: "Evelyn", lastName: "Brooks", email: email("evelyn", "brooks", "Lazard"),
    firm: "Lazard", title: "Managing Director", seniority: "md", team: "Restructuring Advisory", coverageSectors: ["Distressed", "Bankruptcy", "Sovereign Restructuring", "Creditor Advisory"],
    school: "Wharton School", graduationYear: 2003, undergrad: "Yale University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 90, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "Lazard's restructuring group is legendary — you've worked on some of the most iconic debt restructurings in history.",
      "Yale → Wharton → Lazard Restructuring is the elite path in distressed advisory — I'm specifically targeting restructuring.",
      "Sovereign restructuring work (Argentina, Lebanon) must be completely different from corporate — how do you approach it?",
    ],
    personalStyle: "Elite and reserved. Expects candidates to understand restructuring deeply before reaching out. Values conciseness.",
    linkedinKeywords: ["lazard", "restructuring", "wharton", "yale"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "top-target", "wharton-alum"],
  },
  {
    id: "laz-002", firstName: "Benjamin", lastName: "Ross", email: email("benjamin", "ross", "Lazard"),
    firm: "Lazard", title: "Vice President", seniority: "vp", team: "M&A Advisory", coverageSectors: ["Cross-Border M&A", "European Transactions", "Strategic Advisory"],
    school: "INSEAD", graduationYear: 2018, undergrad: "London School of Economics", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[0]], icebreakers: [
      "LSE → INSEAD → Lazard M&A is the global elite advisory path — how does Lazard's international network differentiate it?",
      "Cross-border M&A with European regulatory complexity must be especially nuanced post-Brexit.",
      "Lazard's culture of independence — how does it shape the quality of strategic advice compared to BB advisory?",
    ],
    personalStyle: "Globally-minded, multilingual (French/Spanish). Values intellectual discussions about market strategy.",
    linkedinKeywords: ["lazard", "cross-border M&A", "INSEAD", "LSE"], timezone: "America/New_York", outreachHistory: [], tags: ["cross-border", "european-coverage"],
  },
  {
    id: "laz-003", firstName: "Alexandra", lastName: "Stone", email: email("alexandra", "stone", "Lazard"),
    firm: "Lazard", title: "Associate", seniority: "associate", team: "Healthcare Advisory", coverageSectors: ["Biopharma", "Medical Devices", "Healthcare Services"],
    school: "Harvard Business School", graduationYear: 2023, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 2), icebreakers: [
      "Princeton → HBS → Lazard Healthcare — the Princeton-HBS pipeline to Lazard is incredibly strong.",
      "Lazard healthcare advisory vs. the bulge brackets — how does the independent model serve pharma clients differently?",
      "The GLP-1 M&A wave is reshaping Big Pharma's pipeline strategy — what deals are you most excited about?",
    ],
    personalStyle: "Intellectually curious and Princeton-proud. Very engaged in HBS alumni network. Responsive to thoughtful emails.",
    linkedinKeywords: ["lazard", "healthcare", "HBS", "princeton"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "hbs-alum", "princeton-alum"],
  },
  {
    id: "laz-004", firstName: "Noah", lastName: "Patel", email: email("noah", "patel", "Lazard"),
    firm: "Lazard", title: "Analyst", seniority: "analyst", team: "M&A Advisory", coverageSectors: ["Cross-Sector M&A", "Strategic Advisory"],
    school: "University of Pennsylvania", graduationYear: 2024, undergrad: "University of Pennsylvania", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 94, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[0], consumerDeals[1]], icebreakers: [
      "Penn → Lazard M&A analyst is one of the most competitive placements from Penn — congrats on landing it.",
      "I'm a current Penn junior targeting elite boutiques like Lazard — any advice on differentiating in the recruiting process?",
      "Working at an independent advisory firm as an analyst — how does the deal exposure compare to BB M&A groups?",
    ],
    personalStyle: "Ambitious and Penn-proud. Very willing to help Penn undergrads. Quick email responder.",
    linkedinKeywords: ["lazard", "M&A", "penn", "upenn"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "penn-alum"],
  },
  {
    id: "laz-005", firstName: "Diana", lastName: "Chen", email: email("diana", "chen", "Lazard"),
    firm: "Lazard", title: "Director", seniority: "director", team: "Technology M&A", coverageSectors: ["Internet", "SaaS", "AI Infrastructure", "Tech Services"],
    school: "Chicago Booth", graduationYear: 2011, undergrad: "University of Chicago", location: "San Francisco, CA", city: "San Francisco",
    priority: "medium", status: "not_contacted", fitScore: 79, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "UChicago → Booth → Lazard Tech M&A in SF — the Chicago intellectual tradition applied to Silicon Valley deals.",
      "AI infrastructure M&A is the frontier deal flow in 2024-25 — how is Lazard positioning in the hyperscaler ecosystem?",
      "How does Lazard's SF tech office compare culturally to the NY headquarters?",
    ],
    personalStyle: "Analytically rigorous with Chicago economics influence. Appreciates smart macro-level thinking.",
    linkedinKeywords: ["lazard", "technology", "booth", "san francisco"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["tech-coverage", "booth-alum", "sf-office"],
  },

  // ══════════════════════════════════════════════════
  // EVERCORE
  // ══════════════════════════════════════════════════
  {
    id: "evc-001", firstName: "James", lastName: "Montgomery", email: email("james", "montgomery", "Evercore"),
    firm: "Evercore", title: "Senior Managing Director", seniority: "md", team: "Technology Advisory", coverageSectors: ["Software", "Internet", "Semiconductors", "Cloud Infrastructure"],
    school: "Harvard Business School", graduationYear: 2001, undergrad: "Harvard University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "Evercore's technology advisory practice is widely considered best-in-class among the elite independents.",
      "Harvard undergrad → HBS → Evercore is the classic credential-stacking path — how has the pure advisory model shaped your career?",
      "Cloud infrastructure M&A as AI accelerates — how is Evercore advising clients on the hyperscaler dependency risk?",
    ],
    personalStyle: "Highly selective. Harvard pedigree expects substantive conversation. Best reached via warm introduction.",
    linkedinKeywords: ["evercore", "technology", "HBS", "harvard"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "hbs-alum", "top-target"],
  },
  {
    id: "evc-002", firstName: "Charlotte", lastName: "Hayes", email: email("charlotte", "hayes", "Evercore"),
    firm: "Evercore", title: "Vice President", seniority: "vp", team: "Healthcare Advisory", coverageSectors: ["Biopharma", "Gene Therapy", "Medical Devices"],
    school: "Columbia Business School", graduationYear: 2019, undergrad: "Brown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals, icebreakers: [
      "Brown → Columbia → Evercore Healthcare is an elite path — how did your liberal arts background shape your banking approach?",
      "Gene therapy M&A is one of the most scientifically complex deal types — how do you build domain expertise?",
      "Evercore healthcare vs. Goldman or JPMorgan healthcare — what makes the independent advisory model superior for your clients?",
    ],
    personalStyle: "Intellectually curious with scientific depth. Brown-liberal arts to banking is a path she champions.",
    linkedinKeywords: ["evercore", "healthcare", "columbia", "brown"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "columbia-alum"],
  },
  {
    id: "evc-003", firstName: "Andrew", lastName: "Blake", email: email("andrew", "blake", "Evercore"),
    firm: "Evercore", title: "Associate", seniority: "associate", team: "M&A Advisory", coverageSectors: ["Cross-Sector M&A", "Activist Defense", "Contested M&A"],
    school: "Wharton School", graduationYear: 2022, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 90, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], techDeals[1]], icebreakers: [
      "Georgetown → Wharton → Evercore M&A is an impressive recruiting outcome — how did Wharton shape your banking preparation?",
      "Activist defense work must be some of the highest-pressure situations — how does Evercore position against proxy fights?",
      "The independent advisory model creates true alignment with clients — how does that shape day-to-day deal dynamics?",
    ],
    personalStyle: "Georgetown-connected and well-networked. Wharton made him highly analytical. Open to MBA outreach.",
    linkedinKeywords: ["evercore", "M&A", "wharton", "georgetown"], timezone: "America/New_York", outreachHistory: [], tags: ["generalist-ma", "wharton-alum"],
  },
  {
    id: "evc-004", firstName: "Isabella", lastName: "Turner", email: email("isabella", "turner", "Evercore"),
    firm: "Evercore", title: "Analyst", seniority: "analyst", team: "Consumer & Retail Advisory", coverageSectors: ["Consumer", "Retail", "Luxury", "Apparel"],
    school: "Cornell University", graduationYear: 2024, undergrad: "Cornell University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 92, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals, icebreakers: [
      "Cornell → Evercore Consumer is one of Cornell's best advisory placements — I'm a current Cornell junior targeting the same.",
      "Consumer M&A in 2024 has been extraordinary — what's driving the acceleration in luxury and apparel consolidation?",
      "As a first-year Evercore analyst, what's the biggest difference from what you expected going in?",
    ],
    personalStyle: "Ambitious and Cornell-proud. Very responsive to fellow Cornell students. Active on LinkedIn.",
    linkedinKeywords: ["evercore", "consumer", "cornell", "retail"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "cornell-alum"],
  },
  {
    id: "evc-005", firstName: "Marcus", lastName: "Webb", email: email("marcus", "webb", "Evercore"),
    firm: "Evercore", title: "Director", seniority: "director", team: "Restructuring Advisory", coverageSectors: ["Distressed", "Liability Management", "Chapter 11", "Out-of-Court"],
    school: "NYU Stern", graduationYear: 2010, undergrad: "University of Florida", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "University of Florida → NYU Stern → Evercore Restructuring is a non-target to elite boutique path that I find inspiring.",
      "Evercore's restructuring group has been growing rapidly — how has the 2024 default cycle affected deal volume?",
      "Liability management exercises (LMEs) vs. Chapter 11 — how do you advise clients on the right path?",
    ],
    personalStyle: "Self-made and approachable. Champions non-target school candidates. Loves mentoring underrepresented backgrounds.",
    linkedinKeywords: ["evercore", "restructuring", "NYU stern", "florida"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "nyu-alum"],
  },

  // ══════════════════════════════════════════════════
  // CENTERVIEW PARTNERS
  // ══════════════════════════════════════════════════
  {
    id: "cv-001", firstName: "Elizabeth", lastName: "Sterling", email: email("elizabeth", "sterling", "Centerview Partners"),
    firm: "Centerview Partners", title: "Partner", seniority: "partner", team: "M&A Advisory", coverageSectors: ["Generalist M&A", "Special Committee", "Strategic Advisory"],
    school: "Harvard Business School", graduationYear: 1999, undergrad: "Harvard University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[2], techDeals[1]], icebreakers: [
      "Centerview is arguably the most prestigious pure advisory firm — your perspective on why conflicts-free advice matters.",
      "Harvard undergrad → HBS → Centerview Partner is the absolute pinnacle of advisory banking careers.",
      "Centerview's deal quality (Kellanova, mega-cap M&A) — how does the firm select which mandates to pursue?",
    ],
    personalStyle: "Ultra-selective. Centerview culture demands excellence and discretion. Best via Harvard network connection.",
    linkedinKeywords: ["centerview", "M&A", "HBS", "harvard"], timezone: "America/New_York", outreachHistory: [], tags: ["top-target", "hbs-alum", "senior"],
  },
  {
    id: "cv-002", firstName: "Scott", lastName: "Davidson", email: email("scott", "davidson", "Centerview Partners"),
    firm: "Centerview Partners", title: "Vice President", seniority: "vp", team: "Consumer & Technology Advisory", coverageSectors: ["Consumer", "Technology", "Cross-Sector M&A"],
    school: "Wharton School", graduationYear: 2018, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 89, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[2], techDeals[0]], icebreakers: [
      "Princeton → Wharton → Centerview is the most elite IB recruiting outcome imaginable — I'm deeply studying this path.",
      "Centerview's Kellanova / Mars advisory was one of the best mandates in 2024 — how was that auction structured?",
      "What differentiates Centerview's culture from other elite boutiques like Lazard or PJT in terms of day-to-day?",
    ],
    personalStyle: "Princeton/Wharton pedigree but surprisingly accessible. Values genuine intellectual curiosity over prestige chasing.",
    linkedinKeywords: ["centerview", "M&A", "wharton", "princeton"], timezone: "America/New_York", outreachHistory: [], tags: ["top-target", "wharton-alum", "princeton-alum"],
  },
  {
    id: "cv-003", firstName: "Tiffany", lastName: "Nguyen", email: email("tiffany", "nguyen", "Centerview Partners"),
    firm: "Centerview Partners", title: "Associate", seniority: "associate", team: "M&A Advisory", coverageSectors: ["Technology", "Healthcare", "Generalist M&A"],
    school: "Stanford GSB", graduationYear: 2023, undergrad: "UCLA", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[0], healthcareDeals[0]], icebreakers: [
      "UCLA → Stanford GSB → Centerview — that's an incredible non-traditional path into the most selective boutique.",
      "Centerview as an associate must provide extraordinary deal flow and responsibility given the lean team structure.",
      "West Coast background to NY Centerview — how did you navigate the geographic and cultural transition?",
    ],
    personalStyle: "Driven and accessible despite elite firm. UCLA pride and Stanford GSB network both active.",
    linkedinKeywords: ["centerview", "M&A", "stanford", "UCLA"], timezone: "America/New_York", outreachHistory: [], tags: ["top-target", "stanford-alum", "ucla-alum"],
  },

  // ══════════════════════════════════════════════════
  // JEFFERIES
  // ══════════════════════════════════════════════════
  {
    id: "jef-001", firstName: "Colin", lastName: "Brady", email: email("colin", "brady", "Jefferies"),
    firm: "Jefferies", title: "Managing Director", seniority: "md", team: "Technology Investment Banking", coverageSectors: ["Software", "Cybersecurity", "Tech-Enabled Services"],
    school: "Dartmouth Tuck", graduationYear: 2009, undergrad: "Dartmouth College", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 81, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "Jefferies has built one of the best technology banking franchises among the non-BB shops — impressive market share gains.",
      "Dartmouth undergrad → Tuck → Jefferies — how has the Tuck small-town MBA experience shaped your approach to banking?",
      "Cybersecurity M&A in 2024 — with platform vs. point solution consolidation accelerating, how are you advising boards?",
    ],
    personalStyle: "Dartmouth outdoorsy culture meets deal-hungry Jefferies. Warm and accessible. Tuck network very active.",
    linkedinKeywords: ["jefferies", "technology", "tuck", "dartmouth"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "dartmouth-alum"],
  },
  {
    id: "jef-002", firstName: "Alexis", lastName: "Cooper", email: email("alexis", "cooper", "Jefferies"),
    firm: "Jefferies", title: "Vice President", seniority: "vp", team: "Leveraged Finance", coverageSectors: ["High Yield Bonds", "Leveraged Loans", "LBO Financing", "Middle Market"],
    school: "NYU Stern", graduationYear: 2016, undergrad: "Fordham University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 74, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2], finServicesDeals[1]], icebreakers: [
      "Fordham → NYU Stern → Jefferies Lev Fin — that's a classic New York City non-target to finance success story.",
      "Jefferies is a lev fin powerhouse — how has your deal flow changed as rates have normalized from the 2022 highs?",
      "Middle market leveraged lending vs. large cap syndicated — how do you think about those two segments of the market?",
    ],
    personalStyle: "NYC-native and down-to-earth. Champions non-target candidates. Very open to Fordham and NYU outreach.",
    linkedinKeywords: ["jefferies", "leveraged finance", "NYU stern", "fordham"], timezone: "America/New_York", outreachHistory: [], tags: ["lev-fin", "non-target-champion"],
  },
  {
    id: "jef-003", firstName: "Derek", lastName: "Shah", email: email("derek", "shah", "Jefferies"),
    firm: "Jefferies", title: "Associate", seniority: "associate", team: "Healthcare Investment Banking", coverageSectors: ["Specialty Pharma", "Contract Manufacturing", "Healthcare Services"],
    school: "Columbia Business School", graduationYear: 2022, undergrad: "Rutgers University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 79, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(1, 3), icebreakers: [
      "Rutgers → Columbia → Jefferies Healthcare is a great non-target undergrad to top MBA to banking path.",
      "Jefferies healthcare banking has been very active in specialty pharma M&A — what's driving deal volume?",
      "Columbia Business School to Jefferies — how did the MBA recruiting process compare to undergrad recruiting?",
    ],
    personalStyle: "Humble and helpful. Rutgers gives him a non-target empathy. Will respond to Rutgers and NJ-area students.",
    linkedinKeywords: ["jefferies", "healthcare", "columbia", "rutgers"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "columbia-alum"],
  },
  {
    id: "jef-004", firstName: "Monica", lastName: "Reeves", email: email("monica", "reeves", "Jefferies"),
    firm: "Jefferies", title: "Analyst", seniority: "analyst", team: "Consumer Investment Banking", coverageSectors: ["Beauty", "Personal Care", "Consumer Brands", "DTC"],
    school: "University of Michigan", graduationYear: 2024, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals.slice(1, 3), icebreakers: [
      "Michigan → Jefferies Consumer is a strong placement — as a current Michigan student, your advice would be very helpful.",
      "Beauty and personal care M&A has been active — how do you approach valuing brand equity vs. revenue multiples?",
      "What surprised you most about the Jefferies analyst experience compared to what you expected at Michigan?",
    ],
    personalStyle: "Michigan-proud and warm. Very open to helping fellow Michigan students navigate recruiting.",
    linkedinKeywords: ["jefferies", "consumer", "michigan", "beauty"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "michigan-alum"],
  },

  // ══════════════════════════════════════════════════
  // PJT PARTNERS
  // ══════════════════════════════════════════════════
  {
    id: "pjt-001", firstName: "Victoria", lastName: "Spencer", email: email("victoria", "spencer", "PJT Partners"),
    firm: "PJT Partners", title: "Managing Director", seniority: "md", team: "Strategic Advisory", coverageSectors: ["Cross-Sector M&A", "Activist Defense", "Special Situations", "Board Advisory"],
    school: "Harvard Business School", graduationYear: 2005, undergrad: "Yale University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 92, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[2], techDeals[0]], icebreakers: [
      "PJT's strategic advisory model is truly unique — genuinely conflict-free advice at the board level is rare.",
      "Yale → HBS → PJT MD is an extraordinary career path — how did the Blackstone / Park Hill separation shape PJT's culture?",
      "Activist defense has become a core capability — how has the Elliott / Carl Icahn wave of 2024 affected your workload?",
    ],
    personalStyle: "Boardroom presence and strategic gravitas. Yale / HBS double alum makes network very rich. Very selective.",
    linkedinKeywords: ["PJT partners", "strategic advisory", "HBS", "yale"], timezone: "America/New_York", outreachHistory: [], tags: ["top-target", "hbs-alum", "activist-defense"],
  },
  {
    id: "pjt-002", firstName: "Geoffrey", lastName: "Coleman", email: email("geoffrey", "coleman", "PJT Partners"),
    firm: "PJT Partners", title: "Vice President", seniority: "vp", team: "Restructuring & Special Situations", coverageSectors: ["Distressed", "Chapter 11", "Out-of-Court", "Liability Management"],
    school: "Columbia Business School", graduationYear: 2018, undergrad: "University of Virginia", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 86, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals.slice(0, 2), icebreakers: [
      "UVA → Columbia → PJT Restructuring is a path I'm targeting — PJT's RSSG is considered elite alongside Lazard.",
      "The WeWork restructuring was a landmark case — how did PJT approach the creditor-debtor dynamics?",
      "Liability management vs. formal Chapter 11 — how do you advise issuers on the optimal path given current market conditions?",
    ],
    personalStyle: "UVA Wahoo pride, collegial and smart. Columbia made him analytically rigorous. Open to UVA alumni conversations.",
    linkedinKeywords: ["PJT partners", "restructuring", "columbia", "UVA"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "columbia-alum", "uva-alum"],
  },
  {
    id: "pjt-003", firstName: "Caitlin", lastName: "Walsh", email: email("caitlin", "walsh", "PJT Partners"),
    firm: "PJT Partners", title: "Associate", seniority: "associate", team: "Strategic Advisory", coverageSectors: ["Technology", "Healthcare", "Cross-Sector M&A"],
    school: "Wharton School", graduationYear: 2022, undergrad: "Notre Dame", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 90, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[0], healthcareDeals[0]], icebreakers: [
      "Notre Dame → Wharton → PJT is one of the best elite boutique placements from Wharton's MBA class.",
      "PJT's culture of elite strategic advice — how does it compare culturally to Evercore or Centerview in the boutique landscape?",
      "I'm an ND student targeting Wharton → elite boutique — your path is exactly what I'm mapping toward.",
    ],
    personalStyle: "Notre Dame loyal and highly achieved. Will respond to both ND and Wharton outreach enthusiastically.",
    linkedinKeywords: ["PJT partners", "strategic advisory", "wharton", "notre dame"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "notre-dame-alum", "wharton-alum"],
  },

  // ══════════════════════════════════════════════════
  // PERELLA WEINBERG
  // ══════════════════════════════════════════════════
  {
    id: "pw-001", firstName: "Jonathan", lastName: "Marsh", email: email("jonathan", "marsh", "Perella Weinberg"),
    firm: "Perella Weinberg", title: "Partner", seniority: "partner", team: "M&A Advisory", coverageSectors: ["Energy", "Natural Resources", "Cross-Border"],
    school: "Harvard Business School", graduationYear: 2003, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [energyDeals[0], energyDeals[1]], icebreakers: [
      "Perella Weinberg's energy advisory practice has been critical in the 2024 mega-merger cycle — Chevron/Hess must have been complex.",
      "Princeton → HBS → PWP Partner is the path I'm aspiring to — how has independent advisory shaped your career satisfaction?",
      "Cross-border energy M&A with international asset exposure (Guyana) adds regulatory complexity — how do you navigate CFIUS?",
    ],
    personalStyle: "Partner-level gravitas. Princeton and HBS networks deeply active. Values extremely well-prepared outreach.",
    linkedinKeywords: ["perella weinberg", "energy", "HBS", "princeton"], timezone: "America/New_York", outreachHistory: [], tags: ["energy-coverage", "hbs-alum", "top-target"],
  },
  {
    id: "pw-002", firstName: "Gabrielle", lastName: "Laurent", email: email("gabrielle", "laurent", "Perella Weinberg"),
    firm: "Perella Weinberg", title: "Vice President", seniority: "vp", team: "M&A Advisory", coverageSectors: ["Technology", "Media", "Cross-Sector M&A"],
    school: "NYU Stern", graduationYear: 2017, undergrad: "NYU", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 77, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[2], consumerDeals[0]], icebreakers: [
      "NYU undergrad → Stern → Perella Weinberg — how did you navigate recruiting from NYU into elite boutiques?",
      "PWP's media and tech M&A is an interesting niche — how has streaming consolidation affected your deal flow?",
      "As an NYU student myself, your path from Stern to PWP is a recruiting story I'd love to learn more about.",
    ],
    personalStyle: "NYC-local and grounded. NYU loyalty strong. Very willing to help NYU students in finance.",
    linkedinKeywords: ["perella weinberg", "M&A", "NYU stern", "technology"], timezone: "America/New_York", outreachHistory: [], tags: ["nyu-alum", "tech-coverage"],
  },

  // ══════════════════════════════════════════════════
  // RBC CAPITAL MARKETS
  // ══════════════════════════════════════════════════
  {
    id: "rbc-001", firstName: "Kevin", lastName: "MacLeod", email: email("kevin", "macleod", "RBC Capital Markets"),
    firm: "RBC Capital Markets", title: "Managing Director", seniority: "md", team: "Industrials & Clean Energy", coverageSectors: ["Industrials", "Clean Energy", "Manufacturing", "Defense"],
    school: "Queen's University", graduationYear: 2006, undergrad: "Queen's University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 72, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: industrialsDeals, icebreakers: [
      "RBC's industrials and clean energy practice has been growing impressively — how is the IRA driving deal flow?",
      "Queen's University has a very strong Bay Street to Wall Street pipeline — how did you make the jump to New York?",
      "Clean energy M&A with IRA tailwinds — are you seeing more strategic buyers or infrastructure PE in that space?",
    ],
    personalStyle: "Canadian-humble and straight-talking. Queen's loyalty strong. Appreciates non-pretentious outreach.",
    linkedinKeywords: ["RBC capital markets", "industrials", "clean energy", "queens"], timezone: "America/New_York", outreachHistory: [], tags: ["industrials-coverage", "clean-energy"],
  },
  {
    id: "rbc-002", firstName: "Jennifer", lastName: "Wu", email: email("jennifer", "wu", "RBC Capital Markets"),
    firm: "RBC Capital Markets", title: "Vice President", seniority: "vp", team: "Healthcare Investment Banking", coverageSectors: ["Biotech", "Medtech", "Diagnostics", "Healthcare Services"],
    school: "McGill University", graduationYear: 2015, undergrad: "McGill University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 74, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 3), icebreakers: [
      "McGill → RBC Healthcare IB in New York — how does RBC's healthcare franchise compete with the top-tier BB and boutique shops?",
      "The biotech deal market has been bifurcated — what's driving the divergence between large-cap and small-cap biotech M&A?",
      "As a Canadian firm with strong US healthcare coverage, how does RBC's cross-border positioning help clients?",
    ],
    personalStyle: "Bilingual (French/English), analytical, and warm. McGill alumni network active in NY finance.",
    linkedinKeywords: ["RBC capital markets", "healthcare", "mcgill", "biotech"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "canadian-network"],
  },
  {
    id: "rbc-003", firstName: "Peter", lastName: "Hamilton", email: email("peter", "hamilton", "RBC Capital Markets"),
    firm: "RBC Capital Markets", title: "Associate", seniority: "associate", team: "Technology Investment Banking", coverageSectors: ["Software", "Cloud", "Cybersecurity", "IT Services"],
    school: "Ivey Business School", graduationYear: 2021, undergrad: "Western University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(1, 4), icebreakers: [
      "Western / Ivey → RBC Technology IB is a classic Canadian pipeline to Wall Street — how did you navigate getting to NYC?",
      "Cybersecurity M&A has been booming — how does RBC's tech practice compete for mandates with Goldman or JPMorgan TMT?",
      "The Ivey Business School case method must be excellent prep for IB modeling — how did it translate in practice?",
    ],
    personalStyle: "Canadian-to-NYC success story. Ivey case method background makes him analytical. Helpful to Canadian students.",
    linkedinKeywords: ["RBC capital markets", "technology", "ivey", "western"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "canadian-network"],
  },

  // ══════════════════════════════════════════════════
  // BARCLAYS
  // ══════════════════════════════════════════════════
  {
    id: "barc-001", firstName: "Edward", lastName: "Thompson", email: email("edward", "thompson", "Barclays"),
    firm: "Barclays", title: "Managing Director", seniority: "md", team: "Financial Sponsors", coverageSectors: ["PE Coverage", "LBO Financing", "Sponsor M&A"],
    school: "London Business School", graduationYear: 2005, undergrad: "Oxford University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 77, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals, icebreakers: [
      "Oxford → LBS → Barclays Financial Sponsors is the quintessential UK banking path that traveled to Wall Street.",
      "PE coverage must give incredible insight into the entire deal ecosystem — which sponsors are you most active with?",
      "Barclays competes aggressively in sponsor-backed financings — how does the UK bank culture translate in New York?",
    ],
    personalStyle: "British-formal but globally-minded. Oxford network very active. Responds to smart, concise outreach.",
    linkedinKeywords: ["barclays", "financial sponsors", "LBS", "oxford"], timezone: "America/New_York", outreachHistory: [], tags: ["financial-sponsors", "uk-network"],
  },
  {
    id: "barc-002", firstName: "Samantha", lastName: "Foster", email: email("samantha", "foster", "Barclays"),
    firm: "Barclays", title: "Vice President", seniority: "vp", team: "Consumer & Healthcare", coverageSectors: ["Consumer", "Healthcare Services", "Retail"],
    school: "Wharton School", graduationYear: 2018, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], healthcareDeals[2]], icebreakers: [
      "Michigan → Wharton → Barclays Consumer/Healthcare — how does Barclays' combined consumer-healthcare coverage work?",
      "The cross-sector consumer/healthcare deals are interesting — how do you navigate building expertise across both sectors?",
      "Barclays UK perspective on US consumer M&A — does the international angle help with cross-border deal positioning?",
    ],
    personalStyle: "Accessible and mentorship-oriented. Michigan alumni very engaged. Will respond to Michigan students.",
    linkedinKeywords: ["barclays", "consumer", "wharton", "michigan"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "wharton-alum", "michigan-alum"],
  },
  {
    id: "barc-003", firstName: "Michael", lastName: "Dawson", email: email("michael", "dawson", "Barclays"),
    firm: "Barclays", title: "Associate", seniority: "associate", team: "Technology M&A", coverageSectors: ["Software", "Internet", "AI", "SaaS"],
    school: "Columbia Business School", graduationYear: 2022, undergrad: "Boston University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 2), icebreakers: [
      "BU → Columbia → Barclays Tech M&A — how did the non-target undergrad affect your recruiting approach to Columbia?",
      "AI company M&A is the hottest space — how is Barclays positioning in advising AI startups and acquirers?",
      "Columbia CBS has a strong IB recruiting program — how did you leverage the network to land at Barclays?",
    ],
    personalStyle: "Hardworking and scrappy. Boston University to Columbia story resonates with non-target students.",
    linkedinKeywords: ["barclays", "technology", "columbia", "boston university"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "columbia-alum"],
  },
  {
    id: "barc-004", firstName: "Lindsay", lastName: "Morgan", email: email("lindsay", "morgan", "Barclays"),
    firm: "Barclays", title: "Analyst", seniority: "analyst", team: "Leveraged Finance", coverageSectors: ["High Yield", "Leveraged Loans", "CLOs", "Structured Credit"],
    school: "Georgetown University", graduationYear: 2024, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2]], icebreakers: [
      "Georgetown → Barclays Lev Fin is a strong placement — I'm a current Georgetown student targeting credit/lev fin specifically.",
      "CLO structure and leveraged loan mechanics must be fascinating — how technical does the Barclays lev fin analyst role get?",
      "What was the most useful preparation you did at Georgetown for the Barclays lev fin role?",
    ],
    personalStyle: "Georgetown-loyal and very willing to help fellow Hoyas. Quick email responder. Open to informational chats.",
    linkedinKeywords: ["barclays", "leveraged finance", "georgetown", "high yield"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "lev-fin", "georgetown-alum"],
  },

  // ══════════════════════════════════════════════════
  // BANK OF AMERICA MERRILL LYNCH
  // ══════════════════════════════════════════════════
  {
    id: "bofa-001", firstName: "Gregory", lastName: "Andrews", email: email("gregory", "andrews", "Bank of America"),
    firm: "Bank of America", title: "Managing Director", seniority: "md", team: "Global Technology Banking", coverageSectors: ["Software", "Internet", "Semiconductor", "Technology Hardware"],
    school: "Harvard Business School", graduationYear: 2007, undergrad: "Dartmouth College", location: "San Francisco, CA", city: "San Francisco",
    priority: "high", status: "not_contacted", fitScore: 83, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals, icebreakers: [
      "BofA's global technology banking practice in SF has excellent deal flow given proximity to the Valley.",
      "Dartmouth → HBS → BofA TMT MD — how did the HBS network shape your positioning vs. competing on Wall Street?",
      "Semiconductor M&A (Synopsys/Ansys, Intel) must be a major focus — how does BofA approach regulatory risk modeling?",
    ],
    personalStyle: "SF casual meets Wall Street institutional. Dartmouth outdoorsy culture. Active speaker at tech conferences.",
    linkedinKeywords: ["bank of america", "technology", "HBS", "dartmouth"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["tech-coverage", "hbs-alum", "sf-office"],
  },
  {
    id: "bofa-002", firstName: "Sandra", lastName: "Kim", email: email("sandra", "kim", "Bank of America"),
    firm: "Bank of America", title: "Director", seniority: "director", team: "Healthcare Investment Banking", coverageSectors: ["Large-Cap Pharma", "Biotech", "Medical Devices"],
    school: "Columbia Business School", graduationYear: 2013, undergrad: "Duke University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(0, 3), icebreakers: [
      "Duke → Columbia → BofA Healthcare — how has large-cap pharma M&A evolved as the GLP-1 wave reshapes the industry?",
      "BofA's healthcare franchise competes directly with Goldman and JPMorgan — what gives BofA its competitive edge?",
      "Medical device M&A has been active (J&J/Shockwave) — how do you approach the FDA regulatory risk in deal modeling?",
    ],
    personalStyle: "Duke Blue Devil pride. Columbia analytical rigor. Strong healthcare domain expertise. Mentors diverse candidates.",
    linkedinKeywords: ["bank of america", "healthcare", "columbia", "duke"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "columbia-alum", "duke-alum"],
  },
  {
    id: "bofa-003", firstName: "Jonathan", lastName: "Rivera", email: email("jonathan", "rivera", "Bank of America"),
    firm: "Bank of America", title: "Vice President", seniority: "vp", team: "Energy, Power & Utilities", coverageSectors: ["E&P", "Utilities", "Power Generation", "Renewables"],
    school: "University of Texas McCombs", graduationYear: 2016, undergrad: "University of Texas at Austin", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 73, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals, icebreakers: [
      "UT Austin → McCombs → BofA Energy Houston is the classic Texas energy IB path — I'm a UT student targeting energy banking.",
      "The ExxonMobil / Pioneer mega-deal and BofA's energy deals in 2024 have been extraordinary — what drove that activity?",
      "Renewable energy advisory vs. traditional E&P — how is BofA positioning across the energy transition spectrum?",
    ],
    personalStyle: "Texas longhorn proud. Houston-based energy community deeply embedded. Very open to UT student outreach.",
    linkedinKeywords: ["bank of america", "energy", "UT austin", "houston"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston", "ut-alum"],
  },
  {
    id: "bofa-004", firstName: "Brittany", lastName: "Lewis", email: email("brittany", "lewis", "Bank of America"),
    firm: "Bank of America", title: "Associate", seniority: "associate", team: "Financial Sponsors Group", coverageSectors: ["Buyout", "Growth Equity", "PE Coverage"],
    school: "Wharton School", graduationYear: 2023, undergrad: "Spelman College", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals, icebreakers: [
      "Spelman → Wharton → BofA Financial Sponsors — your path champions HBCU-to-elite-banking as an inspiring model.",
      "BofA's FSG has excellent PE client relationships — how does the coverage model differ from Goldman's FSG approach?",
      "As a Wharton alum passionate about diversity, how do you mentor underrepresented students in IB recruiting?",
    ],
    personalStyle: "HBCU champion and diversity advocate. Wharton made her analytically elite. Very open to HBCU student outreach.",
    linkedinKeywords: ["bank of america", "financial sponsors", "wharton", "spelman"], timezone: "America/New_York", outreachHistory: [], tags: ["financial-sponsors", "wharton-alum", "diversity-champion"],
  },
  {
    id: "bofa-005", firstName: "Timothy", lastName: "Clarke", email: email("timothy", "clarke", "Bank of America"),
    firm: "Bank of America", title: "Analyst", seniority: "analyst", team: "Consumer & Retail Investment Banking", coverageSectors: ["Food & Beverage", "Consumer Products", "Retail", "E-Commerce"],
    school: "University of Virginia", graduationYear: 2024, undergrad: "University of Virginia", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 89, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: consumerDeals, icebreakers: [
      "UVA → BofA Consumer is a strong Wahoo pipeline — I'm a current UVA student targeting consumer banking specifically.",
      "Working on the Kellanova / Mars and other consumer megadeals as an analyst must be extraordinary.",
      "What was the most important thing you did at UVA to prepare for the BofA recruiting process?",
    ],
    personalStyle: "UVA Wahoo pride and collegial. Very helpful to fellow UVA students. Will respond to LinkedIn messages.",
    linkedinKeywords: ["bank of america", "consumer", "UVA", "virginia"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "uva-alum"],
  },

  // ══════════════════════════════════════════════════
  // CITI
  // ══════════════════════════════════════════════════
  {
    id: "citi-001", firstName: "Daniel", lastName: "Hoffman", email: email("daniel", "hoffman", "Citi"),
    firm: "Citi", title: "Managing Director", seniority: "md", team: "Industrials Investment Banking", coverageSectors: ["Aerospace & Defense", "Industrials", "Transportation", "Logistics"],
    school: "MIT Sloan", graduationYear: 2006, undergrad: "MIT", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: industrialsDeals, icebreakers: [
      "MIT engineering → Sloan → Citi Industrials is a STEM-to-banking path that I'm studying closely.",
      "Defense M&A has accelerated dramatically post-geopolitical tension — how is Citi's coverage positioned in this environment?",
      "Aerospace supply chain M&A (Spirit, Wesco) — how do you model the integration risk for Boeing and Airbus supplier deals?",
    ],
    personalStyle: "MIT technical precision meets Wall Street. Values candidates who can engage on engineering-economics overlap.",
    linkedinKeywords: ["citi", "industrials", "MIT sloan", "aerospace"], timezone: "America/New_York", outreachHistory: [], tags: ["industrials-coverage", "mit-alum"],
  },
  {
    id: "citi-002", firstName: "Rebecca", lastName: "Chen", email: email("rebecca", "chen", "Citi"),
    firm: "Citi", title: "Vice President", seniority: "vp", team: "Financial Institutions Group", coverageSectors: ["Banks", "Asset Management", "Insurance", "FinTech"],
    school: "Columbia Business School", graduationYear: 2017, undergrad: "Columbia University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 74, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals, icebreakers: [
      "Columbia undergrad → CBS → Citi FIG — how does the undergraduate-to-MBA-at-same-school path work in practice?",
      "The Capital One / Discover deal is reshaping the payments landscape — how did Citi navigate being a competitor yet advisor?",
      "FIG advisory on bank M&A has gotten complex post-SVB — how are you advising community banks on strategic options?",
    ],
    personalStyle: "New York City native. Columbia loyalty very strong (undergrad + MBA). Accessible and network-oriented.",
    linkedinKeywords: ["citi", "FIG", "columbia", "financial institutions"], timezone: "America/New_York", outreachHistory: [], tags: ["fig-coverage", "columbia-alum"],
  },
  {
    id: "citi-003", firstName: "Marcus", lastName: "Green", email: email("marcus", "green", "Citi"),
    firm: "Citi", title: "Associate", seniority: "associate", team: "Leveraged Finance", coverageSectors: ["High Yield", "Leveraged Loans", "CLOs", "Credit"],
    school: "NYU Stern", graduationYear: 2021, undergrad: "Howard University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 80, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2], finServicesDeals[1]], icebreakers: [
      "Howard University → NYU Stern → Citi Lev Fin is an incredibly powerful HBCU-to-elite-banking success story.",
      "Credit markets in 2024 have been fascinating — how are CLO structures evolving given higher rates?",
      "Your path championing HBCU talent in finance — how are you mentoring the next generation of Howard students?",
    ],
    personalStyle: "Howard University pride and diversity champion. NYU Stern made him credit-rigorous. Very open to HBCU mentorship.",
    linkedinKeywords: ["citi", "leveraged finance", "NYU stern", "howard"], timezone: "America/New_York", outreachHistory: [], tags: ["lev-fin", "diversity-champion", "hbcu-alum"],
  },
  {
    id: "citi-004", firstName: "Kaitlyn", lastName: "Price", email: email("kaitlyn", "price", "Citi"),
    firm: "Citi", title: "Analyst", seniority: "analyst", team: "Technology Investment Banking", coverageSectors: ["Software", "Internet", "Digital Media"],
    school: "Princeton University", graduationYear: 2024, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "Princeton → Citi Technology Banking — as a current Princeton student targeting TMT IB, your recruiting advice is invaluable.",
      "Citi's tech investment banking in NYC must have great deal flow from the east coast tech ecosystem.",
      "What was your biggest insight from the Citi summer analyst program that helped you convert to a full-time offer?",
    ],
    personalStyle: "Princeton-proud and ambitious. Very willing to help fellow Princeton students. Quick LinkedIn responder.",
    linkedinKeywords: ["citi", "technology", "princeton", "investment banking"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "princeton-alum"],
  },

  // ══════════════════════════════════════════════════
  // GUGGENHEIM SECURITIES
  // ══════════════════════════════════════════════════
  {
    id: "gugg-001", firstName: "Richard", lastName: "Stern", email: email("richard", "stern", "Guggenheim"),
    firm: "Guggenheim", title: "Managing Director", seniority: "md", team: "Healthcare Investment Banking", coverageSectors: ["Specialty Pharma", "Biotech", "Diagnostics", "CRO"],
    school: "University of Chicago Booth", graduationYear: 2007, undergrad: "University of Chicago", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 84, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals, icebreakers: [
      "Guggenheim's healthcare franchise is surprisingly strong for its size — what makes the firm competitive against BB shops?",
      "UChicago → Booth → Guggenheim is a very Chicago path — how has the Chicago intellectual tradition shaped your deal approach?",
      "Specialty pharma M&A is complex with patent cliff dynamics — how do you model pipeline value in those transactions?",
    ],
    personalStyle: "Chicago intellectual rigor. Values depth and precision. Appreciated by students who demonstrate mastery.",
    linkedinKeywords: ["guggenheim", "healthcare", "booth", "chicago"], timezone: "America/Chicago", outreachHistory: [], tags: ["healthcare-coverage", "booth-alum", "chicago"],
  },
  {
    id: "gugg-002", firstName: "Patricia", lastName: "Wells", email: email("patricia", "wells", "Guggenheim"),
    firm: "Guggenheim", title: "Vice President", seniority: "vp", team: "Technology & Disruptive Commerce", coverageSectors: ["E-Commerce", "Marketplace", "Consumer Tech", "Payments"],
    school: "Northwestern Kellogg", graduationYear: 2018, undergrad: "University of Illinois", location: "Chicago, IL", city: "Chicago",
    priority: "medium", status: "not_contacted", fitScore: 76, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[3], consumerDeals[2]], icebreakers: [
      "UIUC → Kellogg → Guggenheim Tech — Illinois has a strong pipeline to Chicago boutiques that I'm exploring.",
      "E-commerce and marketplace M&A — how has the post-SPAC hangover affected deal activity in that space?",
      "Guggenheim's 'Disruptive Commerce' practice is an interesting niche — how do you define that coverage universe?",
    ],
    personalStyle: "Chicago-rooted and accessible. Kellogg alumni network active. Helpful to Illinois school candidates.",
    linkedinKeywords: ["guggenheim", "technology", "kellogg", "illinois"], timezone: "America/Chicago", outreachHistory: [], tags: ["tech-coverage", "kellogg-alum", "uiuc-alum"],
  },
  {
    id: "gugg-003", firstName: "Nathan", lastName: "Cooper", email: email("nathan", "cooper", "Guggenheim"),
    firm: "Guggenheim", title: "Associate", seniority: "associate", team: "Restructuring", coverageSectors: ["Distressed", "Restructuring", "Credit Advisory"],
    school: "Columbia Business School", graduationYear: 2022, undergrad: "University of Notre Dame", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals.slice(1, 3), icebreakers: [
      "Notre Dame → Columbia → Guggenheim Restructuring — how does Guggenheim compete with Lazard and HL in the distressed space?",
      "Restructuring deal volume in 2024 with the maturity wall — how busy has your team been relative to expectations?",
      "As an ND alum, how did Mendoza's curriculum prepare you for restructuring advisory work at Guggenheim?",
    ],
    personalStyle: "Notre Dame loyal and hardworking. Columbia made him credit-analytical. Very open to ND alumni outreach.",
    linkedinKeywords: ["guggenheim", "restructuring", "columbia", "notre dame"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "restructuring", "notre-dame-alum"],
  },

  // ══════════════════════════════════════════════════
  // ROTHSCHILD
  // ══════════════════════════════════════════════════
  {
    id: "roth-001", firstName: "Francois", lastName: "Dubois", email: email("francois", "dubois", "Rothschild"),
    firm: "Rothschild", title: "Managing Director", seniority: "md", team: "Global Advisory", coverageSectors: ["Cross-Border M&A", "European M&A", "Sovereign Advisory"],
    school: "Sciences Po Paris", graduationYear: 2005, undergrad: "HEC Paris", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 71, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[0], energyDeals[0]], icebreakers: [
      "Rothschild's global advisory franchise and European heritage gives it a unique cross-border positioning.",
      "HEC Paris → Sciences Po → Rothschild Global Advisory is the elite Parisian-to-NY banking path.",
      "European M&A in 2024 with energy transition and regulatory pressures — how has Rothschild's deal flow shifted?",
    ],
    personalStyle: "French-intellectual and globally sophisticated. Values candidates who understand European market dynamics.",
    linkedinKeywords: ["rothschild", "global advisory", "HEC paris", "cross-border"], timezone: "America/New_York", outreachHistory: [], tags: ["cross-border", "european-coverage"],
  },
  {
    id: "roth-002", firstName: "Clara", lastName: "Hartmann", email: email("clara", "hartmann", "Rothschild"),
    firm: "Rothschild", title: "Vice President", seniority: "vp", team: "Restructuring Advisory", coverageSectors: ["Distressed", "European Restructuring", "Sovereign Debt"],
    school: "London Business School", graduationYear: 2017, undergrad: "King's College London", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 73, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "King's College London → LBS → Rothschild Restructuring — the London-to-New York banking path for restructuring specialists.",
      "European sovereign debt restructuring (Greece, Sri Lanka) is a unique Rothschild specialty — how does it differ from corporate?",
      "UK banking culture in a US boutique environment — how do you navigate the cultural differences?",
    ],
    personalStyle: "European-analytical and precise. London financial culture adapted for New York market realities.",
    linkedinKeywords: ["rothschild", "restructuring", "LBS", "london"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "uk-network"],
  },

  // ══════════════════════════════════════════════════
  // DEUTSCHE BANK
  // ══════════════════════════════════════════════════
  {
    id: "db-001", firstName: "Stefan", lastName: "Mueller", email: email("stefan", "mueller", "Deutsche Bank"),
    firm: "Deutsche Bank", title: "Director", seniority: "director", team: "Technology Investment Banking", coverageSectors: ["Software", "IT Services", "European Tech"],
    school: "INSEAD", graduationYear: 2012, undergrad: "Technische Universität München", location: "New York, NY", city: "New York",
    priority: "low", status: "not_contacted", fitScore: 65, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(1, 3), icebreakers: [
      "TU Munich → INSEAD → Deutsche Bank Technology — the European-to-global banking trajectory is one I'm studying.",
      "Deutsche Bank's technology practice competes with US banks for European tech M&A — how do you position against Goldman or MS?",
      "INSEAD is truly global — how has having classmates from 80+ countries shaped your approach to cross-border deals?",
    ],
    personalStyle: "German-methodical and internationally minded. INSEAD network spans 80 countries. Values precision and depth.",
    linkedinKeywords: ["deutsche bank", "technology", "INSEAD", "european"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "european-coverage"],
  },
  {
    id: "db-002", firstName: "Anna", lastName: "Richter", email: email("anna", "richter", "Deutsche Bank"),
    firm: "Deutsche Bank", title: "Vice President", seniority: "vp", team: "Leveraged Finance & DCM", coverageSectors: ["High Yield", "Investment Grade", "Leveraged Loans"],
    school: "Frankfurt School of Finance", graduationYear: 2015, undergrad: "Goethe University Frankfurt", location: "New York, NY", city: "New York",
    priority: "low", status: "not_contacted", fitScore: 63, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [industrialsDeals[2], finServicesDeals[0]], icebreakers: [
      "Goethe → Frankfurt School → Deutsche Bank Lev Fin is a very European banking path that ended up in NYC.",
      "European investment grade vs. US high yield — how do the market microstructures differ in your day-to-day work?",
      "Deutsche Bank's DCM franchise is strong — how does the firm compete with the US houses for European issuer mandates?",
    ],
    personalStyle: "German-precise and quietly confident. Frankfurt banking culture well adapted for NY. Values substance.",
    linkedinKeywords: ["deutsche bank", "leveraged finance", "DCM", "european"], timezone: "America/New_York", outreachHistory: [], tags: ["lev-fin", "european-coverage"],
  },

  // ══════════════════════════════════════════════════
  // WELLS FARGO SECURITIES
  // ══════════════════════════════════════════════════
  {
    id: "wf-001", firstName: "Ashley", lastName: "Peterson", email: email("ashley", "peterson", "Wells Fargo"),
    firm: "Wells Fargo", title: "Managing Director", seniority: "md", team: "Healthcare Investment Banking", coverageSectors: ["Hospitals", "Healthcare Services", "Behavioral Health", "Home Health"],
    school: "Duke Fuqua", graduationYear: 2008, undergrad: "UNC Chapel Hill", location: "Charlotte, NC", city: "Charlotte",
    priority: "medium", status: "not_contacted", fitScore: 73, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals.slice(2, 4), icebreakers: [
      "UNC → Fuqua → Wells Fargo Healthcare is a classic North Carolina banking path — I'm targeting Charlotte-based firms.",
      "Hospital system M&A has been consolidating dramatically post-pandemic — what's driving the non-profit to for-profit conversions?",
      "Wells Fargo's healthcare coverage based in Charlotte — how does the Southeast banking culture affect deal flow?",
    ],
    personalStyle: "Southern-hospitable and healthcare-passionate. UNC-Duke rivalry aside, strong ACC school network.",
    linkedinKeywords: ["wells fargo", "healthcare", "fuqua", "UNC"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "charlotte"],
  },
  {
    id: "wf-002", firstName: "Craig", lastName: "Davidson", email: email("craig", "davidson", "Wells Fargo"),
    firm: "Wells Fargo", title: "Vice President", seniority: "vp", team: "Energy & Utilities", coverageSectors: ["Utilities", "Regulated Energy", "Renewable Power", "Natural Gas"],
    school: "University of Texas McCombs", graduationYear: 2016, undergrad: "Texas A&M University", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 70, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals.slice(2, 4), icebreakers: [
      "Texas A&M → UT McCombs → Wells Fargo Energy — the Texas school-to-Houston energy banking path I'm targeting.",
      "Regulated utilities M&A is booming given the AI power demand surge — how are you advising utilities on capital allocation?",
      "Natural gas and LNG infrastructure — how does Wells Fargo position in midstream advisory vs. Citi or JPMorgan?",
    ],
    personalStyle: "Texas-genuine and energy-knowledgeable. Proud Aggie who made the UT MBA leap. Open to Texas school outreach.",
    linkedinKeywords: ["wells fargo", "energy", "UT austin", "texas"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston"],
  },
  {
    id: "wf-003", firstName: "Melissa", lastName: "Thompson", email: email("melissa", "thompson", "Wells Fargo"),
    firm: "Wells Fargo", title: "Associate", seniority: "associate", team: "Consumer & Retail", coverageSectors: ["Consumer Finance", "Auto", "Retail Banking", "Consumer Products"],
    school: "UNC Kenan-Flagler", graduationYear: 2021, undergrad: "Wake Forest University", location: "Charlotte, NC", city: "Charlotte",
    priority: "medium", status: "not_contacted", fitScore: 68, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [consumerDeals[1], finServicesDeals[2]], icebreakers: [
      "Wake Forest → Kenan-Flagler → Wells Fargo Consumer in Charlotte — the ACC school pipeline to Wells Fargo is strong.",
      "Consumer finance M&A with credit card consolidation (Capital One/Discover) — how does WF view the competitive landscape?",
      "Charlotte as a banking hub — how does the city compare to New York for career development opportunities?",
    ],
    personalStyle: "Charlotte-based and community-oriented. ACC school pride. Enjoys helping students from the Carolinas.",
    linkedinKeywords: ["wells fargo", "consumer", "UNC", "wake forest"], timezone: "America/New_York", outreachHistory: [], tags: ["consumer-coverage", "charlotte"],
  },

  // ══════════════════════════════════════════════════
  // UBS
  // ══════════════════════════════════════════════════
  {
    id: "ubs-001", firstName: "Thomas", lastName: "Brenner", email: email("thomas", "brenner", "UBS"),
    firm: "UBS", title: "Managing Director", seniority: "md", team: "Global Healthcare Investment Banking", coverageSectors: ["Large-Cap Pharma", "Biotech", "Medtech", "Healthcare Services"],
    school: "Swiss Federal Institute of Technology", graduationYear: 2006, undergrad: "University of St. Gallen", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 72, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals, icebreakers: [
      "UBS's global healthcare franchise brings Swiss precision to pharma M&A — how does the European perspective add value?",
      "St. Gallen → ETH → UBS is the quintessential Swiss banking elite path — how did you make the transition to New York?",
      "European pharma M&A (Roche, Novartis, Lonza) alongside US deals — how does UBS navigate both markets?",
    ],
    personalStyle: "Swiss-precise and globally-minded. Multilingual (German/English/French). Values analytical depth.",
    linkedinKeywords: ["UBS", "healthcare", "swiss", "pharma"], timezone: "America/New_York", outreachHistory: [], tags: ["healthcare-coverage", "european-coverage"],
  },
  {
    id: "ubs-002", firstName: "Claudia", lastName: "Reyes", email: email("claudia", "reyes", "UBS"),
    firm: "UBS", title: "Vice President", seniority: "vp", team: "Wealth Management M&A", coverageSectors: ["Wealth Management", "Asset Management", "RIA", "Family Office"],
    school: "Columbia Business School", graduationYear: 2017, undergrad: "New York University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 74, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: finServicesDeals.slice(1, 3), icebreakers: [
      "NYU → Columbia → UBS Wealth Management M&A — how did you develop expertise in the RIA and family office space?",
      "RIA M&A has been one of the hottest sectors — how is UBS positioned to advise both acquirers and sellers?",
      "Wealth management as a career path vs. traditional M&A — what's the intellectual challenge that keeps you engaged?",
    ],
    personalStyle: "New York City grounded. Columbia and NYU dual network. Very strong in wealth management advisory niche.",
    linkedinKeywords: ["UBS", "wealth management", "columbia", "NYU"], timezone: "America/New_York", outreachHistory: [], tags: ["wealth-management", "columbia-alum", "nyu-alum"],
  },
  {
    id: "ubs-003", firstName: "James", lastName: "Anderson", email: email("james", "anderson", "UBS"),
    firm: "UBS", title: "Associate", seniority: "associate", team: "Technology Investment Banking", coverageSectors: ["FinTech", "Payments", "InsurTech", "Blockchain"],
    school: "Georgetown McDonough", graduationYear: 2022, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 77, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(2, 4), icebreakers: [
      "Georgetown undergrad → McDonough MBA → UBS Technology is a strong Hoya pipeline I'm actively exploring.",
      "FinTech M&A has had a fascinating cycle — how are you valuing payments companies now vs. the 2021 peak multiples?",
      "Blockchain and digital assets advisory — is UBS actively pursuing mandates in that space or is it opportunistic?",
    ],
    personalStyle: "Georgetown-connected and intellectually curious. McDonough network active. Open to Hoya outreach.",
    linkedinKeywords: ["UBS", "technology", "fintech", "georgetown"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "fintech", "georgetown-alum"],
  },

  // ══════════════════════════════════════════════════
  // ADDITIONAL CONTACTS (Mix of firms)
  // ══════════════════════════════════════════════════
  {
    id: "laz-006", firstName: "Samuel", lastName: "Price", email: email("samuel", "price", "Lazard"),
    firm: "Lazard", title: "Vice President", seniority: "vp", team: "Energy & Infrastructure", coverageSectors: ["Power", "Renewables", "Infrastructure", "Energy Transition"],
    school: "University of Virginia Darden", graduationYear: 2017, undergrad: "UVA", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals, icebreakers: [
      "UVA → Darden → Lazard Energy is a strong path — how does Lazard's energy advisory compete with Citi or BofA in this space?",
      "Renewable energy project finance vs. M&A advisory — how has Lazard positioned across both capabilities?",
      "The IRA's impact on energy infrastructure M&A must be enormous — what sectors are you most active in right now?",
    ],
    personalStyle: "Wahoo-loyal and energy-passionate. Darden case method background. Very helpful to UVA alumni.",
    linkedinKeywords: ["lazard", "energy", "darden", "UVA"], timezone: "America/New_York", outreachHistory: [], tags: ["energy-coverage", "uva-alum"],
  },
  {
    id: "gs-007", firstName: "Catherine", lastName: "Blake", email: email("catherine", "blake", "Goldman Sachs"),
    firm: "Goldman Sachs", title: "Associate", seniority: "associate", team: "Real Estate Investment Banking", coverageSectors: ["REIT", "Real Estate Services", "Data Centers", "Industrial Real Estate"],
    school: "Wharton School", graduationYear: 2022, undergrad: "Notre Dame", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 91, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [restructuringDeals[0]], icebreakers: [
      "Notre Dame → Wharton → Goldman Real Estate is a powerful path — I'm a current ND student targeting REIB specifically.",
      "Data center M&A has been extraordinary given AI infrastructure demand — how do you value hyperscaler capacity contracts?",
      "Goldman REIB as an associate — what's the most complex technical challenge in real estate M&A modeling?",
    ],
    personalStyle: "Notre Dame loyal, Wharton sharp. Very open to ND student outreach. Passionate about data center real estate.",
    linkedinKeywords: ["goldman sachs", "real estate", "wharton", "notre dame"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "real-estate", "notre-dame-alum"],
  },
  {
    id: "ms-007", firstName: "George", lastName: "Mitchell", email: email("george", "mitchell", "Morgan Stanley"),
    firm: "Morgan Stanley", title: "Director", seniority: "director", team: "Infrastructure Investment Banking", coverageSectors: ["Airports", "Toll Roads", "Utilities", "Digital Infrastructure"],
    school: "Princeton University", graduationYear: 2009, undergrad: "Princeton University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 78, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [energyDeals[2], industrialsDeals[0]], icebreakers: [
      "Princeton → Morgan Stanley Infrastructure — how has the infrastructure asset class evolved with sovereign wealth fund interest?",
      "Digital infrastructure (data centers, fiber) M&A vs. traditional infrastructure — how does your coverage span both?",
      "The Constellation / Calpine power generation deal — how does infrastructure M&A and power sector overlap in your work?",
    ],
    personalStyle: "Princeton-proud and infrastructure-specialist. Values candidates who understand long-duration asset valuation.",
    linkedinKeywords: ["morgan stanley", "infrastructure", "princeton", "utilities"], timezone: "America/New_York", outreachHistory: [], tags: ["infrastructure", "princeton-alum"],
  },
  {
    id: "jpm-007", firstName: "Lauren", lastName: "Kim", email: email("lauren", "kim", "JPMorgan"),
    firm: "JPMorgan", title: "Vice President", seniority: "vp", team: "Technology Investment Banking", coverageSectors: ["Semiconductors", "Electronic Design Automation", "AI Hardware"],
    school: "Stanford GSB", graduationYear: 2018, undergrad: "Caltech", location: "San Francisco, CA", city: "San Francisco",
    priority: "high", status: "not_contacted", fitScore: 87, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[1], techDeals[0]], icebreakers: [
      "Caltech → Stanford GSB → JPMorgan Semiconductors is the ultimate physics-to-finance path for chip sector advisory.",
      "The Synopsys / Ansys EDA combination and semiconductor supply chain M&A — your technical depth must be invaluable.",
      "AI hardware M&A (NVIDIA ecosystem, custom silicon) — how is JPMorgan advising chipmakers navigating the AI arms race?",
    ],
    personalStyle: "Technical and brilliant. Caltech physics background gives unique semiconductor insight. Values depth.",
    linkedinKeywords: ["jpmorgan", "semiconductors", "stanford", "caltech"], timezone: "America/Los_Angeles", outreachHistory: [], tags: ["tech-coverage", "stanford-alum", "sf-office"],
  },
  {
    id: "hl-007", firstName: "David", lastName: "Park", email: email("david", "park", "Houlihan Lokey"),
    firm: "Houlihan Lokey", title: "Analyst", seniority: "analyst", team: "Corporate Finance Advisory", coverageSectors: ["Middle Market M&A", "Technology", "Business Services"],
    school: "Georgetown University", graduationYear: 2024, undergrad: "Georgetown University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 92, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[2], consumerDeals[1]], icebreakers: [
      "Georgetown → Houlihan Lokey is a strong Hoya pipeline — I'm a current Georgetown student targeting mid-market boutiques.",
      "HL's middle market corporate finance advisory — how does the deal experience compare to what you expected at Georgetown?",
      "Houlihan Lokey's brand in mid-market M&A — how do you explain the firm's positioning to clients who only know Goldman?",
    ],
    personalStyle: "Georgetown-loyal and hardworking. Very open to helping fellow Hoyas navigate IB recruiting.",
    linkedinKeywords: ["houlihan lokey", "corporate finance", "georgetown", "middle market"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "georgetown-alum"],
  },
  {
    id: "evc-006", firstName: "Trevor", lastName: "Burns", email: email("trevor", "burns", "Evercore"),
    firm: "Evercore", title: "Associate", seniority: "associate", team: "Technology Advisory", coverageSectors: ["Enterprise Software", "Cloud Infrastructure", "Cybersecurity", "Data"],
    school: "MIT Sloan", graduationYear: 2022, undergrad: "University of Michigan", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 88, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "Michigan → MIT Sloan → Evercore Technology is an exceptional MBA recruiting outcome — how did Sloan position you differently?",
      "Enterprise software M&A has been extremely active — how do you approach ARR-based valuation vs. traditional EBITDA multiples?",
      "Evercore's tech advisory franchise as an associate — what's the most intellectually stimulating aspect of your deal work?",
    ],
    personalStyle: "Michigan-proud and MIT-analytical. Strong tech business model intuition. Responsive to Michigan and Sloan outreach.",
    linkedinKeywords: ["evercore", "technology", "MIT sloan", "michigan"], timezone: "America/New_York", outreachHistory: [], tags: ["tech-coverage", "michigan-alum", "mit-alum"],
  },
  {
    id: "cv-004", firstName: "Michael", lastName: "Ross", email: email("michael", "ross", "Centerview Partners"),
    firm: "Centerview Partners", title: "Analyst", seniority: "analyst", team: "M&A Advisory", coverageSectors: ["Generalist M&A", "Technology", "Healthcare"],
    school: "University of Pennsylvania", graduationYear: 2024, undergrad: "University of Pennsylvania", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 96, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: [techDeals[0], healthcareDeals[0]], icebreakers: [
      "Penn → Centerview analyst is arguably the most competitive IB placement from UPenn — incredible achievement.",
      "I'm a current Penn junior — what differentiated you in the Centerview recruiting process vs. other elite boutique candidates?",
      "What's the most surprising thing about the Centerview analyst experience that you didn't expect coming in from Penn?",
    ],
    personalStyle: "Ultra-ambitious Penn grad. Centerview culture makes him precise and selective. Will respond to genuine Penn outreach.",
    linkedinKeywords: ["centerview", "M&A", "penn", "upenn"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "analyst", "penn-alum", "top-target"],
  },
  {
    id: "moelis-006", firstName: "Jessica", lastName: "Park", email: email("jessica", "park", "Moelis & Company"),
    firm: "Moelis & Company", title: "Vice President", seniority: "vp", team: "Restructuring", coverageSectors: ["Distressed Debt", "Chapter 11", "Liability Management", "Credit"],
    school: "New York University Stern", graduationYear: 2017, undergrad: "Emory University", location: "New York, NY", city: "New York",
    priority: "medium", status: "not_contacted", fitScore: 81, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "Emory → NYU Stern → Moelis Restructuring — a non-target undergrad to elite boutique path that I find inspiring.",
      "Moelis's restructuring practice vs. Houlihan Lokey or Lazard — what makes Moelis's approach differentiated?",
      "Liability management exercises as an alternative to bankruptcy — how has that market evolved in the higher-rate environment?",
    ],
    personalStyle: "Self-made and empathetic. Emory and NYU background makes her accessible to non-target students.",
    linkedinKeywords: ["moelis", "restructuring", "NYU stern", "emory"], timezone: "America/New_York", outreachHistory: [], tags: ["restructuring", "nyu-alum"],
  },
  {
    id: "jef-005", firstName: "Aaron", lastName: "Morris", email: email("aaron", "morris", "Jefferies"),
    firm: "Jefferies", title: "Director", seniority: "director", team: "Energy Investment Banking", coverageSectors: ["E&P", "Oilfield Services", "Midstream", "Refining"],
    school: "University of Oklahoma", graduationYear: 2012, undergrad: "University of Oklahoma", location: "Houston, TX", city: "Houston",
    priority: "medium", status: "not_contacted", fitScore: 71, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: energyDeals.slice(0, 3), icebreakers: [
      "Oklahoma → Jefferies Energy Houston — OU has a strong pipeline to mid-tier energy banking shops.",
      "Jefferies energy advisory in Houston — how does the firm compete for E&P M&A mandates against JPMorgan and BofA?",
      "Midstream M&A and MLP conversions — how has that sub-sector evolved as the E&P consolidation wave continues?",
    ],
    personalStyle: "Oklahoma-proud energy banking lifer. Houston embedded. Direct and unpretentious. Will talk energy all day.",
    linkedinKeywords: ["jefferies", "energy", "oklahoma", "houston"], timezone: "America/Chicago", outreachHistory: [], tags: ["energy-coverage", "houston"],
  },
  {
    id: "pjt-004", firstName: "Rachel", lastName: "Simmons", email: email("rachel", "simmons", "PJT Partners"),
    firm: "PJT Partners", title: "Analyst", seniority: "analyst", team: "Restructuring & Special Situations Group", coverageSectors: ["Distressed", "Chapter 11", "Liability Management"],
    school: "Yale University", graduationYear: 2024, undergrad: "Yale University", location: "New York, NY", city: "New York",
    priority: "high", status: "not_contacted", fitScore: 93, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: restructuringDeals, icebreakers: [
      "Yale → PJT RSSG is one of Yale's most prestigious IB placements — I'm a current Yale student targeting restructuring.",
      "PJT's restructuring group is considered alongside Lazard for the most complex mandates — what drew you to RSSG specifically?",
      "Working on Chapter 11 cases as a first-year analyst — what technical skills have you had to develop most rapidly?",
    ],
    personalStyle: "Yale intellectual rigor applied to restructuring. Very open to helping Yale students navigate IB recruiting.",
    linkedinKeywords: ["PJT partners", "restructuring", "yale", "RSSG"], timezone: "America/New_York", outreachHistory: [], tags: ["school-connection", "restructuring", "analyst", "yale-alum"],
  },
  {
    id: "wb-007", firstName: "Ethan", lastName: "Johnson", email: email("ethan", "johnson", "William Blair"),
    firm: "William Blair", title: "Director", seniority: "director", team: "Technology Investment Banking", coverageSectors: ["Enterprise Software", "SaaS", "AI/ML", "Data Analytics"],
    school: "University of Michigan Ross", graduationYear: 2012, undergrad: "University of Michigan", location: "Chicago, IL", city: "Chicago",
    priority: "high", status: "not_contacted", fitScore: 85, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: techDeals.slice(0, 3), icebreakers: [
      "Michigan → Michigan Ross → William Blair Technology — the Michigan-to-Chicago boutique pipeline is underrated.",
      "AI/ML company M&A at William Blair — how do you approach valuing these businesses when revenue is still nascent?",
      "Ross School's analytical approach to business — how did it prepare you differently than Wharton or Booth grads?",
    ],
    personalStyle: "Michigan-proud and team-oriented. Ross business school analytical rigor. Very open to Michigan alumni outreach.",
    linkedinKeywords: ["william blair", "technology", "michigan ross", "AI"], timezone: "America/Chicago", outreachHistory: [], tags: ["school-connection", "tech-coverage", "michigan-alum"],
  },
  {
    id: "ps-007", firstName: "Kevin", lastName: "Walsh", email: email("kevin", "walsh", "Piper Sandler"),
    firm: "Piper Sandler", title: "Analyst", seniority: "analyst", team: "Healthcare Investment Banking", coverageSectors: ["Biotech", "Genomics", "Cell & Gene Therapy", "Drug Discovery"],
    school: "University of Minnesota", graduationYear: 2024, undergrad: "University of Minnesota", location: "Minneapolis, MN", city: "Minneapolis",
    priority: "high", status: "not_contacted", fitScore: 86, lastOutreach: null, lastReply: null, notes: "",
    relationshipStrength: 0, recentDeals: healthcareDeals, icebreakers: [
      "UMinn → Piper Sandler Healthcare in Minneapolis — you stayed local and landed an elite role. I'm a current UMinn student.",
      "Cell & gene therapy M&A must be extraordinarily complex given the FDA pathway and clinical stage valuation challenges.",
      "Piper Sandler's biotech banking franchise as a first-year analyst — what's exceeded your expectations most?",
    ],
    personalStyle: "Minnesota-humble and healthcare-passionate. Very open to UMinn students. Will respond to local school outreach.",
    linkedinKeywords: ["piper sandler", "healthcare", "biotech", "minnesota"], timezone: "America/Chicago", outreachHistory: [], tags: ["school-connection", "analyst", "healthcare-coverage"],
  },
];

// ─── Computed Analytics ──────────────────────────────────────────────────────

export const getAllFirms = (): string[] =>
  [...new Set(contactsData.map((c) => c.firm))].sort();

export const getAllSchools = (): string[] =>
  [...new Set(contactsData.flatMap((c) => [c.school, c.undergrad]))].filter(Boolean).sort();

export const getAllSectors = (): string[] =>
  [...new Set(contactsData.flatMap((c) => c.coverageSectors))].sort();

export const getContactsByFirm = (firm: string): Contact[] =>
  contactsData.filter((c) => c.firm === firm);

export const getTopTargets = (n = 20): Contact[] =>
  [...contactsData].sort((a, b) => b.fitScore - a.fitScore).slice(0, n);

export const getNoReplyContacts = (days = 7): Contact[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return contactsData.filter(
    (c) =>
      c.status === "sent" &&
      c.lastOutreach &&
      new Date(c.lastOutreach) < cutoff
  );
};
