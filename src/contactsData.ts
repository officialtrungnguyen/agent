import type { Contact, PriorityTier, Transaction } from './types';

const FIRST_NAMES = [
  'Avery', 'Mason', 'Olivia', 'Ethan', 'Isabella', 'Noah', 'Sophia', 'Liam', 'Charlotte', 'James',
  'Amelia', 'Benjamin', 'Emma', 'Lucas', 'Mia', 'Henry', 'Harper', 'Alexander', 'Evelyn', 'Daniel',
  'Victoria', 'Jack', 'Grace', 'Julian', 'Ella', 'Nathan', 'Chloe', 'Ryan', 'Claire', 'Samuel',
  'Madeline', 'Leo', 'Sofia', 'Owen', 'Lila', 'William', 'Nora', 'David', 'Hannah', 'Joseph',
  'Audrey', 'Carter', 'Stella', 'Wyatt', 'Lucy', 'Caleb', 'Camila', 'Isaac', 'Zoey', 'Matthew',
  'Natalie', 'Gabriel', 'Leah', 'Andrew', 'Maya', 'Thomas', 'Julia', 'Christopher', 'Naomi', 'Dylan',
  'Ariana', 'Sebastian', 'Caroline', 'Adam', 'Vivian', 'Charles', 'Elena', 'Connor', 'Paige', 'Eli'
];

const LAST_NAMES = [
  'Anderson', 'Bennett', 'Campbell', 'Donovan', 'Ellis', 'Foster', 'Griffin', 'Hayes', 'Iverson', 'Jordan',
  'Kensington', 'Lawson', 'Monroe', 'Nolan', 'Owens', 'Prescott', 'Quinn', 'Ramsey', 'Sinclair', 'Taylor',
  'Underwood', 'Vance', 'Walker', 'Xu', 'Young', 'Zimmerman', 'Baker', 'Coleman', 'Dalton', 'Edwards',
  'Fisher', 'Garrett', 'Hawkins', 'Irving', 'Jensen', 'Keller', 'Livingston', 'Morgan', 'Norris', 'Parker',
  'Reynolds', 'Sterling', 'Turner', 'Valentine', 'Winston', 'Yates', 'Bell', 'Chambers', 'Davis', 'Evans'
];

