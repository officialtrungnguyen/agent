export type OutreachStatus =
  | "Not Contacted"
  | "Queued"
  | "Scheduled"
  | "Sent"
  | "Replied"
  | "No Reply"
  | "Positive"
  | "Passed";

export type Priority = "Core" | "High" | "Medium" | "Opportunistic";
export type Seniority = "Analyst" | "Associate" | "VP" | "Director" | "MD";
export type EmailVariant = "Short" | "Relationship-First" | "Deal-Referenced" | "Aggressive";

export interface Transaction {
  company: string;
  counterparty: string;
  role: "Sell-side advisor" | "Buy-side advisor" | "Capital raise" | "Restructuring" | "IPO";
  value: number;
  announced: string;
  sector: string;
  note: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: Seniority;
  team: string;
  coverageSectors: string[];
  school: string;
  geography: string;
  priority: Priority;
  email: string;
  linkedinUrl: string;
  googleSearchUrl: string;
  recentTransactions: Transaction[];
  alumniInterests: string[];
  personalStyle: string;
  deskMetrics: {
    activeMandates: number;
    trailingDealVolume: number;
    responseWarmth: number;
  };
  status: OutreachStatus;
  lastOutreach?: string;
  lastInteraction?: string;
  notes: string[];
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
}

export interface ParsedResume {
  rawText: string;
  fileName?: string;
  fileType?: string;
  fileDataUrl?: string;
  education: string[];
  achievements: string[];
  skills: string[];
  experience: string[];
  leadership: string[];
  targetRole: string;
  personalPitch: string;
  updatedAt: string;
}

export interface ContactScore {
  contactId: string;
  score: number;
  reasons: string[];
}

export interface DraftEmail {
  id: string;
  contactId: string;
  variant: EmailVariant;
  subject: string;
  body: string;
  createdAt: string;
  attachResume: boolean;
  attachmentName?: string;
}

export interface QueueItem {
  id: string;
  contactId: string;
  draft: DraftEmail;
  scheduledFor?: string;
  status: "Queued" | "Scheduled" | "Sending" | "Sent" | "Delivered" | "Failed";
  error?: string;
  sentAt?: string;
}

export interface OutreachHistoryItem {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  sentAt: string;
  variant: EmailVariant;
  status: "Sent" | "Delivered" | "Replied" | "Positive" | "No Reply";
}

export interface UserProfile {
  name: string;
  email: string;
  school: string;
  timezone: string;
  targetRole: string;
  personalPitch: string;
}

export interface GmailAuthState {
  accessToken?: string;
  expiresAt?: number;
  email?: string;
  connected: boolean;
}

export interface AppState {
  contacts: Contact[];
  resume?: ParsedResume;
  userProfile: UserProfile;
  queue: QueueItem[];
  history: OutreachHistoryItem[];
  gmail: GmailAuthState;
}

export interface StrategyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
