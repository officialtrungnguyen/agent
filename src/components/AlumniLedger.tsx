import { LayoutGrid, Rows3, Star } from "lucide-react";
import type { Contact, OutreachRecord, ResumeProfile } from "../types";
import { coverageUniverse, firmUniverse, schoolUniverse } from "../contactsData";
import { calculateFitScore, contactStatus } from "../lib/intelligence";
import { daysSince, formatDateTime } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Input, Select } from "./ui/Form";

interface AlumniLedgerProps {
  contacts: Contact[];
  selectedId?: string;
  resume: ResumeProfile;
  records: OutreachRecord[];
  query: string;
  setQuery: (query: string) => void;
  firmFilter: string;
  setFirmFilter: (firm: string) => void;
  schoolFilter: string;
  setSchoolFilter: (school: string) => void;
  sectorFilter: string;
  setSectorFilter: (sector: string) => void;
  kanban: boolean;
  setKanban: (kanban: boolean) => void;
  onSelect: (contact: Contact) => void;
}

export function AlumniLedger({
  contacts,
  selectedId,
  resume,
  records,
  query,
  setQuery,
  firmFilter,
  setFirmFilter,
  schoolFilter,
  setSchoolFilter,
  sectorFilter,
  setSectorFilter,
  kanban,
  setKanban,
  onSelect
}: AlumniLedgerProps) {
  const scored = contacts
    .filter((contact) => {
      const haystack = `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.team} ${contact.school}`.toLowerCase();
      return (
        (!query || haystack.includes(query.toLowerCase())) &&
        (!firmFilter || contact.firm === firmFilter) &&
        (!schoolFilter || contact.school === schoolFilter) &&
        (!sectorFilter || contact.coverageSectors.includes(sectorFilter))
      );
    })
    .map((contact) => ({ contact, fit: calculateFitScore(contact, resume), liveStatus: contactStatus(contact, records) }))
    .sort((a, b) => b.fit - a.fit);

  const topTargets = scored.slice(0, 20);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="micro-label">Smart Alumni Ledger</p>
            <h2 className="text-lg font-semibold text-slate-950">{contacts.length}+ prioritized IB contacts</h2>
          </div>
          <div className="flex gap-2">
            <Button variant={!kanban ? "primary" : "secondary"} onClick={() => setKanban(false)}>
              <Rows3 className="h-4 w-4" /> Table
            </Button>
            <Button variant={kanban ? "primary" : "secondary"} onClick={() => setKanban(true)}>
              <LayoutGrid className="h-4 w-4" /> Kanban
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Search banker, firm, team..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={firmFilter} onChange={(event) => setFirmFilter(event.target.value)}>
            <option value="">All firms</option>
            {firmUniverse.map((firm) => (
              <option key={firm} value={firm}>
                {firm}
              </option>
            ))}
          </Select>
          <Select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
            <option value="">All schools</option>
            {schoolUniverse.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </Select>
          <Select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
            <option value="">All sectors</option>
            {coverageUniverse.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="micro-label mb-2">Top 20 targets this week</p>
          <div className="flex gap-2 overflow-x-auto pb-1 thin-scrollbar">
            {topTargets.map(({ contact, fit }) => (
              <button
                key={contact.id}
                className="min-w-48 rounded-md border border-slate-200 bg-white p-2 text-left transition hover:border-slate-950"
                onClick={() => onSelect(contact)}
              >
                <p className="text-sm font-semibold text-slate-950">
                  {contact.firstName} {contact.lastName}
                </p>
                <p className="truncate text-xs text-slate-500">{contact.firm}</p>
                <Badge tone="green">Fit {fit}</Badge>
              </button>
            ))}
          </div>
        </div>

        {kanban ? (
          <Kanban scored={scored} selectedId={selectedId} onSelect={onSelect} />
        ) : (
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-2">Banker</th>
                  <th className="px-3 py-2">Firm</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Fit</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Strength</th>
                </tr>
              </thead>
              <tbody>
                {scored.map(({ contact, fit, liveStatus }) => (
                  <tr
                    key={contact.id}
                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                      selectedId === contact.id ? "bg-slate-100" : ""
                    }`}
                    onClick={() => onSelect(contact)}
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-950">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{contact.title}</p>
                    </td>
                    <td className="px-3 py-3">{contact.firm}</td>
                    <td className="px-3 py-3">{contact.team}</td>
                    <td className="px-3 py-3">{contact.school}</td>
                    <td className="px-3 py-3">
                      <Badge tone={fit >= 80 ? "green" : fit >= 65 ? "blue" : "slate"}>{fit}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={liveStatus.status} days={liveStatus.days} />
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(liveStatus.lastOutreach)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Stars count={contact.relationshipStrength} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kanban({
  scored,
  selectedId,
  onSelect
}: {
  scored: Array<{ contact: Contact; fit: number; liveStatus: ReturnType<typeof contactStatus> }>;
  selectedId?: string;
  onSelect: (contact: Contact) => void;
}) {
  const columns = ["Not Contacted", "Sent", "Replied", "No Reply"] as const;
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column} className="rounded-lg border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 px-3 py-2">
            <p className="micro-label">{column}</p>
          </div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto p-2 thin-scrollbar">
            {scored
              .filter(({ liveStatus }) => liveStatus.status === column)
              .slice(0, 40)
              .map(({ contact, fit, liveStatus }) => (
                <button
                  key={contact.id}
                  className={`w-full rounded-md border bg-white p-3 text-left transition hover:border-slate-950 ${
                    selectedId === contact.id ? "border-slate-950" : "border-slate-200"
                  }`}
                  onClick={() => onSelect(contact)}
                >
                  <p className="font-semibold text-slate-950">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{contact.firm}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone="green">Fit {fit}</Badge>
                    <StatusBadge status={liveStatus.status} days={liveStatus.days} />
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, days }: { status: string; days?: number }) {
  if (status === "No Reply") {
    return <Badge tone="amber">⚠ No reply{days ? ` (${days}d)` : ""}</Badge>;
  }
  if (status === "Replied" || status === "Positive") return <Badge tone="green">{status}</Badge>;
  if (status === "Sent" || status === "Delivered" || status === "Scheduled") return <Badge tone="blue">{status}</Badge>;
  return <Badge>{status}</Badge>;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex text-slate-900">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < count ? "fill-slate-900" : "text-slate-300"}`} />
      ))}
    </span>
  );
}
