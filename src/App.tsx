import { useEffect } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { SideNav } from "@/components/shell/SideNav";
import { LedgerScreen } from "@/components/screens/LedgerScreen";
import { KanbanScreen } from "@/components/screens/KanbanScreen";
import { ResumeScreen } from "@/components/screens/ResumeScreen";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { PipelineScreen } from "@/components/screens/PipelineScreen";
import { StrategyAdvisorScreen } from "@/components/screens/StrategyAdvisorScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { ContactIntelligenceDialog } from "@/components/dialogs/ContactIntelligenceDialog";
import { OutreachComposerDialog } from "@/components/dialogs/OutreachComposerDialog";
import { QueueConveyor } from "@/components/shell/QueueConveyor";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";

export function App() {
  const view = useAppStore((s) => s.view);
  const setGmail = useAppStore((s) => s.setGmail);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const status = await api.gmailStatus();
      if (cancelled || !status) return;
      setGmail({
        configured: status.configured,
        connected: status.connected,
        identity: status.identity,
      });
    };
    refresh();
    const onMessage = (e: MessageEvent) => {
      if (e?.data?.type === "bb_gmail_connected") refresh();
    };
    window.addEventListener("message", onMessage);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
    };
  }, [setGmail]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-graphite-50 text-graphite-900">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          {view === "table" && <LedgerScreen />}
          {view === "kanban" && <KanbanScreen />}
          {view === "resume" && <ResumeScreen />}
          {view === "analytics" && <AnalyticsScreen />}
          {view === "pipeline" && <PipelineScreen />}
          {view === "strategy" && <StrategyAdvisorScreen />}
          {view === "settings" && <SettingsScreen />}
          <div className="h-32" />
        </main>
      </div>
      <QueueConveyor />
      <ContactIntelligenceDialog />
      <OutreachComposerDialog />
    </div>
  );
}
