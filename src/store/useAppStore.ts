import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  AppPreferences,
  Contact,
  ContactNote,
  ConversationHistoryEntry,
  DraftEmail,
  GmailIdentity,
  OutreachStatus,
  UserResume,
} from "@/types";
import { SEED_CONTACTS } from "@/data/contactsData";
import { computeFitScore } from "@/lib/scoring";

interface AppState {
  // Persistent state
  contacts: Contact[];
  resume: UserResume | null;
  preferences: AppPreferences;
  drafts: DraftEmail[];
  notes: ContactNote[];
  conversationLog: ConversationHistoryEntry[];

  // Session state
  selectedContactId: string | null;
  composerOpenForId: string | null;
  intelOpenForId: string | null;
  view: "table" | "kanban" | "analytics" | "pipeline" | "strategy" | "resume" | "settings";
  gmail: {
    configured: boolean;
    connected: boolean;
    identity: GmailIdentity | null;
    lastChecked?: string;
  };

  // Actions
  setView(view: AppState["view"]): void;
  selectContact(id: string | null): void;
  openComposer(id: string | null): void;
  openIntel(id: string | null): void;
  setGmail(state: Partial<AppState["gmail"]>): void;

  updateContact(id: string, patch: Partial<Contact>): void;
  setStatus(id: string, status: OutreachStatus): void;
  setStars(id: string, stars: 1 | 2 | 3 | 4 | 5): void;
  setPriorityOverride(id: string, priority: Contact["priority"]): void;
  bulkRescore(): void;

  setResume(resume: UserResume): void;
  clearResume(): void;
  setPreferences(p: Partial<AppPreferences>): void;

  addDraft(d: DraftEmail): void;
  updateDraft(id: string, patch: Partial<DraftEmail>): void;
  removeDraft(id: string): void;
  draftsForContact(id: string): DraftEmail[];

  addNote(contactId: string, body: string): void;
  removeNote(id: string): void;
  notesForContact(id: string): ContactNote[];

  appendLog(entry: Omit<ConversationHistoryEntry, "id" | "at">): void;

  importContacts(parsed: Contact[]): void;
  resetSeed(): void;
}

const DEFAULT_PREFS: AppPreferences = {
  userName: "",
  userEmail: "",
  school: "Wharton",
  graduationYear: new Date().getFullYear() + 1,
  targetRole: "Summer Investment Banking Analyst",
  pitch:
    "I'm a finance-focused student targeting M&A advisory roles. My background blends quantitative modeling with deal-specific research, and I'm intentional about building relationships with bankers who'll be in my career for the next 30 years.",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  signature: "Best,\n[Your Name]\n[Phone] · [LinkedIn]",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      contacts: SEED_CONTACTS,
      resume: null,
      preferences: DEFAULT_PREFS,
      drafts: [],
      notes: [],
      conversationLog: [],

      selectedContactId: null,
      composerOpenForId: null,
      intelOpenForId: null,
      view: "table",
      gmail: { configured: false, connected: false, identity: null },

      setView: (view) => set({ view }),
      selectContact: (id) => set({ selectedContactId: id }),
      openComposer: (id) => set({ composerOpenForId: id }),
      openIntel: (id) => set({ intelOpenForId: id }),
      setGmail: (state) =>
        set((s) => ({ gmail: { ...s.gmail, ...state, lastChecked: new Date().toISOString() } })),

      updateContact: (id, patch) =>
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      setStatus: (id, status) => get().updateContact(id, { status }),
      setStars: (id, stars) => get().updateContact(id, { relationshipStars: stars }),
      setPriorityOverride: (id, priority) => get().updateContact(id, { priority }),

      bulkRescore: () =>
        set((s) => {
          if (!s.resume) return {};
          return {
            contacts: s.contacts.map((c) => {
              const result = computeFitScore(c, s.resume!);
              return {
                ...c,
                fitScore: result.score,
                priority: result.priority,
                fitReasoning: result.reasoning,
              };
            }),
          };
        }),

      setResume: (resume) => set({ resume }),
      clearResume: () => set({ resume: null }),
      setPreferences: (p) => set((s) => ({ preferences: { ...s.preferences, ...p } })),

      addDraft: (d) => set((s) => ({ drafts: [d, ...s.drafts] })),
      updateDraft: (id, patch) =>
        set((s) => ({ drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDraft: (id) => set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),
      draftsForContact: (id) => get().drafts.filter((d) => d.contactId === id),

      addNote: (contactId, body) =>
        set((s) => ({
          notes: [
            { id: nanoid(8), contactId, body, createdAt: new Date().toISOString() },
            ...s.notes,
          ],
        })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      notesForContact: (id) => get().notes.filter((n) => n.contactId === id),

      appendLog: (entry) =>
        set((s) => ({
          conversationLog: [
            { id: nanoid(8), at: new Date().toISOString(), ...entry },
            ...s.conversationLog,
          ].slice(0, 500),
        })),

      importContacts: (parsed) =>
        set((s) => {
          const byEmail = new Map(s.contacts.map((c) => [c.email.toLowerCase(), c]));
          for (const p of parsed) {
            byEmail.set(p.email.toLowerCase(), p);
          }
          return { contacts: Array.from(byEmail.values()) };
        }),

      resetSeed: () => set({ contacts: SEED_CONTACTS, drafts: [], notes: [], conversationLog: [] }),
    }),
    {
      name: "bulgebracket-ai-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        contacts: s.contacts,
        resume: s.resume,
        preferences: s.preferences,
        drafts: s.drafts,
        notes: s.notes,
        conversationLog: s.conversationLog,
        view: s.view,
      }),
    },
  ),
);
