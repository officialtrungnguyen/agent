export type OutreachStatus =
  | "not_contacted"
  | "sent"
  | "replied"
  | "no_reply";

export type ContactPriority = "high" | "medium" | "low";

export interface Deal {
  company: string;
  value: string;
  date: string;
  role: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: string;
  team: string;
  coverage: string[];
  school: string;
  priority: ContactPriority;
  email?: string;
  recentDeals: Deal[];
  personalStyle: string;
  icebreakerSeeds: string[];
  alumniInterests: string[];
  deskMetrics?: string;
}

export interface ContactState {
  contactId: string;
  status: OutreachStatus;
  lastOutreach?: string;
  lastReply?: string;
  fitScore?: number;
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  notes: string;
  outreachHistory: OutreachRecord[];
}

export interface OutreachRecord {
  id: string;
  date: string;
  subject: string;
  body: string;
  type: "initial" | "followup_7" | "followup_14";
  status: "draft" | "queued" | "scheduled" | "sent" | "delivered";
  scheduledFor?: string;
  gmailMessageId?: string;
}

export interface ResumeData {
  rawText: string;
  fileName?: string;
  parsedAt: string;
  name: string;
  email: string;
  phone?: string;
  school: string;
  graduationYear: string;
  targetRole: string;
  personalPitch: string;
  education: string[];
  experience: ResumeExperience[];
  skills: string[];
  achievements: string[];
}

export interface ResumeExperience {
  firm: string;
  title: string;
  dates: string;
  bullets: string[];
}

export interface EmailVariant {
  id: string;
  label: string;
  subject: string;
  body: string;
}

export interface QueueItem {
  id: string;
  contactId: string;
  contactName: string;
  subject: string;
  body: string;
  status: "queued" | "scheduled" | "sent" | "delivered" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  attachResume: boolean;
  tailoredResume?: string;
}

export interface AppSettings {
  timezone: string;
  gmailConnected: boolean;
  gmailEmail?: string;
}

export interface AnalyticsSnapshot {
  sent: number;
  replies: number;
  positiveResponses: number;
  replyRate: number;
  bestHooks: { hook: string; count: number }[];
  bestSendTimes: { hour: number; count: number }[];
}

export type KanbanColumn = OutreachStatus;

export interface StrategyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
