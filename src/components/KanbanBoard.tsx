"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, GripVertical } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Contact, OutreachStatus } from "@/types";
import { Badge, Button, ScoreRing } from "@/components/ui";
import { kanbanBucket, kanbanColumns, priorityMeta } from "@/lib/status";
import { daysSince, fullName } from "@/lib/utils";

export function KanbanBoard() {
  const { contacts, getState, getFit, selectContact, openComposer, updateState } = useStore();
  const [dragId, setDragId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<OutreachStatus, { c: Contact; fit: number; days: number | null }[]> = {
      not_contacted: [], sent: [], replied: [], no_reply: [],
      queued: [], scheduled: [], meeting: [], closed: [],
    };
    for (const c of contacts) {
      const st = getState(c.id);
      // Only surface contacts that are in-pipeline or starred, to keep board usable.
      if (st.status === "not_contacted" && !st.starred && st.emailIds.length === 0) continue;
      const bucket = kanbanBucket(st.status);
      map[bucket].push({ c, fit: getFit(c.id).score, days: daysSince(st.lastOutreachAt) });
    }
    for (const k of Object.keys(map) as OutreachStatus[]) map[k].sort((a, b) => b.fit - a.fit);
    return map;
  }, [contacts, getState, getFit]);

  const handleDrop = (target: OutreachStatus) => {
    if (!dragId) return;
    const next: OutreachStatus =
      target === "sent" ? "sent" : target === "replied" ? "replied" : target === "no_reply" ? "no_reply" : "not_contacted";
    updateState(dragId, {
      status: next,
      ...(next === "sent" && !getState(dragId).lastOutreachAt ? { lastOutreachAt: Date.now() } : {}),
      ...(next === "replied" ? { repliedAt: Date.now(), followUpFlagged: false } : {}),
    });
    setDragId(null);
  };

  const totalInPipeline = kanbanColumns.reduce((acc, col) => acc + columns[col.key].length, 0);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-3 text-xs text-slate-500">
        Drag cards between stages. <span className="font-medium text-slate-900">{totalInPipeline}</span> contacts in active pipeline.
        Outreach you queue from the composer appears here automatically.
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kanbanColumns.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-sm font-medium text-slate-800">{col.label}</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {columns[col.key].length}
              </span>
            </div>
            <div className="flex max-h-[calc(100vh-220px)] min-h-[120px] flex-col gap-2 overflow-y-auto p-2">
              {columns[col.key].map(({ c, fit, days }) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  className="group cursor-grab rounded-md border border-slate-200 bg-white p-2.5 active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="mt-0.5 shrink-0 text-slate-300" />
                    <button onClick={() => selectContact(c.id)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-slate-900">{fullName(c)}</span>
                      </div>
                      <div className="truncate text-[11px] text-slate-500">{c.firm} · {c.title}</div>
                    </button>
                    <ScoreRing score={fit} size={30} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone={priorityMeta[c.priority].tone}>{priorityMeta[c.priority].label}</Badge>
                    <div className="flex items-center gap-1.5">
                      {col.key === "no_reply" && days !== null && (
                        <span className="text-[10px] font-medium text-amber-600">⚠️ {days}d</span>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openComposer(c.id)}>
                        <Sparkles size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {columns[col.key].length === 0 && (
                <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-[11px] text-slate-400">
                  Drop contacts here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
