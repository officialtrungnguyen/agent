"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Contact,
  QueuedEmail,
  ResumeData,
  ContactFilters,
  Seniority,
  ContactStatus,
  Priority,
} from "@/types";
import { contactsData } from "@/data/contactsData";
import { isNoReply } from "@/lib/utils";

// ─── Default Filters ──────────────────────────────────────────────────────────

const defaultFilters: ContactFilters = {
  search: "",
  firms: [],
  schools: [],
  seniorities: [],
  statuses: [],
  priorities: [],
  sectors: [],
  minFitScore: 0,
  maxFitScore: 100,
  hasNoReply: false,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AppStore {
  // Data
  contacts: Contact[];
  emailQueue: QueuedEmail[];
  resume: ResumeData | null;

  // UI State
  selectedContactId: string | null;
  activeTab: string;
  filters: ContactFilters;
  viewMode: "table" | "kanban";
  sidebarOpen: boolean;

  // Auth
  gmailConnected: boolean;
  userEmail: string | null;
  accessToken: string | null;

  // Actions — Contacts
  setContacts: (contacts: Contact[]) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  selectContact: (id: string | null) => void;
  getSelectedContact: () => Contact | null;
  getFilteredContacts: () => Contact[];

  // Actions — Filters
  setFilters: (filters: Partial<ContactFilters>) => void;
  resetFilters: () => void;

  // Actions — View
  setViewMode: (mode: "table" | "kanban") => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;

  // Actions — Email Queue
  addToQueue: (email: QueuedEmail) => void;
  updateEmailStatus: (id: string, updates: Partial<QueuedEmail>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;

  // Actions — Resume
  setResume: (resume: ResumeData | null) => void;

  // Actions — Auth
  setGmailAuth: (email: string, token: string) => void;
  clearGmailAuth: () => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      contacts: contactsData,
      emailQueue: [],
      resume: null,
      selectedContactId: null,
      activeTab: "ledger",
      filters: defaultFilters,
      viewMode: "table",
      sidebarOpen: true,
      gmailConnected: false,
      userEmail: null,
      accessToken: null,

      setContacts: (contacts) => set({ contacts }),

      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      selectContact: (id) => set({ selectedContactId: id }),

      getSelectedContact: () => {
        const { contacts, selectedContactId } = get();
        return contacts.find((c) => c.id === selectedContactId) ?? null;
      },

      getFilteredContacts: () => {
        const { contacts, filters } = get();
        return contacts.filter((c) => {
          if (
            filters.search &&
            !`${c.firstName} ${c.lastName} ${c.firm} ${c.team} ${c.school}`
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          )
            return false;

          if (filters.firms.length > 0 && !filters.firms.includes(c.firm))
            return false;

          if (
            filters.schools.length > 0 &&
            !filters.schools.some(
              (s) =>
                c.school.toLowerCase().includes(s.toLowerCase()) ||
                c.undergrad?.toLowerCase().includes(s.toLowerCase())
            )
          )
            return false;

          if (
            filters.seniorities.length > 0 &&
            !filters.seniorities.includes(c.seniority as Seniority)
          )
            return false;

          if (
            filters.statuses.length > 0 &&
            !filters.statuses.includes(c.status as ContactStatus)
          )
            return false;

          if (
            filters.priorities.length > 0 &&
            !filters.priorities.includes(c.priority as Priority)
          )
            return false;

          if (
            filters.sectors.length > 0 &&
            !filters.sectors.some((s) =>
              c.coverageSectors.some((cs) =>
                cs.toLowerCase().includes(s.toLowerCase())
              )
            )
          )
            return false;

          if (c.fitScore < filters.minFitScore || c.fitScore > filters.maxFitScore)
            return false;

          if (filters.hasNoReply && !isNoReply(c)) return false;

          return true;
        });
      },

      setFilters: (updates) =>
        set((state) => ({ filters: { ...state.filters, ...updates } })),

      resetFilters: () => set({ filters: defaultFilters }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addToQueue: (email) =>
        set((state) => ({ emailQueue: [...state.emailQueue, email] })),

      updateEmailStatus: (id, updates) =>
        set((state) => ({
          emailQueue: state.emailQueue.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      removeFromQueue: (id) =>
        set((state) => ({
          emailQueue: state.emailQueue.filter((e) => e.id !== id),
        })),

      clearQueue: () => set({ emailQueue: [] }),

      setResume: (resume) => set({ resume }),

      setGmailAuth: (email, token) =>
        set({ gmailConnected: true, userEmail: email, accessToken: token }),

      clearGmailAuth: () =>
        set({ gmailConnected: false, userEmail: null, accessToken: null }),
    }),
    {
      name: "bulgebracket-store-v2",
      partialize: (state) => ({
        contacts: state.contacts,
        emailQueue: state.emailQueue,
        resume: state.resume,
        viewMode: state.viewMode,
        gmailConnected: state.gmailConnected,
        userEmail: state.userEmail,
      }),
    }
  )
);
