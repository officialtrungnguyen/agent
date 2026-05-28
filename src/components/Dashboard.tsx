import { useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  Star,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { CONTACTS, searchContacts } from "@/data/contactsData";
import type { Contact, ContactState, ResumeData } from "@/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { KanbanView } from "./KanbanView";
import { computeFitScore, getTopTargets } from "@/lib/scoring";
import { daysSince, formatDate } from "@/lib/utils";
import {
  exportContactsCSV,
  saveContactStates,
} from "@/lib/storage";

interface Props {
  resume: ResumeData | null;
  onSelectContact: (c: Contact) => void;
  states: Record<string, ContactState>;
  onStatesChange: (s: Record<string, ContactState>) => void;
}

export function Dashboard({
  resume,
  onSelectContact,
  states,
  onStatesChange,
}: Props) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const contacts = useMemo(() => {
    let list = searchContacts(CONTACTS, search);
    if (firmFilter)
      list = list.filter((c) =>
        c.firm.toLowerCase().includes(firmFilter.toLowerCase())
      );
    if (priorityFilter)
      list = list.filter((c) => c.priority === priorityFilter);
    if (statusFilter)
      list = list.filter(
        (c) => (states[c.id]?.status ?? "not_contacted") === statusFilter
      );
    return list;
  }, [search, firmFilter, priorityFilter, statusFilter, states]);

  const top20 = useMemo(
    () => getTopTargets(CONTACTS, states, resume, 20),
    [states, resume]
  );

  const firms = useMemo(
    () => [...new Set(CONTACTS.map((c) => c.firm))].sort(),
    []
  );

  const updateStars = (contactId: string, stars: 1 | 2 | 3 | 4 | 5) => {
    const next = { ...states };
    const st = next[contactId] ?? {
      contactId,
      status: "not_contacted" as const,
      relationshipStrength: 1 as const,
      notes: "",
      outreachHistory: [],
    };
    next[contactId] = { ...st, relationshipStrength: stars };
    saveContactStates(next);
    onStatesChange(next);
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Firm",
      "Title",
      "Team",
      "School",
      "Priority",
      "Status",
      "Fit Score",
      "Last Outreach",
    ];
    const rows = contacts.map((c) => {
      const st = states[c.id];
      const score = computeFitScore(
        c,
        resume,
        st ?? {
          contactId: c.id,
          status: "not_contacted",
          relationshipStrength: 1,
          notes: "",
          outreachHistory: [],
        }
      );
      return [
        `${c.firstName} ${c.lastName}`,
        c.firm,
        c.title,
        c.team,
        c.school,
        c.priority,
        st?.status ?? "not_contacted",
        String(score),
        st?.lastOutreach ? formatDate(st.lastOutreach) : "",
      ];
    });
    const blob = new Blob([exportContactsCSV(headers, rows)], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulgebracket-contacts.csv";
    a.click();
  };

  const importCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      console.info("CSV import logged", text.slice(0, 200));
      alert("CSV import parsed — merge with contacts in a future sync.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-graphite-900">
            Smart Alumni Ledger
          </h1>
          <p className="text-sm text-graphite-500">
            {CONTACTS.length}+ contacts · AI scoring · pipeline automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-graphite-300 px-3 py-1.5 text-sm hover:bg-graphite-100">
            <Upload className="h-4 w-4" />
            Import
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCSV(f);
              }}
            />
          </label>
        </div>
      </div>

      <Card className="rounded-lg border border-graphite-200 bg-white p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-graphite-500">
          Top 20 Targets This Week
        </p>
        <div className="flex flex-wrap gap-2">
          {top20.slice(0, 10).map(({ contact: c, score }) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectContact(c)}
              className="rounded border border-graphite-200 px-2 py-1 text-xs hover:bg-graphite-50"
            >
              {c.firstName} {c.lastName} · {c.firm}{" "}
              <Badge variant="high">{score}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name, firm, school, sector…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-9 rounded-md border border-graphite-300 px-2 text-sm"
          value={firmFilter}
          onChange={(e) => setFirmFilter(e.target.value)}
        >
          <option value="">All firms</option>
          {firms.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-graphite-300 px-2 text-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="h-9 rounded-md border border-graphite-300 px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="not_contacted">Not Contacted</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="no_reply">No Reply</option>
        </select>
      </div>

      {view === "kanban" ? (
        <KanbanView
          contacts={contacts}
          states={states}
          resume={resume}
          onSelect={onSelectContact}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-graphite-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-100 bg-graphite-50">
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Name
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Firm
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Team
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  School
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Fit
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Status
                </th>
                <th className="px-3 py-2 font-mono text-[10px] uppercase">
                  Rel.
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.slice(0, 100).map((c) => {
                const st = states[c.id];
                const score = computeFitScore(
                  c,
                  resume,
                  st ?? {
                    contactId: c.id,
                    status: "not_contacted",
                    relationshipStrength: 1,
                    notes: "",
                    outreachHistory: [],
                  }
                );
                const status = st?.status ?? "not_contacted";
                const outreachDays = daysSince(st?.lastOutreach);
                const warn =
                  (status === "sent" || status === "no_reply") &&
                  outreachDays >= 7;

                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-graphite-50 hover:bg-slate-50"
                    onClick={() => onSelectContact(c)}
                  >
                    <td className="px-3 py-2 font-medium">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-3 py-2 text-graphite-600">{c.firm}</td>
                    <td className="px-3 py-2 text-graphite-600">{c.team}</td>
                    <td className="px-3 py-2 text-graphite-600">{c.school}</td>
                    <td className="px-3 py-2">
                      <Badge variant="high">{score}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          status === "replied"
                            ? "replied"
                            : warn
                              ? "warning"
                              : "sent"
                        }
                      >
                        {status.replace("_", " ")}
                        {warn && (
                          <>
                            {" "}
                            <AlertTriangle className="inline h-3 w-3" /> (
                            {outreachDays}d)
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex">
                        {([1, 2, 3, 4, 5] as const).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateStars(c.id, n)}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-3 w-3 ${
                                (st?.relationshipStrength ?? 1) >= n
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-graphite-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contacts.length > 100 && (
            <p className="p-2 text-center text-xs text-graphite-500">
              Showing 100 of {contacts.length} — refine filters
            </p>
          )}
        </div>
      )}
    </div>
  );
}
