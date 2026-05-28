import { ArrowDownUp, Grid3X3, ListFilter, Star } from "lucide-react";
import { Contact, ContactScore, OutreachStatus } from "../types";
import { compactDate, daysBetween, initials } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface AlumniLedgerProps {
  contacts: Contact[];
  scores: Record<string, ContactScore>;
  selectedId?: string;
  view: "table" | "kanban";
  onViewChange: (view: "table" | "kanban") => void;
  onSelect: (contact: Contact) => void;
  onStatusChange: (contactId: string, status: OutreachStatus) => void;
}

const statuses: OutreachStatus[] = ["Not Contacted", "Queued", "Scheduled", "Sent", "Replied", "No Reply"];

export function AlumniLedger({
  contacts,
  scores,
  selectedId,
  view,
  onViewChange,
  onSelect,
  onStatusChange
}: AlumniLedgerProps) {
  const sorted = [...contacts].sort((a, b) => (scores[b.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Smart Alumni Ledger</p>
          <h2 className="text-lg font-semibold">{contacts.length} high-priority alumni</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "table" ? "primary" : "secondary"} onClick={() => onViewChange("table")}>
            <ListFilter className="h-4 w-4" /> Table
          </Button>
          <Button size="sm" variant={view === "kanban" ? "primary" : "secondary"} onClick={() => onViewChange("kanban")}>
            <Grid3X3 className="h-4 w-4" /> Kanban
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {view === "kanban" ? (
          <Kanban contacts={sorted} scores={scores} onSelect={onSelect} />
        ) : (
          <div className="bb-scrollbar overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="p-3">Banker</th>
                  <th className="p-3">Firm / Desk</th>
                  <th className="p-3">School</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1">
                      AI Fit <ArrowDownUp className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Outreach</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((contact) => {
                  const noReplyDays = contact.status === "Sent" ? daysBetween(contact.lastOutreach) : 0;
                  const isAmber = contact.status === "No Reply" || noReplyDays >= 7;

                  return (
                    <tr
                      key={contact.id}
                      className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                        selectedId === contact.id ? "bg-slate-100" : ""
                      }`}
                      onClick={() => onSelect(contact)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-950 text-xs font-semibold text-white">
                            {initials(`${contact.firstName} ${contact.lastName}`)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-950">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{contact.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">{contact.firm}</p>
                        <p className="text-xs text-slate-500">{contact.team}</p>
                      </td>
                      <td className="p-3">{contact.school}</td>
                      <td className="p-3">
                        <Badge tone={contact.priority === "Core" ? "violet" : contact.priority === "High" ? "blue" : "slate"}>
                          {contact.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{scores[contact.id]?.score ?? 50}</span>
                          <div className="h-1.5 w-20 rounded-full bg-slate-200">
                            <div
                              className="h-1.5 rounded-full bg-slate-950"
                              style={{ width: `${scores[contact.id]?.score ?? 50}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                          value={isAmber ? "No Reply" : contact.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onStatusChange(contact.id, event.target.value as OutreachStatus)}
                        >
                          {statuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                        {isAmber && <Badge className="ml-2" tone="amber">No reply {Math.max(noReplyDays, 7)}d</Badge>}
                      </td>
                      <td className="p-3 text-slate-600">{compactDate(contact.lastOutreach)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kanban({
  contacts,
  scores,
  onSelect
}: {
  contacts: Contact[];
  scores: Record<string, ContactScore>;
  onSelect: (contact: Contact) => void;
}) {
  const lanes: OutreachStatus[] = ["Not Contacted", "Sent", "Replied", "No Reply"];

  return (
    <div className="grid gap-3 p-4 md:grid-cols-4">
      {lanes.map((lane) => (
        <div key={lane} className="rounded-xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{lane}</p>
          </div>
          <div className="max-h-[520px] space-y-2 overflow-auto p-2">
            {contacts
              .filter((contact) => (lane === "No Reply" ? contact.status === "No Reply" : contact.status === lane))
              .slice(0, 30)
              .map((contact) => (
                <button
                  key={contact.id}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400"
                  onClick={() => onSelect(contact)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{contact.firm}</p>
                    </div>
                    <Badge tone="blue">{scores[contact.id]?.score ?? 50}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{contact.team}</p>
                  <div className="mt-2 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: contact.relationshipStrength }, (_, index) => (
                      <Star key={index} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
