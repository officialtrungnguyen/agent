"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppSettings,
  AppView,
  Contact,
  ContactState,
  GmailAuthState,
  OutreachEmail,
  ResumeProfile,
} from "@/types";
import { contactsData } from "@/lib/contactsData";
import { computeFitScore } from "@/lib/scoring";
import { daysSince, defaultSendWindows, uid } from "@/lib/utils";

const LS = {
  states: "bb.v1.contactStates",
  resume: "bb.v1.resume",
  emails: "bb.v1.emails",
  gmail: "bb.v1.gmail",
  settings: "bb.v1.settings",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore, app stays functional */
  }
}

function defaultState(contactId: string): ContactState {
  return {
    contactId,
    status: "not_contacted",
    relationship: 0,
    notes: "",
    tags: [],
    emailIds: [],
  };
}

const defaultSettings: AppSettings = {
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/New_York",
  sendWindows: defaultSendWindows,
  signature: "",
  dailyCap: 15,
};

interface StoreValue {
  contacts: Contact[];
  states: Record<string, ContactState>;
  resume: ResumeProfile | null;
  emails: OutreachEmail[];
  gmail: GmailAuthState;
  settings: AppSettings;
  view: AppView;
  selectedContactId: string | null;
  composerContactId: string | null;
  hydrated: boolean;

  setView: (v: AppView) => void;
  selectContact: (id: string | null) => void;
  openComposer: (id: string | null) => void;

  getState: (id: string) => ContactState;
  updateState: (id: string, patch: Partial<ContactState>) => void;
  getFit: (id: string) => { score: number; reasons: string[] };

  saveResume: (r: ResumeProfile | null) => void;

  queueEmail: (e: Omit<OutreachEmail, "id" | "createdAt">) => OutreachEmail;
  updateEmail: (id: string, patch: Partial<OutreachEmail>) => void;
  removeEmail: (id: string) => void;

  setGmail: (g: GmailAuthState) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<Record<string, ContactState>>({});
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [gmail, setGmailState] = useState<GmailAuthState>({ connected: false });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [view, setView] = useState<AppView>("ledger");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [composerContactId, setComposerContactId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage on mount
  useEffect(() => {
    setStates(load(LS.states, {}));
    setResume(load<ResumeProfile | null>(LS.resume, null));
    setEmails(load<OutreachEmail[]>(LS.emails, []));
    setGmailState(load<GmailAuthState>(LS.gmail, { connected: false }));
    setSettings({ ...defaultSettings, ...load<Partial<AppSettings>>(LS.settings, {}) });
    setHydrated(true);
  }, []);

  // persistence
  useEffect(() => {
    if (hydrated) save(LS.states, states);
  }, [states, hydrated]);
  useEffect(() => {
    if (hydrated) save(LS.resume, resume);
  }, [resume, hydrated]);
  useEffect(() => {
    if (hydrated) save(LS.emails, emails);
  }, [emails, hydrated]);
  useEffect(() => {
    if (hydrated) save(LS.gmail, gmail);
  }, [gmail, hydrated]);
  useEffect(() => {
    if (hydrated) save(LS.settings, settings);
  }, [settings, hydrated]);

  // Auto-flag 7-day no-reply on hydrate.
  useEffect(() => {
    if (!hydrated) return;
    setStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const s = next[id];
        if ((s.status === "sent" || s.status === "scheduled") && s.lastOutreachAt && !s.repliedAt) {
          const d = daysSince(s.lastOutreachAt);
          if (d !== null && d >= 7 && !s.followUpFlagged) {
            next[id] = { ...s, status: "no_reply", followUpFlagged: true };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const getState = useCallback(
    (id: string): ContactState => states[id] ?? defaultState(id),
    [states],
  );

  const updateState = useCallback((id: string, patch: Partial<ContactState>) => {
    setStates((prev) => {
      const base = prev[id] ?? defaultState(id);
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }, []);

  const contactsById = useMemo(() => {
    const map: Record<string, Contact> = {};
    for (const c of contactsData) map[c.id] = c;
    return map;
  }, []);

  // Memoized fit-score cache keyed on resume identity.
  const fitCache = useRef<Record<string, { score: number; reasons: string[] }>>({});
  const resumeKey = useRef<string>("");
  useEffect(() => {
    const key = resume
      ? JSON.stringify([resume.school, resume.targetRole, resume.targetFirms, resume.skills, resume.major])
      : "none";
    if (key !== resumeKey.current) {
      fitCache.current = {};
      resumeKey.current = key;
    }
  }, [resume]);

  const getFit = useCallback(
    (id: string) => {
      if (fitCache.current[id]) return fitCache.current[id];
      const c = contactsById[id];
      if (!c) return { score: 0, reasons: [] };
      const res = computeFitScore(c, resume);
      fitCache.current[id] = res;
      return res;
    },
    [contactsById, resume],
  );

  const saveResume = useCallback((r: ResumeProfile | null) => setResume(r), []);

  const queueEmail = useCallback((e: Omit<OutreachEmail, "id" | "createdAt">): OutreachEmail => {
    const email: OutreachEmail = { ...e, id: uid("email"), createdAt: Date.now() };
    setEmails((prev) => [email, ...prev]);
    setStates((prev) => {
      const base = prev[e.contactId] ?? defaultState(e.contactId);
      return { ...prev, [e.contactId]: { ...base, emailIds: [...base.emailIds, email.id] } };
    });
    return email;
  }, []);

  const updateEmail = useCallback((id: string, patch: Partial<OutreachEmail>) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const removeEmail = useCallback((id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setGmail = useCallback((g: GmailAuthState) => setGmailState(g), []);
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [],
  );

  const value: StoreValue = {
    contacts: contactsData,
    states,
    resume,
    emails,
    gmail,
    settings,
    view,
    selectedContactId,
    composerContactId,
    hydrated,
    setView,
    selectContact: setSelectedContactId,
    openComposer: setComposerContactId,
    getState,
    updateState,
    getFit,
    saveResume,
    queueEmail,
    updateEmail,
    removeEmail,
    setGmail,
    updateSettings,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
