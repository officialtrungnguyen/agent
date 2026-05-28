import type { FirmGroup } from "../types";

export interface FirmMeta {
  name: string;
  group: FirmGroup;
  domain: string;
  hqCity: string;
  blurb: string;
}

export const FIRMS: FirmMeta[] = [
  { name: "Goldman Sachs", group: "Bulge Bracket", domain: "gs.com", hqCity: "New York, NY", blurb: "Global leader in M&A, ECM, and DCM across all sectors." },
  { name: "Morgan Stanley", group: "Bulge Bracket", domain: "morganstanley.com", hqCity: "New York, NY", blurb: "Premier global M&A franchise with deep tech and healthcare coverage." },
  { name: "J.P. Morgan", group: "Bulge Bracket", domain: "jpmorgan.com", hqCity: "New York, NY", blurb: "#1 global IB by fees with industry-leading DCM and sponsors coverage." },
  { name: "Bank of America", group: "Bulge Bracket", domain: "bofa.com", hqCity: "New York, NY", blurb: "Top 3 league tables across M&A, LevFin, and capital markets." },
  { name: "Citi", group: "Bulge Bracket", domain: "citi.com", hqCity: "New York, NY", blurb: "Strong cross-border M&A and EM franchise; deep banking coverage." },
  { name: "Barclays", group: "Bulge Bracket", domain: "barclays.com", hqCity: "New York, NY", blurb: "Power, energy, natural resources powerhouse with strong LevFin." },
  { name: "Deutsche Bank", group: "Bulge Bracket", domain: "db.com", hqCity: "New York, NY", blurb: "European leader with strong US M&A and structured products." },
  { name: "UBS", group: "Bulge Bracket", domain: "ubs.com", hqCity: "New York, NY", blurb: "Top wealth management franchise with growing US advisory practice." },
  { name: "Wells Fargo", group: "Bulge Bracket", domain: "wellsfargo.com", hqCity: "Charlotte, NC", blurb: "Real estate, gaming, lodging, and middle-market champion." },
  { name: "RBC Capital Markets", group: "Bulge Bracket", domain: "rbccm.com", hqCity: "New York, NY", blurb: "Energy, mining, and consumer leader expanding US M&A footprint." },

  { name: "Houlihan Lokey", group: "Elite Boutique", domain: "hl.com", hqCity: "Los Angeles, CA", blurb: "#1 in restructuring and middle-market M&A; deep sponsors coverage." },
  { name: "Piper Sandler", group: "Elite Boutique", domain: "psc.com", hqCity: "Minneapolis, MN", blurb: "Healthcare, financial services, and tech middle-market leader." },
  { name: "Lazard", group: "Elite Boutique", domain: "lazard.com", hqCity: "New York, NY", blurb: "Independent advisory powerhouse with elite global M&A and restructuring." },
  { name: "Evercore", group: "Elite Boutique", domain: "evercore.com", hqCity: "New York, NY", blurb: "Top advisory boutique; #1 in M&A advice per banker." },
  { name: "Centerview Partners", group: "Elite Boutique", domain: "centerviewpartners.com", hqCity: "New York, NY", blurb: "Elite mega-deal boutique; highest comp per head on the Street." },
  { name: "Moelis & Company", group: "Elite Boutique", domain: "moelis.com", hqCity: "New York, NY", blurb: "Independent advisory with leading M&A, restructuring, capital markets." },
  { name: "Perella Weinberg Partners", group: "Elite Boutique", domain: "pwpartners.com", hqCity: "New York, NY", blurb: "Independent advisory with strong industrials and restructuring practice." },
  { name: "Guggenheim Securities", group: "Elite Boutique", domain: "guggenheimpartners.com", hqCity: "New York, NY", blurb: "Independent advisory growing fast in healthcare and tech." },
  { name: "PJT Partners", group: "Elite Boutique", domain: "pjtpartners.com", hqCity: "New York, NY", blurb: "Premier strategic advisory + Park Hill secondaries + restructuring." },
  { name: "Qatalyst Partners", group: "Elite Boutique", domain: "qatalyst.com", hqCity: "San Francisco, CA", blurb: "Tech sell-side specialist; Frank Quattrone's franchise." },
  { name: "LionTree", group: "Elite Boutique", domain: "liontree.com", hqCity: "New York, NY", blurb: "TMT-focused independent advisory boutique." },
  { name: "Allen & Company", group: "Elite Boutique", domain: "allenco.com", hqCity: "New York, NY", blurb: "Discrete media/tech advisory; Sun Valley conference host." },
  { name: "Greenhill & Co.", group: "Elite Boutique", domain: "greenhill.com", hqCity: "New York, NY", blurb: "Independent advisory with strong restructuring and M&A." },
  { name: "Rothschild & Co", group: "Elite Boutique", domain: "rothschildandco.com", hqCity: "New York, NY", blurb: "Global independent advisory with deep European roots." },

  { name: "William Blair", group: "Middle Market", domain: "williamblair.com", hqCity: "Chicago, IL", blurb: "Middle-market growth M&A and ECM; Chicago institution." },
  { name: "Baird", group: "Middle Market", domain: "rwbaird.com", hqCity: "Milwaukee, WI", blurb: "Top middle-market M&A advisor; strong industrials and healthcare." },
  { name: "Raymond James", group: "Middle Market", domain: "raymondjames.com", hqCity: "St. Petersburg, FL", blurb: "Diversified middle-market advisory across all sectors." },
  { name: "Jefferies", group: "Middle Market", domain: "jefferies.com", hqCity: "New York, NY", blurb: "Full-service investment bank; aggressive growth and league tables." },
  { name: "Stifel", group: "Middle Market", domain: "stifel.com", hqCity: "St. Louis, MO", blurb: "Middle-market full-service IB with KBW financials franchise." },
  { name: "Lincoln International", group: "Middle Market", domain: "lincolninternational.com", hqCity: "Chicago, IL", blurb: "Global mid-market M&A advisory with sponsors focus." },
  { name: "Harris Williams", group: "Middle Market", domain: "harriswilliams.com", hqCity: "Richmond, VA", blurb: "Middle-market sell-side specialist owned by PNC." },
  { name: "Robert W. Baird", group: "Middle Market", domain: "rwbaird.com", hqCity: "Milwaukee, WI", blurb: "Independent middle-market M&A and capital markets." },

  { name: "Jefferies Restructuring", group: "Restructuring", domain: "jefferies.com", hqCity: "New York, NY", blurb: "Top-3 restructuring shop with creditor and debtor side mandates." },
  { name: "Ducera Partners", group: "Restructuring", domain: "ducerapartners.com", hqCity: "New York, NY", blurb: "Restructuring-focused boutique founded by ex-Perella partners." },

  { name: "Solomon Partners", group: "Elite Boutique", domain: "solomonpartners.com", hqCity: "New York, NY", blurb: "Consumer, retail, healthcare advisory boutique (Natixis-owned)." },
];

export const FIRM_NAMES = FIRMS.map((f) => f.name);
