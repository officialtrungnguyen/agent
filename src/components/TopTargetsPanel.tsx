import type { Contact } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopTargetsPanelProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
}

export function TopTargetsPanel({ contacts, onSelectContact }: TopTargetsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 20 Targets This Week</CardTitle>
      </CardHeader>
      <CardContent className="max-h-72 space-y-2 overflow-y-auto">
        {contacts.map((contact, index) => (
          <button
            key={contact.id}
            className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-left hover:bg-slate-900"
            onClick={() => onSelectContact(contact.id)}
          >
            <p className="text-sm text-slate-100">
              #{index + 1} {contact.firstName} {contact.lastName}
            </p>
            <p className="text-xs text-slate-500">
              {contact.firm} · {contact.teamDesk}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={contact.priority === "critical" ? "critical" : contact.priority === "high" ? "warning" : "default"}>
                {contact.priority}
              </Badge>
              <Badge variant="info">Fit {contact.fitScore}</Badge>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
