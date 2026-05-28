import { ReactNode, useEffect, useMemo, useState } from "react";
import { Brain, Download, Search, Upload, Zap } from "lucide-react";
import { AlumniLedger } from "./components/AlumniLedger";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { GmailScheduler } from "./components/GmailScheduler";
import { OutreachComposer } from "./components/OutreachComposer";
import { ResumeIntelligence } from "./components/ResumeIntelligence";
import { StrategyAdvisor } from "./components/StrategyAdvisor";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { AppState, Contact, ContactScore, DraftEmail, OutreachHistoryItem, OutreachStatus, QueueItem } from "./types";
import { scoreContact } from "./lib/aiEngine";
import { exportState, loadAppState, saveAppState } from "./lib/storage";

type ViewMode = "table" | "kanban";

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [selectedId, setSelectedId] = useState(state.contacts[0]?.id);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [firm, setFirm] = useState("All");
  const [team, setTeam] = useState("All");
  const [priority, setPriority] = useState("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const scores = useMemo<Record<string, ContactScore>>(() => {
    return Object.fromEntries(
      state.contacts.map((contact) => [
        contact.id,
        scoreContact(contact, state.resume, {
          ...state.userProfile,
          targetRole: state.userProfile.targetRole || state.resume?.targetRole || "Investment Banking Summer Analyst",
          personalPitch: state.userProfile.personalPitch || state.resume?.personalPitch || ""
        })
      ])
    );
  }, [state.contacts, state.resume, state.userProfile]);

  const selected = state.contacts.find((contact) => contact.id === selectedId) ?? state.contacts[0];
  const firms = ["All", ...Array.from(new Set(state.contacts.map((contact) => contact.firm))).sort()];
  const teams = ["All", ...Array.from(new Set(state.contacts.map((contact) => contact.team))).sort()];

  const filteredContacts = state.contacts.filter((contact) => {
    const haystack = [
      contact.firstName,
      contact.lastName,
      contact.firm,
      contact.team,
      contact.school,
      contact.title,
      contact.coverageSectors.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return (
      haystack.includes(search.toLowerCase()) &&
      (firm === "All" || contact.firm === firm) &&
      (team === "All" || contact.team === team) &&
      (priority === "All" || contact.priority === priority)
    );
  });

  function updateContact(contactId: string, patch: Partial<Contact>) {
    setState((current) => ({
      ...current,
      contacts: current.contacts.map((contact) => (contact.id === contactId ? { ...contact, ...patch } : contact))
    }));
  }

  function queueDraft(draft: DraftEmail) {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      contactId: draft.contactId,
      draft,
      status: "Queued"
    };
    setState((current) => ({
      ...current,
      queue: [...current.queue, item],
      contacts: current.contacts.map((contact) =>
        contact.id === draft.contactId ? { ...contact, status: "Queued" } : contact
      )
    }));
    setToast("Email added to Gmail conveyor queue.");
  }

  function onSent(item: QueueItem) {
    const history: OutreachHistoryItem = {
      id: crypto.randomUUID(),
      contactId: item.contactId,
      subject: item.draft.subject,
      body: item.draft.body,
      sentAt: item.sentAt ?? new Date().toISOString(),
      variant: item.draft.variant,
      status: "Sent"
    };

    setState((current) => ({
      ...current,
      history: [...current.history, history],
      contacts: current.contacts.map((contact) =>
        contact.id === item.contactId
          ? {
              ...contact,
              status: "Sent",
              lastOutreach: history.sentAt,
              lastInteraction: history.sentAt,
              notes: [`Sent ${item.draft.variant} email: ${item.draft.subject}`, ...contact.notes].slice(0, 8)
            }
          : contact
      )
    }));
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setToast("Copied to clipboard.");
  }

  function importJson(file?: File) {
    if (!file) return;
    void file.text().then((text) => {
      const imported = JSON.parse(text) as AppState;
      setState({
        ...loadAppState(),
        ...imported
      });
      setToast("Imported CRM state.");
    });
  }

  return (
    <main className="min-h-screen pb-56 text-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="slate">BulgeBracket.ai</Badge>
              <Badge tone="green">Real Gmail API</Badge>
              <Badge tone="blue">240+ Alumni</Badge>
              <Badge tone="violet">Offline AI Fallbacks</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
              Investment Banking Recruiting AI Command Center
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-slate-600 md:text-base">
              Resume-aware banker scoring, deep research intelligence, hyper-personalized outreach, Gmail send/schedule,
              CRM analytics, and follow-up automation for elite IB recruiting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportState(state)}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
              <Upload className="h-4 w-4" /> Import
              <input className="hidden" type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0])} />
            </label>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 xl:grid-cols-[380px_minmax(0,1fr)_440px]">
        <aside className="space-y-4">
          <ResumeIntelligence
            resume={state.resume}
            profile={state.userProfile}
            onResumeChange={(resume) =>
              setState((current) => ({
                ...current,
                resume,
                userProfile: {
                  ...current.userProfile,
                  targetRole: resume.targetRole,
                  personalPitch: resume.personalPitch
                }
              }))
            }
            onProfileChange={(userProfile) => setState((current) => ({ ...current, userProfile }))}
          />
          <StrategyAdvisor contacts={state.contacts} resume={state.resume} profile={state.userProfile} />
        </aside>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-950"
                  placeholder="Search banker, firm, sector, school, team..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Select value={firm} values={firms} onChange={setFirm} />
              <Select value={team} values={teams} onChange={setTeam} />
              <Select value={priority} values={["All", "Core", "High", "Medium", "Opportunistic"]} onChange={setPriority} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <HeroMetric icon={<Brain className="h-5 w-5" />} label="Avg Fit" value={`${averageScore(scores)}%`} />
            <HeroMetric icon={<Zap className="h-5 w-5" />} label="Queued" value={String(state.queue.filter((item) => item.status === "Queued").length)} />
            <HeroMetric label="No Reply Risk" value={String(state.contacts.filter((contact) => contact.status === "No Reply").length)} />
            <HeroMetric label="Relationships" value={`${state.contacts.filter((contact) => contact.relationshipStrength >= 4).length} warm`} />
          </div>

          <AlumniLedger
            contacts={filteredContacts}
            scores={scores}
            selectedId={selected?.id}
            view={view}
            onViewChange={setView}
            onSelect={(contact) => setSelectedId(contact.id)}
            onStatusChange={(contactId: string, status: OutreachStatus) => updateContact(contactId, { status })}
          />

          <AnalyticsDashboard state={state} scores={scores} />
        </section>

        <aside className="space-y-4">
          <ContactIntelligence contact={selected} resume={state.resume} onCopy={copy} />
          <OutreachComposer
            contact={selected}
            resume={state.resume}
            profile={state.userProfile}
            onQueue={queueDraft}
            onCopy={copy}
          />
        </aside>
      </section>

      {toast && (
        <button
          className="fixed right-4 top-4 z-40 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900"
          onClick={() => setToast("")}
        >
          {toast}
        </button>
      )}

      <GmailScheduler
        contacts={state.contacts}
        queue={state.queue}
        gmail={state.gmail}
        profile={state.userProfile}
        resume={state.resume}
        onGmailChange={(gmail) => setState((current) => ({ ...current, gmail }))}
        onQueueChange={(queue) => setState((current) => ({ ...current, queue }))}
        onSent={onSent}
      />
    </main>
  );
}

function Select({
  value,
  values,
  onChange
}: {
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {values.map((candidate) => (
        <option key={candidate}>{candidate}</option>
      ))}
    </select>
  );
}

function HeroMetric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function averageScore(scores: Record<string, ContactScore>) {
  const values = Object.values(scores);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, score) => sum + score.score, 0) / values.length);
}
