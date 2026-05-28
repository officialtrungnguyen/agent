import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { ContactState } from "@/types";

interface Props {
  states: Record<string, ContactState>;
}

export function AnalyticsPanel({ states }: Props) {
  const metrics = useMemo(() => {
    const all = Object.values(states);
    const sent = all.filter(
      (s) => s.status === "sent" || s.status === "replied" || s.status === "no_reply"
    ).length;
    const replies = all.filter((s) => s.status === "replied").length;
    const positive = all.filter((s) => s.relationshipStrength >= 4).length;
    const replyRate = sent ? Math.round((replies / sent) * 100) : 0;

    const hooks: Record<string, number> = {};
    const hours: Record<number, number> = {};
    for (const s of all) {
      for (const h of s.outreachHistory) {
        const hook = h.subject.split("—")[0]?.trim() ?? h.subject.slice(0, 30);
        hooks[hook] = (hooks[hook] ?? 0) + 1;
        const hour = new Date(h.date).getHours();
        hours[hour] = (hours[hour] ?? 0) + 1;
      }
    }

    const bestHooks = Object.entries(hooks)
      .map(([hook, count]) => ({ hook, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const bestSendTimes = Object.entries(hours)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { sent, replies, positive, replyRate, bestHooks, bestSendTimes };
  }, [states]);

  return (
    <Card>
      <CardHeader>
        <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
          CRM Analytics
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Sent" value={metrics.sent} />
          <Stat label="Reply Rate" value={`${metrics.replyRate}%`} />
          <Stat label="Replies" value={metrics.replies} />
          <Stat label="Strong Relationships" value={metrics.positive} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase text-graphite-500">
              Best Hooks
            </p>
            <ul className="text-xs text-graphite-700">
              {metrics.bestHooks.length ? (
                metrics.bestHooks.map((h) => (
                  <li key={h.hook}>
                    {h.hook} ({h.count})
                  </li>
                ))
              ) : (
                <li>No outreach logged yet</li>
              )}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase text-graphite-500">
              Best Send Times
            </p>
            <ul className="text-xs text-graphite-700">
              {metrics.bestSendTimes.length ? (
                metrics.bestSendTimes.map((t) => (
                  <li key={t.hour}>
                    {t.hour}:00 — {t.count} sends
                  </li>
                ))
              ) : (
                <li>Schedule emails to populate</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-graphite-100 p-3">
      <p className="font-mono text-[10px] uppercase text-graphite-500">{label}</p>
      <p className="text-2xl font-semibold text-graphite-900">{value}</p>
    </div>
  );
}
