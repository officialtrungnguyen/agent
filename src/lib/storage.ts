// ─────────────────────────────────────────────────────────────
// localStorage persistence layer
//
// Persists the user profile, per-contact CRM state (status, notes,
// events, relationship strength, last outreach), and the outreach
// queue. Contact seed data is merged with persisted CRM overrides on
// load so we never lose the rich generated profiles.
// ─────────────────────────────────────────────────────────────

import type { Contact, QueueItem, UserProfile } from "../types";
import { SEED_CONTACTS, USER_DEFAULT_SCHOOL } from "../data/contactsData";

const KEYS = {
  user: "bb_user_profile_v1",
  crm: "bb_contact_crm_v1",
  queue: "bb_queue_v1",
  onboarded: "bb_onboarded_v1",
} as const;

type CrmOverride = Pick<
  Contact,
  "status" | "relationshipStrength" | "lastOutreachAt" | "lastReplyAt" | "notes" | "events"
>;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

// ── User profile ─────────────────────────────────────────────
export function loadUser(): UserProfile {
  const fallback: UserProfile = {
    fullName: "",
    email: "",
    school: USER_DEFAULT_SCHOOL,
    gradYear: 2027,
    targetRole: "Investment Banking Summer Analyst",
    targetFirms: ["Houlihan Lokey", "Piper Sandler", "William Blair", "Moelis & Company"],
    personalPitch:
      "Driven finance student with a passion for M&A and a relentless work ethic, targeting an analyst seat at an elite advisory firm.",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    signature: "Best,\n",
  };
  const stored = safeGet<Partial<UserProfile>>(KEYS.user, {});
  return { ...fallback, ...stored };
}

export function saveUser(user: UserProfile): void {
  safeSet(KEYS.user, user);
}

// ── Contacts (seed + CRM overrides) ──────────────────────────
export function loadContacts(): Contact[] {
  const overrides = safeGet<Record<string, CrmOverride>>(KEYS.crm, {});
  return SEED_CONTACTS.map((c) => {
    const o = overrides[c.id];
    if (!o) return { ...c };
    return {
      ...c,
      status: o.status ?? c.status,
      relationshipStrength: o.relationshipStrength ?? c.relationshipStrength,
      lastOutreachAt: o.lastOutreachAt ?? c.lastOutreachAt,
      lastReplyAt: o.lastReplyAt ?? c.lastReplyAt,
      notes: o.notes ?? c.notes,
      events: o.events ?? c.events,
    };
  });
}

export function saveContacts(contacts: Contact[]): void {
  const overrides: Record<string, CrmOverride> = {};
  for (const c of contacts) {
    // Only persist contacts that have diverged from the clean slate.
    const touched =
      c.status !== "not_contacted" ||
      c.relationshipStrength > 0 ||
      c.lastOutreachAt ||
      c.lastReplyAt ||
      c.notes.length > 0 ||
      c.events.length > 0;
    if (touched) {
      overrides[c.id] = {
        status: c.status,
        relationshipStrength: c.relationshipStrength,
        lastOutreachAt: c.lastOutreachAt ?? null,
        lastReplyAt: c.lastReplyAt ?? null,
        notes: c.notes,
        events: c.events,
      };
    }
  }
  safeSet(KEYS.crm, overrides);
}

// ── Queue ────────────────────────────────────────────────────
export function loadQueue(): QueueItem[] {
  return safeGet<QueueItem[]>(KEYS.queue, []);
}

export function saveQueue(queue: QueueItem[]): void {
  safeSet(KEYS.queue, queue);
}

// ── Onboarding flag ──────────────────────────────────────────
export function isOnboarded(): boolean {
  return safeGet<boolean>(KEYS.onboarded, false);
}

export function setOnboarded(v: boolean): void {
  safeSet(KEYS.onboarded, v);
}

export function resetAll(): void {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}
