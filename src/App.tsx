import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ResumePanel } from "./components/ResumePanel";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { OutreachComposer } from "./components/OutreachComposer";
import { GmailConnect } from "./components/GmailConnect";
import { GmailQueue } from "./components/GmailQueue";
import { FollowUpPanel } from "./components/FollowUpPanel";
import { ContactCRM } from "./components/ContactCRM";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { StrategyAdvisor } from "./components/StrategyAdvisor";
import type { ContactState, ResumeData } from "./types";
import {
  getOrCreateContactState,
  loadContactStates,
  loadResume,
  saveContactStates,
} from "./lib/storage";
import { getGmailStatus } from "./lib/gmailClient";
import { getContactById } from "./data/contactsData";

export default function App() {
  const [resume, setResume] = useState<ResumeData | null>(() => loadResume());
  const [states, setStates] = useState<Record<string, ContactState>>(() =>
    loadContactStates()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gmailKey, setGmailKey] = useState(0);

  const selected = selectedId ? getContactById(selectedId) : null;
  const selectedState = selected
    ? getOrCreateContactState(selected.id, states)
    : null;


  useEffect(() => {
    const tick = () => {
      setStates((prev) => {
        const next = { ...prev };
        let changed = false;
        const now = Date.now();
        for (const [id, st] of Object.entries(prev)) {
          if (st.status === "sent" && st.lastOutreach) {
            const days = Math.floor((now - new Date(st.lastOutreach).getTime()) / 86400000);
            if (days >= 7) {
              next[id] = { ...st, status: "no_reply" };
              changed = true;
            }
          }
        }
        if (changed) {
          saveContactStates(next);
          return next;
        }
        return prev;
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void getGmailStatus().then((s) => {
      if (s.connected) setGmailKey((k) => k + 1);
    });
  }, []);

  const onStatesChange = useCallback((s: Record<string, ContactState>) => {
    setStates(s);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 border-b border-graphite-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-graphite-950">
              BulgeBracket.ai
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
              IB Recruiting Command Center
            </p>
          </div>
          <GmailConnect key={gmailKey} onConnected={() => setGmailKey((k) => k + 1)} />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Dashboard
            resume={resume}
            states={states}
            onStatesChange={onStatesChange}
            onSelectContact={(c) => setSelectedId(c.id)}
          />
          <AnalyticsPanel states={states} />
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <ResumePanel
            selectedContact={selected}
            onResumeChange={setResume}
          />
          <StrategyAdvisor resume={resume} states={states} />
        </aside>

        {selected && selectedState && (
          <div className="lg:col-span-12 grid gap-4 lg:grid-cols-2">
            <OutreachComposer
              contact={selected}
              resume={resume}
              onQueued={(subject, body) => {
                const st = getOrCreateContactState(selected.id, states);
                const next = {
                  ...states,
                  [selected.id]: {
                    ...st,
                    status: "sent" as const,
                    lastOutreach: new Date().toISOString(),
                    outreachHistory: [
                      ...st.outreachHistory,
                      {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        subject,
                        body,
                        type: "initial" as const,
                        status: "queued" as const,
                      },
                    ],
                  },
                };
                saveContactStates(next);
                setStates(next);
                document.querySelector("[data-queue]")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
            <div className="space-y-4">
              <FollowUpPanel
                contact={selected}
                state={selectedState}
                resume={resume}
              />
              <ContactCRM
                state={selectedState}
                states={states}
                onStatesChange={onStatesChange}
              />
            </div>
          </div>
        )}
      </main>

      {selected && (
        <ContactIntelligence
          contact={selected}
          resume={resume}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div data-queue>
        <GmailQueue onUpdate={() => {}} />
      </div>
    </div>
  );
}
