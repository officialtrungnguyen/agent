/**
 * BulgeBracket.ai — domain types.
 *
 * These models power the alumni ledger, AI scoring engine, outreach composer,
 * Gmail scheduler, and analytics surface. They are intentionally rich so the
 * AI features have plenty of signal to reason about — even offline.
 */

export type OutreachStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "opened"
  | "replied"
  | "no_reply"
  | "meeting_set"
  | "closed";

export type Priority = "S" | "A" | "B" | "C";

export type Seniority =
  | "Analyst"
  | "Associate"
  | "Vice President"
  | "Director"
  | "Senior Vice President"
  | "Managing Director"
  | "Partner";

export type CoverageSector =
  | "Technology"
  | "Healthcare"
  | "Financial Sponsors"
  | "Industrials"
  | "Consumer & Retail"
  | "Energy & Power"
  | "Real Estate"
  | "FIG"
  | "Media & Telecom"
  | "TMT"
  | "Restructuring"
  | "Capital Markets"
  | "Special Situations"
  | "Aerospace & Defense"
  | "Business Services";

export type Product =
  | "M&A"
  | "Restructuring"
  | "Capital Markets"
  | "Leveraged Finance"
  | "ECM"
  | "DCM"
  | "Private Capital";

export type Firm =
  | "Houlihan Lokey"
  | "Piper Sandler"
  | "Goldman Sachs"
  | "William Blair"
  | "Moelis & Company"
  | "Morgan Stanley"
  | "JPMorgan"
  | "Evercore"
  | "Lazard"
  | "Centerview"
  | "PJT Partners"
  | "Jefferies"
  | "Guggenheim"
  | "Lincoln International"
  | "Harris Williams"
  | "Stifel"
  | "Raymond James"
  | "Baird"
  | "Cowen"
  | "Perella Weinberg"
  | "Rothschild & Co"
  | "Greenhill"
  | "Bank of America"
  | "Citi";

export interface DealReference {
  target: string;
  acquirer?: string;
  value: string; // e.g. "$1.2B"
  date: string; // ISO date string
  role: string; // e.g. "Sell-side advisor to target"
  product: Product;
}

export interface ContactNote {
  id: string;
  contactId: string;
  body: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  firm: Firm;
  title: string;
  seniority: Seniority;
  desk: string; // exact team / desk (e.g. "Healthcare M&A — NYC")
  city: string;
  coverage: CoverageSector[];
  products: Product[];
  school: string;
  gradYear?: number;
  priority: Priority;
  fitScore: number; // 0-100, computed by AI scoring engine
  fitReasoning: string[]; // bullet list reasons backing the score
  recentDeals: DealReference[];
  interests: string[];
  icebreakers: string[];
  desk_metrics?: {
    headcount?: number;
    annualMandates?: number;
    leagueRank?: string;
  };
  linkedInHandle?: string;
  status: OutreachStatus;
  relationshipStars: 1 | 2 | 3 | 4 | 5;
  lastOutreachAt?: string;
  lastReplyAt?: string;
  nextFollowupAt?: string;
  tags?: string[];
}

export interface UserResume {
  rawText: string;
  fileName?: string;
  updatedAt: string;
  summary: string;
  headline: string;
  targetRole: string;
  targetFirms: string[];
  achievements: string[]; // resume bullets
  skills: string[];
  education: {
    school: string;
    degree: string;
    graduation: string;
    gpa?: string;
    honors?: string[];
  }[];
  experience: {
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
}

export interface EmailVariantStyle {
  id: "short" | "relationship" | "deal" | "aggressive";
  label: string;
  description: string;
}

export interface DraftEmail {
  id: string;
  contactId: string;
  variant: EmailVariantStyle["id"];
  subject: string;
  body: string;
  signature?: string;
  attachResume?: boolean;
  resumeFileName?: string;
  createdAt: string;
  scheduledFor?: string; // ISO datetime
  sentAt?: string;
  status: "draft" | "queued" | "scheduled" | "sent" | "failed";
  threadId?: string;
  gmailMessageId?: string;
  failureReason?: string;
}

export interface GmailIdentity {
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

export interface AppPreferences {
  userName: string;
  userEmail: string;
  school: string;
  graduationYear?: number;
  targetRole: string;
  pitch: string;
  timezone: string;
  signature: string;
}

export interface ConversationHistoryEntry {
  id: string;
  type: "email_sent" | "email_scheduled" | "reply_received" | "note" | "meeting_set" | "follow_up_sent";
  contactId: string;
  at: string;
  summary: string;
}
