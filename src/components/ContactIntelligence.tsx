"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  ExternalLink,
  Search,
  Copy,
  Check,
  Sparkles,
  Briefcase,
  TrendingUp,
  Users,
  MessageSquareQuote,
  Radar,
  StickyNote,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { OutreachStatus } from "@/types";
import { Avatar, Badge, Button, MicroLabel, ScoreRing, Select, Stars } from "@/components/ui";
import { statusMeta, priorityMeta } from "@/lib/status";
import { generateIntel } from "@/lib/ai";
import {
  fullName,
  googleSearchUrl,
  initials,
  linkedInSearchUrl,
} from "@/lib/utils";

export function ContactIntelligence() {
  const {
    contacts,
    selectedContactId,
    selectContact,
    getState,
    getFit,
    updateState,
    openComposer,
  } = useStore();

  const contact = contacts.find((c) => c.id === selectedContactId) || null;
  const [copied, setCopied] = useState<number | null>(null);

  const intel = useMemo(() => (contact ? generateIntel(contact) : null), [contact]);

  if (!contact || !intel) return null;
  const st = getState(contact.id);
  const fit = getFit(contact.id);

  const copy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => selectContact(null)} />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <Avatar initials={initials(contact)} tone={contact.priority === "tier_1" ? "graphite" : "slate"} size={48} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold leading-tight">{fullName(contact)}</h2>
                <Badge tone={priorityMeta[contact.priority].tone}>{priorityMeta[contact.priority].label}</Badge>
              </div>
              <div className="text-sm text-slate-600">{contact.title} · {contact.firm}</div>
              <div className="text-xs text-slate-400">{contact.team} · {contact.city}</div>
            </div>
          </div>
          <button onClick={() => selectContact(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Fit + search actions */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <ScoreRing score={fit.score} size={44} />
            <div>
              <MicroLabel>AI Fit Score</MicroLabel>
              <div className="text-xs text-slate-600">{fit.reasons[0]}</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <a href={linkedInSearchUrl(contact)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><ExternalLink size={14} /> LinkedIn</Button>
            </a>
            <a href={googleSearchUrl(contact)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><Search size={14} /> Google</Button>
            </a>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* AI Intel Scoping Agent */}
          <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Radar size={15} className="text-slate-900" />
              <MicroLabel>AI Intel Scoping Agent</MicroLabel>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{intel.summary}</p>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <IntelLine icon={<TrendingUp size={13} />} label="Deal momentum" text={intel.dealMomentum} />
              <IntelLine icon={<Users size={13} />} label="Team signal" text={intel.teamSignal} />
              <IntelLine icon={<Radar size={13} />} label="Desk metrics" text={intel.deskMetric} />
            </div>
          </section>

          <Section icon={<Briefcase size={14} />} title="Team / Desk & Coverage">
            <div className="text-sm text-slate-700">{contact.team}</div>
            <div className="mt-1 text-xs text-slate-500">{contact.group} · {contact.school.split(" (")[0]} &apos;{String(contact.gradYear).slice(2)}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {contact.coverage.map((s) => (
                <Badge key={s} tone="slate">{s}</Badge>
              ))}
            </div>
          </Section>

          <Section icon={<TrendingUp size={14} />} title="Recent Key Transactions">
            <div className="space-y-2">
              {contact.recentDeals.map((d, i) => (
                <div key={i} className="rounded border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{d.company}</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">{d.value}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {d.type}{d.counterparty ? ` · ${d.counterparty}` : ""} · {d.date}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Users size={14} />} title="Shared Alumni Interests">
            <div className="flex flex-wrap gap-1.5">
              {contact.sharedInterests.map((s) => (
                <span key={s} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">{s}</span>
              ))}
            </div>
            <div className="mt-3">
              <MicroLabel className="mb-1">Personal Style</MicroLabel>
              <p className="text-sm text-slate-600">{contact.personalStyle}</p>
            </div>
          </Section>

          <Section icon={<MessageSquareQuote size={14} />} title="Copyable Icebreakers">
            <div className="space-y-2">
              {intel.angles.map((ib, i) => (
                <div key={i} className="group flex items-start gap-2 rounded border border-slate-200 bg-white p-2.5">
                  <p className="flex-1 text-xs leading-relaxed text-slate-700">{ib}</p>
                  <button
                    onClick={() => copy(ib, i)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {copied === i ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* CRM */}
          <Section icon={<StickyNote size={14} />} title="CRM & Relationship">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <MicroLabel className="mb-1">Status</MicroLabel>
                <Select
                  value={st.status}
                  onChange={(e) => {
                    const status = e.target.value as OutreachStatus;
                    updateState(contact.id, {
                      status,
                      ...(status === "replied" ? { repliedAt: Date.now(), followUpFlagged: false } : {}),
                      ...(status === "sent" && !st.lastOutreachAt ? { lastOutreachAt: Date.now() } : {}),
                    });
                  }}
                  className="w-full"
                >
                  {(Object.keys(statusMeta) as OutreachStatus[]).map((s) => (
                    <option key={s} value={s}>{statusMeta[s].label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <MicroLabel className="mb-1">Relationship</MicroLabel>
                <div className="flex h-9 items-center">
                  <Stars value={st.relationship} onChange={(v) => updateState(contact.id, { relationship: v })} size={16} />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <MicroLabel className="mb-1">Notes</MicroLabel>
              <textarea
                value={st.notes}
                onChange={(e) => updateState(contact.id, { notes: e.target.value })}
                placeholder="Log call notes, referrals, next steps…"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-ring"
                rows={3}
              />
            </div>
            {contact.email && (
              <div className="mt-2 text-xs text-slate-400">
                <span className="micro-label">Email</span> {contact.email}
              </div>
            )}
          </Section>
        </div>

        {/* Footer action */}
        <div className="border-t border-slate-200 p-4">
          <Button variant="primary" size="lg" className="w-full" onClick={() => openComposer(contact.id)}>
            <Sparkles size={16} /> Generate Hyper-Personalized Outreach
          </Button>
        </div>
      </aside>
    </div>
  );
}

function IntelLine({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <p>
        <span className="font-medium text-slate-700">{label}:</span> {text}
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <MicroLabel>{title}</MicroLabel>
      </div>
      {children}
    </section>
  );
}
