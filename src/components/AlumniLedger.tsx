"use client";

import React, { useMemo, useState } from "react";
import { Search, Star, Sparkles, ChevronDown, Filter, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Contact, OutreachStatus, Priority, SeniorityTier } from "@/types";
import { Avatar, Badge, Button, Input, ScoreRing, Select, Stars } from "@/components/ui";
import { statusMeta, priorityMeta } from "@/lib/status";
import {
  daysSince,
  formatRelative,
  fullName,
  initials,
  seniorityLabel,
} from "@/lib/utils";

type SortKey = "fit" | "name" | "firm" | "recent" | "priority";

export function AlumniLedger() {
  const { contacts, getState, getFit, selectContact, openComposer, updateState } = useStore();

  const [q, setQ] = useState("");
  const [firm, setFirm] = useState("");
  const [group, setGroup] = useState("");
  const [school, setSchool] = useState("");
  const [seniority, setSeniority] = useState<SeniorityTier | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [status, setStatus] = useState<OutreachStatus | "">("");
  const [minFit, setMinFit] = useState(0);
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("fit");
  const [showFilters, setShowFilters] = useState(false);

  const firms = useMemo(() => Array.from(new Set(contacts.map((c) => c.firm))).sort(), [contacts]);
  const groups = useMemo(() => Array.from(new Set(contacts.map((c) => c.group))).sort(), [contacts]);
  const schools = useMemo(() => Array.from(new Set(contacts.map((c) => c.school))).sort(), [contacts]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = contacts
      .map((c) => ({ c, st: getState(c.id), fit: getFit(c.id) }))
      .filter(({ c, st }) => {
        if (firm && c.firm !== firm) return false;
        if (group && c.group !== group) return false;
        if (school && c.school !== school) return false;
        if (seniority && c.seniority !== seniority) return false;
        if (priority && c.priority !== priority) return false;
        if (status && st.status !== status) return false;
        if (starredOnly && !st.starred) return false;
        if (needle) {
          const hay = `${fullName(c)} ${c.firm} ${c.team} ${c.coverage.join(" ")} ${c.school} ${c.title}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .filter(({ fit }) => fit.score >= minFit);

    rows.sort((a, b) => {
      switch (sort) {
        case "fit":
          return b.fit.score - a.fit.score;
        case "name":
          return a.c.lastName.localeCompare(b.c.lastName);
        case "firm":
          return a.c.firm.localeCompare(b.c.firm);
        case "priority":
          return a.c.priority.localeCompare(b.c.priority);
        case "recent":
          return (b.st.lastOutreachAt ?? 0) - (a.st.lastOutreachAt ?? 0);
      }
    });
    return rows;
  }, [contacts, getState, getFit, q, firm, group, school, seniority, priority, status, minFit, starredOnly, sort]);

  const clearFilters = () => {
    setFirm(""); setGroup(""); setSchool(""); setSeniority(""); setPriority(""); setStatus(""); setMinFit(0); setStarredOnly(false);
  };
  const activeFilters = [firm, group, school, seniority, priority, status].filter(Boolean).length + (minFit > 0 ? 1 : 0) + (starredOnly ? 1 : 0);

  return (
    <div className="p-4 md:p-6">
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, firm, desk, coverage, school…"
              className="pl-8"
            />
          </div>
          <Button variant={showFilters ? "primary" : "outline"} size="md" onClick={() => setShowFilters((v) => !v)}>
            <Filter size={14} /> Filters {activeFilters > 0 && <span className="ml-0.5 rounded bg-white/20 px-1 text-[10px]">{activeFilters}</span>}
          </Button>
          <div className="flex items-center gap-1.5">
            <span className="micro-label">Sort</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="fit">AI Fit Score</option>
              <option value="priority">Priority</option>
              <option value="name">Last Name</option>
              <option value="firm">Firm</option>
              <option value="recent">Recent Outreach</option>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-3 lg:grid-cols-6 animate-fade-in">
            <FilterSelect label="Firm" value={firm} onChange={setFirm} options={firms} />
            <FilterSelect label="Group" value={group} onChange={setGroup} options={groups} />
            <FilterSelect label="School" value={school} onChange={setSchool} options={schools} />
            <div>
              <span className="micro-label">Seniority</span>
              <Select value={seniority} onChange={(e) => setSeniority(e.target.value as SeniorityTier | "")} className="mt-1 w-full">
                <option value="">All</option>
                {(["analyst", "associate", "vp", "director", "md"] as SeniorityTier[]).map((s) => (
                  <option key={s} value={s}>{seniorityLabel[s]}</option>
                ))}
              </Select>
            </div>
            <div>
              <span className="micro-label">Status</span>
              <Select value={status} onChange={(e) => setStatus(e.target.value as OutreachStatus | "")} className="mt-1 w-full">
                <option value="">All</option>
                {(Object.keys(statusMeta) as OutreachStatus[]).map((s) => (
                  <option key={s} value={s}>{statusMeta[s].label}</option>
                ))}
              </Select>
            </div>
            <div>
              <span className="micro-label">Min Fit: {minFit}</span>
              <input
                type="range"
                min={0}
                max={95}
                value={minFit}
                onChange={(e) => setMinFit(Number(e.target.value))}
                className="mt-2 w-full accent-slate-900"
              />
            </div>
            <div className="col-span-2 flex items-center gap-3 sm:col-span-3 lg:col-span-6">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} className="accent-slate-900" />
                <Star size={13} /> Starred only
              </label>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="font-medium text-slate-900">{filtered.length}</span> of {contacts.length} contacts
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="hidden grid-cols-[auto_1fr_160px_120px_56px_140px_100px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 lg:grid">
          <div className="w-9" />
          <div className="micro-label">Contact / Desk</div>
          <div className="micro-label">Firm</div>
          <div className="micro-label">School</div>
          <div className="micro-label text-center">Fit</div>
          <div className="micro-label">Status</div>
          <div className="micro-label text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map(({ c, st, fit }) => (
            <LedgerRow
              key={c.id}
              c={c}
              fit={fit}
              status={st.status}
              starred={!!st.starred}
              relationship={st.relationship}
              lastOutreachAt={st.lastOutreachAt}
              onOpen={() => selectContact(c.id)}
              onCompose={() => openComposer(c.id)}
              onStar={() => updateState(c.id, { starred: !st.starred })}
              onRelationship={(v) => updateState(c.id, { relationship: v })}
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-16 text-center text-sm text-slate-400">No contacts match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <span className="micro-label">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>
    </div>
  );
}

function LedgerRow({
  c,
  fit,
  status,
  starred,
  relationship,
  lastOutreachAt,
  onOpen,
  onCompose,
  onStar,
  onRelationship,
}: {
  c: Contact;
  fit: { score: number; reasons: string[] };
  status: OutreachStatus;
  starred: boolean;
  relationship: number;
  lastOutreachAt?: number;
  onOpen: () => void;
  onCompose: () => void;
  onStar: () => void;
  onRelationship: (v: number) => void;
}) {
  const meta = statusMeta[status];
  const noReplyDays = status === "no_reply" || status === "sent" ? daysSince(lastOutreachAt) : null;
  const showNoReply = (status === "sent" || status === "no_reply") && noReplyDays !== null && noReplyDays >= 7;

  return (
    <div className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-slate-50 lg:grid-cols-[auto_1fr_160px_120px_56px_140px_100px] lg:items-center lg:gap-3">
      {/* avatar + star */}
      <div className="flex items-center gap-2 lg:block">
        <button onClick={onStar} className="relative">
          <Avatar initials={initials(c)} tone={c.priority === "tier_1" ? "graphite" : "slate"} />
          {starred && (
            <Star size={12} className="absolute -right-1 -top-1 fill-amber-400 text-amber-400" />
          )}
        </button>
      </div>

      {/* name + desk */}
      <button onClick={onOpen} className="min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-900">{fullName(c)}</span>
          <Badge tone={priorityMeta[c.priority].tone}>{priorityMeta[c.priority].label}</Badge>
        </div>
        <div className="truncate text-xs text-slate-500">
          {c.title} · {c.team}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {c.coverage.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{s}</span>
          ))}
        </div>
      </button>

      {/* firm */}
      <div className="text-xs text-slate-600 lg:text-sm">
        <div className="font-medium text-slate-800">{c.firm}</div>
        <div className="text-[11px] text-slate-400">{c.city}</div>
      </div>

      {/* school */}
      <div className="truncate text-xs text-slate-500" title={c.school}>
        {c.school.split(" (")[0]}
        {c.gradYear && <span className="text-slate-400"> &apos;{String(c.gradYear).slice(2)}</span>}
      </div>

      {/* fit */}
      <div className="flex justify-start lg:justify-center" title={fit.reasons.join(" • ")}>
        <ScoreRing score={fit.score} />
      </div>

      {/* status */}
      <div className="flex flex-col items-start gap-1">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {showNoReply ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
            ⚠️ No reply ({noReplyDays}d)
          </span>
        ) : lastOutreachAt ? (
          <span className="text-[10px] text-slate-400">{formatRelative(lastOutreachAt)}</span>
        ) : null}
        <Stars value={relationship} onChange={onRelationship} size={11} />
      </div>

      {/* actions */}
      <div className="flex items-center justify-start gap-1.5 lg:justify-end">
        <Button variant="ghost" size="sm" onClick={onOpen} title="Open intelligence">
          <ChevronDown size={14} className="-rotate-90" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCompose} title="Compose outreach">
          <Sparkles size={14} />
        </Button>
      </div>
    </div>
  );
}
