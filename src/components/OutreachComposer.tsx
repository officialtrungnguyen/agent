import { CalendarClock, MailPlus, Send, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { generateEmailVariants, generateFollowUp, getAutoStatus, getContactName } from '../lib/recruiting';
import type { AttachmentMode, Contact, EmailHistoryItem, ResumeProfile } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

interface OutreachComposerProps {
  open: boolean;
  contact?: Contact;
  resume: ResumeProfile;
  history: EmailHistoryItem[];
  onOpenChange: (open: boolean) => void;
  onQueueDraft: (params: {
    contact: Contact;
    subject: string;
    body: string;
    sendAt: string;
    variantLabel: 'Short' | 'Relationship-First' | 'Deal-Referenced' | 'Aggressive';
    hook: string;
    attachmentMode: AttachmentMode;
    sendImmediately: boolean;
  }) => void;
}

export function OutreachComposer({ open, contact, resume, history, onOpenChange, onQueueDraft }: OutreachComposerProps) {
  const variants = useMemo(() => (contact ? generateEmailVariants(contact, resume) : []), [contact, resume]);
  const [variantLabel, setVariantLabel] = useState<'Short' | 'Relationship-First' | 'Deal-Referenced' | 'Aggressive'>('Short');
  const activeVariant = variants.find((variant) => variant.label === variantLabel) ?? variants[0];
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('none');
  const [useAltSubject, setUseAltSubject] = useState(false);

  useEffect(() => {
    if (activeVariant) {
      setSubject(activeVariant.subjectA);
      setBody(activeVariant.body);
      setSendAt(activeVariant.recommendedSendAt.slice(0, 16));
    }
  }, [activeVariant]);

  useEffect(() => {
    if (activeVariant) {
      setSubject(useAltSubject ? activeVariant.subjectB : activeVariant.subjectA);
    }
  }, [activeVariant, useAltSubject]);

  if (!contact || !activeVariant) {
    return null;
  }

  const shouldSuggestFollowUp = getAutoStatus(contact) === 'no-reply';
  const followUp = generateFollowUp(contact, history);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <div className="micro-label">Hyper-personalized outreach composer</div>
              <DialogTitle className="mt-2">{getContactName(contact)}</DialogTitle>
              <DialogDescription>
                {contact.firm} - {contact.team} - {contact.school} - {contact.coverageSectors.join(', ')}
              </DialogDescription>
            </div>
            <Badge variant="green">Best email ready</Badge>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Tabs value={variantLabel} onValueChange={(value) => setVariantLabel(value as typeof variantLabel)}>
              <TabsList className="grid w-full grid-cols-4">
                {variants.map((variant) => (
                  <TabsTrigger key={variant.label} value={variant.label}>
                    {variant.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {variants.map((variant) => (
                <TabsContent key={variant.label} value={variant.label}>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2 text-slate-100">
                      <Sparkles className="h-4 w-4" /> Hook strategy
                    </div>
                    <div className="mt-2">{variant.hook}</div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Subject line</label>
              <div className="mb-2 flex gap-2">
                <Button variant={useAltSubject ? 'outline' : 'default'} size="sm" onClick={() => setUseAltSubject(false)}>
                  A version
                </Button>
                <Button variant={useAltSubject ? 'default' : 'outline'} size="sm" onClick={() => setUseAltSubject(true)}>
                  B version
                </Button>
              </div>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Email body</label>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-[260px]" />
              <div className="mt-2 text-xs text-slate-500">{body.split(/\s+/).filter(Boolean).length} words</div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <div className="micro-label">Delivery controls</div>
              <div className="mt-2 text-sm text-slate-300">
                Attach the original resume or a tailored one-pager, then either send immediately or route it into the conveyor queue.
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Attachment mode</label>
              <select
                value={attachmentMode}
                onChange={(event) => setAttachmentMode(event.target.value as AttachmentMode)}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                <option value="none">No attachment</option>
                <option value="original">Attach original resume</option>
                <option value="tailored">Attach tailored one-pager</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Recommended send time</label>
              <Input type="datetime-local" value={sendAt} onChange={(event) => setSendAt(event.target.value)} />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <CalendarClock className="h-4 w-4" /> Send-time AI
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Analysts: 7-9 AM. VPs: 8-10 AM. MDs: 9-11 AM. This recommendation already matches the contact title and next business-day window.
              </div>
            </div>

            {shouldSuggestFollowUp ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="micro-label text-amber-200">7-day no-reply follow-up</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-amber-50">{followUp}</div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Button
                onClick={() =>
                  onQueueDraft({
                    contact,
                    subject,
                    body,
                    sendAt: new Date(sendAt).toISOString(),
                    variantLabel,
                    hook: activeVariant.hook,
                    attachmentMode,
                    sendImmediately: false,
                  })
                }
              >
                <MailPlus className="h-4 w-4" /> Queue draft
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  onQueueDraft({
                    contact,
                    subject,
                    body,
                    sendAt: new Date().toISOString(),
                    variantLabel,
                    hook: activeVariant.hook,
                    attachmentMode,
                    sendImmediately: true,
                  })
                }
              >
                <Send className="h-4 w-4" /> Send now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
