import { Textarea, Label } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { ContactState } from "@/types";
import { saveContactStates } from "@/lib/storage";

interface Props {
  state: ContactState;
  states: Record<string, ContactState>;
  onStatesChange: (s: Record<string, ContactState>) => void;
}

export function ContactCRM({ state, states, onStatesChange }: Props) {
  const updateNotes = (notes: string) => {
    const next = {
      ...states,
      [state.contactId]: { ...state, notes },
    };
    saveContactStates(next);
    onStatesChange(next);
  };

  const setResponse = (replied: boolean) => {
    const next = {
      ...states,
      [state.contactId]: {
        ...state,
        status: replied ? ("replied" as const) : ("no_reply" as const),
        lastReply: replied ? new Date().toISOString() : state.lastReply,
      },
    };
    saveContactStates(next);
    onStatesChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <span className="font-mono text-[10px] uppercase text-graphite-500">
          CRM & Outreach History
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Notes</Label>
          <Textarea
            value={state.notes}
            onChange={(e) => updateNotes(e.target.value)}
            rows={3}
            placeholder="Call notes, mutual connections…"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50"
            onClick={() => setResponse(true)}
          >
            Mark Replied
          </button>
          <button
            type="button"
            className="rounded border border-graphite-200 px-2 py-1 text-xs hover:bg-graphite-50"
            onClick={() => setResponse(false)}
          >
            Mark No Reply
          </button>
        </div>
        <div>
          <Label>History</Label>
          <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-graphite-600">
            {state.outreachHistory.length === 0 ? (
              <li>No outreach logged</li>
            ) : (
              state.outreachHistory.map((h) => (
                <li key={h.id} className="border-b border-graphite-50 py-1">
                  {h.date.slice(0, 10)} — {h.subject} ({h.status})
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
