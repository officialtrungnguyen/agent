// ─────────────────────────────────────────────────────────────
// BulgeBracket.ai — Core domain types
// Shared between the dashboard, intel agent, composer, queue and CRM.
// ─────────────────────────────────────────────────────────────

export type OutreachStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "replied"
  | "no_reply"
  | "meeting"
  | "closed";

export type Priority = "top" | "high" | "medium" | "low";

export type Division =
  | "M&A"
  | "Leveraged Finance"
  | "Restructuring"
  | "Equity Capital Markets"
  | "Debt Capital Markets"
  | "Financial Sponsors"
  | "Industrials"
  | "Technology"
  | "Healthcare"
  | "Consumer & Retail"
  | "FIG"
  | "Energy & Power"
  | "Real Estate"
  | "Media & Telecom"
  | "Generalist";

export type SeniorityLevel =
  | "Analyst"
  | "Associate"
  | "Vice President"
  | "Director"
  | "Senior Vice President"
  | "Managing Director"
  | "Partner";

/** A single closed/announced transaction tied to a banker's desk. */
export interface DealRecord {
  id: string;
  headline: string;
  client: string;
  counterparty?: string;
  valueUsd: number | null; // in USD millions; null = undisclosed
  type: "M&A" | "Financing" | "IPO" | "Restructuring" | "Advisory" | "Refinancing";
  sector: string;
  date: string; // ISO date
}

/** A canned, instantly-copyable conversation opener. */
export interface Icebreaker {
  id: string;
  text: string;
  angle: "deal" | "school" | "team" | "career" | "market";
}

/** A note attached to a contact's CRM record. */
export interface ContactNote {
  id: string;
  body: string;
  createdAt: string;
}

/** A logged outreach / interaction event for a contact. */
export interface OutreachEvent {
  id: string;
  type: "email_sent" | "email_scheduled" | "reply_received" | "follow_up" | "note" | "meeting" | "status_change";
  summary: string;
  at: string; // ISO timestamp
  meta?: Record<string, string | number | null>;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firm: string;
  title: string;
  level: SeniorityLevel;
  team: string; // exact desk, e.g. "Technology M&A — Software"
  division: Division;
  coverageSectors: string[];
  school: string;
  gradYear?: number;
  city: string;
  region: string;
  timezone: string; // IANA tz
  priority: Priority;
  sharedSchool: boolean;
  recentDeals: DealRecord[];
  personalStyle: string; // tone / icebreaker fodder
  interests: string[];
  linkedinHint?: string;
  // Mutable CRM / pipeline state (persisted in localStorage)
  status: OutreachStatus;
  relationshipStrength: number; // 0-5 stars
  lastOutreachAt?: string | null;
  lastReplyAt?: string | null;
  notes: ContactNote[];
  events: OutreachEvent[];
  fitScore?: number; // computed
}

/** Structured resume parsed from the user's upload. */
export interface ResumeProfile {
  rawText: string;
  fileName?: string;
  name?: string;
  email?: string;
  phone?: string;
  education: {
    school: string;
    degree?: string;
    gradYear?: number;
    gpa?: string;
  }[];
  experience: {
    company: string;
    role: string;
    period?: string;
    bullets: string[];
  }[];
  skills: string[];
  achievements: string[];
  uploadedAt: string;
}

/** The user's recruiting profile + preferences. */
export interface UserProfile {
  fullName: string;
  email: string;
  school: string;
  gradYear?: number;
  targetRole: string;
  targetFirms: string[];
  personalPitch: string;
  timezone: string;
  signature: string;
  resume?: ResumeProfile;
}

export type EmailVariant = "short" | "relationship" | "deal" | "aggressive";

export interface GeneratedEmail {
  subject: string;
  body: string;
  variant: EmailVariant;
  altSubjects: string[];
  wordCount: number;
  rationale: string;
}

export type QueueItemStatus =
  | "queued"
  | "scheduled"
  | "sending"
  | "sent"
  | "delivered"
  | "failed";

export interface QueueItem {
  id: string;
  contactId: string;
  to: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  attachResume: boolean;
  status: QueueItemStatus;
  scheduledFor?: string | null; // ISO timestamp
  createdAt: string;
  sentAt?: string | null;
  error?: string | null;
  isFollowUp?: boolean;
}

export interface GmailAuthState {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  expiresAt?: number;
}

export interface FitBreakdown {
  total: number;
  components: { label: string; score: number; max: number; note: string }[];
}

export interface AnalyticsSnapshot {
  total: number;
  contacted: number;
  sent: number;
  replied: number;
  meetings: number;
  replyRate: number;
  positiveRate: number;
  scheduled: number;
  noReply: number;
  topHooks: { hook: string; replies: number }[];
  bestSendWindows: { window: string; replies: number }[];
}
