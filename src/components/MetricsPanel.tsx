import { Activity, BarChart3, Flame, Target } from 'lucide-react';
import { buildMetrics, computeFitScore, getContactName, getAutoStatus } from '../lib/recruiting';
import type { AppState, Contact } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MetricsPanelProps {
  state: AppState;
  onSelectContact: (contact: Contact) => void;
}

export function MetricsPanel({ state, onSelectContact }: MetricsPanelProps) {
  const metrics = buildMetrics(state);
  const topTargets = metrics.topTargets.slice(0, 5);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="micro-label">Pipeline Analytics</div>
            <CardTitle className="mt-2 text-xl">Weekly signal readout</CardTitle>
          </div>
          <BarChart3 className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <MetricCell icon={Activity} label="Sent" value={String(metrics.sent)} />
          <MetricCell icon={Flame} label="Reply Rate" value={`${metrics.replyRate.toFixed(0)}%`} />
          <MetricCell icon={Target} label="Positive Replies" value={String(metrics.positiveResponses)} />
          <MetricCell
            icon={BarChart3}
            label="No Reply Alerts"
            value={String(state.contacts.filter((contact) => getAutoStatus(contact) === 'no-reply').length)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="micro-label">Top 20 Targets This Week</div>
          <CardTitle className="mt-2 text-xl">Highest-priority queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topTargets.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelectContact(contact)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-left transition hover:border-slate-600"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">{getContactName(contact)}</div>
                <div className="text-xs text-slate-400">
                  {contact.firm} - {contact.team}
                </div>
              </div>
              <Badge variant={computeFitScore(contact, state.resume) >= 85 ? 'green' : 'blue'}>
                {computeFitScore(contact, state.resume)}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="micro-label">Best Hooks</div>
          <CardTitle className="mt-2 text-xl">What is resonating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.bestHooks.length ? (
            metrics.bestHooks.map((hook) => (
              <div key={hook.hook} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-sm text-slate-100">{hook.hook}</div>
                <div className="mt-2 text-xs text-slate-400">Used in {hook.count} sent notes</div>
              </div>
            ))
          ) : (
            <EmptyState text="Send a few emails to start building hook analytics." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="micro-label">Best Send Windows</div>
          <CardTitle className="mt-2 text-xl">When your outreach lands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.bestSendWindows.length ? (
            metrics.bestSendWindows.map((window) => (
              <div key={window.window} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-sm text-slate-100">{window.window}</div>
                <Badge variant="slate">{window.count}</Badge>
              </div>
            ))
          ) : (
            <EmptyState text="Send history is still empty; recommended send windows are queued automatically." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between">
        <div className="micro-label">{label}</div>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">{text}</div>;
}
