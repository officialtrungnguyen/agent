export type OutreachStatus =
  | "Not Contacted"
  | "Queued"
  | "Scheduled"
  | "Sent"
  | "Delivered"
  | "Replied"
  | "Positive"
  | "No Reply";

export type Priority = "A+" | "A" | "B" | "C";

export type BankerLevel = "Analyst" | "Associate" | "VP" | "Director" | "MD" | "Partner";

export type EmailVariant =
  | "Short"
  | "Relationship-First"
  | "Deal-Referenced"
  | "Aggressive";

export interface Deal {
  company: string;
  counterparty: string;
  value: string;
  date: string;
  type: "M&A" | "Sell-side" | "Buy-side" | "IPO" | "Debt" | "Restructuring";
  angle: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: string;
  level: BankerLevel;
  team: string;
  coverageSectors: string[];
  school: string;
  location: string;
  email: string;
  priority: Priority;
  status: OutreachStatus;
  lastOutreach?: string;
  lastInteraction?: string;
  notes: string[];
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  personalStyle: string[];
  sharedInterests: string[];
  recentDeals: Deal[];
}

export interface ResumeProfile {
  rawText: string;
  fileName?: string;
  education: string[];
  skills: string[];
  achievements: string[];
  experiences: string[];
  targetRole: string;
  personalPitch: string;
  uploadedAt?: string;
  originalAttachment?: StoredAttachment;
}

export interface StoredAttachment {
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface OutreachRecord {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  sentAt?: string;
  scheduledFor?: string;
  status: OutreachStatus;
  hook: string;
  attachmentName?: string;
  threadId?: string;
}

export interface QueuedEmail {
  id: string;
  contactId: string;
  to: string;
  subject: string;
  body: string;
  scheduledFor?: string;
  status: OutreachStatus;
  attachment?: StoredAttachment;
  variant: EmailVariant;
}

export interface GmailAuthState {
  accessToken?: string;
  expiresAt?: number;
  email?: string;
}

export interface Metrics {
  sent: number;
  replies: number;
  positives: number;
  replyRate: number;
  bestHooks: string[];
  bestSendTimes: string[];
}
