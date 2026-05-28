import { BarChart3, Brain, FileText, KanbanSquare, MessageSquareText, Send, Settings2, Table } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Item {
  id: "table" | "kanban" | "pipeline" | "resume" | "analytics" | "strategy" | "settings";
  label: string;
  description: string;
  icon: ReactNode;
}

const ITEMS: Item[] = [
  { id: "table", label: "Alumni Ledger", description: "Full pipeline · filters · scoring", icon: <Table className="h-4 w-4" /> },
  { id: "kanban", label: "Outreach Board", description: "Kanban by status", icon: <KanbanSquare className="h-4 w-4" /> },
  { id: "pipeline", label: "Send Pipeline", description: "Queue · schedule · history", icon: <Send className="h-4 w-4" /> },
  { id: "resume", label: "Resume Intel", description: "Upload + tailor", icon: <FileText className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", description: "Reply rate · hooks · timing", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "strategy", label: "Strategy Advisor", description: "Personalized AI coach", icon: <Brain className="h-4 w-4" /> },
  { id: "settings", label: "Settings", description: "Profile · Gmail · prefs", icon: <Settings2 className="h-4 w-4" /> },
];

export function SideNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-graphite-200 bg-white p-3 md:flex md:flex-col">
      <div className="mb-2 px-2 pt-1">
        <p className="microlabel">Workspace</p>
      </div>
      <nav className="flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={cn(
                "group flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-graphite-900/20",
                active ? "bg-graphite-900 text-graphite-50" : "text-graphite-700 hover:bg-graphite-100",
              )}
            >
              <div className={cn("mt-0.5 shrink-0", active ? "text-graphite-50" : "text-graphite-500 group-hover:text-graphite-900")}>{it.icon}</div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className={cn("truncate text-[13px] font-medium", active ? "text-graphite-50" : "text-graphite-900")}>{it.label}</span>
                <span className={cn("truncate text-[11px]", active ? "text-graphite-300" : "text-graphite-500")}>{it.description}</span>
              </div>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-md border border-graphite-200 bg-graphite-50 p-3">
        <div className="microlabel mb-1.5">Tip</div>
        <p className="text-[11px] leading-snug text-graphite-600">
          Send Analyst emails between 7-9am, VP/Director 8-10am, MD 9-11am — local time. The scheduler auto-picks optimal windows.
        </p>
        <button
          onClick={() => useAppStore.getState().setView("strategy")}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-graphite-900 underline-offset-4 hover:underline"
        >
          <MessageSquareText className="h-3 w-3" /> Ask the advisor
        </button>
      </div>
    </aside>
  );
}
