"use client";

import React, { useMemo, useRef } from "react";
import {
  Send,
  MessageSquare,
  TrendingUp,
  CalendarClock,
  Download,
  Upload,
  Users,
  Star,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { OutreachStatus } from "@/types";
import { Card, MicroLabel, Button, Badge } from "@/components/ui";
import { statusMeta } from "@/lib/status";
import { downloadFile, fullName, seniorityLabel } from "@/lib/utils";

const VARIANT_HOOK: Record<string, string> = {
  short: "Crisp & direct",
  relationship: "Shared-school warmth",
  deal_referenced: "Recent-deal reference",
  aggressive: "High-conviction close",
};

export function AnalyticsDashboard() {
  const { contacts, getState, getFit, emails, updateState } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const m = useMemo(() => {
    let sent = 0, replied = 0, meetings = 0, scheduled = 0, queued = 0, noReply = 0, starred = 0, relationshipSum = 0, relationshipCount = 0;
    const statusCounts: Record<OutreachStatus, number> = {
      not_contacted: 0, queued: 0, scheduled: 0, sent: 0, replied: 0, no_reply: 0, meeting: 0, closed: 0,
    };
    for (const c of contacts) {
      const st = getState(c.id);
      statusCounts[st.status]++;
      if (["sent", "no_reply", "replied", "meeting"].includes(st.status)) sent++;
      if (st.status === "replied" || st.status === "meeting") replied++;
      if (st.status === "meeting") meetings++;
      if (st.status === "scheduled") scheduled++;
      if (st.status === "queued") queued++;
      if (st.status === "no_reply") noReply++;
      if (st.starred) starred++;
      if (st.relationship > 0) { relationshipSum += st.relationship; relationshipCount++; }
    }
    const replyRate = sent ? Math.round((replied / sent) * 100) : 0;
    const positiveRate = sent ? Math.round((meetings / sent) * 100) : 0;

    // best send hour from delivered/sent emails
    const hourTally: Record<number, number> = {};
    for (const e of emails) {
      if ((e.status === "sent" || e.status === "delivered") && e.sentAt) {
        const h = new Date(e.sentAt).getHours();
        hourTally[h] = (hourTally[h] || 0) + 1;
      }
    }
    const bestHour = Object.entries(hourTally).sort((a, b) => b[1] - a[1])[0]?.[0];

    // top hooks by variant usage
    const hookTally: Record<string, number> = {};
    for (const e of emails) {
      const label = VARIANT_HOOK[e.variant] || e.variant;
      hookTally[label] = (hookTally[label] || 0) + 1;
    }
    const topHooks = Object.entries(hookTally).sort((a, b) => b[1] - a[1]).slice(0, 4);

    const avgRelationship = relationshipCount ? (relationshipSum / relationshipCount).toFixed(1) : "0.0";

    return { sent, replied, meetings, scheduled, queued, noReply, replyRate, positiveRate, statusCounts, bestHour, topHooks, starred, avgRelationship };
  }, [contacts, getState, emails]);

  const exportCsv = () => {
    const rows = [
      ["name", "firm", "title", "seniority", "team", "coverage", "school", "city", "email", "priority", "fit_score", "status", "relationship", "starred", "notes", "tags"],
      ...contacts.map((c) => {
        const st = getState(c.id);
        return [
          fullName(c), c.firm, c.title, c.seniority, c.team, c.coverage.join("; "), c.school, c.city,
          c.email || "", c.priority, String(getFit(c.id).score), st.status, String(st.relationship),
          st.starred ? "yes" : "no", st.notes.replace(/\n/g, " "), st.tags.join("; "),
        ].map(csvCell).join(",");
      }),
    ];
    downloadFile(`bulgebracket-ledger-${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"), "text/csv");
  };

  const exportEmails = () => {
    const rows = [
      ["contact", "to", "subject", "variant", "status", "scheduledAt", "sentAt"],
      ...emails.map((e) => {
        const c = contacts.find((x) => x.id === e.contactId);
        return [
          c ? fullName(c) : "", e.to, e.subject, e.variant, e.status,
          e.scheduledAt ? new Date(e.scheduledAt).toISOString() : "",
          e.sentAt ? new Date(e.sentAt).toISOString() : "",
        ].map(csvCell).join(",");
      }),
    ];
    downloadFile(`bulgebracket-outreach-${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"), "text/csv");
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const idx = (k: string) => header.indexOf(k);
    let matched = 0;
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const email = (idx("email") >= 0 ? cells[idx("email")] : "").toLowerCase().trim();
      const name = (idx("name") >= 0 ? cells[idx("name")] : "").toLowerCase().trim();
      const c = contacts.find((x) => (email && x.email?.toLowerCase() === email) || fullName(x).toLowerCase() === name);
      if (!c) continue;
      matched++;
      const patch: Record<string, unknown> = {};
      if (idx("status") >= 0 && cells[idx("status")]) {
        const s = cells[idx("status")].trim() as OutreachStatus;
        if (statusMeta[s]) patch.status = s;
      }
      if (idx("relationship") >= 0 && cells[idx("relationship")]) patch.relationship = Number(cells[idx("relationship")]) || 0;
      if (idx("notes") >= 0) patch.notes = cells[idx("notes")] || "";
      if (idx("starred") >= 0) patch.starred = /yes|true|1/i.test(cells[idx("starred")] || "");
      if (idx("tags") >= 0 && cells[idx("tags")]) patch.tags = cells[idx("tags")].split(";").map((t) => t.trim()).filter(Boolean);
      updateState(c.id, patch);
    }
    alert(`Imported CRM data for ${matched} matched contact(s).`);
  };

  const topByFit = useMemo(
    () => contacts.map((c) => ({ c, fit: getFit(c.id).score })).sort((a, b) => b.fit - a.fit).slice(0, 5),
    [contacts, getFit],
  );

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={<Send size={15} />} label="Emails Sent" value={m.sent} />
        <Stat icon={<MessageSquare size={15} />} label="Replies" value={m.replied} sub={`${m.replyRate}% reply rate`} tone={m.replyRate >= 20 ? "green" : "slate"} />
        <Stat icon={<TrendingUp size={15} />} label="Meetings" value={m.meetings} sub={`${m.positiveRate}% positive`} tone={m.meetings > 0 ? "green" : "slate"} />
        <Stat icon={<CalendarClock size={15} />} label="Scheduled" value={m.scheduled} />
        <Stat icon={<Clock size={15} />} label="Awaiting / No Reply" value={m.noReply} tone={m.noReply > 0 ? "amber" : "slate"} />
        <Stat icon={<Star size={15} />} label="Starred" value={m.starred} sub={`avg rel ${m.avgRelationship}★`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pipeline breakdown */}
        <Card className="p-4">
          <MicroLabel className="mb-3">Pipeline Breakdown</MicroLabel>
          <div className="space-y-2">
            {(Object.keys(m.statusCounts) as OutreachStatus[])
              .filter((s) => m.statusCounts[s] > 0)
              .map((s) => {
                const pct = Math.round((m.statusCounts[s] / contacts.length) * 100);
                return (
                  <div key={s}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="text-slate-600">{statusMeta[s].label}</span>
                      <span className="text-slate-400">{m.statusCounts[s]}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-800" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Best hooks + send time */}
        <Card className="p-4">
          <MicroLabel className="mb-3">Best Hooks & Timing</MicroLabel>
          <div className="space-y-2">
            {m.topHooks.length === 0 && <div className="text-xs text-slate-400">Send a few emails to surface your best-performing hooks.</div>}
            {m.topHooks.map(([hook, count]) => (
              <div key={hook} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{hook}</span>
                <Badge tone="slate">{count} used</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <MicroLabel className="mb-1">Best Send Hour</MicroLabel>
            <div className="text-slate-700">
              {m.bestHour !== undefined ? `${String(m.bestHour).padStart(2, "0")}:00 — your most active send window` : "No sends yet — analysts read at 7–9 AM."}
            </div>
          </div>
        </Card>

        {/* Top fit */}
        <Card className="p-4">
          <MicroLabel className="mb-3">Highest-Fit Targets</MicroLabel>
          <div className="space-y-2">
            {topByFit.map(({ c, fit }) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-700">{fullName(c)}</span>
                  <span className="block truncate text-slate-400">{c.firm} · {seniorityLabel[c.seniority]}</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">{fit}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CSV */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <div>
              <div className="text-sm font-medium">Data Portability (CSV)</div>
              <div className="text-xs text-slate-500">Export your full ledger & outreach history, or import CRM updates by email/name match.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download size={14} /> Export Ledger</Button>
            <Button variant="outline" size="sm" onClick={exportEmails}><Download size={14} /> Export Outreach</Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import CSV</Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone = "slate" }: { icon: React.ReactNode; label: string; value: number; sub?: string; tone?: "slate" | "green" | "amber" }) {
  const color = tone === "green" ? "text-green-600" : tone === "amber" ? "text-amber-600" : "text-slate-400";
  return (
    <Card className="p-3.5">
      <div className={`mb-1 flex items-center gap-1.5 ${color}`}>{icon}<MicroLabel>{label}</MicroLabel></div>
      <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </Card>
  );
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
