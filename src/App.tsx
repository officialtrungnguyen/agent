import * as React from "react";
import {
  LayoutList, GitBranch, FileText, BarChart3, Sparkles, Bot, AlarmClock,
} from "lucide-react";
import { ToastProvider } from "./components/ui/Toast";
import { AppProvider, useApp } from "./store/AppContext";
import { UIProvider, useUI, type Tab } from "./store/UIContext";
import { GmailConnect } from "./components/GmailConnect";
import { AlumniLedger } from "./components/AlumniLedger";
import { Pipeline } from "./components/Pipeline";
import { ResumePanel } from "./components/ResumePanel";
import { Analytics } from "./components/Analytics";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { OutreachComposer } from "./components/OutreachComposer";
import { QueuePanel } from "./components/QueuePanel";
import { StrategyAdvisor } from "./components/StrategyAdvisor";
import { Onboarding } from "./components/Onboarding";
import { Button } from "./components/ui/Button";
import { Badge } from "./components/ui/Badge";
import { cn, daysBetween } from "./lib/utils";

const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "ledger", label: "Alumni Ledger", icon: <LayoutList className="h-4 w-4" /> },
  { key: "pipeline", label: "Pipeline & Follow-ups", icon: <GitBranch className="h-4 w-4" /> },
  { key: "resume", label: "Résumé Intelligence", icon: <FileText className="h-4 w-4" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
];

function Shell() {
  const { tab, setTab, setAdvisorOpen } = useUI();
  const { contacts, analytics } = useApp();

  const followUpCount = React.useMemo(
    () =>
      contacts.filter(
        (c) => (c.status === "sent" || c.status === "no_reply") && c.lastOutreachAt && !c.lastReplyAt && daysBetween(c.lastOutreachAt) >= 7,
      ).length,
    [contacts],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-graphite-50">
      {/* Topbar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-graphite-200 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite-900 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold tracking-tight text-graphite-900">BulgeBracket</span>
              <span className="text-[15px] font-semibold tracking-tight text-accent">.ai</span>
            </div>
            <span className="micro-label">IB Recruiting Command Center</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge tone="neutral" mono className="hidden md:inline-flex">
            {analytics.total} bankers · {analytics.replyRate}% reply
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setAdvisorOpen(true)}>
            <Bot className="h-4 w-4" /> <span className="hidden sm:inline">Strategy Advisor</span>
          </Button>
          <GmailConnect />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-graphite-200 bg-white p-3 lg:flex">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  tab === item.key ? "bg-graphite-900 text-white" : "text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900",
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === "pipeline" && followUpCount > 0 && (
                  <span className={cn("rounded px-1.5 text-[10px] font-semibold", tab === item.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700")}>
                    {followUpCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-lg border border-graphite-200 bg-graphite-50 p-3">
            <div className="flex items-center gap-1.5">
              <AlarmClock className="h-3.5 w-3.5 text-amber-500" />
              <span className="micro-label">This week</span>
            </div>
            <p className="mt-1.5 text-xs text-graphite-600">
              {followUpCount > 0
                ? `${followUpCount} thread${followUpCount === 1 ? "" : "s"} need a follow-up.`
                : "All threads on track. Queue your Top 20 targets."}
            </p>
            <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => setTab(followUpCount > 0 ? "pipeline" : "analytics")}>
              {followUpCount > 0 ? "Review follow-ups" : "View Top 20"}
            </Button>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="flex w-full flex-col min-w-0">
          <div className="flex gap-1 overflow-x-auto border-b border-graphite-200 bg-white px-2 py-1.5 lg:hidden">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  tab === item.key ? "bg-graphite-900 text-white" : "text-graphite-600",
                )}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <main className="min-h-0 flex-1 overflow-hidden">
            {tab === "ledger" && <AlumniLedger />}
            {tab === "pipeline" && <div className="h-full overflow-auto scrollbar-thin"><Pipeline /></div>}
            {tab === "resume" && <div className="h-full overflow-auto scrollbar-thin"><ResumePanel /></div>}
            {tab === "analytics" && <div className="h-full overflow-auto scrollbar-thin"><Analytics /></div>}
          </main>

          {/* Bottom conveyor */}
          <QueuePanel />
        </div>
      </div>

      {/* Overlays */}
      <ContactIntelligence />
      <OutreachComposer />
      <StrategyAdvisor />
      <Onboarding />
    </div>
  );
}

function Boot() {
  const { ready } = useApp();
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-graphite-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-graphite-900 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="micro-label">Calibrating your recruiting engine…</p>
        </div>
      </div>
    );
  }
  return (
    <UIProvider>
      <Shell />
    </UIProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Boot />
      </AppProvider>
    </ToastProvider>
  );
}
