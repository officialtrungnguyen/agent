import * as React from "react";
import {
  BarChart3, Send, MessageSquare, Calendar, TrendingUp, Trophy, Clock, Flame, Crown, Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { StatPill, ScoreRing } from "./ui/Misc";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { cn, initials, avatarColor } from "../lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "../lib/labels";

export function Analytics() {
  const { analytics, contacts } = useApp();
  const { openIntel, openCompose } = useUI();

  // Top 20 targets this week = highest fit, not yet contacted.
  const topTargets = React.useMemo(
    () =>
      [...contacts]
        .filter((c) => c.status === "not_contacted")
        .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
        .slice(0, 20),
    [contacts],
  );

  const funnel = [
    { label: "Total ledger", value: analytics.total, tone: "neutral" as const },
    { label: "Sent", value: analytics.sent, tone: "slate" as const },
    { label: "Replied", value: analytics.replied, tone: "green" as const },
    { label: "Meetings", value: analytics.meetings, tone: "green" as const },
  ];

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contacts) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [contacts]);

  return (
    <div className="space-y-5 p-5">
      {/* Metric pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Bankers" value={analytics.total} hint="in your ledger" />
        <StatPill label="Sent" value={analytics.sent} />
        <StatPill label="Reply rate" value={`${analytics.replyRate}%`} hint={`${analytics.replied} replies`} />
        <StatPill label="Meetings" value={analytics.meetings} hint="coffee chats booked" />
        <StatPill label="In pipeline" value={analytics.scheduled} hint="queued / scheduled" />
        <StatPill label="No reply" value={analytics.noReply} hint="needs follow-up" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-graphite-400" /> Outreach Funnel</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {funnel.map((f) => {
              const pct = analytics.total ? Math.round((f.value / analytics.total) * 100) : 0;
              return (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-graphite-700">{f.label}</span>
                    <span className="tabular-nums text-graphite-500">{f.value} <span className="text-graphite-300">· {pct}%</span></span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-graphite-100">
                    <div className={cn("h-full rounded-full", f.tone === "green" ? "bg-emerald-500" : f.tone === "slate" ? "bg-graphite-600" : "bg-graphite-900")} style={{ width: `${Math.max(pct, f.value > 0 ? 3 : 0)}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
              <Mini icon={<Send className="h-4 w-4" />} label="Sent" value={analytics.sent} />
              <Mini icon={<MessageSquare className="h-4 w-4" />} label="Positive rate" value={`${analytics.positiveRate}%`} />
              <Mini icon={<Calendar className="h-4 w-4" />} label="Scheduled" value={analytics.scheduled} />
            </div>
          </CardBody>
        </Card>

        {/* Best hooks + windows */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-graphite-400" /> Best Hooks</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {analytics.topHooks.map((h, i) => (
                <div key={h.hook} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-graphite-700">
                    <Flame className={cn("h-3.5 w-3.5", i === 0 ? "text-amber-500" : "text-graphite-300")} />
                    {h.hook}
                  </span>
                  <Badge tone={h.replies > 0 ? "green" : "neutral"}>{h.replies} replies</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-graphite-400" /> Best Send Windows</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Row label="Analysts / Associates" value="7–9 AM" />
              <Row label="Vice Presidents" value="8–10 AM" />
              <Row label="MDs / Partners" value="9–11 AM" />
              <p className="pt-1 text-xs text-graphite-400">Tue–Thu outperform Mon/Fri. Times are localized to each banker.</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Status distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-graphite-400" /> Pipeline by Status</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABEL).map(([k, label]) => (
              <Badge key={k} tone={STATUS_TONE[k as keyof typeof STATUS_TONE]}>
                {label}: {statusCounts[k] ?? 0}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Top 20 targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-graphite-400" /> Top 20 Targets This Week</CardTitle>
          <Badge tone="dark" mono>highest fit · not contacted</Badge>
        </CardHeader>
        <CardBody>
          {topTargets.length === 0 ? (
            <p className="text-sm text-graphite-400">You've contacted all your top targets — great work. Import or add more to keep the momentum.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {topTargets.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-md border border-graphite-200 bg-white p-2.5">
                  <span className="w-5 text-center text-xs font-semibold text-graphite-300">{i + 1}</span>
                  <ScoreRing score={c.fitScore ?? 0} size={36} />
                  <button onClick={() => openIntel(c)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", avatarColor(c.id))}>
                      {initials(c.firstName, c.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate text-sm font-medium text-graphite-900">
                        {c.firstName} {c.lastName} {c.sharedSchool && <Crown className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="truncate text-xs text-graphite-500">{c.firm} · {c.division}</div>
                    </div>
                  </button>
                  <Button size="sm" variant="primary" onClick={() => openCompose({ contact: c })}>Reach out</Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-graphite-200 bg-graphite-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-graphite-400">{icon}<span className="micro-label">{label}</span></div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-graphite-900">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-graphite-600">{label}</span>
      <Badge tone="outline" mono>{value}</Badge>
    </div>
  );
}
