// BulgeBracket.ai — core domain types

export type OutreachStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "replied"
  | "no_reply"
  | "meeting"
  | "closed";

export type Priority = "tier_1" | "tier_2" | "tier_3";

export type SeniorityTier = "analyst" | "associate" | "vp" | "director" | "md";

export interface Transaction {
  /** e.g. "Sell-side advisory" */
  type: string;
  /** target / counterparty */
  company: string;
  /** acquirer or counterparty, optional */
  counterparty?: string;
  /** deal value, formatted e.g. "$1.2B" */
  value: string;
  /** ISO-ish date label, e.g. "Mar 2025" */
  date: string;
  /** short descriptor */
  note?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  /** Analyst, Associate, Vice President, Director, Managing Director */
  title: string;
  seniority: SeniorityTier;
  /** Exact team / desk, e.g. "Technology M&A — West Coast" */
  team: string;
  /** Coverage sectors */
  coverage: string[];
  /** Group, e.g. "Investment Banking", "Restructuring", "Leveraged Finance" */
  group: string;
  school: string;
  gradYear?: number;
  city: string;
  email?: string;
  priority: Priority;
  recentDeals: Transaction[];
  sharedInterests: string[];
  personalStyle: string;
  /** seed icebreakers (offline-first) */
  icebreakers: string[];
  /** notable career path note */
  careerNote: string;
}

/** Mutable per-contact CRM state stored in localStorage */
export interface ContactState {
  contactId: string;
  status: OutreachStatus;
  /** last outreach timestamp (ms) */
  lastOutreachAt?: number;
  /** when a reply was logged (ms) */
  repliedAt?: number;
  /** 1–5 relationship strength */
  relationship: number;
  notes: string;
  /** free-form tags */
  tags: string[];
  /** cached AI fit score 0–100 */
  fitScore?: number;
  fitReasons?: string[];
  /** ids of emails sent to this contact */
  emailIds: string[];
  /** whether flagged for follow-up */
  followUpFlagged?: boolean;
  starred?: boolean;
}

export interface ResumeProfile {
  rawText: string;
  fileName?: string;
  uploadedAt?: number;
  name: string;
  email: string;
  phone: string;
  school: string;
  gradYear: string;
  gpa: string;
  major: string;
  targetRole: string;
  targetFirms: string[];
  personalPitch: string;
  skills: string[];
  achievements: string[];
  experience: ResumeExperience[];
  /** base64 of the original file for attachment */
  fileDataUrl?: string;
}

export interface ResumeExperience {
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export type EmailVariant =
  | "short"
  | "relationship"
  | "deal_referenced"
  | "aggressive";

export type EmailStatus =
  | "draft"
  | "queued"
  | "scheduled"
  | "sending"
  | "sent"
  | "delivered"
  | "failed";

export interface OutreachEmail {
  id: string;
  contactId: string;
  to: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  status: EmailStatus;
  createdAt: number;
  /** scheduled send time (ms) */
  scheduledAt?: number;
  sentAt?: number;
  /** whether it's a follow-up and which step */
  followUpStep?: number;
  attachResume?: boolean;
  error?: string;
  gmailThreadId?: string;
  gmailMessageId?: string;
}

export interface GmailAuthState {
  connected: boolean;
  email?: string;
  expiresAt?: number;
}

export interface AppSettings {
  timezone: string;
  /** send-time windows by seniority, 24h local hours */
  sendWindows: Record<SeniorityTier, [number, number]>;
  signature: string;
  dailyCap: number;
}

export type AppView =
  | "ledger"
  | "kanban"
  | "resume"
  | "analytics"
  | "followups"
  | "top20";

export interface AnalyticsSnapshot {
  totalContacts: number;
  sent: number;
  replied: number;
  meetings: number;
  replyRate: number;
  positiveRate: number;
  scheduled: number;
  queued: number;
  noReply: number;
  bestSendHour: number | null;
  topHooks: { hook: string; count: number }[];
}
