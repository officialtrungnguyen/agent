import * as React from "react";
import {
  Linkedin, Search as SearchIcon, Copy, Check, Sparkles, Mail, Building2,
  GraduationCap, Briefcase, TrendingUp, Quote, MapPin, Clock, Target, FileText, StickyNote,
} from "lucide-react";
import { Dialog, DialogHeader } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Stars, ScoreRing } from "./ui/Misc";
import { Textarea } from "./ui/Input";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { useToast } from "./ui/Toast";
import { cn, initials, avatarColor, fmtMoney, fmtDate, relativeTime } from "../lib/utils";
import { STATUS_LABEL, STATUS_TONE, linkedinSearchUrl, googleSearchUrl } from "../lib/labels";
import { computeFitBreakdown } from "../lib/scoring";
import { generateIcebreakers, generateIntelReport } from "../lib/ai";
import { optimalWindowLabel } from "../lib/scheduler";

export function ContactIntelligence() {
  const { intelContact, openIntel, openCompose } = useUI();
  const { user, contacts, setRelationship, addNote, setContactStatus, markReplied } = useApp();
  const toast = useToast();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  // Pull the live version (with fitScore + latest CRM state) from the store.
  const contact = React.useMemo(
    () => (intelContact ? contacts.find((c) => c.id === intelContact.id) ?? intelContact : null),
    [intelContact, contacts],
  );

  if (!contact) return null;

  const breakdown = computeFitBreakdown(contact, user);
  const icebreakers = generateIcebreakers(contact, user);
  const intel = generateIntelReport(contact, user);

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(id);
        setTimeout(() => setCopied(null), 1500);
        toast.push("Copied to clipboard.", "success");
      },
      () => toast.push("Copy failed.", "error"),
    );
  };

  return (
    <Dialog open={!!contact} onClose={() => openIntel(null)} size="lg">
      <DialogHeader
        title={
          <span className="flex items-center gap-2">
            {contact.firstName} {contact.lastName}
            <Badge tone={STATUS_TONE[contact.status]}>{STATUS_LABEL[contact.status]}</Badge>
          </span>
        }
        subtitle={`${contact.title} · ${contact.firm}`}
        onClose={() => openIntel(null)}
        right={
          <Button size="sm" variant="primary" onClick={() => { openCompose({ contact }); openIntel(null); }}>
            <Mail className="h-4 w-4" /> Compose
          </Button>
        }
      />

      <div className="max-h-[78vh] overflow-y-auto scrollbar-thin">
        {/* Hero */}
        <div className="flex flex-col gap-4 border-b border-graphite-200 px-5 py-4 sm:flex-row sm:items-center">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white", avatarColor(contact.id))}>
            {initials(contact.firstName, contact.lastName)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-graphite-500">
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {contact.team}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {contact.city}, {contact.region}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Best: {optimalWindowLabel(contact.level)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="micro-label">Relationship</span>
              <Stars value={contact.relationshipStrength} onChange={(v) => setRelationship(contact.id, v)} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScoreRing score={contact.fitScore ?? breakdown.total} size={64} />
            <span className="micro-label">AI Fit Score</span>
          </div>
        </div>

        {/* Search + quick actions */}
        <div className="flex flex-wrap gap-2 border-b border-graphite-200 bg-graphite-50 px-5 py-3">
          <a href={linkedinSearchUrl(contact.firstName, contact.lastName, contact.firm, contact.school)} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline"><Linkedin className="h-4 w-4 text-[#0a66c2]" /> LinkedIn</Button>
          </a>
          <a href={googleSearchUrl(contact.firstName, contact.lastName, contact.firm, contact.school)} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline"><SearchIcon className="h-4 w-4" /> Google</Button>
          </a>
          <a href={`mailto:${contact.email}`}>
            <Button size="sm" variant="ghost"><Mail className="h-4 w-4" /> {contact.email}</Button>
          </a>
          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => markReplied(contact.id, true)}>Mark replied</Button>
            <Button size="sm" variant="ghost" onClick={() => setContactStatus(contact.id, "meeting")}>Meeting set</Button>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Intel summary */}
            <Section icon={<Sparkles className="h-4 w-4" />} title="AI Intel Scoping Agent">
              <p className="text-sm leading-relaxed text-graphite-700">{intel.summary}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {intel.deskMetrics.map((m) => (
                  <div key={m.label} className="rounded-md border border-graphite-200 bg-white px-3 py-2">
                    <div className="text-sm font-semibold text-graphite-900">{m.value}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-graphite-500">{m.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Coverage */}
            <Section icon={<Target className="h-4 w-4" />} title="Team, Desk & Coverage">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="dark">{contact.division}</Badge>
                {contact.coverageSectors.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
              </div>
            </Section>

            {/* Deals */}
            <Section icon={<TrendingUp className="h-4 w-4" />} title="Recent Key Transactions">
              {contact.recentDeals.length === 0 ? (
                <p className="text-sm text-graphite-400">No tracked transactions yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {contact.recentDeals.map((d) => (
                    <li key={d.id} className="rounded-md border border-graphite-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-graphite-800">{d.headline}</p>
                        <Badge tone="outline" mono>{d.type}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-graphite-500">
                        <span className="font-semibold text-graphite-700">{fmtMoney(d.valueUsd)}</span>
                        <span>{d.sector}</span>
                        <span>{fmtDate(d.date)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Icebreakers */}
            <Section icon={<Quote className="h-4 w-4" />} title="Copyable Icebreakers" hint="Tailored to this banker">
              <ul className="space-y-2">
                {icebreakers.map((ib) => (
                  <li key={ib.id} className="group flex items-start gap-2 rounded-md border border-graphite-200 bg-white p-2.5">
                    <Badge tone="outline" mono className="mt-0.5 shrink-0">{ib.angle}</Badge>
                    <p className="flex-1 text-sm text-graphite-700">{ib.text}</p>
                    <button
                      onClick={() => copy(ib.text, ib.id)}
                      className="shrink-0 rounded p-1 text-graphite-400 opacity-0 transition-opacity hover:bg-graphite-100 hover:text-graphite-700 group-hover:opacity-100"
                    >
                      {copied === ib.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Fit breakdown */}
            <Section icon={<Target className="h-4 w-4" />} title="Fit Breakdown">
              <div className="space-y-2.5">
                {breakdown.components.map((comp) => (
                  <div key={comp.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-graphite-700">{comp.label}</span>
                      <span className="tabular-nums text-graphite-500">{comp.score}/{comp.max}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-graphite-100">
                      <div className="h-full rounded-full bg-graphite-800" style={{ width: `${(comp.score / comp.max) * 100}%` }} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-graphite-400">{comp.note}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Alumni + personal */}
            <Section icon={<GraduationCap className="h-4 w-4" />} title="Background">
              <dl className="space-y-2 text-sm">
                <Row label="School" value={contact.school} highlight={contact.sharedSchool} />
                {contact.gradYear && <Row label="Class of" value={String(contact.gradYear)} />}
                <Row label="Seniority" value={contact.level} />
              </dl>
              <div className="mt-3">
                <span className="micro-label">Shared Interests</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {contact.interests.map((i) => <Badge key={i} tone="outline">{i}</Badge>)}
                </div>
              </div>
              <div className="mt-3 rounded-md bg-graphite-50 p-2.5">
                <span className="micro-label">Personal Style</span>
                <p className="mt-1 text-xs text-graphite-600">{contact.personalStyle}</p>
              </div>
            </Section>

            {/* Talking points */}
            <Section icon={<Briefcase className="h-4 w-4" />} title="Strategy">
              <ul className="space-y-1.5">
                {intel.talkingPoints.map((t, i) => (
                  <li key={i} className="flex gap-2 text-xs text-graphite-600">
                    <span className="text-graphite-300">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Notes */}
            <Section icon={<StickyNote className="h-4 w-4" />} title="CRM Notes">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log a note (call recap, intro, etc.)"
              />
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => { addNote(contact.id, note); setNote(""); }}
                disabled={!note.trim()}
              >
                Save note
              </Button>
              <ul className="mt-3 space-y-2">
                {contact.notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-graphite-200 bg-white p-2 text-xs">
                    <p className="text-graphite-700">{n.body}</p>
                    <p className="mt-1 text-[10px] text-graphite-400">{fmtDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Activity */}
            {contact.events.length > 0 && (
              <Section icon={<FileText className="h-4 w-4" />} title="Activity">
                <ul className="space-y-1.5">
                  {contact.events.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-graphite-600">{e.summary}</span>
                      <span className="shrink-0 text-graphite-400">{relativeTime(e.at)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-graphite-400">{icon}</span>
        <h4 className="text-sm font-semibold text-graphite-900">{title}</h4>
        {hint && <span className="text-[11px] text-graphite-400">· {hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-graphite-400">{label}</dt>
      <dd className={cn("text-right", highlight ? "font-semibold text-graphite-900" : "text-graphite-700")}>{value}</dd>
    </div>
  );
}
