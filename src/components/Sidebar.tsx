import { cn } from "../lib/cn";
import {
  LayoutGrid,
  Users2,
  FileText,
  Mail,
  BarChart3,
  Bot,
  Settings,
  Zap,
} from "lucide-react";

export type View = "dashboard" | "contacts" | "resume" | "outreach" | "analytics" | "advisor" | "settings";

interface Props {
  view: View;
  onChange: (v: View) => void;
  metrics: { pending: number; queued: number; replied: number; noReply: number };
}

const NAV: Array<{ id: View; label: string; icon: typeof LayoutGrid }> = [
  { id: "dashboard", label: "Command Center", icon: LayoutGrid },
  { id: "contacts", label: "Alumni Ledger", icon: Users2 },
  { id: "resume", label: "Resume Intelligence", icon: FileText },
  { id: "outreach", label: "Outreach Composer", icon: Mail },
  { id: "analytics", label: "Pipeline Analytics", icon: BarChart3 },
  { id: "advisor", label: "Strategy Advisor", icon: Bot },
  { id: "settings", label: "Settings & Gmail", icon: Settings },
];

export function Sidebar({ view, onChange, metrics }: Props) {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col hairline-r bg-white">
      <div className="px-5 py-5 hairline-b">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-sharp bg-graphite-900 text-graphite-50 grid place-items-center font-mono font-bold text-[12px]">
            BB
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-none">BulgeBracket.ai</div>
            <div className="micro mt-1">// recruiting intel</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-4 flex-1 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === view;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "w-full text-left flex items-center gap-2.5 px-2.5 h-8 rounded-sharp transition-colors text-[12.5px]",
                active
                  ? "bg-graphite-900 text-graphite-50"
                  : "text-graphite-700 hover:bg-graphite-100 hover:text-graphite-900"
              )}
            >
              <Icon size={14} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 hairline-t space-y-2">
        <div className="micro px-1">// pipeline</div>
        <div className="grid grid-cols-2 gap-2">
          <Snippet label="Pending" value={metrics.pending} />
          <Snippet label="Queued" value={metrics.queued} />
          <Snippet label="Replied" value={metrics.replied} tone="green" />
          <Snippet label="No reply" value={metrics.noReply} tone="amber" />
        </div>
        <div className="px-1 pt-2 text-[10px] text-graphite-500 font-mono flex items-center gap-1">
          <Zap size={10} />
          offline-first AI · zero quota risk
        </div>
      </div>
    </aside>
  );
}

function Snippet({ label, value, tone }: { label: string; value: number; tone?: "amber" | "green" }) {
  return (
    <div className="hairline rounded-sharp px-2 py-1.5">
      <div className="micro">{label}</div>
      <div
        className={cn(
          "text-base font-semibold num",
          tone === "amber" && "text-amber-700",
          tone === "green" && "text-emerald-700"
        )}
      >
        {value}
      </div>
    </div>
  );
}
