import { useEffect, useState } from 'react';
import { contactsData } from '../contactsData';
import type { AppState, Contact, ResumeProfile } from '../types';

const STORAGE_KEY = 'bulgebracket-ai-state-v1';

const defaultResume: ResumeProfile = {
  rawText: '',
  targetRole: 'Investment Banking Summer Analyst',
  pitch: 'Curious, technically sharp, and energized by complex sell-side and M&A execution.',
  education: [],
  achievements: [],
  experience: [],
  skills: [],
  tailoredBullets: {},
};

export function createDefaultState(): AppState {
  return {
    contacts: contactsData,
    resume: defaultResume,
    queue: [],
    history: [],
    strategyMessages: [
      {
        id: 'strategy-system',
        role: 'assistant',
        content:
          'Focus this week on high-fit analysts and associates in your target group, then layer in VPs with one deal-specific observation rather than a generic career question.',
        createdAt: new Date().toISOString(),
      },
    ],
    filters: {
      search: '',
      firm: 'All',
      school: 'All',
      status: 'All',
      priority: 'All',
    },
    viewMode: 'table',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    gmailStatus: { authenticated: false },
  };
}

function mergeContacts(baseContacts: Contact[], storedContacts: Contact[]): Contact[] {
  const storedMap = new Map(storedContacts.map((contact) => [contact.id, contact]));
  return baseContacts.map((contact) => ({
    ...contact,
    ...(storedMap.get(contact.id) ?? {}),
    notes: storedMap.get(contact.id)?.notes ?? contact.notes,
    recentTransactions: storedMap.get(contact.id)?.recentTransactions ?? contact.recentTransactions,
    teamMoves: storedMap.get(contact.id)?.teamMoves ?? contact.teamMoves,
    deskMetrics: storedMap.get(contact.id)?.deskMetrics ?? contact.deskMetrics,
  }));
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...createDefaultState(),
      ...parsed,
      contacts: mergeContacts(contactsData, parsed.contacts ?? []),
      resume: {
        ...defaultResume,
        ...(parsed.resume ?? {}),
        tailoredBullets: parsed.resume?.tailoredBullets ?? {},
      },
    };
  } catch {
    return createDefaultState();
  }
}

export function usePersistentAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(loadState());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [state, setState] as const;
}
