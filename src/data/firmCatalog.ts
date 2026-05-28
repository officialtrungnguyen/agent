import type { CoverageSector, Firm, Product } from "@/types";

/**
 * Firm-specific catalog: cities of major offices, dominant product groups,
 * coverage strengths, and league-table positioning. Used to ground generated
 * contacts in realistic team/desk + recent deal context.
 */

export interface FirmProfile {
  firm: Firm;
  cities: string[];
  products: Product[];
  coverage: CoverageSector[];
  domain: string;
  leagueTagline: string;
  notableDeals: {
    target: string;
    acquirer?: string;
    value: string;
    date: string;
    role: string;
    sector: CoverageSector;
    product: Product;
  }[];
}

export const FIRM_CATALOG: FirmProfile[] = [
  {
    firm: "Houlihan Lokey",
    cities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Dallas", "Atlanta", "Miami", "Minneapolis"],
    products: ["M&A", "Restructuring", "Capital Markets", "Private Capital"],
    coverage: ["Industrials", "Business Services", "Healthcare", "Technology", "Financial Sponsors", "Consumer & Retail", "Real Estate"],
    domain: "hl.com",
    leagueTagline: "#1 Global M&A Advisor for Transactions Under $1B · #1 Global Restructuring Advisor",
    notableDeals: [
      { target: "ConvergeOne", value: "$1.3B", date: "2024-04-12", role: "Sole financial advisor to ConvergeOne", sector: "Technology", product: "Restructuring" },
      { target: "WeWork", value: "$13B", date: "2024-06-09", role: "Financial advisor to WeWork", sector: "Real Estate", product: "Restructuring" },
      { target: "Mavis Tire Express", acquirer: "BayPine", value: "$6.0B", date: "2024-02-28", role: "Sell-side advisor", sector: "Consumer & Retail", product: "M&A" },
      { target: "PetVet Care Centers", acquirer: "KKR", value: "$3.5B", date: "2023-11-15", role: "Sell-side advisor", sector: "Healthcare", product: "M&A" },
      { target: "Bishop Lifting", acquirer: "Bishop Lifting Products", value: "$425M", date: "2024-08-30", role: "Sell-side advisor", sector: "Industrials", product: "M&A" },
      { target: "Aimbridge Hospitality", value: "$1.1B", date: "2024-02-05", role: "Restructuring advisor", sector: "Consumer & Retail", product: "Restructuring" },
    ],
  },
  {
    firm: "Piper Sandler",
    cities: ["Minneapolis", "New York", "Chicago", "San Francisco", "Boston", "Charlotte", "Houston"],
    products: ["M&A", "Capital Markets", "ECM", "DCM"],
    coverage: ["Healthcare", "Financial Sponsors", "FIG", "Technology", "Industrials", "Consumer & Retail", "Energy & Power"],
    domain: "psc.com",
    leagueTagline: "#1 Healthcare M&A Advisor by Deal Count · Top 5 ECM Bookrunner",
    notableDeals: [
      { target: "Apollo Endosurgery", acquirer: "Boston Scientific", value: "$615M", date: "2024-04-04", role: "Financial advisor to Apollo Endosurgery", sector: "Healthcare", product: "M&A" },
      { target: "Inogen", value: "$172M", date: "2024-07-22", role: "Sole bookrunner — follow-on equity offering", sector: "Healthcare", product: "ECM" },
      { target: "Heritage Bank of Commerce", acquirer: "HarborOne Bancorp", value: "$540M", date: "2024-09-18", role: "Advisor to Heritage", sector: "FIG", product: "M&A" },
      { target: "Endeavor Robotics", acquirer: "FLIR", value: "$385M", date: "2023-10-25", role: "Sell-side advisor", sector: "Aerospace & Defense", product: "M&A" },
      { target: "Cornerstone Building Brands", value: "$220M", date: "2024-03-14", role: "Joint bookrunner — senior notes", sector: "Industrials", product: "DCM" },
    ],
  },
  {
    firm: "Goldman Sachs",
    cities: ["New York", "London", "San Francisco", "Chicago", "Los Angeles", "Houston", "Salt Lake City"],
    products: ["M&A", "ECM", "DCM", "Leveraged Finance", "Capital Markets"],
    coverage: ["Technology", "Healthcare", "Financial Sponsors", "Consumer & Retail", "Industrials", "Energy & Power", "TMT", "FIG"],
    domain: "gs.com",
    leagueTagline: "#1 Global M&A Bookrunner · #1 Global Equity Bookrunner",
    notableDeals: [
      { target: "Splunk", acquirer: "Cisco", value: "$28.0B", date: "2024-03-18", role: "Lead financial advisor to Splunk", sector: "Technology", product: "M&A" },
      { target: "ARM Holdings", value: "$54.5B", date: "2023-09-14", role: "Joint lead bookrunner — IPO", sector: "Technology", product: "ECM" },
      { target: "Pioneer Natural Resources", acquirer: "ExxonMobil", value: "$59.5B", date: "2024-05-03", role: "Sell-side advisor to Pioneer", sector: "Energy & Power", product: "M&A" },
      { target: "Catalent", acquirer: "Novo Holdings", value: "$16.5B", date: "2024-02-05", role: "Advisor to Catalent", sector: "Healthcare", product: "M&A" },
      { target: "Cava Group", value: "$318M", date: "2023-06-15", role: "Joint lead bookrunner — IPO", sector: "Consumer & Retail", product: "ECM" },
    ],
  },
  {
    firm: "William Blair",
    cities: ["Chicago", "New York", "San Francisco", "Boston", "London", "Frankfurt"],
    products: ["M&A", "ECM", "Private Capital", "Capital Markets"],
    coverage: ["Healthcare", "Technology", "Business Services", "Industrials", "Consumer & Retail", "Financial Sponsors"],
    domain: "williamblair.com",
    leagueTagline: "Top 3 Middle-Market M&A Advisor · Healthcare & Tech-Centric",
    notableDeals: [
      { target: "Lytx", acquirer: "Permira", value: "$2.5B", date: "2024-02-21", role: "Sell-side advisor", sector: "Technology", product: "M&A" },
      { target: "Caliber Collision", value: "$1.5B", date: "2024-05-11", role: "Joint bookrunner — term loan B", sector: "Consumer & Retail", product: "Leveraged Finance" },
      { target: "Therapy Brands", acquirer: "KKR", value: "$1.2B", date: "2023-11-09", role: "Sell-side advisor", sector: "Healthcare", product: "M&A" },
      { target: "Sweetwater Sound", acquirer: "GTCR", value: "$1.4B", date: "2024-08-08", role: "Sell-side advisor", sector: "Consumer & Retail", product: "M&A" },
    ],
  },
  {
    firm: "Moelis & Company",
    cities: ["New York", "Los Angeles", "Chicago", "London", "Houston", "Boston"],
    products: ["M&A", "Restructuring", "Capital Markets", "Private Capital"],
    coverage: ["Technology", "Healthcare", "Energy & Power", "Financial Sponsors", "Industrials", "TMT", "Consumer & Retail", "Special Situations"],
    domain: "moelis.com",
    leagueTagline: "Boutique Powerhouse · Top 3 Independent Restructuring Advisor",
    notableDeals: [
      { target: "Wesco Aircraft", value: "$1.9B", date: "2024-01-22", role: "Restructuring advisor", sector: "Aerospace & Defense", product: "Restructuring" },
      { target: "Air Methods", value: "$1.7B", date: "2023-12-04", role: "Restructuring advisor", sector: "Healthcare", product: "Restructuring" },
      { target: "Hudson's Bay Company (Saks OFF 5TH)", value: "$2.65B", date: "2024-07-10", role: "Sell-side advisor", sector: "Consumer & Retail", product: "M&A" },
      { target: "Endeavor Group", value: "$13.0B", date: "2024-04-02", role: "Advisor to Endeavor Special Committee", sector: "TMT", product: "M&A" },
    ],
  },
  {
    firm: "Morgan Stanley",
    cities: ["New York", "Menlo Park", "Chicago", "Los Angeles", "London", "San Francisco"],
    products: ["M&A", "ECM", "DCM", "Leveraged Finance"],
    coverage: ["Technology", "Healthcare", "Financial Sponsors", "TMT", "FIG", "Consumer & Retail", "Industrials"],
    domain: "morganstanley.com",
    leagueTagline: "#2 Global M&A · Top 3 Global ECM Bookrunner",
    notableDeals: [
      { target: "VMware", acquirer: "Broadcom", value: "$69.0B", date: "2023-11-22", role: "Financial advisor to VMware", sector: "Technology", product: "M&A" },
      { target: "Activision Blizzard", acquirer: "Microsoft", value: "$68.7B", date: "2023-10-13", role: "Advisor to Activision Special Committee", sector: "TMT", product: "M&A" },
      { target: "Klaviyo", value: "$576M", date: "2023-09-20", role: "Joint lead bookrunner — IPO", sector: "Technology", product: "ECM" },
      { target: "Birkenstock", value: "$1.5B", date: "2023-10-11", role: "Joint lead bookrunner — IPO", sector: "Consumer & Retail", product: "ECM" },
    ],
  },
  {
    firm: "JPMorgan",
    cities: ["New York", "San Francisco", "Chicago", "Los Angeles", "Houston", "London"],
    products: ["M&A", "ECM", "DCM", "Leveraged Finance"],
    coverage: ["Technology", "Healthcare", "Financial Sponsors", "Industrials", "TMT", "Energy & Power", "FIG", "Consumer & Retail"],
    domain: "jpmorgan.com",
    leagueTagline: "#1 Global Investment Banking Fees · #1 Global DCM Bookrunner",
    notableDeals: [
      { target: "First Republic", value: "$10.6B", date: "2023-05-01", role: "Acquirer financial advisor", sector: "FIG", product: "M&A" },
      { target: "Hess Corporation", acquirer: "Chevron", value: "$53.0B", date: "2023-10-23", role: "Sell-side advisor", sector: "Energy & Power", product: "M&A" },
      { target: "Cerevel Therapeutics", acquirer: "AbbVie", value: "$8.7B", date: "2023-12-06", role: "Sell-side advisor", sector: "Healthcare", product: "M&A" },
    ],
  },
  {
    firm: "Evercore",
    cities: ["New York", "San Francisco", "Houston", "Boston", "Chicago", "London"],
    products: ["M&A", "Restructuring", "Private Capital", "ECM"],
    coverage: ["Energy & Power", "Healthcare", "Technology", "TMT", "Financial Sponsors", "Industrials", "Consumer & Retail"],
    domain: "evercore.com",
    leagueTagline: "Top Independent Advisor · #1 in U.S. Strategic M&A Advisory by Independent Firm",
    notableDeals: [
      { target: "Pioneer Natural Resources", acquirer: "ExxonMobil", value: "$59.5B", date: "2024-05-03", role: "Advisor to ExxonMobil", sector: "Energy & Power", product: "M&A" },
      { target: "Karuna Therapeutics", acquirer: "Bristol Myers Squibb", value: "$14.0B", date: "2024-03-18", role: "Advisor to Karuna", sector: "Healthcare", product: "M&A" },
      { target: "Squarespace", value: "$6.9B", date: "2024-05-13", role: "Advisor to Squarespace Special Committee", sector: "Technology", product: "M&A" },
    ],
  },
  {
    firm: "Lazard",
    cities: ["New York", "Houston", "San Francisco", "Chicago", "Boston", "London"],
    products: ["M&A", "Restructuring", "Capital Markets"],
    coverage: ["Healthcare", "Financial Sponsors", "Industrials", "Consumer & Retail", "FIG", "Energy & Power"],
    domain: "lazard.com",
    leagueTagline: "Top 5 Global Independent M&A · #1 European Restructuring Advisor",
    notableDeals: [
      { target: "Endeavor Group", value: "$13.0B", date: "2024-04-02", role: "Advisor to Silver Lake", sector: "TMT", product: "M&A" },
      { target: "Genesco", value: "$305M", date: "2024-04-26", role: "Advisor to special committee", sector: "Consumer & Retail", product: "M&A" },
      { target: "Hertz Global", value: "$1.0B", date: "2023-12-15", role: "Sustainability-linked notes — joint bookrunner", sector: "Industrials", product: "DCM" },
    ],
  },
  {
    firm: "Centerview",
    cities: ["New York", "Los Angeles", "San Francisco", "London"],
    products: ["M&A", "Restructuring"],
    coverage: ["Healthcare", "Technology", "Consumer & Retail", "TMT", "Financial Sponsors"],
    domain: "centerviewpartners.com",
    leagueTagline: "Elite Boutique · Highest Deal Size per Banker on Wall Street",
    notableDeals: [
      { target: "Seagen", acquirer: "Pfizer", value: "$43.0B", date: "2023-12-14", role: "Advisor to Seagen", sector: "Healthcare", product: "M&A" },
      { target: "Activision Blizzard", acquirer: "Microsoft", value: "$68.7B", date: "2023-10-13", role: "Advisor to Microsoft", sector: "TMT", product: "M&A" },
      { target: "Spirit Airlines", value: "$3.8B", date: "2024-01-16", role: "Advisor to Spirit", sector: "Aerospace & Defense", product: "M&A" },
    ],
  },
  {
    firm: "PJT Partners",
    cities: ["New York", "Chicago", "San Francisco", "London"],
    products: ["M&A", "Restructuring", "Private Capital"],
    coverage: ["Financial Sponsors", "Restructuring", "Healthcare", "Technology", "Industrials", "Special Situations"],
    domain: "pjtpartners.com",
    leagueTagline: "Premier Restructuring House · Leading Park Hill Secondaries",
    notableDeals: [
      { target: "Yellow Corp", value: "$2.6B", date: "2023-12-12", role: "Restructuring advisor", sector: "Industrials", product: "Restructuring" },
      { target: "Diamond Sports Group", value: "$8.0B", date: "2024-06-25", role: "Restructuring advisor", sector: "Media & Telecom", product: "Restructuring" },
      { target: "Envision Healthcare", value: "$7.7B", date: "2023-10-24", role: "Restructuring advisor", sector: "Healthcare", product: "Restructuring" },
    ],
  },
  {
    firm: "Jefferies",
    cities: ["New York", "San Francisco", "Houston", "Chicago", "Los Angeles", "Charlotte"],
    products: ["M&A", "Leveraged Finance", "ECM", "DCM"],
    coverage: ["Technology", "Healthcare", "Industrials", "Energy & Power", "Consumer & Retail", "Financial Sponsors"],
    domain: "jefferies.com",
    leagueTagline: "Top 5 Global Leveraged Finance · Fastest-Growing Sponsor Coverage",
    notableDeals: [
      { target: "Endeavor Operating Company", value: "$2.75B", date: "2024-05-10", role: "Joint lead arranger — term loan", sector: "TMT", product: "Leveraged Finance" },
      { target: "Carvana", value: "$3.4B", date: "2024-08-20", role: "Advisor on debt exchange", sector: "Consumer & Retail", product: "Restructuring" },
      { target: "Lulu's Fashion Lounge", value: "$152M", date: "2024-03-12", role: "Sole bookrunner — secondary offering", sector: "Consumer & Retail", product: "ECM" },
    ],
  },
  {
    firm: "Guggenheim",
    cities: ["New York", "Chicago", "Los Angeles", "San Francisco", "Houston"],
    products: ["M&A", "ECM", "DCM", "Restructuring"],
    coverage: ["Healthcare", "TMT", "Consumer & Retail", "Industrials", "Energy & Power"],
    domain: "guggenheimpartners.com",
    leagueTagline: "Top Boutique · Strong Healthcare & TMT Franchises",
    notableDeals: [
      { target: "ImmunoGen", acquirer: "AbbVie", value: "$10.1B", date: "2023-11-30", role: "Advisor to ImmunoGen", sector: "Healthcare", product: "M&A" },
      { target: "Cigna's Medicare Advantage Business", acquirer: "Health Care Service Corp", value: "$3.7B", date: "2024-01-24", role: "Advisor to Cigna", sector: "Healthcare", product: "M&A" },
    ],
  },
  {
    firm: "Lincoln International",
    cities: ["Chicago", "New York", "Los Angeles", "Atlanta", "Dallas", "Frankfurt", "London"],
    products: ["M&A", "Capital Markets", "Private Capital"],
    coverage: ["Industrials", "Business Services", "Consumer & Retail", "Healthcare", "Technology", "Financial Sponsors"],
    domain: "lincolninternational.com",
    leagueTagline: "Top Middle-Market M&A Advisor · 100% Sponsor Penetration",
    notableDeals: [
      { target: "Saratoga Specialty Coatings", acquirer: "Tinicum", value: "$185M", date: "2024-06-04", role: "Sell-side advisor", sector: "Industrials", product: "M&A" },
      { target: "Plant Prefab", acquirer: "Asahi Kasei Homes", value: "$120M", date: "2024-09-19", role: "Sell-side advisor", sector: "Real Estate", product: "M&A" },
    ],
  },
  {
    firm: "Harris Williams",
    cities: ["Richmond", "Boston", "New York", "Cleveland", "San Francisco", "Minneapolis", "Frankfurt"],
    products: ["M&A", "Private Capital"],
    coverage: ["Industrials", "Healthcare", "Technology", "Business Services", "Consumer & Retail", "Energy & Power"],
    domain: "harriswilliams.com",
    leagueTagline: "Premier Middle-Market Sell-Side Advisor",
    notableDeals: [
      { target: "Premier Tech", acquirer: "Caisse de dépôt", value: "$800M", date: "2024-06-12", role: "Sell-side advisor", sector: "Industrials", product: "M&A" },
      { target: "Pet Honesty", acquirer: "Compass Diversified", value: "$235M", date: "2024-08-01", role: "Sell-side advisor", sector: "Consumer & Retail", product: "M&A" },
    ],
  },
  {
    firm: "Stifel",
    cities: ["St. Louis", "New York", "San Francisco", "Boston", "Baltimore"],
    products: ["M&A", "ECM", "DCM"],
    coverage: ["Industrials", "Consumer & Retail", "Technology", "Healthcare", "FIG", "Real Estate"],
    domain: "stifel.com",
    leagueTagline: "Top 10 U.S. ECM Bookrunner",
    notableDeals: [
      { target: "Talen Energy", value: "$1.5B", date: "2024-07-15", role: "Co-manager — IPO", sector: "Energy & Power", product: "ECM" },
      { target: "Cresco Labs", value: "$320M", date: "2024-02-09", role: "Joint bookrunner — senior notes", sector: "Consumer & Retail", product: "DCM" },
    ],
  },
  {
    firm: "Raymond James",
    cities: ["St. Petersburg", "New York", "Chicago", "Atlanta", "Memphis", "Nashville"],
    products: ["M&A", "ECM", "DCM"],
    coverage: ["Energy & Power", "Real Estate", "Consumer & Retail", "Healthcare", "Industrials"],
    domain: "raymondjames.com",
    leagueTagline: "Top Energy & Power Mid-Cap Advisor",
    notableDeals: [
      { target: "Bonanza Creek", acquirer: "Civitas Resources", value: "$1.3B", date: "2023-10-30", role: "Advisor to Bonanza", sector: "Energy & Power", product: "M&A" },
      { target: "Inland Western Retail REIT", value: "$680M", date: "2024-04-19", role: "Joint bookrunner — preferred", sector: "Real Estate", product: "ECM" },
    ],
  },
  {
    firm: "Baird",
    cities: ["Milwaukee", "Chicago", "New York", "Boston", "Charlotte", "Denver"],
    products: ["M&A", "ECM", "DCM"],
    coverage: ["Industrials", "Healthcare", "Technology", "Consumer & Retail", "Business Services"],
    domain: "rwbaird.com",
    leagueTagline: "Top Middle-Market M&A · Strong Industrials Franchise",
    notableDeals: [
      { target: "Brunswick Corporation Mercury Outboard", value: "$650M", date: "2024-05-30", role: "Joint bookrunner — senior notes", sector: "Industrials", product: "DCM" },
      { target: "Mister Sparky Electric", acquirer: "Authority Brands", value: "$420M", date: "2024-07-08", role: "Sell-side advisor", sector: "Business Services", product: "M&A" },
    ],
  },
  {
    firm: "Cowen",
    cities: ["New York", "Boston", "San Francisco", "Chicago"],
    products: ["M&A", "ECM"],
    coverage: ["Healthcare", "Technology", "Consumer & Retail"],
    domain: "cowen.com",
    leagueTagline: "Top Healthcare ECM Bookrunner (Mid-Cap)",
    notableDeals: [
      { target: "MoonLake Immunotherapeutics", value: "$230M", date: "2024-06-11", role: "Joint bookrunner — follow-on", sector: "Healthcare", product: "ECM" },
    ],
  },
  {
    firm: "Perella Weinberg",
    cities: ["New York", "Houston", "Los Angeles", "San Francisco", "London"],
    products: ["M&A", "Restructuring"],
    coverage: ["Energy & Power", "Industrials", "Healthcare", "Financial Sponsors", "TMT"],
    domain: "pwpartners.com",
    leagueTagline: "Elite Independent Advisor · Strong Energy & Industrials",
    notableDeals: [
      { target: "Crestwood Equity Partners", acquirer: "Energy Transfer", value: "$7.1B", date: "2023-11-03", role: "Advisor to Crestwood", sector: "Energy & Power", product: "M&A" },
      { target: "Stagwell", value: "$640M", date: "2024-04-08", role: "Advisor to special committee", sector: "Media & Telecom", product: "M&A" },
    ],
  },
  {
    firm: "Rothschild & Co",
    cities: ["New York", "London", "Frankfurt", "Paris", "Los Angeles"],
    products: ["M&A", "Restructuring", "Capital Markets"],
    coverage: ["Industrials", "Healthcare", "Consumer & Retail", "Financial Sponsors", "FIG"],
    domain: "rothschildandco.com",
    leagueTagline: "#1 Global M&A by Deal Count · Leading European House",
    notableDeals: [
      { target: "Endeavour Mining", value: "$2.2B", date: "2024-03-25", role: "Advisor to Endeavour", sector: "Industrials", product: "M&A" },
    ],
  },
  {
    firm: "Greenhill",
    cities: ["New York", "Chicago", "London", "Frankfurt", "Tokyo"],
    products: ["M&A", "Restructuring", "Private Capital"],
    coverage: ["Healthcare", "Industrials", "Technology", "Energy & Power", "Financial Sponsors"],
    domain: "greenhill.com",
    leagueTagline: "Pure-Play Advisory · Now Part of Mizuho",
    notableDeals: [
      { target: "Cooper Companies", value: "$3.6B", date: "2024-02-15", role: "Advisor to Cooper", sector: "Healthcare", product: "M&A" },
    ],
  },
  {
    firm: "Bank of America",
    cities: ["New York", "Charlotte", "Chicago", "San Francisco", "Los Angeles", "Boston"],
    products: ["M&A", "ECM", "DCM", "Leveraged Finance"],
    coverage: ["Technology", "Healthcare", "Financial Sponsors", "Industrials", "TMT", "Consumer & Retail", "FIG"],
    domain: "bofa.com",
    leagueTagline: "Top 3 Global Investment Banking · #1 in U.S. ESG-Linked DCM",
    notableDeals: [
      { target: "Tapestry", acquirer: "Capri Holdings", value: "$8.5B", date: "2023-08-10", role: "Advisor to Tapestry", sector: "Consumer & Retail", product: "M&A" },
    ],
  },
  {
    firm: "Citi",
    cities: ["New York", "London", "San Francisco", "Houston", "Chicago"],
    products: ["M&A", "ECM", "DCM", "Leveraged Finance"],
    coverage: ["FIG", "Energy & Power", "Healthcare", "Technology", "Industrials"],
    domain: "citi.com",
    leagueTagline: "Top 5 Global Investment Banking · #1 EM DCM Bookrunner",
    notableDeals: [
      { target: "Discover Financial Services", acquirer: "Capital One", value: "$35.3B", date: "2024-02-19", role: "Advisor to Discover", sector: "FIG", product: "M&A" },
    ],
  },
];

export const ALL_FIRMS: Firm[] = FIRM_CATALOG.map((f) => f.firm);

export function getFirmProfile(firm: Firm): FirmProfile {
  const profile = FIRM_CATALOG.find((f) => f.firm === firm);
  if (!profile) throw new Error(`Unknown firm: ${firm}`);
  return profile;
}
