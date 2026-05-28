import * as React from "react";
import {
  AlarmClock, Reply, CornerUpRight, CheckCircle2, History, Mail, Crown, CalendarClock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/Misc";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { cn, initials, avatarColor, daysBetween, relativeTime } from "../lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "../lib/labels";

export function Pipeline() {
  const { contacts, markReplied, setContactStatus } = useApp();
  const { openCompose, openIntel } = useUI();

  // Needs follow-up: sent or no_reply, >=7 days, no reply yet.
  const needsFollowUp = React.useMemo(
    () =>
      contacts
        .filter((c) => (c.status === "sent" || c.status === "no_reply") && c.lastOutreachAt && !c.lastReplyAt && daysBetween(c.lastOutreachAt) >= 7)
        .sort((a, b) => daysBetween(b.lastOutreachAt) - daysBetween(a.lastOutreachAt)),
    [contacts],
  );

  const awaiting = React.useMemo(
    () =>
      contacts
        .filter((c) => c.status === "sent" && c.lastOutreachAt && !c.lastReplyAt && daysBetween(c.lastOutreachAt) < 7)
        .sort((a, b) => daysBetween(b.lastOutreachAt) - daysBetween(a.lastOutreachAt)),
    [contacts],
  );

  const active = React.useMemo(
    () => contacts.filter((c) => c.status === "replied" || c.status === "meeting"),
    [contacts],
  );

  const recentActivity = React.useMemo(() => {
    const events = contacts.flatMap((c) =>
      c.events.map((e) => ({ ...e, contact: c })),
    );
    return events.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 25);
  }, [contacts]);

  return (
    <div className="space-y-5 p-5">
      {/* Needs follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlarmClock className="h-4 w-4 text-amber-500" /> Needs Follow-up</CardTitle>
          <Badge tone="amber" mono>{needsFollowUp.length} flagged</Badge>
        </CardHeader>
        <CardBody>
          {needsFollowUp.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-7 w-7" />} title="Nothing overdue" body="No threads have gone 7+ days without a reply. You're on top of it." />
          ) : (
            <div className="space-y-2">
              {needsFollowUp.map((c) => {
                const days = daysBetween(c.lastOutreachAt);
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50/50 p-2.5">
                    <button onClick={() => openIntel(c)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", avatarColor(c.id))}>
                        {initials(c.firstName, c.lastName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-graphite-900">
                          {c.firstName} {c.lastName} {c.sharedSchool && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="truncate text-xs text-graphite-500">{c.firm} · {c.title}</div>
                      </div>
                    </button>
                    <Badge tone="amber" mono>⚠ {days}d no reply</Badge>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => markReplied(c.id, true)}>
                        <Reply className="h-3.5 w-3.5" /> Got reply
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openCompose({ contact: c, followUpDays: days >= 14 ? 14 : 7 })}
                      >
                        <CornerUpRight className="h-3.5 w-3.5" /> {days >= 14 ? "14-day" : "7-day"} follow-up
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Awaiting reply */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-graphite-400" /> Awaiting Reply</CardTitle>
            <Badge tone="slate">{awaiting.length}</Badge>
          </CardHeader>
          <CardBody>
            {awaiting.length === 0 ? (
              <p className="text-sm text-graphite-400">No emails currently awaiting a reply within the 7-day window.</p>
            ) : (
              <div className="space-y-2">
                {awaiting.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", avatarColor(c.id))}>
                      {initials(c.firstName, c.lastName)}
                    </div>
                    <button onClick={() => openIntel(c)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium text-graphite-800">{c.firstName} {c.lastName}</div>
                      <div className="truncate text-xs text-graphite-500">{c.firm} · sent {relativeTime(c.lastOutreachAt)}</div>
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => markReplied(c.id, true)}>Mark replied</Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Active relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Active Relationships</CardTitle>
            <Badge tone="green">{active.length}</Badge>
          </CardHeader>
          <CardBody>
            {active.length === 0 ? (
              <p className="text-sm text-graphite-400">Replies and meetings will appear here as your network warms up.</p>
            ) : (
              <div className="space-y-2">
                {active.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", avatarColor(c.id))}>
                      {initials(c.firstName, c.lastName)}
                    </div>
                    <button onClick={() => openIntel(c)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium text-graphite-800">{c.firstName} {c.lastName}</div>
                      <div className="truncate text-xs text-graphite-500">{c.firm}</div>
                    </button>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    {c.status === "replied" && (
                      <Button size="sm" variant="ghost" onClick={() => setContactStatus(c.id, "meeting")}>
                        <Mail className="h-3.5 w-3.5" /> Set meeting
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-graphite-400" /> Recent CRM Activity</CardTitle>
        </CardHeader>
        <CardBody>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-graphite-400">Your outreach activity log will populate as you send and track emails.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentActivity.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-graphite-700">
                    <span className="font-medium text-graphite-900">{e.contact.firstName} {e.contact.lastName}</span>
                    <span className="text-graphite-400"> — {e.summary}</span>
                  </span>
                  <span className="shrink-0 text-xs text-graphite-400">{relativeTime(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
