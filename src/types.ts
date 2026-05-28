// Core domain types for BulgeBracket.ai

export type ContactStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "replied"
  | "no_reply"
  | "meeting_set"
  | "passed";

export type Seniority =
  | "Analyst"
  | "Associate"
  | "Vice President"
  | "Director"
  | "Managing Director"
  | "Partner";

export type FirmGroup =
  | "Bulge Bracket"
  | "Elite Boutique"
  | "Middle Market"
  | "Restructuring"
  | "Industry Specialist";

export interface RecentDeal {
  title: string;        // "Advised XYZ on $1.4B sale to ABC"
  date: string;         // ISO yyyy-mm
  value?: string;       // "$1.4B"
  sector?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;        // best-effort discovered email or known address
  firm: string;
  firmGroup: FirmGroup;
  title: string;
  seniority: Seniority;
  team: string;          // e.g. "M&A — Industrials"
  desk?: string;         // e.g. "Houston Energy"
  coverage: string[];    // sectors
  school: string;
  gradYear?: number;
  city: string;
  priority: 1 | 2 | 3 | 4 | 5; // 5 highest
  status: ContactStatus;
  fitScore?: number;     // 0-100 (computed)
  relationshipStars?: 0 | 1 | 2 | 3 | 4 | 5;
  lastOutreachAt?: string; // ISO
  lastReplyAt?: string;    // ISO
  notes?: string;
  tags?: string[];
  recentDeals?: RecentDeal[];
  bio?: string;
  linkedinHint?: string;   // optional helper, not used to build search URL
  personalStyle?: string;  // for icebreakers
  yearsAtFirm?: number;
  previousFirm?: string;
}

export interface ResumeData {
  rawText: string;
  fileName?: string;
  uploadedAt: string;
  candidate: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    targetRole?: string;
    pitch?: string;
  };
  education: Array<{
    school: string;
    degree?: string;
    gradYear?: string;
    gpa?: string;
    honors?: string[];
  }>;
  experiences: Array<{
    company: string;
    title: string;
    dates?: string;
    bullets: string[];
  }>;
  skills: string[];
  achievements: string[];
}

export interface OutreachEmail {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  variant: "short" | "relationship" | "deal" | "aggressive" | "followup7" | "followup14" | "custom";
  status: "draft" | "queued" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: string; // ISO
  sentAt?: string;       // ISO
  threadId?: string;
  messageId?: string;
  error?: string;
  attachResume?: boolean;
  resumeFileName?: string;
  createdAt: string;
  parentEmailId?: string; // for follow-ups
}

export interface ActivityEvent {
  id: string;
  contactId: string;
  type: "note" | "email_sent" | "email_scheduled" | "email_failed" | "reply_logged" | "meeting" | "status_change";
  text: string;
  at: string; // ISO
}

export interface UserProfile {
  name?: string;
  email?: string;
  picture?: string;
  gmailConnected: boolean;
  gmailScopeOk: boolean;
  timezone: string;
  targetRole: string;       // "Summer Analyst — M&A"
  targetClass?: string;     // "Summer 2027"
  preferredFirms: string[];
  personalPitch: string;
}

export interface PipelineMetrics {
  totalContacts: number;
  contacted: number;
  sent: number;
  replied: number;
  positive: number;
  meetingsSet: number;
  noReply: number;
  replyRate: number;
  positiveRate: number;
  bestHooks: Array<{ hook: string; rate: number; n: number }>;
  bestSendTimes: Array<{ hour: number; rate: number; n: number }>;
}
