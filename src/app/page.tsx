"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AlumniLedger } from "@/components/dashboard/AlumniLedger";
import { ContactIntelligence } from "@/components/intelligence/ContactIntelligence";
import { ResumePanel } from "@/components/resume/ResumePanel";
import { OutreachComposer } from "@/components/composer/OutreachComposer";
import { EmailQueue } from "@/components/gmail/EmailQueue";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { StrategyAdvisor } from "@/components/advisor/StrategyAdvisor";
import { ContactCRM } from "@/components/crm/ContactCRM";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

function AppContent() {
  const { activeTab } = useAppStore();

  const renderPanel = () => {
    switch (activeTab) {
      case "ledger":
        return <AlumniLedger />;
      case "intelligence":
        return <ContactIntelligence />;
      case "resume":
        return <ResumePanel />;
      case "composer":
        return <OutreachComposer />;
      case "queue":
        return <EmailQueue />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "advisor":
        return <StrategyAdvisor />;
      case "crm":
        return <ContactCRM />;
      default:
        return <AlumniLedger />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden animate-fade-in">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
