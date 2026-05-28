export type ContactStatus =
  | "not_contacted"
  | "queued"
  | "scheduled"
  | "sent"
  | "replied"
  | "no_reply";

export type Priority = "critical" | "high" | "medium";

export type EmailVariant =
  | "short"
  | "relationship_first"
  | "deal_referenced"
  | "aggressive";

export interface DealTransaction {
  id: string;
  bankerId: string;
  company: string;
  counterparty: string;
  valueUsdBillions: number;
  announcedAt: string;
  summary: string;
  sector: string;
}

export interface Icebreaker {
  id: string;
  text: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firm: string;
  title: "Analyst" | "Associate" | "VP" | "Director" | "MD";
  teamDesk: string;
  coverageSectors: string[];
  school: string;
  location: string;
  priority: Priority;
  status: ContactStatus;
  lastOutreachAt?: string;
  lastInteractionAt?: string;
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  notes: string[];
  recentDeals: DealTransaction[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  graduationYear: string;
}

export interface ResumeData {
  parsedText: string;
  achievements: string[];
  skills: string[];
  education: ResumeEducation[];
  targetRole: string;
  personalPitch: string;
  tailoredBulletsByDesk: Record<string, string[]>;
}

export interface UserProfile {
  fullName: string;
  timezone: string;
  resume?: ResumeData;
}

export interface GmailAuthState {
  isAuthed: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
}

export interface OutreachEmail {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  createdAt: string;
  scheduledFor?: string;
  status: "draft" | "queued" | "scheduled" | "sent" | "delivered" | "failed";
  threadId?: string;
  attachedResumeText?: string;
}

export interface PipelineItem {
  id: string;
  contactId: string;
  action: "send_now" | "auto_schedule";
  emailDraft: OutreachEmail;
  createdAt: string;
}

export interface ContactIntel {
  teamDesk: string;
  coverageSectors: string[];
  transactions: DealTransaction[];
  sharedAlumniInterests: string[];
  styleInsights: string[];
  icebreakers: Icebreaker[];
}

export interface AnalyticsSnapshot {
  sent: number;
  replies: number;
  positiveResponses: number;
  replyRate: number;
  bestHooks: string[];
  bestSendTimes: string[];
}

export interface StrategyAdvice {
  id: string;
  createdAt: string;
  summary: string;
}
