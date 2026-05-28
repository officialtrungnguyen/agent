import * as React from "react";
import {
  Search, SlidersHorizontal, LayoutGrid, Table2, Download, Upload,
  Mail, Sparkles, Star, ArrowUpDown, Crown, Users,
} from "lucide-react";
import type { Contact, OutreachStatus, Priority } from "../types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input, Select } from "./ui/Input";
import { ScoreRing, EmptyState } from "./ui/Misc";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { useToast } from "./ui/Toast";
import { cn, initials, avatarColor, relativeTime, daysBetween } from "../lib/utils";
import { STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL, PRIORITY_TONE, KANBAN_COLUMNS } from "../lib/labels";
import { FIRM_NAMES, ALL_DIVISIONS } from "../data/contactsData";
import { contactsToCsv, csvToContacts, downloadCsv } from "../lib/csv";
import { scoreBand } from "../lib/scoring";

type SortKey = "fit" | "name" | "priority" | "lastOutreach" | "firm";
type ViewMode = "table" | "kanban";

const PRIORITY_RANK: Record<Priority, number> = { top: 0, high: 1, medium: 2, low: 3 };

export function AlumniLedger() {
  const { contacts, importContacts } = useApp();
  const { openIntel, openCompose } = useUI();
  const toast = useToast();

  const [view, setView] = React.useState<ViewMode>("table");
  const [query, setQuery] = React.useState("");
  const [firm, setFirm] = React.useState("all");
  const [division, setDivision] = React.useState("all");
  const [status, setStatus] = React.useState<OutreachStatus | "all">("all");
  const [priority, setPriority] = React.useState<Priority | "all">("all");
  const [sharedOnly, setSharedOnly] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("fit");
  const [showFilters, setShowFilters] = React.useState(true);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = contacts.filter((c) => {
      if (firm !== "all" && c.firm !== firm) return false;
      if (division !== "all" && c.division !== division) return false;
      if (status !== "all" && c.status !== status) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      if (sharedOnly && !c.sharedSchool) return false;
      if (q) {
        const blob = `${c.firstName} ${c.lastName} ${c.firm} ${c.title} ${c.team} ${c.division} ${c.school} ${c.coverageSectors.join(" ")} ${c.city}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "fit":
          return (b.fitScore ?? 0) - (a.fitScore ?? 0);
        case "name":
          return a.lastName.localeCompare(b.lastName);
        case "firm":
          return a.firm.localeCompare(b.firm) || (b.fitScore ?? 0) - (a.fitScore ?? 0);
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (b.fitScore ?? 0) - (a.fitScore ?? 0);
        case "lastOutreach": {
          const at = a.lastOutreachAt ? new Date(a.lastOutreachAt).getTime() : 0;
          const bt = b.lastOutreachAt ? new Date(b.lastOutreachAt).getTime() : 0;
          return bt - at;
        }
        default:
          return 0;
      }
    });
    return list;
  }, [contacts, query, firm, division, status, priority, sharedOnly, sortKey]);

  const onExport = () => {
    downloadCsv(`bulgebracket-ledger-${new Date().toISOString().slice(0, 10)}.csv`, contactsToCsv(filtered));
    toast.push(`Exported ${filtered.length} contacts to CSV.`, "success");
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = csvToContacts(String(reader.result));
      if (parsed.length) importContacts(parsed);
      else toast.push("No valid rows found in CSV.", "error");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeFilters = [firm, division, status, priority].filter((v) => v !== "all").length + (sharedOnly ? 1 : 0);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-graphite-200 bg-white px-4 py-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 240+ bankers by name, firm, team, sector…"
            className="pl-9"
          />
        </div>
        <Button
          size="sm"
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeFilters > 0 && <Badge tone="dark" className="ml-1">{activeFilters}</Badge>}
        </Button>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-graphite-400" />
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="h-8">
            <option value="fit">Sort: AI Fit</option>
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
            <option value="firm">Sort: Firm</option>
            <option value="lastOutreach">Sort: Last outreach</option>
          </Select>
        </div>
        <div className="flex overflow-hidden rounded-md border border-graphite-300">
          <button
            onClick={() => setView("table")}
            className={cn("flex h-8 items-center gap-1.5 px-2.5 text-xs", view === "table" ? "bg-graphite-900 text-white" : "bg-white text-graphite-600 hover:bg-graphite-50")}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn("flex h-8 items-center gap-1.5 border-l border-graphite-300 px-2.5 text-xs", view === "kanban" ? "bg-graphite-900 text-white" : "bg-white text-graphite-600 hover:bg-graphite-50")}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
        <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
          <Upload className="h-4 w-4" /> Import
        </Button>
        <Button size="sm" variant="ghost" onClick={onExport}>
          <Download className="h-4 w-4" /> Export
        </Button>
        <input ref={fileInput} type="file" accept=".csv" className="hidden" onChange={onImport} />
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 border-b border-graphite-200 bg-graphite-50 px-4 py-2.5">
          <Select value={firm} onChange={(e) => setFirm(e.target.value)} className="h-8">
            <option value="all">All firms</option>
            {FIRM_NAMES.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Select value={division} onChange={(e) => setDivision(e.target.value)} className="h-8">
            <option value="all">All divisions</option>
            {ALL_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as OutreachStatus | "all")} className="h-8">
            <option value="all">Any status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "all")} className="h-8">
            <option value="all">Any priority</option>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v} priority</option>)}
          </Select>
          <button
            onClick={() => setSharedOnly((s) => !s)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
              sharedOnly ? "border-graphite-900 bg-graphite-900 text-white" : "border-graphite-300 bg-white text-graphite-600 hover:bg-graphite-50",
            )}
          >
            <Crown className="h-3.5 w-3.5" /> Shared school
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-graphite-500">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-graphite-700">{filtered.length}</span> of {contacts.length} bankers
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState icon={<Search className="h-8 w-8" />} title="No bankers match your filters" body="Try widening your search or clearing a filter." />
        ) : view === "table" ? (
          <LedgerTable contacts={filtered} onIntel={openIntel} onCompose={(c) => openCompose({ contact: c })} />
        ) : (
          <KanbanBoard contacts={filtered} onIntel={openIntel} onCompose={(c) => openCompose({ contact: c })} />
        )}
      </div>
    </div>
  );
}

function NoReplyFlag({ contact }: { contact: Contact }) {
  if (contact.status !== "no_reply" && contact.status !== "sent") return null;
  if (!contact.lastOutreachAt || contact.lastReplyAt) return null;
  const days = daysBetween(contact.lastOutreachAt);
  if (days < 7) return null;
  return (
    <Badge tone="amber" className="ml-1" mono>
      ⚠ {days}d no reply
    </Badge>
  );
}

function LedgerTable({
  contacts,
  onIntel,
  onCompose,
}: {
  contacts: Contact[];
  onIntel: (c: Contact) => void;
  onCompose: (c: Contact) => void;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 z-10 bg-graphite-50">
        <tr className="border-b border-graphite-200 text-left">
          <th className="px-4 py-2 micro-label">Fit</th>
          <th className="px-2 py-2 micro-label">Banker</th>
          <th className="px-2 py-2 micro-label">Firm · Team</th>
          <th className="px-2 py-2 micro-label">Coverage</th>
          <th className="px-2 py-2 micro-label">School</th>
          <th className="px-2 py-2 micro-label">Status</th>
          <th className="px-2 py-2 micro-label">Last</th>
          <th className="px-4 py-2 micro-label text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((c) => {
          const band = scoreBand(c.fitScore ?? 0);
          return (
            <tr
              key={c.id}
              className="group border-b border-graphite-100 transition-colors hover:bg-graphite-50/70"
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ScoreRing score={c.fitScore ?? 0} size={38} />
                </div>
              </td>
              <td className="px-2 py-2.5">
                <button onClick={() => onIntel(c)} className="flex items-center gap-2.5 text-left">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", avatarColor(c.id))}>
                    {initials(c.firstName, c.lastName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-graphite-900 group-hover:underline">{c.firstName} {c.lastName}</span>
                      {c.sharedSchool && <Crown className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="text-xs text-graphite-500">{c.title}</div>
                  </div>
                </button>
              </td>
              <td className="px-2 py-2.5">
                <div className="font-medium text-graphite-800">{c.firm}</div>
                <div className="text-xs text-graphite-500">{c.team}</div>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {c.coverageSectors.slice(0, 2).map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                </div>
              </td>
              <td className="px-2 py-2.5">
                <span className={cn("text-xs", c.sharedSchool ? "font-medium text-graphite-900" : "text-graphite-500")}>
                  {c.school.replace(/\s*\(.*\)/, "")}
                </span>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  <NoReplyFlag contact={c} />
                </div>
              </td>
              <td className="px-2 py-2.5">
                <div className="text-xs text-graphite-500">{relativeTime(c.lastOutreachAt)}</div>
                <Badge tone={PRIORITY_TONE[c.priority]} className="mt-0.5">{PRIORITY_LABEL[c.priority]}</Badge>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="outline" onClick={() => onIntel(c)} title={`${band.label} · open intel`}>
                    <Sparkles className="h-3.5 w-3.5" /> Intel
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => onCompose(c)}>
                    <Mail className="h-3.5 w-3.5" /> Reach out
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function KanbanBoard({
  contacts,
  onIntel,
  onCompose,
}: {
  contacts: Contact[];
  onIntel: (c: Contact) => void;
  onCompose: (c: Contact) => void;
}) {
  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4 scrollbar-thin">
      {KANBAN_COLUMNS.map((col) => {
        const items = contacts.filter((c) => col.statuses.includes(c.status));
        return (
          <div key={col.key} className="flex w-72 shrink-0 flex-col rounded-lg border border-graphite-200 bg-graphite-50">
            <div className="flex items-center justify-between border-b border-graphite-200 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-graphite-600">{col.title}</span>
              <Badge tone="slate">{items.length}</Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
              {items.slice(0, 60).map((c) => (
                <div key={c.id} className="rounded-md border border-graphite-200 bg-white p-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => onIntel(c)} className="flex min-w-0 items-center gap-2 text-left">
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", avatarColor(c.id))}>
                        {initials(c.firstName, c.lastName)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-graphite-900">{c.firstName} {c.lastName}</div>
                        <div className="truncate text-[11px] text-graphite-500">{c.firm}</div>
                      </div>
                    </button>
                    <span className="shrink-0 text-[11px] font-semibold text-graphite-700">{c.fitScore}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <NoReplyFlag contact={c} />
                    <button onClick={() => onCompose(c)} className="ml-auto rounded p-1 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700" title="Compose">
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-graphite-400">Empty</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { Star };
