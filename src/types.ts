// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Seniority = "analyst" | "associate" | "vp" | "director" | "md" | "partner";

export type ContactStatus =
  | "not_contacted"
  | "sent"
  | "replied"
  | "no_reply"
  | "positive"
  | "coffee_chat"
  | "closed";

export type Priority = "high" | "medium" | "low";

export type EmailVariant = "short" | "relationship" | "deal_referenced" | "aggressive";

export type EmailQueueStatus = "queued" | "scheduled" | "sent" | "delivered" | "failed" | "cancelled";

// ─── Deal Intelligence ────────────────────────────────────────────────────────

export interface Deal {
  title: string;
  description: string;
  value: string;
  date: string;
  role: string;
  type: "M&A" | "IPO" | "Debt" | "Restructuring" | "Advisory" | "Equity" | "LBO";
  sector: string;
  companies: string[];
}

// ─── Contact Model ────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firm: string;
  title: string;
  seniority: Seniority;
  team: string;
  coverageSectors: string[];
  school: string;
  graduationYear: number;
  undergrad: string;
  location: string;
  city: string;
  priority: Priority;
  status: ContactStatus;
  fitScore: number;
  lastOutreach: string | null;
  lastReply: string | null;
  notes: string;
  relationshipStrength: number;
  recentDeals: Deal[];
  icebreakers: string[];
  personalStyle: string;
  linkedinKeywords: string[];
  timezone: string;
  outreachHistory: OutreachHistory[];
  tags: string[];
  phone?: string;
}

// ─── Outreach History ─────────────────────────────────────────────────────────

export interface OutreachHistory {
  id: string;
  type: "email" | "call" | "meeting" | "linkedin" | "coffee_chat";
  date: string;
  subject?: string;
  body?: string;
  outcome: "sent" | "replied" | "no_reply" | "positive" | "meeting_set";
  notes?: string;
}

// ─── Email Queue ──────────────────────────────────────────────────────────────

export interface QueuedEmail {
  id: string;
  contactId: string;
  contactName: string;
  contactFirm: string;
  to: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  status: EmailQueueStatus;
  scheduledFor: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  attachResume: boolean;
  isFollowUp: boolean;
  followUpDay: number;
  createdAt: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
}

// ─── Resume Intelligence ──────────────────────────────────────────────────────

export interface Education {
  institution: string;
  degree: string;
  field: string;
  gpa?: string;
  graduationYear: number;
  honors?: string[];
  activities?: string[];
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  sector?: string;
  type: "investment_banking" | "private_equity" | "consulting" | "finance" | "other";
}

export interface ResumeData {
  rawText: string;
  name: string;
  email: string;
  phone: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  achievements: string[];
  targetRole: string;
  targetFirms: string[];
  targetSectors: string[];
  personalPitch: string;
  parsedAt: string;
  fileName: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  totalContacts: number;
  totalSent: number;
  totalReplied: number;
  replyRate: number;
  positiveResponses: number;
  coffeeChatsScheduled: number;
  averageFitScore: number;
  emailsByFirm: Record<string, number>;
  emailsByStatus: Record<string, number>;
  bestSendTimes: { hour: number; replyRate: number }[];
  topPerformingSubjects: { subject: string; replyRate: number; opens: number }[];
  weeklyActivity: { week: string; sent: number; replied: number }[];
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  contacts: Contact[];
  emailQueue: QueuedEmail[];
  resume: ResumeData | null;
  selectedContactId: string | null;
  activeTab: string;
  filters: ContactFilters;
  viewMode: "table" | "kanban";
  gmailConnected: boolean;
  userEmail: string | null;
}

export interface ContactFilters {
  search: string;
  firms: string[];
  schools: string[];
  seniorities: Seniority[];
  statuses: ContactStatus[];
  priorities: Priority[];
  sectors: string[];
  minFitScore: number;
  maxFitScore: number;
  hasNoReply: boolean;
}

// ─── AI Generation ───────────────────────────────────────────────────────────

export interface EmailGenerationRequest {
  contact: Contact;
  resume: ResumeData | null;
  variant: EmailVariant;
  customInstructions?: string;
}

export interface EmailGenerationResult {
  subject: string;
  body: string;
  alternativeSubjects: string[];
  wordCount: number;
  confidenceScore: number;
}

export interface ResearchResult {
  recentDeals: Deal[];
  teamMoves: string[];
  icebreakers: string[];
  marketContext: string;
  personalStyle: string;
  source: "live" | "cached" | "offline";
}

// ─── Gmail Types ──────────────────────────────────────────────────────────────

export interface GmailCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  replyToMessageId?: string;
  attachResume?: boolean;
  resumeData?: string;
}

export interface ScheduleEmailRequest extends SendEmailRequest {
  scheduledFor: string;
}
