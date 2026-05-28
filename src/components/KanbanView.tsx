import type { Contact, ContactState, OutreachStatus } from "@/types";
import { Badge } from "./ui/badge";
import { computeFitScore } from "@/lib/scoring";
import type { ResumeData } from "@/types";
import { daysSince } from "@/lib/utils";

const COLUMNS: { id: OutreachStatus; label: string }[] = [
  { id: "not_contacted", label: "Not Contacted" },
  { id: "sent", label: "Sent" },
  { id: "replied", label: "Replied" },
  { id: "no_reply", label: "No Reply" },
];

interface Props {
  contacts: Contact[];
  states: Record<string, ContactState>;
  resume: ResumeData | null;
  onSelect: (c: Contact) => void;
}

export function KanbanView({ contacts, states, resume, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = contacts.filter(
          (c) => (states[c.id]?.status ?? "not_contacted") === col.id
        );
        return (
          <div key={col.id} className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                {col.label}
              </span>
              <Badge>{items.length}</Badge>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {items.map((c) => {
                const st = states[c.id];
                const noReplyDays =
                  st?.status === "sent" || st?.status === "no_reply"
                    ? daysSince(st?.lastOutreach)
                    : 0;
                const warn = noReplyDays >= 7;
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
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-lg border border-graphite-200 bg-white hover:border-graphite-400"
                    onClick={() => onSelect(c)}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(c)}
                  >
                    <div className="p-3">
                      <p className="text-sm font-medium">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-graphite-500">{c.firm}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="high">Fit {score}</Badge>
                        {warn && (
                          <Badge variant="warning">
                            ⚠ No reply ({noReplyDays}d)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
