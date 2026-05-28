"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  Table2,
  FileText,
  BarChart3,
  Clock,
  Target,
  Sparkles,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { AppView } from "@/types";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { AlumniLedger } from "@/components/AlumniLedger";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ResumePanel } from "@/components/ResumePanel";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FollowUpCenter } from "@/components/FollowUpCenter";
import { TopTargets } from "@/components/TopTargets";
import { ContactIntelligence } from "@/components/ContactIntelligence";
import { OutreachComposer } from "@/components/OutreachComposer";
import { QueueConveyor } from "@/components/QueueConveyor";
import { StrategyAdvisor } from "@/components/StrategyAdvisor";
import { GmailButton } from "@/components/GmailButton";
import { useScheduler } from "@/components/useScheduler";

const NAV: { key: AppView; label: string; icon: React.ElementType }[] = [
  { key: "ledger", label: "Alumni Ledger", icon: Table2 },
  { key: "kanban", label: "Pipeline", icon: LayoutGrid },
  { key: "top20", label: "Top 20 This Week", icon: Target },
  { key: "followups", label: "Follow-ups", icon: Clock },
  { key: "resume", label: "Resume Intel", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const VIEW_TITLES: Record<AppView, string> = {
  ledger: "Alumni Ledger",
  kanban: "Outreach Pipeline",
  top20: "Top 20 Targets — This Week",
  followups: "Follow-up Center",
  resume: "Resume Intelligence",
  analytics: "Analytics & CRM",
};

export function AppShell() {
  const { view, setView, resume, emails, hydrated } = useStore();
  const [advisorOpen, setAdvisorOpen] = useState(false);

  // Background scheduler dispatches due scheduled emails via real Gmail.
  useScheduler();

  const queuedCount = emails.filter((e) => e.status === "queued" || e.status === "scheduled").length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-slate-50">
            <span className="font-mono text-xs font-bold">BB</span>
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">BulgeBracket<span className="text-slate-400">.ai</span></div>
            <div className="micro-label leading-tight">IB Recruiting OS</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          <div className="micro-label px-2 pb-1.5 pt-2">Command Center</div>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                view === key
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon size={16} className={view === key ? "text-slate-50" : "text-slate-400"} />
              <span className="flex-1 text-left">{label}</span>
              {key === "followups" && <FollowUpBadge />}
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-200 p-3">
          <button
            onClick={() => setAdvisorOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Sparkles size={16} className="text-slate-900" />
            <span className="flex-1 text-left">Strategy Advisor</span>
          </button>
          <ResumeStatus hasResume={!!resume?.rawText || !!resume?.name} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="min-w-0">
            <div className="micro-label">Workspace</div>
            <h1 className="truncate text-lg font-semibold leading-tight">{VIEW_TITLES[view]}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* mobile nav */}
            <div className="flex md:hidden">
              <NavSelect />
            </div>
            <Button variant="outline" size="sm" onClick={() => setAdvisorOpen(true)} className="hidden sm:inline-flex">
              <Sparkles size={14} /> Advisor
            </Button>
            <GmailButton />
          </div>
        </header>

        {/* View */}
        <main className="relative flex-1 overflow-y-auto pb-28">
          {!hydrated ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading workspace…</div>
          ) : (
            <div className="animate-fade-in">
              {view === "ledger" && <AlumniLedger />}
              {view === "kanban" && <KanbanBoard />}
              {view === "top20" && <TopTargets />}
              {view === "followups" && <FollowUpCenter />}
              {view === "resume" && <ResumePanel />}
              {view === "analytics" && <AnalyticsDashboard />}
            </div>
          )}
        </main>
      </div>

      {/* Overlays */}
      <ContactIntelligence />
      <OutreachComposer />
      <QueueConveyor />
      <StrategyAdvisor open={advisorOpen} onClose={() => setAdvisorOpen(false)} />

      {/* tiny corner status when queue active */}
      {queuedCount > 0 && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2">
          <Badge tone="blue">
            <Mail size={11} /> {queuedCount} in pipeline
          </Badge>
        </div>
      )}
    </div>
  );
}

function FollowUpBadge() {
  const { contacts, getState } = useStore();
  const count = contacts.filter((c) => getState(c.id).status === "no_reply").length;
  if (!count) return null;
  return (
    <span className="rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">{count}</span>
  );
}

function ResumeStatus({ hasResume }: { hasResume: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2 text-xs">
      {hasResume ? (
        <>
          <CheckCircle2 size={14} className="text-green-600" />
          <span className="text-slate-600">Resume loaded</span>
        </>
      ) : (
        <>
          <AlertCircle size={14} className="text-amber-500" />
          <span className="text-slate-600">No resume yet</span>
        </>
      )}
    </div>
  );
}

function NavSelect() {
  const { view, setView } = useStore();
  return (
    <select
      value={view}
      onChange={(e) => setView(e.target.value as AppView)}
      className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
    >
      {NAV.map((n) => (
        <option key={n.key} value={n.key}>
          {n.label}
        </option>
      ))}
    </select>
  );
}
