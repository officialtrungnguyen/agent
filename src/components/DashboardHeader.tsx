import { Badge, Button, Card } from "./ui";
import { GmailAuthState, MetricsSnapshot, ResumeProfile } from "../types";
import { Mail, RefreshCcw, Download, Target } from "lucide-react";

interface DashboardHeaderProps {
  gmailAuth: GmailAuthState;
  metrics: MetricsSnapshot;
  resume: ResumeProfile | null;
  timezone: string;
  onConnectGmail: () => void;
  onRefreshQueue: () => void;
  onExportCsv: () => void;
}

export const DashboardHeader = ({
  gmailAuth,
  metrics,
  resume,
  timezone,
  onConnectGmail,
  onRefreshQueue,
  onExportCsv,
}: DashboardHeaderProps) => (
  <Card className="overflow-hidden">
    <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="mono-label">BulgeBracket.ai / Investment Banking Recruiting Command Center</div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50">Win the process before coffee chats even start.</h1>
          </div>
          <p className="max-w-4xl text-sm leading-6 text-slate-300">
            Upload one resume and BulgeBracket.ai scores banker fit, assembles deal intelligence, generates Wall Street-ready outreach,
            schedules Gmail sends in the optimal banker time windows, and surfaces your highest-conviction alumni targets every week.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={gmailAuth.connected ? "success" : "warning"}>
            <Mail className="h-3.5 w-3.5" />
            {gmailAuth.connected ? `Gmail live: ${gmailAuth.email ?? "connected"}` : "Gmail not connected"}
          </Badge>
          <Badge tone="muted">
            <Target className="h-3.5 w-3.5" />
            {resume?.targetRole ?? "Set target role"}
          </Badge>
          <Badge tone="muted">Timezone {timezone}</Badge>
          <Badge tone="muted">{metrics.totalContacts}+ banker records live</Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onConnectGmail}>
            <Mail className="h-4 w-4" />
            {gmailAuth.connected ? "Reconnect Gmail" : "Connect Gmail"}
          </Button>
          <Button variant="outline" onClick={onRefreshQueue}>
            <RefreshCcw className="h-4 w-4" />
            Refresh live statuses
          </Button>
          <Button variant="secondary" onClick={onExportCsv}>
            <Download className="h-4 w-4" />
            Export CRM CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="mono-label">Command Center Snapshot</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-sm text-slate-400">Sent</div>
            <div className="mt-2 text-2xl font-semibold">{metrics.sent}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-sm text-slate-400">Reply rate</div>
            <div className="mt-2 text-2xl font-semibold">{metrics.replyRate}%</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-sm text-slate-400">Positive replies</div>
            <div className="mt-2 text-2xl font-semibold">{metrics.positiveResponses}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-sm text-slate-400">Queue</div>
            <div className="mt-2 text-2xl font-semibold">{metrics.scheduled + metrics.queued}</div>
          </div>
        </div>
        <div className="text-sm leading-6 text-slate-400">
          Resume intelligence is stored locally on-device. Gmail scheduling syncs through the backend when OAuth is connected so queued emails can
          send even after the browser closes.
        </div>
      </div>
    </div>
  </Card>
);
