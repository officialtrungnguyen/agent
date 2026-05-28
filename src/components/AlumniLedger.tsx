import { useMemo, useState } from "react";
import type { Contact } from "../types";
import { StatusBadge } from "./StatusBadge";
import { FitScore } from "./FitScore";
import { Pill } from "./ui/Pill";
import { Button } from "./ui/Button";
import {
  Search, Linkedin, ExternalLink, Star, ArrowUpDown,
  LayoutGrid, ListIcon, Filter, MailPlus, X,
} from "lucide-react";
import { linkedinSearchUrl, googleSearchUrl } from "../lib/linkedin";
import { cn } from "../lib/cn";

const ListIconAlias = ListIcon;

interface Props {
  contacts: Contact[];
  onOpenContact: (c: Contact) => void;
  onCompose: (c: Contact) => void;
}

type SortKey = "fit" | "priority" | "firm" | "name" | "status" | "seniority" | "school";

export function AlumniLedger({ contacts, onOpenContact, onCompose }: Props) {
  const [search, setSearch] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [seniorityFilter, setSeniorityFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [sortKey, setSortKey] = useState<SortKey>("fit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const firms = useMemo(() => Array.from(new Set(contacts.map((c) => c.firm))).sort(), [contacts]);
  const sectors = useMemo(
    () => Array.from(new Set(contacts.flatMap((c) => c.coverage))).sort(),
    [contacts]
  );
  const seniorities = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.seniority))),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (firmFilter !== "all" && c.firm !== firmFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (seniorityFilter !== "all" && c.seniority !== seniorityFilter) return false;
      if (sectorFilter !== "all" && !c.coverage.includes(sectorFilter)) return false;
      if (!q) return true;
      const hay = [
        c.firstName, c.lastName, c.firm, c.title, c.team, c.school, c.city,
        ...(c.coverage || []), ...(c.tags || []),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, search, firmFilter, statusFilter, seniorityFilter, sectorFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "fit":
          return ((a.fitScore || 0) - (b.fitScore || 0)) * dir;
        case "priority":
          return (a.priority - b.priority) * dir;
        case "firm":
          return a.firm.localeCompare(b.firm) * dir;
        case "name":
          return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "seniority":
          return a.seniority.localeCompare(b.seniority) * dir;
        case "school":
          return a.school.localeCompare(b.school) * dir;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  const clearFilters = () => {
    setSearch(""); setFirmFilter("all"); setStatusFilter("all");
    setSeniorityFilter("all"); setSectorFilter("all");
  };

  return (
    <div className="space-y-3">
      <div className="panel p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, firm, sector, school..."
            className="input pl-7"
          />
        </div>
        <Select label="Firm" value={firmFilter} onChange={setFirmFilter} options={[{ v: "all", l: "All firms" }, ...firms.map((f) => ({ v: f, l: f }))]} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { v: "all", l: "All statuses" },
          { v: "not_contacted", l: "Not contacted" },
          { v: "queued", l: "Queued" },
          { v: "scheduled", l: "Scheduled" },
          { v: "sent", l: "Sent" },
          { v: "replied", l: "Replied" },
          { v: "no_reply", l: "No reply" },
          { v: "meeting_set", l: "Meeting set" },
          { v: "passed", l: "Passed" },
        ]} />
        <Select label="Seniority" value={seniorityFilter} onChange={setSeniorityFilter} options={[{ v: "all", l: "All seniority" }, ...seniorities.map((s) => ({ v: s, l: s }))]} />
        <Select label="Sector" value={sectorFilter} onChange={setSectorFilter} options={[{ v: "all", l: "All sectors" }, ...sectors.map((s) => ({ v: s, l: s }))]} />
        <Button variant="ghost" size="sm" leading={<X size={12} />} onClick={clearFilters}>Clear</Button>
        <div className="ml-auto flex items-center gap-1 hairline rounded-sharp p-0.5">
          <button
            onClick={() => setView("table")}
            className={cn("h-6 px-2 rounded-sharp flex items-center gap-1 text-[11px]", view === "table" ? "bg-graphite-900 text-graphite-50" : "text-graphite-700")}
          >
            <ListIconAlias size={11} /> Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn("h-6 px-2 rounded-sharp flex items-center gap-1 text-[11px]", view === "kanban" ? "bg-graphite-900 text-graphite-50" : "text-graphite-700")}
          >
            <LayoutGrid size={11} /> Kanban
          </button>
        </div>
      </div>

      <div className="micro flex items-center gap-3">
        <Filter size={11} /> {sorted.length} of {contacts.length} contacts
      </div>

      {view === "table" ? (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-[12.5px]">
              <thead className="hairline-b bg-graphite-50/60">
                <tr className="text-graphite-500">
                  <Th onClick={() => toggleSort("fit")} active={sortKey === "fit"} dir={sortDir}>Fit</Th>
                  <Th onClick={() => toggleSort("priority")} active={sortKey === "priority"} dir={sortDir}>P</Th>
                  <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir}>Name</Th>
                  <Th onClick={() => toggleSort("firm")} active={sortKey === "firm"} dir={sortDir}>Firm</Th>
                  <Th onClick={() => toggleSort("seniority")} active={sortKey === "seniority"} dir={sortDir}>Title · Team</Th>
                  <Th onClick={() => toggleSort("school")} active={sortKey === "school"} dir={sortDir}>School</Th>
                  <Th onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>Status</Th>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id} className="hairline-b hover:bg-graphite-50/70 cursor-pointer" onClick={() => onOpenContact(c)}>
                    <td className="px-3 py-2"><FitScore score={c.fitScore} size="sm" /></td>
                    <td className="px-3 py-2"><PriorityDots p={c.priority} /></td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-graphite-900">{c.firstName} {c.lastName}</div>
                      <div className="text-[11px] text-graphite-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.firm}</div>
                      <div className="text-[10.5px] text-graphite-500 font-mono uppercase tracking-micro">{c.firmGroup}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{c.title}</div>
                      <div className="text-[11px] text-graphite-500">{c.team}</div>
                    </td>
                    <td className="px-3 py-2 text-[11.5px]">{c.school}</td>
                    <td className="px-3 py-2"><StatusBadge contact={c} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <a
                          className="btn-ghost h-7 px-2"
                          href={linkedinSearchUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          title="Exact LinkedIn search"
                        >
                          <Linkedin size={12} />
                        </a>
                        <a
                          className="btn-ghost h-7 px-2"
                          href={googleSearchUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          title="Google search"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <Button size="sm" variant="primary" leading={<MailPlus size={11} />} onClick={() => onCompose(c)}>
                          Compose
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!sorted.length && (
              <div className="p-8 text-center text-sm text-graphite-500">No contacts match your filters.</div>
            )}
          </div>
        </div>
      ) : (
        <KanbanView contacts={sorted} onOpen={onOpenContact} onCompose={onCompose} />
      )}
    </div>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px] select-none">
      <button onClick={onClick} className={cn("inline-flex items-center gap-1", active && "text-graphite-900")}>
        {children} <ArrowUpDown size={10} className={cn(active ? "opacity-100" : "opacity-30")} />
        {active && <span className="ml-0.5 text-[9px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-graphite-500">
      <span className="micro">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input h-8 w-auto min-w-[120px]"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function PriorityDots({ p }: { p: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={9} className={i <= p ? "fill-graphite-900 text-graphite-900" : "text-graphite-300"} />
      ))}
    </div>
  );
}

