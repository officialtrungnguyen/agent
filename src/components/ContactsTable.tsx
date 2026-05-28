import { Star } from "lucide-react";
import type { Contact, ContactStatus, Priority } from "../types";
import { daysSince } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

interface ContactsTableProps {
  contacts: Contact[];
  fitScores: Record<string, number>;
  selectedContactId?: string;
  searchQuery: string;
  statusFilter: ContactStatus | "all";
  priorityFilter: Priority | "all";
  firmFilter: string;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: ContactStatus | "all") => void;
  onPriorityFilterChange: (priority: Priority | "all") => void;
  onFirmFilterChange: (firm: string) => void;
  onSelectContact: (contactId: string) => void;
}

const statusLabel: Record<ContactStatus, string> = {
  not_contacted: "Not Contacted",
  queued: "Queued",
  scheduled: "Scheduled",
  sent: "Sent",
  replied: "Replied",
  no_reply: "No Reply"
};

export const ContactsTable = ({
  contacts,
  fitScores,
  selectedContactId,
  searchQuery,
  statusFilter,
  priorityFilter,
  firmFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onFirmFilterChange,
  onSelectContact
}: ContactsTableProps) => {
  const firms = [...new Set(contacts.map((contact) => contact.firm))].sort((a, b) => a.localeCompare(b));
  return (
    <section className="border border-slate-800 bg-slate-950">
      <div className="grid gap-2 border-b border-slate-800 p-3 lg:grid-cols-4">
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search name, school, firm, desk"
        />
        <Select value={firmFilter} onChange={(event) => onFirmFilterChange(event.target.value)}>
          <option value="all">All Firms</option>
          {firms.map((firm) => (
            <option key={firm} value={firm}>
              {firm}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as ContactStatus | "all")}>
          <option value="all">All Statuses</option>
          {Object.entries(statusLabel).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={priorityFilter}
          onChange={(event) => onPriorityFilterChange(event.target.value as Priority | "all")}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </Select>
      </div>
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-950">
            <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Desk</th>
              <th className="px-3 py-2">Coverage</th>
              <th className="px-3 py-2">Fit</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Strength</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const daysWithoutReply = daysSince(contact.lastOutreachAt);
              const showNoReplyAlert = (contact.status === "sent" || contact.status === "no_reply") && daysWithoutReply >= 7;
              return (
                <tr
                  key={contact.id}
                  className={`cursor-pointer border-b border-slate-900/90 hover:bg-slate-900/50 ${
                    selectedContactId === contact.id ? "bg-slate-900/70" : ""
                  }`}
                  onClick={() => onSelectContact(contact.id)}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-100">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {contact.title} · {contact.firm} · {contact.school}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{contact.teamDesk}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{contact.coverageSectors.join(" · ")}</td>
                  <td className="px-3 py-2">
                    <Badge className="border-slate-600 text-slate-200">{fitScores[contact.id] ?? 0}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        contact.priority === "critical"
                          ? "border-rose-400/40 text-rose-200"
                          : contact.priority === "high"
                            ? "border-sky-400/40 text-sky-200"
                            : ""
                      }
                    >
                      {contact.priority}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={
                          contact.status === "replied"
                            ? "border-emerald-400/40 text-emerald-200"
                            : contact.status === "no_reply"
                              ? "border-amber-400/40 text-amber-200"
                              : ""
                        }
                      >
                        {statusLabel[contact.status]}
                      </Badge>
                      {showNoReplyAlert && <Badge className="border-amber-400/40 text-amber-200">⚠ No reply ({daysWithoutReply}d)</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" className="h-auto px-0 py-0 text-slate-400">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-3.5 w-3.5 ${index < contact.relationshipStrength ? "fill-slate-200 text-slate-200" : "text-slate-700"}`}
                        />
                      ))}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
