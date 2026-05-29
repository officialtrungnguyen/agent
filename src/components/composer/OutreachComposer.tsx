"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Mail,
  Zap,
  Copy,
  CheckCircle,
  Send,
  Clock,
  RefreshCw,
  Users,
  AlertCircle,
  ChevronDown,
  Paperclip,
  Calendar,
  RotateCcw,
  Star,
} from "lucide-react";
import { cn, generateId, getOptimalSendTime, formatSendTime, countWords } from "@/lib/utils";
import { toast } from "sonner";
import type { EmailVariant, QueuedEmail } from "@/types";

const VARIANTS: { id: EmailVariant; label: string; description: string }[] = [
  { id: "short", label: "Short & Sharp", description: "<120 words, punchy hook" },
  { id: "relationship", label: "Relationship-First", description: "Warm, human, genuine" },
  { id: "deal_referenced", label: "Deal-Referenced", description: "Specific transaction hook" },
  { id: "aggressive", label: "Direct & Confident", description: "Lead with credentials" },
];

export function OutreachComposer() {
  const {
    getSelectedContact,
    resume,
    gmailConnected,
    accessToken,
    emailQueue,
    addToQueue,
    updateContact,
    setActiveTab,
  } = useAppStore();

  const contact = getSelectedContact();

  const [variant, setVariant] = useState<EmailVariant>("short");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [attachResume, setAttachResume] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [altSubjects, setAltSubjects] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    if (contact) {
      const optimal = getOptimalSendTime(contact.seniority);
      setScheduledTime(optimal.toISOString().slice(0, 16));
    }
  }, [contact]);

  useEffect(() => {
    setWordCount(countWords(body));
  }, [body]);

  const handleGenerate = async () => {
    if (!contact) {
      toast.error("No contact selected. Go to the Alumni Ledger and select a contact.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, resume, variant, customInstructions }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      setSubject(data.subject || "");
      setBody(data.body || "");
      setAltSubjects(data.alternativeSubjects || []);
      setConfidenceScore(data.confidenceScore || 80);
      setWordCount(countWords(data.body || ""));

      if (data.source === "offline" || data.source === "offline_quota") {
        toast.info("Generated using offline templates — add OpenAI key for AI personalization");
      } else {
        toast.success("Email generated with AI personalization");
      }
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const buildQueueItem = (status: "queued" | "scheduled", scheduledFor: string | null = null): QueuedEmail => ({
    id: generateId(),
    contactId: contact!.id,
    contactName: `${contact!.firstName} ${contact!.lastName}`,
    contactFirm: contact!.firm,
    to: contact!.email,
    subject,
    body,
    variant,
    status,
    scheduledFor,
    sentAt: null,
    openedAt: null,
    repliedAt: null,
    attachResume,
    isFollowUp: false,
    followUpDay: 0,
    createdAt: new Date().toISOString(),
  });

  const handleAddToQueue = () => {
    if (!contact || !subject || !body) {
      toast.error("Please generate or write an email first");
      return;
    }
    addToQueue(buildQueueItem("queued"));
    toast.success(`Added to queue for ${contact.firstName} ${contact.lastName}`);
    setActiveTab("queue");
  };

  const handleSchedule = () => {
    if (!contact || !subject || !body) {
      toast.error("Please generate an email first");
      return;
    }
    addToQueue(buildQueueItem("scheduled", new Date(scheduledTime).toISOString()));
    toast.success(`Scheduled for ${formatSendTime(new Date(scheduledTime))}`);
    setShowScheduler(false);
    setActiveTab("queue");
  };

  const handleSendNow = async () => {
    if (!contact || !subject || !body) {
      toast.error("Please generate an email first");
      return;
    }
    if (!gmailConnected || !accessToken) {
      toast.error("Please connect your Gmail account first");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          to: contact.email,
          subject,
          emailBody: body,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Send failed");
      }

      const data = await res.json();

      // Update contact status
      updateContact(contact.id, {
        status: "sent",
        lastOutreach: new Date().toISOString(),
        outreachHistory: [
          ...(contact.outreachHistory || []),
          {
            id: generateId(),
            type: "email" as const,
            date: new Date().toISOString(),
            subject,
            body,
            outcome: "sent" as const,
          },
        ],
      });

      // Add to queue as sent
      const queueItem = buildQueueItem("queued");
      queueItem.status = "sent"; queueItem.sentAt = new Date().toISOString();
      queueItem.gmailMessageId = data.messageId;
      queueItem.gmailThreadId = data.threadId;
      addToQueue(queueItem);

      toast.success(`Email sent to ${contact.firstName} ${contact.lastName} ✓`);
      setSubject("");
      setBody("");
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleCopySubject = async () => {
    await navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = async () => {
    await navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Left: Controls */}
      <div className="w-72 border-r border-border flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="micro-label mb-3">Target Contact</div>
          {contact ? (
            <div className="card-base p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-300 shrink-0">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {contact.firstName} {contact.lastName}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {contact.title} · {contact.firm}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-base p-3 text-center">
              <div className="text-xs text-muted-foreground">No contact selected</div>
              <button
                onClick={() => setActiveTab("ledger")}
                className="btn-ghost text-xs mt-2"
              >
                <Users className="w-3.5 h-3.5" />
                Select Contact
              </button>
            </div>
          )}
        </div>

        {/* Variant Selection */}
        <div className="p-4 border-b border-border">
          <div className="micro-label mb-3">Email Variant</div>
          <div className="space-y-2">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-md border transition-colors",
                  variant === v.id
                    ? "border-indigo-500/40 bg-indigo-600/10"
                    : "border-border hover:border-indigo-500/20 hover:bg-accent"
                )}
              >
                <div className={cn("text-xs font-medium", variant === v.id ? "text-indigo-400" : "text-foreground")}>
                  {v.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="p-4 border-b border-border">
          <div className="micro-label mb-2">Custom Instructions (Optional)</div>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., 'mention my DCF modeling project', 'focus on M&A angle'..."
            className="input-base w-full h-20 resize-none text-xs"
          />
        </div>

        {/* Resume Attachment */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="micro-label">Attach Resume</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {resume ? `Attach "${resume.fileName}"` : "Upload resume first"}
              </div>
            </div>
            <button
              onClick={() => setAttachResume(!attachResume)}
              disabled={!resume}
              className={cn(
                "w-10 h-6 rounded-full border transition-colors relative",
                attachResume && resume
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-secondary border-border"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                  attachResume && resume ? "left-[calc(100%-22px)]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4">
          <button
            onClick={handleGenerate}
            disabled={generating || !contact}
            className="btn-primary w-full justify-center"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Email
              </>
            )}
          </button>

          {confidenceScore > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Confidence: {confidenceScore}%</span>
              </div>
              <div className="ml-auto font-mono text-foreground">{wordCount}w</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Email Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="micro-label">Email Draft</div>
          {wordCount > 0 && (
            <div className={cn(
              "flex items-center gap-1.5 text-[11px] font-mono",
              wordCount > 150 ? "text-amber-400" : "text-emerald-400"
            )}>
              {wordCount > 150 && <AlertCircle className="w-3 h-3" />}
              {wordCount} words {wordCount > 150 ? "(try to keep under 150)" : "✓"}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* To */}
          <div>
            <div className="micro-label mb-1.5">To</div>
            <div className="input-base text-xs text-muted-foreground">
              {contact ? contact.email : "Select a contact first"}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="micro-label">Subject</div>
              {subject && (
                <button onClick={handleCopySubject} className="btn-ghost text-xs">
                  {copiedSubject ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line will appear here after generation..."
              className="input-base w-full text-sm"
            />
          </div>

          {/* Alt Subjects */}
          {altSubjects.length > 0 && (
            <div>
              <div className="micro-label mb-1.5">Alternative Subject Lines</div>
              <div className="space-y-1.5">
                {altSubjects.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => setSubject(alt)}
                    className="w-full text-left px-3 py-2 rounded-md border border-border hover:border-indigo-500/30 hover:bg-accent text-xs text-muted-foreground transition-colors"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="micro-label">Body</div>
              {body && (
                <button onClick={handleCopyBody} className="btn-ghost text-xs">
                  {copiedBody ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your personalized email will appear here after generation. You can also type directly..."
              className="input-base w-full min-h-56 resize-none text-sm leading-relaxed"
            />
          </div>

          {attachResume && resume && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600/5 border border-indigo-600/20">
              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-400">{resume.fileName} will be attached</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToQueue}
              disabled={!subject || !body}
              className="btn-outline text-xs flex-1 justify-center"
            >
              <Mail className="w-3.5 h-3.5" />
              Add to Queue
            </button>

            <button
              onClick={() => setShowScheduler(!showScheduler)}
              disabled={!subject || !body}
              className="btn-outline text-xs flex-1 justify-center"
            >
              <Clock className="w-3.5 h-3.5" />
              Schedule
              <ChevronDown className={cn("w-3 h-3 transition-transform", showScheduler && "rotate-180")} />
            </button>

            <button
              onClick={handleSendNow}
              disabled={!subject || !body || !gmailConnected || sending}
              className={cn(
                "btn-primary text-xs flex-1 justify-center",
                !gmailConnected && "opacity-50 cursor-not-allowed"
              )}
              title={!gmailConnected ? "Connect Gmail to send" : ""}
            >
              {sending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {sending ? "Sending..." : "Send Now"}
            </button>
          </div>

          {showScheduler && (
            <div className="mt-3 p-3 rounded-md bg-accent/40 border border-border space-y-3">
              <div className="micro-label">Schedule Send Time</div>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input-base text-xs flex-1"
                />
                <button onClick={handleSchedule} className="btn-primary text-xs whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5" />
                  Confirm
                </button>
              </div>
              {contact && (
                <div className="text-[11px] text-muted-foreground">
                  Optimal for {contact.seniority}: {formatSendTime(getOptimalSendTime(contact.seniority))}
                </div>
              )}
            </div>
          )}

          {!gmailConnected && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-400">
              <AlertCircle className="w-3 h-3" />
              Connect Gmail to send directly. Use Queue to send later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
