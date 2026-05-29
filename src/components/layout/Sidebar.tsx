"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  Users,
  Brain,
  FileText,
  Mail,
  BarChart3,
  MessageSquare,
  Inbox,
  TrendingUp,
  Settings,
  ChevronLeft,
  Zap,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "ledger", label: "Alumni Ledger", icon: Users, description: "240+ contacts" },
  { id: "intelligence", label: "Contact Intel", icon: Brain, description: "Deep research" },
  { id: "resume", label: "Resume AI", icon: FileText, description: "Parse & tailor" },
  { id: "composer", label: "Outreach Composer", icon: Mail, description: "Generate emails" },
  { id: "queue", label: "Email Queue", icon: Inbox, description: "Send & schedule" },
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "Pipeline metrics" },
  { id: "advisor", label: "Strategy Advisor", icon: MessageSquare, description: "AI coaching" },
  { id: "crm", label: "CRM & Notes", icon: TrendingUp, description: "Track history" },
];

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar, contacts, emailQueue } = useAppStore();

  const sentCount = contacts.filter((c) => c.status === "sent" || c.status === "replied").length;
  const replyCount = contacts.filter((c) => c.status === "replied" || c.status === "positive").length;
  const queuedCount = emailQueue.filter((e) => e.status === "queued" || e.status === "scheduled").length;

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 h-full",
        sidebarOpen ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-foreground leading-none">BulgeBracket</div>
            <div className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider mt-0.5">.ai</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {sidebarOpen && (
          <div className="micro-label px-2 mb-2">Navigation</div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors text-left",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-indigo-400")} />
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
              {sidebarOpen && item.id === "queue" && queuedCount > 0 && (
                <span className="ml-auto text-[10px] font-mono bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded">
                  {queuedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pipeline Stats */}
      {sidebarOpen && (
        <div className="px-3 pb-3">
          <div className="card-base p-3 space-y-2">
            <div className="micro-label">Pipeline</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sent</span>
                <span className="font-mono text-blue-400">{sentCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Replies</span>
                <span className="font-mono text-emerald-400">{replyCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reply Rate</span>
                <span className="font-mono text-amber-400">
                  {sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
      </button>
    </aside>
  );
}
