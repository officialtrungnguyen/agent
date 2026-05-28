"use client";

import React, { useMemo } from "react";
import { Target, Sparkles, ArrowUpRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Button, ScoreRing } from "@/components/ui";
import { priorityMeta, statusMeta } from "@/lib/status";
import { fullName, initials, seniorityLabel } from "@/lib/utils";

export function TopTargets() {
  const { contacts, getState, getFit, selectContact, openComposer } = useStore();

  const top = useMemo(() => {
    return contacts
      .map((c) => ({ c, st: getState(c.id), fit: getFit(c.id) }))
      // not yet contacted, ranked by fit — the smartest fresh targets
      .filter(({ st }) => st.status === "not_contacted" || st.status === "no_reply")
      .sort((a, b) => b.fit.score - a.fit.score)
      .slice(0, 20);
  }, [contacts, getState, getFit]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Target size={16} className="text-slate-900" />
        Your 20 highest-leverage targets to work this week, ranked by AI fit score against your resume.
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {top.map(({ c, st, fit }, idx) => (
          <div key={c.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-300">#{String(idx + 1).padStart(2, "0")}</span>
                <Avatar initials={initials(c)} tone={c.priority === "tier_1" ? "graphite" : "slate"} />
              </div>
              <button onClick={() => selectContact(c.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium text-slate-900">{fullName(c)}</div>
                <div className="truncate text-xs text-slate-500">{seniorityLabel[c.seniority]} · {c.firm}</div>
              </button>
              <ScoreRing score={fit.score} />
            </div>
            <div className="mt-2 truncate text-xs text-slate-500">{c.team}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <Badge tone={priorityMeta[c.priority].tone}>{priorityMeta[c.priority].label}</Badge>
              <Badge tone={statusMeta[st.status].tone}>{statusMeta[st.status].label}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{fit.reasons[0]}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={() => openComposer(c.id)}>
                <Sparkles size={14} /> Outreach
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectContact(c.id)}>
                <ArrowUpRight size={14} />
              </Button>
            </div>
          </div>
        ))}
        {top.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-slate-400">
            You&apos;ve worked through your fresh targets — great hustle. Check Follow-ups next.
          </div>
        )}
      </div>
    </div>
  );
}
