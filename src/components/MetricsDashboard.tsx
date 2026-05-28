import { Contact, MetricsSnapshot } from "../types";
import { Badge, Card, MetricTile, SectionHeading } from "./ui";

interface MetricsDashboardProps {
  metrics: MetricsSnapshot;
  topTargets: Contact[];
}

export const MetricsDashboard = ({ metrics, topTargets }: MetricsDashboardProps) => (
  <Card className="overflow-hidden">
    <SectionHeading
      eyebrow="CRM + Analytics + Smart Weekly Targeting"
      title="Measure what is converting and stay focused on the right 20 bankers"
      description="The dashboard tracks sends, reply conversion, positive signals, highest-performing hooks, and the top contacts to attack this week based on fit score, relationship strength, and desk relevance."
    />

    <div className="grid gap-4 p-5 lg:grid-cols-4">
      <MetricTile label="Sent" value={metrics.sent} detail="Live outreach records in the CRM timeline." />
      <MetricTile label="Reply Rate" value={`${metrics.replyRate}%`} detail="Across contacts already reached." />
      <MetricTile label="Positive responses" value={metrics.positiveResponses} detail="Manual and synced reply events combined." />
      <MetricTile label="No reply flags" value={metrics.noReply} detail="Amber follow-up reminders after 7 days." />
    </div>

    <div className="grid gap-5 border-t border-slate-800 px-5 py-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-4">
        <div className="mono-label">Best Hooks + Send Times</div>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-300">Winning hooks</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {metrics.bestHooks.map((hook) => (
                <Badge key={hook}>{hook}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-300">Best windows</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {metrics.bestSendWindows.map((window) => (
                <Badge key={window} tone="muted">
                  {window}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mono-label">Top 20 Targets This Week</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {topTargets.map((contact, index) => (
            <div key={contact.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-slate-100">
                  #{index + 1} {contact.firstName} {contact.lastName}
                </div>
                <Badge tone={contact.priority === "Tier 1" ? "warning" : "muted"}>{contact.fitScore}</Badge>
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {contact.firm} / {contact.teamDesk}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {contact.school} alumni tie / {contact.relationshipStrength} star relationship / {contact.coverageSectors[0]} angle
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </Card>
);
