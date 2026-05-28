export type OutreachStatus =
  | 'not-contacted'
  | 'queued'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'replied'
  | 'positive'
  | 'no-reply';

export type QueueStatus = 'queued' | 'scheduled' | 'sent' | 'delivered' | 'failed';
export type PriorityTier = 'A+' | 'A' | 'B' | 'C';
export type ViewMode = 'table' | 'kanban';
export type AttachmentMode = 'none' | 'original' | 'tailored';

export interface Transaction {
  company: string;
  counterparty: string;
  value: string;
  date: string;
  summary: string;
  role: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  firm: string;
  title: string;
  team: string;
  desk: string;
  coverageSectors: readonly string[];
  school: string;
  city: string;
  email: string;
  priority: PriorityTier;
  lastOutreach?: string;
  lastInteraction?: string;
  status: OutreachStatus;
  relationshipStrength: number;
  notes: readonly string[];
  sharedInterests: readonly string[];
  styleNotes: readonly string[];
  recentTransactions: Transaction[];
  teamMoves: readonly string[];
  deskMetrics: readonly string[];
}

export interface ResumeProfile {
  fileName?: string;
  originalFileBase64?: string;
  originalMimeType?: string;
  rawText: string;
  targetRole: string;
  pitch: string;
  education: string[];
  achievements: string[];
  experience: string[];
  skills: string[];
  tailoredBullets: Record<string, string[]>;
  lastParsedAt?: string;
}

export interface DraftVariant {
  label: 'Short' | 'Relationship-First' | 'Deal-Referenced' | 'Aggressive';
  subjectA: string;
  subjectB: string;
  hook: string;
  body: string;
  recommendedSendAt: string;
}

export interface QueueItem {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  sendAt: string;
  status: QueueStatus;
  variantLabel: DraftVariant['label'];
  hook: string;
  attachmentMode: AttachmentMode;
  attachmentFileName?: string;
  attachmentContent?: string;
  attachmentMimeType?: string;
  createdAt: string;
  gmailJobId?: string;
  error?: string;
}

export interface EmailHistoryItem {
  id: string;
  contactId: string;
  subject: string;
  body: string;
  hook: string;
  outcome: QueueStatus | 'reply' | 'positive';
  sentAt: string;
}

export interface StrategyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface GmailStatus {
  authenticated: boolean;
  email?: string;
  authUrl?: string;
  lastError?: string;
}

export interface FiltersState {
  search: string;
  firm: string;
  school: string;
  status: string;
  priority: string;
}

export interface AppState {
  contacts: Contact[];
  resume: ResumeProfile;
  queue: QueueItem[];
  history: EmailHistoryItem[];
  strategyMessages: StrategyMessage[];
  filters: FiltersState;
  selectedContactId?: string;
  composerContactId?: string;
  viewMode: ViewMode;
  timezone: string;
  gmailStatus: GmailStatus;
  lastQueueRunAt?: string;
  lastSyncAt?: string;
}

export interface MetricsSnapshot {
  sent: number;
  replyRate: number;
  positiveResponses: number;
  bestHooks: Array<{ hook: string; count: number }>;
  bestSendWindows: Array<{ window: string; count: number }>;
  topTargets: Contact[];
}

export interface ResumeParseResponse {
  rawText: string;
  education: string[];
  achievements: string[];
  experience: string[];
  skills: string[];
}

export interface GmailSendPayload {
  to: string;
  subject: string;
  body: string;
  sendAt?: string;
  attachment?: {
    fileName: string;
    mimeType: string;
    base64Content: string;
  };
}
