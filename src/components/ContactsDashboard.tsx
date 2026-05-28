import { differenceInDays, format } from "date-fns";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import type { Contact, FiltersState } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ContactsDashboardProps {
  contacts: Contact[];
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
  onContactsBulkMerge: (contacts: Contact[]) => void;
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => void;
}

function statusBadgeVariant(status: Contact["status"]) {
  if (status === "replied") return "success";
  if (status === "no_reply") return "warning";
  if (status === "sent" || status === "scheduled") return "info";
  return "default";
}

function displayStatus(contact: Contact) {
  if ((contact.status === "sent" || contact.status === "scheduled") && contact.lastOutreach) {
    const staleDays = differenceInDays(new Date(), new Date(contact.lastOutreach));
    if (staleDays >= 7) {
      return `No reply (${staleDays} days)`;
    }
  }
  return contact.status.replace("_", " ");
}

export function ContactsDashboard({
  contacts,
  filters,
  onFiltersChange,
  selectedContactId,
  onSelectContact,
  onContactsBulkMerge,
  onContactStatusUpdate,
}: ContactsDashboardProps) {
  const filtered = contacts.filter((contact) => {
    const query = filters.query.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const queryPass =
      !query ||
      fullName.includes(query) ||
      contact.firm.toLowerCase().includes(query) ||
      contact.teamDesk.toLowerCase().includes(query) ||
      contact.coverageSectors.join(" ").toLowerCase().includes(query);
    const firmPass = filters.firm === "all" || contact.firm === filters.firm;
    const statusPass = filters.status === "all" || contact.status === filters.status;
    const priorityPass = filters.priority === "all" || contact.priority === filters.priority;
    const schoolPass = filters.school === "all" || contact.school === filters.school;
    return queryPass && firmPass && statusPass && priorityPass && schoolPass;
  });

  function exportCsv() {
    const csv = Papa.unparse(
      filtered.map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        firm: contact.firm,
        title: contact.title,
        teamDesk: contact.teamDesk,
        school: contact.school,
        priority: contact.priority,
        status: contact.status,
        fitScore: contact.fitScore,
        relationshipStrength: contact.relationshipStrength,
        lastOutreach: contact.lastOutreach ?? "",
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bulgebracket-contacts.csv";
    link.click();
  }

  function importCsv(file: File) {
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        const rows = result.data as Array<Record<string, string>>;
        const merged = contacts.map((contact) => {
          const row = rows.find((entry) => entry.id === contact.id);
          if (!row) return contact;
          return {
            ...contact,
            status: (row.status as Contact["status"]) ?? contact.status,
            notes: row.notes ?? contact.notes,
          };
        });
        onContactsBulkMerge(merged);
      },
    });
  }

  const uniqueFirms = Array.from(new Set(contacts.map((contact) => contact.firm))).sort();
  const uniqueSchools = Array.from(new Set(contacts.map((contact) => contact.school))).sort();

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Smart Alumni Ledger + AI Scoring Engine</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              Export CSV
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-200">
              <Upload className="h-3 w-3" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importCsv(file);
                }}
              />
            </label>
            <Button
              variant="outline"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  view: filters.view === "table" ? "kanban" : "table",
                })
              }
            >
              {filters.view === "table" ? "Kanban View" : "Table View"}
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <Input
            value={filters.query}
            placeholder="Search name, firm, sector..."
            onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          />
          <Select
            value={filters.firm}
            onChange={(event) => onFiltersChange({ ...filters, firm: event.target.value })}
            options={[{ label: "All Firms", value: "all" }, ...uniqueFirms.map((firm) => ({ label: firm, value: firm }))]}
          />
          <Select
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as FiltersState["status"] })}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Not Contacted", value: "not_contacted" },
              { label: "Queued", value: "queued" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Sent", value: "sent" },
              { label: "Replied", value: "replied" },
              { label: "No Reply", value: "no_reply" },
            ]}
          />
          <Select
            value={filters.priority}
            onChange={(event) => onFiltersChange({ ...filters, priority: event.target.value as FiltersState["priority"] })}
            options={[
              { label: "All Priority", value: "all" },
              { label: "Critical", value: "critical" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
            ]}
          />
          <Select
            value={filters.school}
            onChange={(event) => onFiltersChange({ ...filters, school: event.target.value })}
            options={[{ label: "All Schools", value: "all" }, ...uniqueSchools.map((school) => ({ label: school, value: school }))]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filters.view === "table" ? (
          <div className="max-h-[520px] overflow-auto rounded-md border border-slate-800">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-950">
                <tr className="border-b border-slate-800 text-left uppercase tracking-[0.12em] text-slate-500">
                  <th className="p-2">Banker</th>
                  <th className="p-2">Firm / Team</th>
                  <th className="p-2">School</th>
                  <th className="p-2">Fit</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Last Outreach</th>
                  <th className="p-2">Relationship</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`cursor-pointer border-b border-slate-900 ${
                      selectedContactId === contact.id ? "bg-slate-900/80" : "hover:bg-slate-900/40"
                    }`}
                    onClick={() => onSelectContact(contact.id)}
                  >
                    <td className="p-2 text-slate-100">
                      {contact.firstName} {contact.lastName}
                      <p className="text-[11px] text-slate-500">{contact.title}</p>
                    </td>
                    <td className="p-2 text-slate-300">
                      {contact.firm}
                      <p className="text-[11px] text-slate-500">{contact.teamDesk}</p>
                    </td>
                    <td className="p-2 text-slate-300">{contact.school}</td>
                    <td className="p-2 text-slate-100">{contact.fitScore}</td>
                    <td className="p-2">
                      <Badge variant={contact.priority === "critical" ? "critical" : contact.priority === "high" ? "warning" : "default"}>
                        {contact.priority}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <Badge variant={statusBadgeVariant(contact.status)}>{displayStatus(contact)}</Badge>
                        <Select
                          className="h-7 text-[10px]"
                          value={contact.status}
                          onChange={(event) => onContactStatusUpdate(contact.id, event.target.value as Contact["status"])}
                          options={[
                            { label: "Not Contacted", value: "not_contacted" },
                            { label: "Queued", value: "queued" },
                            { label: "Scheduled", value: "scheduled" },
                            { label: "Sent", value: "sent" },
                            { label: "Replied", value: "replied" },
                            { label: "No Reply", value: "no_reply" },
                          ]}
                        />
                      </div>
                    </td>
                    <td className="p-2 text-slate-400">
                      {contact.lastOutreach ? format(new Date(contact.lastOutreach), "MMM d") : "—"}
                    </td>
                    <td className="p-2 text-slate-200">{"★".repeat(contact.relationshipStrength)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {(["not_contacted", "sent", "replied", "no_reply"] as Contact["status"][]).map((status) => (
              <div key={status} className="rounded-md border border-slate-800 p-2">
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-slate-400">{status.replace("_", " ")}</p>
                <div className="space-y-2">
                  {filtered
                    .filter((contact) => contact.status === status)
                    .slice(0, 20)
                    .map((contact) => (
                      <button
                        key={contact.id}
                        className={`w-full rounded-md border p-2 text-left ${
                          selectedContactId === contact.id
                            ? "border-slate-200 bg-slate-100 text-slate-950"
                            : "border-slate-700 bg-slate-900 text-slate-100"
                        }`}
                        onClick={() => onSelectContact(contact.id)}
                      >
                        <p className="text-xs font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-[10px] opacity-80">{contact.firm}</p>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
