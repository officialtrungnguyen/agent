// UI-level navigation + dialog state (kept separate from data store).
import * as React from "react";
import type { Contact, EmailVariant } from "../types";

export type Tab = "ledger" | "pipeline" | "resume" | "analytics";

interface ComposeTarget {
  contact: Contact;
  variant?: EmailVariant;
  followUpDays?: number; // if set, open in follow-up mode
}

interface UIState {
  tab: Tab;
  setTab: (t: Tab) => void;
  intelContact: Contact | null;
  openIntel: (c: Contact | null) => void;
  composeTarget: ComposeTarget | null;
  openCompose: (t: ComposeTarget | null) => void;
  advisorOpen: boolean;
  setAdvisorOpen: (v: boolean) => void;
}

const Ctx = React.createContext<UIState | null>(null);

export function useUI(): UIState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = React.useState<Tab>("ledger");
  const [intelContact, setIntelContact] = React.useState<Contact | null>(null);
  const [composeTarget, setComposeTarget] = React.useState<ComposeTarget | null>(null);
  const [advisorOpen, setAdvisorOpen] = React.useState(false);

  const value: UIState = {
    tab,
    setTab,
    intelContact,
    openIntel: setIntelContact,
    composeTarget,
    openCompose: setComposeTarget,
    advisorOpen,
    setAdvisorOpen,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
