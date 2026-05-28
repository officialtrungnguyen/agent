import type {
  AppSettings,
  ContactState,
  QueueItem,
  ResumeData,
  StrategyMessage,
} from "../types";

const KEYS = {
  contactStates: "bb_contact_states",
  resume: "bb_resume",
  queue: "bb_queue",
  settings: "bb_settings",
  strategy: "bb_strategy_chat",
  importedContacts: "bb_imported_contacts",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadContactStates(): Record<string, ContactState> {
  return load(KEYS.contactStates, {});
}

export function saveContactStates(states: Record<string, ContactState>): void {
  save(KEYS.contactStates, states);
}

export function getOrCreateContactState(
  contactId: string,
  states: Record<string, ContactState>
): ContactState {
  if (states[contactId]) return states[contactId];
  return {
    contactId,
    status: "not_contacted",
    relationshipStrength: 1,
    notes: "",
    outreachHistory: [],
  };
}

export function loadResume(): ResumeData | null {
  return load<ResumeData | null>(KEYS.resume, null);
}

export function saveResume(resume: ResumeData): void {
  save(KEYS.resume, resume);
}

export function loadQueue(): QueueItem[] {
  return load(KEYS.queue, []);
}

export function saveQueue(queue: QueueItem[]): void {
  save(KEYS.queue, queue);
}

export function loadSettings(): AppSettings {
  return load(KEYS.settings, {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    gmailConnected: false,
  });
}

export function saveSettings(settings: AppSettings): void {
  save(KEYS.settings, settings);
}

export function loadStrategyChat(): StrategyMessage[] {
  return load(KEYS.strategy, []);
}

export function saveStrategyChat(messages: StrategyMessage[]): void {
  save(KEYS.strategy, messages);
}

export function exportContactsCSV(
  headers: string[],
  rows: string[][]
): string {
  const escape = (v: string) =>
    v.includes(",") || v.includes('"')
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}
