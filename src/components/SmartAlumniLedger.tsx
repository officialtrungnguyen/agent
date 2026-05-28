import { useMemo, useRef } from "react";
import { ArrowUpDown, Download, Filter, Import, Star } from "lucide-react";
import { coverageOptions, firmOptions, schoolOptions } from "../contactsData";
import { Contact, ContactFilters } from "../types";
import { deriveStatusLabel } from "../utils";
import { Badge, Button, Card, Input, Label, SectionHeading, Select } from "./ui";

interface SmartAlumniLedgerProps {
  contacts: Contact[];
  selectedId: string;
  filters: ContactFilters;
  view: "table" | "kanban";
  onSelect: (contactId: string) => void;
  onChangeFilters: (filters: ContactFilters) => void;
  onChangeView: (view: "table" | "kanban") => void;
  onImportCsv: (file: File) => void;
}

const getTone = (label: string) => {
  if (label.startsWith("No reply")) return "warning" as const;
  if (label === "Replied") return "success" as const;
  if (label === "Failed") return "danger" as const;
  return "default" as const;
};

const kanbanColumns = ["Not Contacted", "Queued", "Scheduled", "Sent", "Replied", "No Reply"];

export const SmartAlumniLedger = ({
  contacts,
  selectedId,
  filters,
  view,
  onSelect,
  onChangeFilters,
  onChangeView,
  onImportCsv,
}: SmartAlumniLedgerProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const grouped = useMemo(
    () =>
      kanbanColumns.map((column) => ({
        column,
        contacts: contacts.filter((contact) => {
          const label = deriveStatusLabel(contact);
          if (column === "No Reply") return label.startsWith("No reply");
          return contact.status === column;
        }),
      })),
    [contacts],
  );

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Smart Alumni Ledger + AI Scoring Engine"
        title="240+ investment banking contacts ranked by fit, team relevance, and response urgency"
        description="Use multi-filters to narrow by firm, school, priority, or coverage. Toggle between a research-grade table and a pipeline kanban that auto-flags amber no-reply contacts after 7 days."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => onChangeView("table")}>
              Table
            </Button>
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => onChangeView("kanban")}>
              Kanban
            </Button>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Import className="h-4 w-4" />
              Import CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 border-b border-slate-800 px-5 py-4 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <Label>Search</Label>
          <Input
            placeholder="Search name, firm, team, school, coverage..."
            value={filters.search}
            onChange={(event) => onChangeFilters({ ...filters, search: event.target.value })}
          />
        </div>
        <div>
          <Label>Firm</Label>
          <Select value={filters.firm} onChange={(event) => onChangeFilters({ ...filters, firm: event.target.value })}>
            <option value="">All firms</option>
            {firmOptions.map((firm) => (
              <option key={firm} value={firm}>
                {firm}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>School</Label>
          <Select value={filters.school} onChange={(event) => onChangeFilters({ ...filters, school: event.target.value })}>
            <option value="">All schools</option>
            {schoolOptions.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={filters.status} onChange={(event) => onChangeFilters({ ...filters, status: event.target.value })}>
            <option value="">All stages</option>
            {kanbanColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={filters.priority} onChange={(event) => onChangeFilters({ ...filters, priority: event.target.value })}>
            <option value="">All priority tiers</option>
            <option value="Tier 1">Tier 1</option>
            <option value="Tier 2">Tier 2</option>
            <option value="Tier 3">Tier 3</option>
          </Select>
        </div>
        <div>
          <Label>Coverage</Label>
          <Select value={filters.coverage} onChange={(event) => onChangeFilters({ ...filters, coverage: event.target.value })}>
            <option value="">All sectors</option>
            {coverageOptions.map((coverage) => (
              <option key={coverage} value={coverage}>
                {coverage}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Banker</th>
                <th className="px-4 py-4">Firm / Group</th>
                <th className="px-4 py-4">School</th>
                <th className="px-4 py-4">Coverage</th>
                <th className="px-4 py-4">
                  <div className="inline-flex items-center gap-2">
                    AI Fit
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-4">Priority</th>
                <th className="px-4 py-4">Relationship</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const label = deriveStatusLabel(contact);
                return (
                  <tr
                    key={contact.id}
                    className={`cursor-pointer border-b border-slate-900/80 text-sm transition hover:bg-slate-900/60 ${
                      selectedId === contact.id ? "bg-slate-900/80" : ""
                    }`}
                    onClick={() => onSelect(contact.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-100">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{contact.title}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-200">{contact.firm}</div>
                      <div className="mt-1 text-xs text-slate-400">{contact.teamDesk}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{contact.school}</td>
                    <td className="px-4 py-4 text-slate-300">{contact.coverageSectors.join(" / ")}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-50">{contact.fitScore}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={contact.priority === "Tier 1" ? "warning" : contact.priority === "Tier 2" ? "default" : "muted"}>
                        {contact.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-amber-200">
                        {Array.from({ length: contact.relationshipStrength }, (_, index) => (
                          <Star key={index} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={getTone(label)}>{label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto px-5 py-5 lg:grid-cols-6">
          {grouped.map((group) => (
            <div key={group.column} className="min-h-[420px] rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="mono-label">{group.column}</div>
                <Badge tone={group.column === "No Reply" ? "warning" : "muted"}>{group.contacts.length}</Badge>
              </div>
              <div className="space-y-3">
                {group.contacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId === contact.id
                        ? "border-slate-500 bg-slate-900"
                        : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                    }`}
                    onClick={() => onSelect(contact.id)}
                  >
                    <div className="font-medium text-slate-100">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{contact.firm}</div>
                    <div className="mt-2 text-sm text-slate-300">{contact.teamDesk}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{contact.fitScore} fit</span>
                      <span>{contact.priority}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImportCsv(file);
          event.currentTarget.value = "";
        }}
      />
    </Card>
  );
};