function KanbanView({ contacts, onOpen, onCompose }: { contacts: Contact[]; onOpen: (c: Contact) => void; onCompose: (c: Contact) => void; }) {
  const cols: Array<{ id: string; label: string; match: (c: Contact) => boolean }> = [
    { id: "not", label: "Not Contacted", match: (c) => c.status === "not_contacted" },
    { id: "queued", label: "Queued / Scheduled", match: (c) => c.status === "queued" || c.status === "scheduled" },
    { id: "sent", label: "Sent", match: (c) => c.status === "sent" },
    { id: "noreply", label: "No Reply (7d+)", match: (c) => c.status === "no_reply" },
    { id: "replied", label: "Replied / Meeting", match: (c) => c.status === "replied" || c.status === "meeting_set" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      {cols.map((col) => {
        const list = contacts.filter(col.match).slice(0, 80);
        return (
          <div key={col.id} className="panel">
            <div className="px-3 py-2 hairline-b flex items-center justify-between">
              <div className="micro-strong">{col.label}</div>
              <Pill tone="neutral">{list.length}</Pill>
            </div>
            <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto scroll-thin">
              {list.map((c) => (
                <div key={c.id} className="hairline rounded-sharp p-2.5 hover:bg-graphite-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-[12.5px]" onClick={() => onOpen(c)}>
                      {c.firstName} {c.lastName}
                    </div>
                    <FitScore score={c.fitScore} size="sm" />
                  </div>
                  <div className="text-[11px] text-graphite-500 mt-0.5">{c.firm} · {c.seniority}</div>
                  <div className="text-[10.5px] text-graphite-500 mt-0.5">{c.team}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onOpen(c)}>Open</Button>
                    <Button size="sm" variant="primary" onClick={() => onCompose(c)}>Compose</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
