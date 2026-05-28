import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Filter, Search, Sparkles, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";
import { cn, daysBetween, formatRelative } from "@/lib/utils";
import { contactsToCSV, downloadFile, parseCSVAsContacts } from "@/lib/csv";
import type { Contact, OutreachStatus } from "@/types";

const STATUS_LABEL: Record<OutreachStatus, { label: string; variant: "muted" | "info" | "success" | "warn" | "danger" | "default" | "outline" | "solid" }> = {
  not_contacted: { label: "Not contacted", variant: "muted" },
  queued: { label: "Queued", variant: "outline" },
  scheduled: { label: "Scheduled", variant: "info" },
  sent: { label: "Sent", variant: "info" },
  opened: { label: "Opened", variant: "default" },
  replied: { label: "Replied", variant: "success" },
  no_reply: { label: "No reply", variant: "warn" },
  meeting_set: { label: "Meeting set", variant: "success" },
  closed: { label: "Closed", variant: "default" },
};

type SortKey = "fitScore" | "fullName" | "firm" | "lastOutreachAt" | "priority";
type SortDir = "asc" | "desc";

export function LedgerScreen() {
  const contacts = useAppStore((s) => s.contacts);
  const openIntel = useAppStore((s) => s.openIntel);
  const openComposer = useAppStore((s) => s.openComposer);
  const importContacts = useAppStore((s) => s.importContacts);
  const bulkRescore = useAppStore((s) => s.bulkRescore);
  const resume = useAppStore((s) => s.resume);

  const [search, setSearch] = useState("");
  const [firm, setFirm] = useState<string>("all");
  const [seniority, setSeniority] = useState<string>("all");
  const [coverage, setCoverage] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [school, setSchool] = useState<string>("all");
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("fitScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const facets = useMemo(() => {
    const f = {
      firms: new Set<string>(),
      seniorities: new Set<string>(),
      coverages: new Set<string>(),
      statuses: new Set<string>(),
      schools: new Set<string>(),
    };
    for (const c of contacts) {
      f.firms.add(c.firm);
      f.seniorities.add(c.seniority);
      c.coverage.forEach((cv) => f.coverages.add(cv));
      f.statuses.add(c.status);
      f.schools.add(c.school);
    }
    return {
      firms: [...f.firms].sort(),
      seniorities: [...f.seniorities],
      coverages: [...f.coverages].sort(),
      statuses: [...f.statuses],
      schools: [...f.schools].sort(),
    };
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (q) {
        const hay = `${c.fullName} ${c.email} ${c.firm} ${c.title} ${c.desk} ${c.school} ${c.coverage.join(" ")} ${c.tags?.join(" ") ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (firm !== "all" && c.firm !== firm) return false;
      if (seniority !== "all" && c.seniority !== seniority) return false;
      if (coverage !== "all" && !c.coverage.includes(coverage as Contact["coverage"][number])) return false;
      if (status !== "all" && c.status !== status) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      if (school !== "all" && c.school !== school) return false;
      if (showTopOnly && c.priority !== "S") return false;
      return true;
    });
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "fitScore") return (a.fitScore - b.fitScore) * dir;
      if (sortKey === "fullName") return a.fullName.localeCompare(b.fullName) * dir;
      if (sortKey === "firm") return a.firm.localeCompare(b.firm) * dir;
      if (sortKey === "lastOutreachAt") {
        const av = a.lastOutreachAt ? new Date(a.lastOutreachAt).getTime() : 0;
        const bv = b.lastOutreachAt ? new Date(b.lastOutreachAt).getTime() : 0;
        return (av - bv) * dir;
      }
      if (sortKey === "priority") {
        const rank = { S: 4, A: 3, B: 2, C: 1 } as const;
        return (rank[a.priority] - rank[b.priority]) * dir;
      }
      return 0;
    });
    return list;
  }, [contacts, search, firm, seniority, coverage, status, priority, school, sortKey, sortDir, showTopOnly]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "fullName" || key === "firm" ? "asc" : "desc");
    }
  }

  function exportCSV() {
    const csv = contactsToCSV(filtered);
    downloadFile(`bulgebracket-pipeline-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv", csv);
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSVAsContacts(String(reader.result ?? ""));
      if (parsed.length > 0) importContacts(parsed);
    };
    reader.readAsText(file);
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="microlabel">Dashboard</p>
          <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Alumni Ledger</h1>
          <p className="text-xs text-graphite-500">
            {contacts.length} contacts · {filtered.length} matching filters · AI-scored against your resume + targets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={showTopOnly ? "default" : "secondary"} onClick={() => setShowTopOnly((v) => !v)}>
            <Star className="h-3.5 w-3.5" /> Top 20 This Week
          </Button>
          <Button size="sm" variant="secondary" onClick={bulkRescore} disabled={!resume}>
            <Sparkles className="h-3.5 w-3.5" /> Rescore vs Resume
          </Button>
          <Button size="sm" variant="secondary" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <label className="inline-flex items-center gap-1.5 rounded-md border border-graphite-200 bg-white px-2.5 py-1.5 text-xs font-medium text-graphite-900 hover:bg-graphite-50">
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
          </label>
        </div>
      </div>

      <div className="surface mb-4 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, firm, desk, school, sector, tag…"
              className="pl-8"
            />
          </div>
          <FacetSelect label="Firm" value={firm} onChange={setFirm} options={facets.firms} />
          <FacetSelect label="Seniority" value={seniority} onChange={setSeniority} options={facets.seniorities} />
          <FacetSelect label="Coverage" value={coverage} onChange={setCoverage} options={facets.coverages} />
          <FacetSelect label="Status" value={status} onChange={setStatus} options={facets.statuses.map((s) => STATUS_LABEL[s as OutreachStatus]?.label ?? s)} mapBack={(label) => Object.entries(STATUS_LABEL).find(([, v]) => v.label === label)?.[0] ?? label} />
          <FacetSelect label="Priority" value={priority} onChange={setPriority} options={["S", "A", "B", "C"]} />
          <FacetSelect label="School" value={school} onChange={setSchool} options={facets.schools} />
          <button
            onClick={() => {
              setSearch(""); setFirm("all"); setSeniority("all"); setCoverage("all"); setStatus("all"); setPriority("all"); setSchool("all"); setShowTopOnly(false);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-graphite-500 hover:bg-graphite-100 hover:text-graphite-900"
          >
            <Filter className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-graphite-200 bg-graphite-50">
              <tr>
                <Th onClick={() => toggleSort("fullName")} sorted={sortKey === "fullName" ? sortDir : null}>Contact</Th>
                <Th onClick={() => toggleSort("firm")} sorted={sortKey === "firm" ? sortDir : null}>Firm · Desk</Th>
                <Th>Coverage</Th>
                <Th>School</Th>
                <Th onClick={() => toggleSort("priority")} sorted={sortKey === "priority" ? sortDir : null}>Pri</Th>
                <Th onClick={() => toggleSort("fitScore")} sorted={sortKey === "fitScore" ? sortDir : null}>Fit</Th>
                <Th>Status</Th>
                <Th onClick={() => toggleSort("lastOutreachAt")} sorted={sortKey === "lastOutreachAt" ? sortDir : null}>Last touch</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Row key={c.id} c={c} onOpen={() => openIntel(c.id)} onWrite={() => openComposer(c.id)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-graphite-500">
                    No contacts match those filters. Try resetting them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, sorted }: { children: React.ReactNode; onClick?: () => void; sorted?: "asc" | "desc" | null }) {
  const sortable = !!onClick;
  return (
    <th
      onClick={onClick}
      className={cn(
        "select-none whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-microcap text-graphite-500",
        sortable && "cursor-pointer hover:text-graphite-900",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          sorted === "asc" ? <ChevronUp className="h-3 w-3" /> : sorted === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

function Row({ c, onOpen, onWrite }: { c: Contact; onOpen: () => void; onWrite: () => void }) {
  const noReplyDays = c.status === "no_reply" && c.lastOutreachAt ? daysBetween(c.lastOutreachAt) : null;
  return (
    <tr className="border-t border-graphite-100 hover:bg-graphite-50/60">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={c.fullName} className="h-8 w-8 text-[10px]" />
          <div className="flex min-w-0 flex-col leading-tight">
            <button onClick={onOpen} className="truncate text-left text-[13px] font-medium text-graphite-900 hover:underline">
              {c.fullName}
            </button>
            <span className="truncate text-[11px] text-graphite-500">{c.title}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[12px] font-medium text-graphite-900">{c.firm}</span>
          <span className="truncate text-[11px] text-graphite-500">{c.desk}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {c.coverage.slice(0, 2).map((cv) => (
            <Badge key={cv} variant="outline" className="text-[10px]">{cv}</Badge>
          ))}
        </div>
      </td>
      <td className="px-3 py-2">
        <span className="text-[12px] text-graphite-700">{c.school}</span>
      </td>
      <td className="px-3 py-2">
        <Badge
          variant={c.priority === "S" ? "priority_s" : c.priority === "A" ? "priority_a" : c.priority === "B" ? "priority_b" : "priority_c"}
          className="px-2 py-0.5"
        >
          {c.priority}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-graphite-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-graphite-900"
              style={{ width: `${c.fitScore}%` }}
            />
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-graphite-900">{c.fitScore}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <Badge variant={STATUS_LABEL[c.status].variant} className="self-start">
            {STATUS_LABEL[c.status].label}
          </Badge>
          {noReplyDays !== null && noReplyDays >= 7 && (
            <Badge variant="warn" className="self-start text-[10px]">
              ⚠ No reply · {noReplyDays}d
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-[11px] text-graphite-500">{formatRelative(c.lastOutreachAt)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={onOpen}>Intel</Button>
          <Button size="sm" variant="default" onClick={onWrite}>Draft</Button>
        </div>
      </td>
    </tr>
  );
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
  mapBack,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  mapBack?: (label: string) => string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-graphite-200 bg-white px-2 py-1 text-xs text-graphite-700">
      <span className="microlabel">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(mapBack ? mapBack(e.target.value) : e.target.value)}
        className="bg-transparent text-[12px] focus:outline-none"
      >
        <option value="all">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
