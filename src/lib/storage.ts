"use client";

import type { Contact, QueuedEmail, ResumeData } from "@/types";

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  CONTACTS: "bb_contacts_v2",
  EMAIL_QUEUE: "bb_email_queue_v2",
  RESUME: "bb_resume_v2",
  SETTINGS: "bb_settings_v2",
  OUTREACH_HISTORY: "bb_outreach_history_v2",
} as const;

// ─── Generic Helpers ──────────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("localStorage write failed:", key);
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function getStoredContacts(): Contact[] | null {
  return safeGet<Contact[] | null>(KEYS.CONTACTS, null);
}

export function setStoredContacts(contacts: Contact[]): void {
  safeSet(KEYS.CONTACTS, contacts);
}

export function clearStoredContacts(): void {
  safeRemove(KEYS.CONTACTS);
}

// ─── Email Queue ──────────────────────────────────────────────────────────────

export function getEmailQueue(): QueuedEmail[] {
  return safeGet<QueuedEmail[]>(KEYS.EMAIL_QUEUE, []);
}

export function setEmailQueue(queue: QueuedEmail[]): void {
  safeSet(KEYS.EMAIL_QUEUE, queue);
}

export function addToEmailQueue(email: QueuedEmail): void {
  const queue = getEmailQueue();
  queue.push(email);
  setEmailQueue(queue);
}

export function updateEmailInQueue(id: string, updates: Partial<QueuedEmail>): void {
  const queue = getEmailQueue();
  const idx = queue.findIndex((e) => e.id === id);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    setEmailQueue(queue);
  }
}

export function removeFromEmailQueue(id: string): void {
  const queue = getEmailQueue().filter((e) => e.id !== id);
  setEmailQueue(queue);
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export function getStoredResume(): ResumeData | null {
  return safeGet<ResumeData | null>(KEYS.RESUME, null);
}

export function setStoredResume(resume: ResumeData): void {
  safeSet(KEYS.RESUME, resume);
}

export function clearStoredResume(): void {
  safeRemove(KEYS.RESUME);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  gmailConnected: boolean;
  userEmail: string | null;
  accessToken: string | null;
  targetRole: string;
  targetFirms: string[];
  userSchool: string;
  timezone: string;
  defaultSendDelay: number;
  autoFollowUp: boolean;
  followUpDays: number;
  onboardingComplete: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  gmailConnected: false,
  userEmail: null,
  accessToken: null,
  targetRole: "Investment Banking Analyst",
  targetFirms: [],
  userSchool: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  defaultSendDelay: 0,
  autoFollowUp: true,
  followUpDays: 7,
  onboardingComplete: false,
};

export function getSettings(): AppSettings {
  return safeGet<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...updates };
  safeSet(KEYS.SETTINGS, updated);
  return updated;
}

// ─── Scheduled Email Processor ────────────────────────────────────────────────

export function getScheduledEmailsDue(): QueuedEmail[] {
  const queue = getEmailQueue();
  const now = new Date();
  return queue.filter(
    (e) =>
      e.status === "scheduled" &&
      e.scheduledFor &&
      new Date(e.scheduledFor) <= now
  );
}
