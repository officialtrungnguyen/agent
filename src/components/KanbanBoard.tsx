import type { Contact } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface KanbanBoardProps {
  contacts: Contact[];
  onSelect: (contactId: string) => void;
}

const lanes: Array<{ title: string; statuses: Contact["status"][] }> = [
  { title: "Not Contacted", statuses: ["not_contacted"] },
  { title: "Sent", statuses: ["sent", "queued", "scheduled"] },
  { title: "Replied", statuses: ["replied"] },
  { title: "No Reply", statuses: ["no_reply"] }
];

export const KanbanBoard = ({ contacts, onSelect }: KanbanBoardProps) => (
  <section className="grid gap-3 xl:grid-cols-4">
    {lanes.map((lane) => {
      const laneContacts = contacts.filter((contact) => lane.statuses.includes(contact.status));
      return (
        <div key={lane.title} className="border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <h4 className="text-xs uppercase tracking-[0.16em] text-slate-300">{lane.title}</h4>
            <Badge>{laneContacts.length}</Badge>
          </div>
          <div className="max-h-[300px] space-y-2 overflow-auto p-2">
            {laneContacts.map((contact) => (
              <Button
                key={contact.id}
                variant="ghost"
                className="h-auto w-full justify-start border border-slate-900 px-2 py-2 text-left normal-case tracking-normal"
                onClick={() => onSelect(contact.id)}
              >
                <span>
                  <span className="block text-sm text-slate-100">
                    {contact.firstName} {contact.lastName}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {contact.firm} · {contact.teamDesk}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      );
    })}
  </section>
);
