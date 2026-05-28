import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import type { Contact, OutreachStatus } from "@/types";
import { daysBetween, formatRelative } from "@/lib/utils";

const COLUMNS: { id: OutreachStatus; label: string; description: string }[] = [
  { id: "not_contacted", label: "Not Contacted", description: "Cold queue · highest leverage" },
  { id: "queued", label: "Queued", description: "Drafted, awaiting review" },
  { id: "scheduled", label: "Scheduled", description: "Auto-sending at optimal window" },
  { id: "sent", label: "Sent", description: "Awaiting reply window (0-7d)" },
  { id: "no_reply", label: "No Reply 7d+", description: "Time to follow up" },
  { id: "replied", label: "Replied", description: "Active conversation" },
  { id: "meeting_set", label: "Meeting Set", description: "Coffee scheduled" },
];

export function KanbanScreen() {
  const contacts = useAppStore((s) => s.contacts);
  const openIntel = useAppStore((s) => s.openIntel);
  const openComposer = useAppStore((s) => s.openComposer);
  const setStatus = useAppStore((s) => s.setStatus);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const byCol = useMemo(() => {
    const map = new Map<OutreachStatus, Contact[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    const q = search.toLowerCase().trim();
    for (const c of contacts) {
      if (q) {
        const hay = `${c.fullName} ${c.firm} ${c.desk}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const colId: OutreachStatus = c.status === "opened" ? "sent" : c.status;
      const target = map.get(colId);
      if (target) target.push(c);
    }
    for (const [, list] of map) list.sort((a, b) => b.fitScore - a.fitScore);
    return map;
  }, [contacts, search]);

  function onDrop(col: OutreachStatus) {
    if (!dragId) return;
    setStatus(dragId, col);
    setDragId(null);
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="microlabel">Pipeline</p>
          <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Outreach Board</h1>
          <p className="text-xs text-graphite-500">Drag cards across columns to update status. Auto-flags after 7 days of no reply.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick filter…" className="w-60" />
          <Button size="sm" variant="ghost" onClick={() => setSearch("")}> <Filter className="h-3.5 w-3.5" /> Reset</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {COLUMNS.map((col) => {
          const items = byCol.get(col.id) ?? [];
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col rounded-lg border border-graphite-200 bg-graphite-50"
            >
              <div className="border-b border-graphite-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-microcap text-graphite-700">{col.label}</span>
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-graphite-700">{items.length}</span>
                </div>
                <p className="text-[10px] text-graphite-500">{col.description}</p>
              </div>
              <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-2">
                {items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    className="cursor-grab rounded-md border border-graphite-200 bg-white p-2.5 transition-colors hover:border-graphite-400 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar name={c.fullName} className="h-7 w-7 text-[9px]" />
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openIntel(c.id)} className="block w-full truncate text-left text-[12px] font-medium text-graphite-900 hover:underline">
                          {c.fullName}
                        </button>
                        <p className="truncate text-[10px] text-graphite-500">{c.firm} · {c.title}</p>
                      </div>
                      <Badge
                        variant={c.priority === "S" ? "priority_s" : c.priority === "A" ? "priority_a" : c.priority === "B" ? "priority_b" : "priority_c"}
                        className="text-[9px]"
                      >{c.priority}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="relative h-1 w-full overflow-hidden rounded-full bg-graphite-100">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-graphite-900" style={{ width: `${c.fitScore}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold tabular-nums text-graphite-700">{c.fitScore}</span>
                    </div>
                    {c.status === "no_reply" && c.lastOutreachAt && daysBetween(c.lastOutreachAt) >= 7 && (
                      <p className="mt-1.5 text-[10px] font-medium text-amber-700">⚠ No reply · {daysBetween(c.lastOutreachAt)}d</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-graphite-400">{formatRelative(c.lastOutreachAt)}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => openComposer(c.id)}>Draft</Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-[11px] text-graphite-400">No contacts.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
