import type { AnalyticsSnapshot } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface AnalyticsPanelProps {
  snapshot: AnalyticsSnapshot;
}

export const AnalyticsPanel = ({ snapshot }: AnalyticsPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle>CRM + Analytics</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid gap-2 md:grid-cols-4">
        <div className="border border-slate-800 p-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Sent</p>
          <p className="mt-1 text-lg text-slate-100">{snapshot.sent}</p>
        </div>
        <div className="border border-slate-800 p-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Reply Rate</p>
          <p className="mt-1 text-lg text-slate-100">{snapshot.replyRate}%</p>
        </div>
        <div className="border border-slate-800 p-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Replies</p>
          <p className="mt-1 text-lg text-slate-100">{snapshot.replies}</p>
        </div>
        <div className="border border-slate-800 p-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Positive</p>
          <p className="mt-1 text-lg text-slate-100">{snapshot.positiveResponses}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-slate-800 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Best Hooks</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {snapshot.bestHooks.map((hook) => (
              <Badge key={hook}>{hook}</Badge>
            ))}
          </div>
        </div>
        <div className="border border-slate-800 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Best Send Times</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {snapshot.bestSendTimes.map((slot) => (
              <Badge key={slot}>{slot}</Badge>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