const FIRMS = [
  {
    name: 'Goldman Sachs',
    domain: 'gs.com',
    city: 'New York',
    schools: ['Wharton', 'Columbia', 'NYU Stern', 'Cornell'],
    teams: [
      { team: 'Global Industrials', desk: 'M&A', sectors: ['Industrials', 'Aerospace', 'Transportation'] },
      { team: 'Financial Institutions Group', desk: 'FIG', sectors: ['Banks', 'Insurance', 'FinTech'] },
      { team: 'Technology, Media & Telecom', desk: 'TMT', sectors: ['Software', 'Internet', 'Media'] },
    ],
    moves: ['Expanded industrials staffing in Chicago coverage', 'Promoted two senior VPs into sponsor coverage leadership'],
    metrics: ['Top-three announced M&A league table share', 'Strong analyst-to-associate promotion track'],
  },
  {
    name: 'Morgan Stanley',
    domain: 'morganstanley.com',
    city: 'New York',
    schools: ['Michigan Ross', 'Duke', 'UNC', 'Virginia McIntire'],
    teams: [
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Biopharma', 'MedTech', 'Services'] },
      { team: 'Sponsors', desk: 'Financial Sponsors', sectors: ['Private Equity', 'Sponsors', 'Portfolio Companies'] },
      { team: 'Real Estate', desk: 'REIB', sectors: ['REITs', 'Gaming', 'Hospitality'] },
    ],
    moves: ['Added a dedicated medtech execution pod', 'Rotated sponsor execution talent into healthcare'],
    metrics: ['Very active sell-side process flow', 'Lean execution teams with high reps for analysts'],
  },
  {
    name: 'J.P. Morgan',
    domain: 'jpmorgan.com',
    city: 'New York',
    schools: ['Penn', 'Georgetown', 'Notre Dame', 'Villanova'],
    teams: [
      { team: 'Diversified Industries', desk: 'Industrials', sectors: ['Building Products', 'Packaging', 'Distribution'] },
      { team: 'Power & Renewables', desk: 'Energy Transition', sectors: ['Utilities', 'Renewables', 'Infrastructure'] },
      { team: 'Consumer & Retail', desk: 'Consumer', sectors: ['Retail', 'Food', 'Beverage'] },
    ],
    moves: ['Energy transition group hired additional execution talent', 'Consumer team increased sponsor-facing coverage'],
    metrics: ['Strong financing adjacency for coverage bankers', 'Frequent cross-border mandates'],
  },
  {
    name: 'Evercore',
    domain: 'evercore.com',
    city: 'New York',
    schools: ['Harvard', 'Yale', 'Princeton', 'Brown'],
    teams: [
      { team: 'M&A Advisory', desk: 'Generalist M&A', sectors: ['Diversified', 'Generalist', 'Strategic Advisory'] },
      { team: 'Consumer', desk: 'Consumer', sectors: ['Branded Consumer', 'Ecommerce', 'Restaurants'] },
      { team: 'Telecom', desk: 'TMT', sectors: ['Wireless', 'Broadband', 'Communications Infrastructure'] },
    ],
    moves: ['Senior MD pushed deeper into activist defense', 'Consumer team increased cross-office staffing'],
    metrics: ['High-touch lean deal teams', 'Strong modeling and strategic advisory reps'],
  },
  {
    name: 'PJT Partners',
    domain: 'pjtpartners.com',
    city: 'New York',
    schools: ['Penn', 'Chicago Booth', 'Dartmouth', 'Vanderbilt'],
    teams: [
      { team: 'Strategic Advisory', desk: 'M&A', sectors: ['Cross-Sector', 'Activism Defense', 'Special Situations'] },
      { team: 'Restructuring', desk: 'RX', sectors: ['Distressed', 'Liability Management', 'Turnaround'] },
      { team: 'Private Capital Solutions', desk: 'PCS', sectors: ['Secondaries', 'GP-led', 'Fundraising'] },
    ],
    moves: ['Restructuring desk staffing remains strong after liability management wave', 'PCS team deepened sponsor coverage alignment'],
    metrics: ['Very high exposure to complex situations', 'Elite placement and buyside exits'],
  },
  {
    name: 'Lazard',
    domain: 'lazard.com',
    city: 'New York',
    schools: ['Northwestern', 'Chicago Booth', 'Duke', 'Cornell'],
    teams: [
      { team: 'Restructuring', desk: 'RX', sectors: ['Distressed', 'Chapter 11', 'Liability Management'] },
      { team: 'Power, Energy & Infrastructure', desk: 'PEI', sectors: ['Utilities', 'Power', 'Infrastructure'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Life Sciences', 'Providers', 'Services'] },
    ],
    moves: ['Continued to add RX execution capacity', 'Healthcare franchise expanding sponsor dialogue'],
    metrics: ['Deep creditor-side mandates', 'Consistent mid-market and large-cap strategic activity'],
  },
  {
    name: 'Moelis',
    domain: 'moelis.com',
    city: 'New York',
    schools: ['Penn', 'UCLA', 'USC', 'Berkeley Haas'],
    teams: [
      { team: 'Industrials', desk: 'Industrials', sectors: ['Capital Goods', 'Aerospace', 'Transportation'] },
      { team: 'Sponsors', desk: 'Financial Sponsors', sectors: ['Sponsors', 'Portfolio Companies', 'PE-backed Sell-sides'] },
      { team: 'Business Services', desk: 'Services', sectors: ['Outsourcing', 'Facility Services', 'Tech-enabled Services'] },
    ],
    moves: ['Sponsors group added dedicated execution support', 'Business services team increased software-enabled services coverage'],
    metrics: ['Heavy sell-side reps', 'High process ownership for juniors'],
  },
  {
    name: 'Houlihan Lokey',
    domain: 'hl.com',
    city: 'New York',
    schools: ['Michigan Ross', 'Indiana Kelley', 'USC', 'Notre Dame'],
    teams: [
      { team: 'Financial Restructuring', desk: 'RX', sectors: ['Distressed', 'Chapter 11', 'Liability Management'] },
      { team: 'Business Services', desk: 'Corporate Finance', sectors: ['Services', 'Outsourcing', 'Human Capital'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Vertical Software', 'Infra Software', 'IT Services'] },
    ],
    moves: ['Technology team pushing deeper into sponsor-backed software', 'RX franchise still a market anchor'],
    metrics: ['Best-in-class middle-market volume', 'Frequent direct exposure to management teams'],
  },
  {
    name: 'Piper Sandler',
    domain: 'psc.com',
    city: 'New York',
    schools: ['Minnesota Carlson', 'Wisconsin', 'Michigan Ross', 'Notre Dame'],
    teams: [
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Biopharma', 'MedTech', 'Services'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'SaaS', 'Cybersecurity'] },
      { team: 'Financial Services', desk: 'FIG', sectors: ['Banks', 'Specialty Finance', 'Insurance'] },
    ],
    moves: ['Tech team added more growth software coverage', 'Healthcare franchise remains highly active in medtech'],
    metrics: ['Strong middle-market sector specialization', 'Good access to live processes for junior bankers'],
  },
  {
    name: 'William Blair',
    domain: 'williamblair.com',
    city: 'Chicago',
    schools: ['Northwestern', 'Notre Dame', 'Indiana Kelley', 'Illinois'],
    teams: [
      { team: 'Services & Industrials', desk: 'Industrials', sectors: ['Distribution', 'Services', 'Transportation'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Application Software', 'Vertical SaaS', 'FinTech'] },
      { team: 'Consumer', desk: 'Consumer', sectors: ['Food', 'Retail', 'Consumer Brands'] },
    ],
    moves: ['Chicago services team added sponsor coverage overlap', 'Tech franchise remains strong in sponsor-backed sell-sides'],
    metrics: ['Strong founder-owned sell-side flow', 'Collaborative culture with solid client exposure'],
  },
  {
    name: 'Jefferies',
    domain: 'jefferies.com',
    city: 'New York',
    schools: ['Emory', 'Duke', 'Cornell', 'Vanderbilt'],
    teams: [
      { team: 'Aerospace & Defense', desk: 'A&D', sectors: ['Defense Tech', 'Aerospace', 'Government Services'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'Semiconductors', 'Internet'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Pharma', 'Tools', 'Services'] },
    ],
    moves: ['A&D team remains busy with sponsor-backed assets', 'Healthcare group leaned further into medtech'],
    metrics: ['Strong ECM/DCM adjacency', 'Active mid-cap and large-cap coverage mix'],
  },
  {
    name: 'Guggenheim Securities',
    domain: 'guggenheimpartners.com',
    city: 'New York',
    schools: ['Penn', 'Georgetown', 'Duke', 'Michigan Ross'],
    teams: [
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Biopharma', 'Diagnostics', 'Healthcare Services'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'Security', 'Data Infrastructure'] },
      { team: 'Consumer', desk: 'Consumer', sectors: ['Retail', 'Consumer Products', 'Restaurants'] },
    ],
    moves: ['Tech team increased security software focus', 'Consumer coverage continues to track premium branded assets'],
    metrics: ['High-intensity live deal reps', 'Sector-focused advisory with strong buyside relationships'],
  },
  {
    name: 'BofA Securities',
    domain: 'bofa.com',
    city: 'New York',
    schools: ['UNC', 'Virginia McIntire', 'Wake Forest', 'Georgetown'],
    teams: [
      { team: 'Industrials', desk: 'Industrials', sectors: ['Building Products', 'Capital Goods', 'Logistics'] },
      { team: 'Financial Sponsors', desk: 'Sponsors', sectors: ['Sponsors', 'Portfolio Companies', 'LBO Finance'] },
      { team: 'Consumer & Retail', desk: 'Consumer', sectors: ['Retail', 'Food', 'Consumer Services'] },
    ],
    moves: ['Sponsor coverage increased coordination with lev fin', 'Industrials team added building products senior coverage'],
    metrics: ['Strong balance sheet-led origination', 'Excellent financing plus advisory toolkit'],
  },
  {
    name: 'Barclays',
    domain: 'barclays.com',
    city: 'New York',
    schools: ['Georgetown', 'Notre Dame', 'Villanova', 'Duke'],
    teams: [
      { team: 'Financial Sponsors', desk: 'Sponsors', sectors: ['Sponsors', 'LBO', 'Portfolio Companies'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Pharma', 'Services', 'MedTech'] },
      { team: 'Energy', desk: 'Energy', sectors: ['Oil & Gas', 'Midstream', 'Energy Transition'] },
    ],
    moves: ['Sponsors team remains highly leveraged to sponsor dialogue', 'Healthcare leaned into services-heavy mandates'],
    metrics: ['Cross-border platform with strong financing support', 'Robust sponsor relationship coverage'],
  },
  {
    name: 'Citi',
    domain: 'citi.com',
    city: 'New York',
    schools: ['Rutgers', 'NYU Stern', 'Cornell', 'Penn'],
    teams: [
      { team: 'Mergers & Acquisitions', desk: 'M&A', sectors: ['Cross-Sector', 'Strategic Advisory', 'Large Cap'] },
      { team: 'FIG', desk: 'FIG', sectors: ['Banks', 'Asset Management', 'FinTech'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'Internet', 'Payments'] },
    ],
    moves: ['Core M&A team continues to staff large-cap strategic work', 'Payments and fintech coverage remains active'],
    metrics: ['Very broad global platform', 'Strong cross-border and financing-linked execution'],
  },
  {
    name: 'UBS',
    domain: 'ubs.com',
    city: 'New York',
    schools: ['Michigan Ross', 'Penn', 'NYU Stern', 'Dartmouth'],
    teams: [
      { team: 'Sponsors', desk: 'Sponsors', sectors: ['Sponsors', 'LBO', 'Portfolio Company M&A'] },
      { team: 'Consumer & Retail', desk: 'Consumer', sectors: ['Consumer Brands', 'Retail', 'Ecommerce'] },
      { team: 'Industrials', desk: 'Industrials', sectors: ['A&D', 'Building Products', 'Transportation'] },
    ],
    moves: ['Sponsor coverage expanded in upper middle market', 'Consumer group spending more time on ecommerce infrastructure'],
    metrics: ['Balanced product and coverage exposure', 'Solid European cross-border flow'],
  },
  {
    name: 'RBC Capital Markets',
    domain: 'rbccm.com',
    city: 'New York',
    schools: ['McGill', 'Western Ivey', 'Michigan Ross', 'Virginia McIntire'],
    teams: [
      { team: 'Power & Utilities', desk: 'Power', sectors: ['Utilities', 'Renewables', 'Infrastructure'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'IT Services', 'Semis'] },
      { team: 'Financial Institutions', desk: 'FIG', sectors: ['Banks', 'Insurance', 'Specialty Finance'] },
    ],
    moves: ['Utilities team focused on grid modernization mandates', 'Technology group continues to lean into software services'],
    metrics: ['Strong Canada plus U.S. cross-border lens', 'Solid strategic plus sponsor execution mix'],
  },
  {
    name: 'Stifel',
    domain: 'stifel.com',
    city: 'New York',
    schools: ['WashU', 'Indiana Kelley', 'Wisconsin', 'SMU'],
    teams: [
      { team: 'Diversified Industrials', desk: 'Industrials', sectors: ['Industrial Tech', 'Transportation', 'Packaging'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Healthcare IT', 'Services', 'Devices'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Vertical Software', 'Digital Infrastructure', 'Data'] },
    ],
    moves: ['Healthcare IT coverage broadened to adjacent services', 'Technology team remains active in founder-owned software sell-sides'],
    metrics: ['Strong middle-market transaction count', 'Frequent sponsor-backed client exposure'],
  },
  {
    name: 'Lincoln International',
    domain: 'lincolninternational.com',
    city: 'Chicago',
    schools: ['Northwestern', 'Notre Dame', 'Indiana Kelley', 'Illinois'],
    teams: [
      { team: 'Business Services', desk: 'Services', sectors: ['Facility Services', 'Human Capital', 'Tech-enabled Services'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Services', 'Devices', 'Distribution'] },
      { team: 'Technology', desk: 'Technology', sectors: ['SaaS', 'IT Services', 'Industrial Tech'] },
    ],
    moves: ['Business services team stayed very active in sponsor-backed exits', 'Technology group deepening industrial tech coverage'],
    metrics: ['Excellent sponsor-backed middle-market reps', 'High live-process volume in core sectors'],
  },
  {
    name: 'Perella Weinberg Partners',
    domain: 'pwp.com',
    city: 'New York',
    schools: ['Penn', 'Columbia', 'Princeton', 'Duke'],
    teams: [
      { team: 'M&A Advisory', desk: 'M&A', sectors: ['Generalist', 'Strategic Advisory', 'Complex Situations'] },
      { team: 'Energy', desk: 'Energy', sectors: ['Upstream', 'Infrastructure', 'Energy Transition'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Biopharma', 'Services', 'Devices'] },
    ],
    moves: ['Generalist advisory staff continues to work across complex boardside mandates', 'Energy team remains active in infrastructure'],
    metrics: ['Lean teams with strong analytical training', 'Strong strategic advisory franchise'],
  },
  {
    name: 'Centerview Partners',
    domain: 'centerviewpartners.com',
    city: 'New York',
    schools: ['Harvard', 'Stanford', 'Penn', 'Columbia'],
    teams: [
      { team: 'Generalist Advisory', desk: 'M&A', sectors: ['Generalist', 'Boardside', 'Strategic Advisory'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Large Cap Pharma', 'Providers', 'Services'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'Internet', 'Semis'] },
    ],
    moves: ['Generalist team remains heavily staffed on high-profile board mandates', 'Healthcare continues to win large-cap strategic work'],
    metrics: ['Elite advisory brand', 'Strong senior banker access for top juniors'],
  },
  {
    name: 'Greenhill',
    domain: 'greenhill.com',
    city: 'New York',
    schools: ['Penn', 'Virginia McIntire', 'Notre Dame', 'Duke'],
    teams: [
      { team: 'Industrials', desk: 'Industrials', sectors: ['Capital Goods', 'Industrial Services', 'Transportation'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'IT Services', 'Digital Media'] },
      { team: 'M&A Advisory', desk: 'M&A', sectors: ['Generalist', 'Strategic Advisory', 'Cross-Border'] },
    ],
    moves: ['Technology team maintaining focus on software and services', 'Generalist group still active in select cross-border assignments'],
    metrics: ['Lean teams and direct execution exposure', 'Historic strength in strategic advisory situations'],
  },
  {
    name: 'Deutsche Bank',
    domain: 'db.com',
    city: 'New York',
    schools: ['NYU Stern', 'Penn', 'Boston College', 'Villanova'],
    teams: [
      { team: 'Sponsors', desk: 'Sponsors', sectors: ['Sponsors', 'Portfolio Companies', 'LBO Finance'] },
      { team: 'Technology', desk: 'Technology', sectors: ['Software', 'Communications', 'Semiconductors'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Biotech', 'Pharma', 'Services'] },
    ],
    moves: ['Sponsors coverage increasingly coordinated with leveraged finance', 'Technology maintains solid semiconductor dialogue'],
    metrics: ['Financing-heavy platform with meaningful advisory opportunities', 'Good cross-border connectivity'],
  },
  {
    name: 'Wells Fargo Securities',
    domain: 'wellsfargo.com',
    city: 'Charlotte',
    schools: ['UNC', 'Wake Forest', 'Vanderbilt', 'Notre Dame'],
    teams: [
      { team: 'Energy & Power', desk: 'Power', sectors: ['Utilities', 'Renewables', 'Midstream'] },
      { team: 'Financial Sponsors', desk: 'Sponsors', sectors: ['Sponsors', 'PE-backed', 'Capital Solutions'] },
      { team: 'Healthcare', desk: 'Healthcare', sectors: ['Providers', 'Services', 'Devices'] },
    ],
    moves: ['Power group remains active in utility advisory', 'Sponsors team still strong in middle-market sponsor dialogue'],
    metrics: ['Balanced middle-market and large-cap platform', 'Strong southeastern alumni presence'],
  },
  {
    name: 'Baird',
    domain: 'rwbaird.com',
    city: 'Chicago',
    schools: ['Wisconsin', 'Indiana Kelley', 'Notre Dame', 'Michigan Ross'],
    teams: [
      { team: 'Global Industrials', desk: 'Industrials', sectors: ['Industrial Tech', 'Distribution', 'A&D'] },
      { team: 'Technology & Services', desk: 'Technology', sectors: ['Software', 'IT Services', 'Digital Infrastructure'] },
      { team: 'Consumer', desk: 'Consumer', sectors: ['Consumer Products', 'Ecommerce', 'Retail'] },
    ],
    moves: ['Industrial tech coverage continues to deepen', 'Technology and services remains active in sponsor-backed mandates'],
    metrics: ['High-volume middle-market sell-side platform', 'Very strong Midwest alumni network'],
  },
] as const;

const DEAL_NAMES = [
  'Apex', 'BlueRiver', 'Crescent', 'Drift', 'Eagle', 'Falcon', 'Granite', 'Harbor', 'Ironclad', 'Juniper',
  'Keystone', 'Lighthouse', 'Meridian', 'Northstar', 'Oakmont', 'Pinnacle', 'Quarry', 'Ridge', 'Summit', 'Timber',
  'Union', 'Vector', 'Westlake', 'Xylo', 'York', 'Zenith'
];

const ACQUIRERS = [
  'Advent International', 'Bain Capital', 'Blackstone', 'KKR', 'Warburg Pincus', 'Carlyle', 'Vista Equity Partners',
  'CD&R', 'HG', 'TPG', 'Apollo', 'General Atlantic', 'Permira', 'EQT'
];

const PRIORITIES: PriorityTier[] = ['A+', 'A', 'A', 'B', 'B', 'C'];
const TITLES = ['Analyst', 'Associate', 'Associate', 'Vice President', 'Director', 'Managing Director'] as const;
const STATUS_SEQUENCE = ['not-contacted', 'not-contacted', 'queued', 'scheduled', 'sent', 'replied', 'positive', 'no-reply'] as const;

function isoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function buildTransactions(firm: string, sectors: readonly string[], seed: number): Transaction[] {
  return Array.from({ length: 3 }, (_, idx) => {
    const dealName = DEAL_NAMES[(seed + idx) % DEAL_NAMES.length];
    const counterparty = ACQUIRERS[(seed + idx * 2) % ACQUIRERS.length];
    const sector = sectors[idx % sectors.length];
    const value = `$${(350 + ((seed + idx) % 18) * 125).toLocaleString()}M`;
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(seed + idx) % 12];
    const year = 2023 + ((seed + idx) % 3);
    return {
      company: `${dealName} ${sector.split(' ')[0]}`,
      counterparty,
      value,
      date: `${month} ${year}`,
      summary: `${firm} advised ${dealName} ${sector.toLowerCase()} assets on a strategic review and sponsor dialogue process.`,
      role: idx % 2 === 0 ? 'Sell-side advisor' : 'Strategic advisor',
    };
  });
}

export const contactsData: Contact[] = FIRMS.flatMap((firm, firmIndex) =>
  Array.from({ length: 11 }, (_, i) => {
    const teamDef = firm.teams[i % firm.teams.length];
    const firstName = FIRST_NAMES[(firmIndex * 7 + i) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(firmIndex * 11 + i * 3) % LAST_NAMES.length];
    const title = TITLES[i % TITLES.length];
    const priority = PRIORITIES[(firmIndex + i) % PRIORITIES.length];
    const status = STATUS_SEQUENCE[(firmIndex + i) % STATUS_SEQUENCE.length];
    const school = firm.schools[(firmIndex + i) % firm.schools.length];
    const lastOutreach = status === 'not-contacted' ? undefined : isoDate(((firmIndex + i) % 17) + 1);
    const lastInteraction = status === 'not-contacted' ? undefined : isoDate(((firmIndex + i) % 11) + 1);
    const relationshipStrength = status === 'positive' ? 4 : status === 'replied' ? 3 : status === 'no-reply' ? 2 : 1;
    const notes = [
      `${school} alum in ${teamDef.team}.`,
      `Prefers concise outreach with one specific reason for the conversation.`,
    ];
    return {
      id: `${firm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`,
      firstName,
      lastName,
      firm: firm.name,
      title,
      team: teamDef.team,
      desk: teamDef.desk,
      coverageSectors: teamDef.sectors,
      school,
      city: firm.city,
      email: `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]+/g, '') + `@${firm.domain}`,
      priority,
      lastOutreach,
      lastInteraction,
      status,
      relationshipStrength,
      notes,
      sharedInterests: [school, 'student mentorship', 'live deal process breakdowns'],
      styleNotes: [
        `${title}s on this desk value quick pattern recognition and strong preparation.`,
        `Reference ${teamDef.sectors[0].toLowerCase()} or ${teamDef.sectors[1].toLowerCase()} trends rather than broad finance themes.`,
      ],
      recentTransactions: buildTransactions(firm.name, teamDef.sectors, firmIndex * 13 + i * 5),
      teamMoves: firm.moves,
      deskMetrics: firm.metrics,
    } satisfies Contact;
  })
);

export const firmList = Array.from(new Set(contactsData.map((contact) => contact.firm))).sort();
export const schoolList = Array.from(new Set(contactsData.map((contact) => contact.school))).sort();
