import type { Contact } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsPanelProps {
  contacts: Contact[];
}

export function MetricsPanel({ contacts }: MetricsPanelProps) {
  const sent = contacts.filter((contact) => contact.status === "sent" || contact.status === "scheduled").length;
  const replied = contacts.filter((contact) => contact.status === "replied").length;
  const noReply = contacts.filter((contact) => contact.status === "no_reply").length;
  const positiveReplies = contacts.filter((contact) =>
    contact.outreachHistory.some((entry) => entry.direction === "inbound" && entry.sentiment === "positive"),
  ).length;

  const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : "0.0";
  const positiveRate = replied > 0 ? ((positiveReplies / replied) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Sent", value: sent.toString() },
    { label: "Reply Rate", value: `${replyRate}%` },
    { label: "Positive Responses", value: positiveReplies.toString() },
    { label: "Positive Ratio", value: `${positiveRate}%` },
    { label: "No Reply", value: noReply.toString() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM + Analytics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
