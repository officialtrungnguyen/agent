import * as React from "react";
import {
  Wand2, Send, CalendarClock, ListPlus, Paperclip, RefreshCw, Clock, Check, ChevronRight,
} from "lucide-react";
import type { EmailVariant, GeneratedEmail } from "../types";
import { Dialog, DialogHeader } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input, Textarea } from "./ui/Input";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { useToast } from "./ui/Toast";
import { cn } from "../lib/utils";
import { generateEmail, generateFollowUp, VARIANT_META } from "../lib/ai";
import { nextOptimalSend, describeSendPlan, optimalWindowLabel } from "../lib/scheduler";

const VARIANTS: EmailVariant[] = ["short", "relationship", "deal", "aggressive"];

export function OutreachComposer() {
  const { composeTarget, openCompose } = useUI();
  const { user, addToQueue, sendQueueItem, auth } = useApp();
  const toast = useToast();

  const contact = composeTarget?.contact ?? null;
  const isFollowUp = (composeTarget?.followUpDays ?? 0) > 0;

  const [variant, setVariant] = React.useState<EmailVariant>(composeTarget?.variant ?? "deal");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [altSubjects, setAltSubjects] = React.useState<string[]>([]);
  const [rationale, setRationale] = React.useState("");
  const [attachResume, setAttachResume] = React.useState(false);
  const [scheduleMode, setScheduleMode] = React.useState<"now" | "optimal" | "custom">("optimal");
  const [customWhen, setCustomWhen] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const regenerate = React.useCallback(
    (v: EmailVariant) => {
      if (!contact) return;
      let email: GeneratedEmail;
      if (isFollowUp) {
        const originalSubject =
          [...contact.events].find((e) => e.type === "email_sent")?.summary.match(/"([^"]+)"/)?.[1] ??
          `${contact.division} at ${contact.firm} — quick question`;
        email = generateFollowUp(contact, user, composeTarget?.followUpDays ?? 7, originalSubject);
      } else {
        email = generateEmail(contact, user, v);
      }
      setSubject(email.subject);
      setBody(email.body);
      setAltSubjects(email.altSubjects);
      setRationale(email.rationale);
    },
    [contact, user, isFollowUp, composeTarget?.followUpDays],
  );

  // Initialize when target changes.
  React.useEffect(() => {
    if (!contact) return;
    const v = composeTarget?.variant ?? "deal";
    setVariant(v);
    setScheduleMode(isFollowUp ? "optimal" : "optimal");
    setAttachResume(false);
    regenerate(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeTarget?.contact.id]);

  if (!contact) return null;

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const overLength = wordCount > 150;

  const resolveSchedule = (): string | null => {
    if (scheduleMode === "now") return null;
    if (scheduleMode === "custom" && customWhen) return new Date(customWhen).toISOString();
    return nextOptimalSend(contact).toISOString();
  };

  const onQueue = () => {
    addToQueue({
      contactId: contact.id,
      to: contact.email,
      subject,
      body,
      variant,
      attachResume,
      scheduledFor: scheduleMode === "now" ? null : resolveSchedule(),
      isFollowUp,
    });
    toast.push(`Added to pipeline → ${contact.firstName} ${contact.lastName}.`, "success");
    openCompose(null);
  };

  const onSendNow = async () => {
    if (!auth.connected) {
      toast.push("Connect Gmail to send now.", "error");
      return;
    }
    setBusy(true);
    const item = addToQueue({
      contactId: contact.id,
      to: contact.email,
      subject,
      body,
      variant,
      attachResume,
      scheduledFor: null,
      isFollowUp,
    });
    await sendQueueItem(item.id);
    setBusy(false);
    openCompose(null);
  };

  const onAutoSchedule = () => {
    addToQueue({
      contactId: contact.id,
      to: contact.email,
      subject,
      body,
      variant,
      attachResume,
      scheduledFor: nextOptimalSend(contact).toISOString(),
      isFollowUp,
    });
    toast.push(`Auto-scheduled for ${describeSendPlan(contact)}.`, "success");
    openCompose(null);
  };

  return (
    <Dialog open={!!contact} onClose={() => openCompose(null)} size="lg">
      <DialogHeader
        title={isFollowUp ? `Follow-up — ${contact.firstName} ${contact.lastName}` : `Compose — ${contact.firstName} ${contact.lastName}`}
        subtitle={`${contact.email} · ${contact.title}, ${contact.firm}`}
        onClose={() => openCompose(null)}
        right={<Badge tone="accent" mono>Fit {contact.fitScore}</Badge>}
      />

      <div className="grid max-h-[80vh] gap-0 overflow-y-auto scrollbar-thin lg:grid-cols-[1fr_280px]">
        {/* Editor */}
        <div className="space-y-4 p-5">
          {!isFollowUp && (
            <div>
              <span className="micro-label">Email Variant</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VARIANTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setVariant(v); regenerate(v); }}
                    className={cn(
                      "rounded-md border p-2 text-left transition-colors",
                      variant === v ? "border-graphite-900 bg-graphite-900 text-white" : "border-graphite-200 bg-white hover:border-graphite-400",
                    )}
                  >
                    <div className="text-xs font-semibold">{VARIANT_META[v].label}</div>
                    <div className={cn("mt-0.5 text-[10px]", variant === v ? "text-graphite-300" : "text-graphite-400")}>
                      {VARIANT_META[v].blurb}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="micro-label">Subject</span>
              <Button size="sm" variant="ghost" onClick={() => regenerate(variant)}>
                <Wand2 className="h-3.5 w-3.5" /> Generate best email
              </Button>
            </div>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
            {altSubjects.length > 0 && (
              <div className="mt-2">
                <span className="text-[11px] text-graphite-400">A/B alternatives — click to use:</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {altSubjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className="rounded border border-graphite-200 bg-white px-2 py-1 text-[11px] text-graphite-600 hover:border-graphite-400 hover:text-graphite-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="micro-label">Body</span>
              <span className={cn("text-[11px]", overLength ? "font-medium text-amber-600" : "text-graphite-400")}>
                {wordCount} words {overLength ? "· over 150 (tighten it up)" : "· within etiquette"}
              </span>
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={13} className="mt-1.5 font-[450] leading-relaxed" />
          </div>

          {rationale && (
            <div className="rounded-md border border-graphite-200 bg-graphite-50 p-2.5">
              <span className="micro-label">Why this works</span>
              <p className="mt-1 text-xs text-graphite-600">{rationale}</p>
            </div>
          )}
        </div>

        {/* Side controls */}
        <div className="space-y-4 border-t border-graphite-200 bg-graphite-50 p-5 lg:border-l lg:border-t-0">
          <div>
            <span className="micro-label">Attachment</span>
            <button
              onClick={() => setAttachResume((a) => !a)}
              disabled={!user.resume}
              className={cn(
                "mt-1.5 flex w-full items-center gap-2 rounded-md border p-2.5 text-left text-sm transition-colors disabled:opacity-50",
                attachResume ? "border-graphite-900 bg-white" : "border-graphite-200 bg-white hover:border-graphite-400",
              )}
            >
              <Paperclip className="h-4 w-4 text-graphite-500" />
              <span className="flex-1">
                <span className="font-medium text-graphite-800">{user.resume ? "Attach résumé" : "No résumé uploaded"}</span>
                <span className="block text-[11px] text-graphite-400">
                  {user.resume ? user.resume.fileName || "tailored one-pager" : "Add one in the Résumé tab"}
                </span>
              </span>
              {attachResume && <Check className="h-4 w-4 text-emerald-600" />}
            </button>
          </div>

          <div>
            <span className="micro-label">Send Timing</span>
            <div className="mt-1.5 space-y-1.5">
              {([
                { key: "optimal", label: "AI-optimal window", hint: optimalWindowLabel(contact.level) + " " + (contact.timezone.split("/")[1]?.replace("_", " ") ?? "") },
                { key: "now", label: "Send immediately", hint: "Requires Gmail connected" },
                { key: "custom", label: "Custom date/time", hint: "Pick your own slot" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setScheduleMode(opt.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors",
                    scheduleMode === opt.key ? "border-graphite-900 bg-white" : "border-graphite-200 bg-white hover:border-graphite-400",
                  )}
                >
                  <Clock className="h-4 w-4 text-graphite-500" />
                  <span className="flex-1">
                    <span className="font-medium text-graphite-800">{opt.label}</span>
                    <span className="block text-[11px] text-graphite-400">{opt.hint}</span>
                  </span>
                  {scheduleMode === opt.key && <Check className="h-4 w-4 text-emerald-600" />}
                </button>
              ))}
              {scheduleMode === "custom" && (
                <Input type="datetime-local" value={customWhen} onChange={(e) => setCustomWhen(e.target.value)} className="mt-1" />
              )}
              {scheduleMode === "optimal" && (
                <p className="rounded bg-graphite-100 px-2 py-1.5 text-[11px] text-graphite-600">
                  <CalendarClock className="mr-1 inline h-3 w-3" />
                  {describeSendPlan(contact)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {scheduleMode === "now" ? (
              <Button className="w-full" onClick={onSendNow} disabled={busy || !subject || !body}>
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send now
              </Button>
            ) : (
              <Button className="w-full" onClick={onAutoSchedule} disabled={!subject || !body}>
                <CalendarClock className="h-4 w-4" /> Auto-schedule
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={onQueue} disabled={!subject || !body}>
              <ListPlus className="h-4 w-4" /> Add to pipeline
            </Button>
            {!auth.connected && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <ChevronRight className="h-3 w-3" /> Connect Gmail to enable live send.
              </p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
