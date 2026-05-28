import { BarChart3, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { GmailAuthState } from "../types";

interface DashboardHeaderProps {
  totalContacts: number;
  topTargets: number;
  gmailState: GmailAuthState;
  onConnectGmail: () => void;
}

export const DashboardHeader = ({
  totalContacts,
  topTargets,
  gmailState,
  onConnectGmail
}: DashboardHeaderProps) => (
  <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-200">
            BULGEBRACKET.AI LIVE
          </Badge>
          <Badge>INVESTMENT BANKING RECRUITING OS</Badge>
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">Intelligent Networking Command Center</h1>
        <p className="mt-1 text-sm text-slate-400">
          {totalContacts} banker profiles indexed · {topTargets} top targets this week · real Gmail pipeline execution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.14em] text-slate-400 md:grid-cols-4">
        <div className="border border-slate-800 bg-slate-950 px-3 py-2">
          <Sparkles className="mb-1 h-3.5 w-3.5 text-slate-300" />
          AI Scoring
        </div>
        <div className="border border-slate-800 bg-slate-950 px-3 py-2">
          <MailCheck className="mb-1 h-3.5 w-3.5 text-slate-300" />
          Outreach Queue
        </div>
        <div className="border border-slate-800 bg-slate-950 px-3 py-2">
          <BarChart3 className="mb-1 h-3.5 w-3.5 text-slate-300" />
          CRM Analytics
        </div>
        <div className="border border-slate-800 bg-slate-950 px-3 py-2">
          <ShieldCheck className="mb-1 h-3.5 w-3.5 text-slate-300" />
          Offline Fallback
        </div>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-end gap-3">
      <Badge className={gmailState.isAuthed ? "border-emerald-400/40 text-emerald-200" : "border-amber-400/40 text-amber-200"}>
        {gmailState.isAuthed ? `GMAIL CONNECTED ${gmailState.email ?? ""}` : "GMAIL NOT CONNECTED"}
      </Badge>
      <Button variant={gmailState.isAuthed ? "outline" : "default"} onClick={onConnectGmail}>
        {gmailState.isAuthed ? "Reconnect Gmail" : "Connect Gmail OAuth"}
      </Button>
    </div>
  </header>
);
