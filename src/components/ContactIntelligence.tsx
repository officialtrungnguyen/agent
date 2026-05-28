import { useState } from "react";
import { Globe, Linkedin, NotebookPen, Sparkles, WandSparkles } from "lucide-react";
import { Contact, TimelineEvent } from "../types";
import { buildFollowUpDraft, buildGoogleSearchUrl, buildLinkedInSearchUrl, daysSince } from "../utils";
import { Badge, Button, Card, SectionHeading, Textarea } from "./ui";

interface ContactIntelligenceProps {
  contact: Contact;
  timeline: TimelineEvent[];
  onAddNote: (contactId: string, note: string) => void;
  onUseFollowUp: (draft: string) => void;
  onMarkStatus: (contactId: string, status: Contact["status"]) => void;
}

export const ContactIntelligence = ({
  contact,
  timeline,
  onAddNote,
  onUseFollowUp,
  onMarkStatus,
}: ContactIntelligenceProps) => {
  const [note, setNote] = useState("");
  const daysIdle = daysSince(contact.lastOutreach);

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Deep Profile Intelligence + Research Agent"
        title={`${contact.firstName} ${contact.lastName} / ${contact.firm}`}
        description="Deep desk-level context, exact search shortcuts, live-ready transaction cards, and copyable talking points designed for high-conviction IB outreach."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={buildLinkedInSearchUrl(contact)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
            </a>
            <a href={buildGoogleSearchUrl(contact)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4" />
                Google
              </Button>
            </a>
          </div>
        }
      />

      <div className="grid gap-4 p-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mono-label">Team / Desk</div>
              <div className="mt-3 text-xl font-semibold text-slate-50">{contact.teamDesk}</div>
              <div className="mt-2 text-sm text-slate-400">
                {contact.title} in {contact.location}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mono-label">Coverage Sectors</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {contact.coverageSectors.map((sector) => (
                  <Badge key={sector}>{sector}</Badge>
                ))}
              </div>
              <div className="mt-3 text-sm text-slate-400">Mutual school tie: {contact.school}</div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-300" />
              <div className="mono-label">Recent Key Transactions</div>
            </div>
            <div className="mt-4 grid gap-3">
              {contact.recentTransactions.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                  Offline deal intelligence will populate here as you import or enrich contacts.
                </div>
              ) : (
                contact.recentTransactions.map((deal) => (
                  <div key={`${deal.company}-${deal.date}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-100">
                        {deal.company} / {deal.counterparty}
                      </div>
                      <Badge tone="muted">{deal.value}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{deal.date}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">{deal.description}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <WandSparkles className="h-4 w-4 text-emerald-300" />
              <div className="mono-label">Shared Alumni Interests + Icebreakers</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {contact.sharedInterests.map((item) => (
                <Badge key={item} tone="muted">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {contact.icebreakers.map((icebreaker) => (
                <div key={icebreaker} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
                  {icebreaker}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mono-label">Personal Style / Scoping Agent</div>
            <div className="mt-4 space-y-3">
              {contact.styleNotes.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={daysIdle >= 7 ? "warning" : "muted"}>{daysIdle} days since last outreach</Badge>
              <Badge tone="muted">{contact.relationshipStrength}/5 relationship strength</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onUseFollowUp(buildFollowUpDraft(contact, 7))}>
                Generate 7-day follow-up
              </Button>
              <Button variant="outline" size="sm" onClick={() => onUseFollowUp(buildFollowUpDraft(contact, 14))}>
                Generate 14-day follow-up
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => onMarkStatus(contact.id, "Replied")}>
                Mark replied
              </Button>
              <Button variant="warning" size="sm" onClick={() => onMarkStatus(contact.id, "No Reply")}>
                Mark no reply
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mono-label">CRM Notes</div>
            <div className="mt-4 space-y-3">
              <Textarea
                value={note}
                placeholder="Log a warm intro, a call takeaway, or a calibration note before the next follow-up..."
                onChange={(event) => setNote(event.target.value)}
              />
              <Button
                onClick={() => {
                  if (!note.trim()) return;
                  onAddNote(contact.id, note.trim());
                  setNote("");
                }}
              >
                <NotebookPen className="h-4 w-4" />
                Save note
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {contact.notes.length === 0 ? (
                <div className="text-sm text-slate-500">No saved notes yet.</div>
              ) : (
                contact.notes.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mono-label">Outreach Timeline</div>
            <div className="mt-4 space-y-3">
              {timeline.length === 0 ? (
                <div className="text-sm text-slate-500">No history yet for this banker.</div>
              ) : (
                timeline.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-slate-200">{event.title}</div>
                      <div className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-400">{event.body}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
