import { Clock3, Play, SendHorizonal } from "lucide-react";
import { bestSendSlot } from "../lib/ai";
import type { Contact, GmailAuthState, PipelineItem, UserProfile } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PipelineQueuePanelProps {
  items: PipelineItem[];
  contactsById: Record<string, Contact>;
  profile: UserProfile;
  gmail: GmailAuthState;
  onSendNow: (item: PipelineItem) => void;
  onAutoSchedule: (item: PipelineItem, sendAt: string) => void;
  onExecutePipeline: () => void;
}

export const PipelineQueuePanel = ({
  items,
  contactsById,
  profile,
  gmail,
  onSendNow,
  onAutoSchedule,
  onExecutePipeline
}: PipelineQueuePanelProps) => (
  <Card className="fixed bottom-0 left-0 right-0 z-30 border-x-0 border-b-0 backdrop-blur">
    <CardHeader className="flex flex-row items-center justify-between py-2.5">
      <CardTitle>Outreach Conveyor Queue</CardTitle>
      <div className="flex items-center gap-2">
        <Badge>{items.length} queued</Badge>
        <Button variant="accent" size="sm" onClick={onExecutePipeline} disabled={!gmail.isAuthed || items.length === 0}>
          <Play className="mr-1 h-3.5 w-3.5" />
          Execute Pipeline
        </Button>
      </div>
    </CardHeader>
    <CardContent className="max-h-[230px] overflow-auto pt-0">
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-500">No emails queued yet. Generate drafts to start pipeline automation.</p>}
        {items.map((item) => {
          const contact = contactsById[item.contactId];
          if (!contact) {
            return null;
          }
          const optimalSlot = bestSendSlot(contact.title, profile.timezone);
          return (
            <div key={item.id} className="flex flex-col gap-2 border border-slate-800 px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-100">
                  {contact.firstName} {contact.lastName} · {contact.firm}
                </p>
                <p className="text-xs text-slate-500">{item.emailDraft.subject}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onSendNow(item)} disabled={!gmail.isAuthed}>
                  <SendHorizonal className="mr-1 h-3.5 w-3.5" />
                  Send Now
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAutoSchedule(item, optimalSlot)} disabled={!gmail.isAuthed}>
                  <Clock3 className="mr-1 h-3.5 w-3.5" />
                  Auto-Schedule ({new Date(optimalSlot).toLocaleTimeString()})
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
