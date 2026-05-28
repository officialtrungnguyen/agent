import { CalendarClock, Play, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getContactName } from '../lib/recruiting';
import type { Contact, QueueItem } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface QueuePanelProps {
  queue: QueueItem[];
  contacts: Contact[];
  onSendNow: (queueItemId: string) => void;
  onAutoSchedule: (queueItemId: string) => void;
  onExecutePipeline: () => void;
  onDelete: (queueItemId: string) => void;
}

export function QueuePanel({ queue, contacts, onSendNow, onAutoSchedule, onExecutePipeline, onDelete }: QueuePanelProps) {
  const contactsMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const liveQueue = queue.filter((item) => ['queued', 'scheduled'].includes(item.status));

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 rounded-2xl border border-slate-800 bg-[#0d131b]/95 p-4 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="micro-label">Conveyor Queue</div>
          <div className="mt-1 text-lg font-semibold text-slate-100">
            {liveQueue.length} queued or scheduled note{liveQueue.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExecutePipeline}>
            <Play className="h-4 w-4" /> Execute pipeline
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {liveQueue.length ? (
          liveQueue.slice(0, 6).map((item) => {
            const contact = contactsMap.get(item.contactId);
            if (!contact) return null;
            return (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{getContactName(contact)}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {contact.firm} - {contact.team}
                    </div>
                  </div>
                  <Badge variant={item.status === 'scheduled' ? 'blue' : 'slate'}>{item.status}</Badge>
                </div>
                <div className="mt-3 text-sm text-slate-300">{item.subject}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {item.sendAt ? format(new Date(item.sendAt), 'EEE, MMM d h:mm a') : 'Ready immediately'}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onSendNow(item.id)}>
                    <Send className="h-4 w-4" /> Send now
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onAutoSchedule(item.id)}>
                    <CalendarClock className="h-4 w-4" /> Auto-schedule
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="xl:col-span-3 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">
            Queue drafts from the composer and this bottom conveyor becomes your batch execution lane.
          </div>
        )}
      </div>
    </div>
  );
}
