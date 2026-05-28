import { Download, TrendingUp } from "lucide-react";
import { AppState, ContactScore } from "../types";
import { contactsToCsv } from "../lib/storage";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";

interface AnalyticsDashboardProps {
  state: AppState;
  scores: Record<string, ContactScore>;
}

export function AnalyticsDashboard({ state, scores }: AnalyticsDashboardProps) {
  const sent = state.history.length + state.contacts.filter((contact) => contact.status === "Sent").length;
  const replied = state.contacts.filter((contact) => contact.status === "Replied" || contact.status === "Positive").length;
  const positive = state.contacts.filter((contact) => contact.status === "Positive").length;
  const replyRate = sent ? Math.round((replied / sent) * 100) : 0;
  const topTargets = [...state.contacts]
    .sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0))
    .slice(0, 20);

  function exportCsv() {
    const csv = contactsToCsv(state);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulgebracket-ai-contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CRM Analytics</p>
          <h2 className="text-lg font-semibold">Pipeline command metrics</h2>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" /> CSV Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Sent" value={String(sent)} />
          <Metric label="Reply Rate" value={`${replyRate}%`} />
          <Metric label="Positive" value={String(positive)} />
          <Metric label="Best Send Window" value="7-10 AM" />
        </div>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top 20 Targets This Week</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {topTargets.map((contact, index) => (
              <div key={contact.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div>
                  <p className="text-sm font-medium">
                    {index + 1}. {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {contact.firm} - {contact.team}
                  </p>
                </div>
                <Badge tone="blue">{scores[contact.id]?.score ?? 50}</Badge>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
