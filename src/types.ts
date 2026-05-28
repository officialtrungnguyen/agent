export type ContactStatus =
  | "Not Contacted"
  | "Queued"
  | "Scheduled"
  | "Sent"
  | "Replied"
  | "No Reply";

export type PriorityLevel = "Tier 1" | "Tier 2" | "Tier 3";

export type EmailVariant =
  | "Short"
  | "Relationship-First"
  | "Deal-Referenced"
  | "Aggressive";

export type QueueStatus = "Queued" | "Scheduled" | "Sent" | "Delivered" | "Failed";

export type TimelineEventType = "email" | "note" | "reply" | "follow-up";

export interface DealIntel {
  company: string;
  counterparty: string;
  value: string;
  date: string;
  description: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: string;
  location: string;
  teamDesk: string;
  coverageSectors: string[];
  school: string;
  priority: PriorityLevel;
  relationshipStrength: number;
  email: string;
  status: ContactStatus;
  lastOutreach: string | null;
  fitScore: number;
  sharedInterests: string[];
  styleNotes: string[];
  icebreakers: string[];
  recentTransactions: DealIntel[];
  notes: string[];
}

export interface ResumeAchievement {
  section: "experience" | "leadership" | "skills" | "education" | "awards";
  text: string;
}

export interface ResumeProfile {
  fileName: string;
  originalText: string;
  summary: string;
  education: string[];
  experience: string[];
  achievements: ResumeAchievement[];
  skills: string[];
  targetRole: string;
  personalPitch: string;
  uploadedAt: string;
}

export interface ResumeVariant {
  id: string;
  contactId: string;
  title: string;
  generatedAt: string;
  bullets: string[];
}

export interface GeneratedEmail {
  variant: EmailVariant;
  subjectOptions: string[];
  body: string;
  optimalSendAt: string;
}

export interface QueueItem {
  id: string;
  contactId: string;
  contactName: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  scheduledFor: string;
  status: QueueStatus;
  attachmentName?: string;
  serverId?: string;
  error?: string;
}

export interface TimelineEvent {
  id: string;
  contactId: string;
  type: TimelineEventType;
  title: string;
  body: string;
  timestamp: string;
}

export interface GmailAuthState {
  connected: boolean;
  email?: string;
  expiresAt?: string;
  scopes?: string[];
  needsReauth?: boolean;
}

export interface MetricsSnapshot {
  totalContacts: number;
  sent: number;
  replied: number;
  noReply: number;
  scheduled: number;
  queued: number;
  positiveResponses: number;
  replyRate: number;
  bestHooks: string[];
  bestSendWindows: string[];
}

export interface StrategyMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

export interface ContactFilters {
  search: string;
  firm: string;
  school: string;
  status: string;
  priority: string;
  coverage: string;
}

export interface CsvImportResult {
  imported: number;
  contacts: Contact[];
}
