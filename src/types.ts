export type OutreachStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "replied"
  | "no_reply";

export type OutreachTone =
  | "short"
  | "relationship_first"
  | "deal_referenced"
  | "aggressive";

export type ReplySentiment = "positive" | "neutral" | "negative";

export interface DealTransaction {
  id: string;
  company: string;
  counterparty: string;
  valueUSDMillions: number;
  announcementDate: string;
  transactionType: "M&A" | "Restructuring" | "Capital Markets" | "Private Placement";
  sector: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: string;
  teamDesk: string;
  coverageSectors: string[];
  school: string;
  city: string;
  priority: "critical" | "high" | "medium";
  status: OutreachStatus;
  lastOutreach?: string;
  lastInteraction?: string;
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  notes: string;
  fitScore: number;
  recentDeals: DealTransaction[];
  personalStyle: string;
  icebreakers: string[];
  outreachHistory: OutreachLog[];
}

export interface OutreachLog {
  id: string;
  contactId: string;
  timestamp: string;
  subject: string;
  body: string;
  direction: "outbound" | "inbound";
  sentiment?: ReplySentiment;
  channel: "gmail";
}

export interface ResumeProfile {
  rawText: string;
  achievements: string[];
  skills: string[];
  education: string[];
  targetRole: string;
  personalPitch: string;
  tailoredBulletsByDesk: Record<string, string[]>;
  uploadedFileName?: string;
  uploadedMimeType?: string;
  uploadedBase64?: string;
  updatedAt: string;
}

export interface EmailDraft {
  id: string;
  contactId: string;
  variant: OutreachTone;
  to: string;
  subjectOptions: string[];
  body: string;
  chosenSubject: string;
  includeTailoredResume: boolean;
  createdAt: string;
}

export interface ScheduledQueueItem {
  id: string;
  draftId: string;
  contactId: string;
  sendAt?: string;
  status: "queued" | "scheduled" | "sent" | "delivered" | "failed";
  providerId?: string;
  providerStatus?: string;
  error?: string;
}

export interface GmailSession {
  sessionId: string;
  email: string;
}

export interface StrategyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface FiltersState {
  query: string;
  firm: string;
  status: "all" | OutreachStatus;
  priority: "all" | Contact["priority"];
  school: string;
  view: "table" | "kanban";
}
