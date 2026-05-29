"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Inbox,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Play,
  Eye,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Mail,
  Zap,
  BarChart2,
} from "lucide-react";
import { cn, formatDate, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import type { QueuedEmail, EmailQueueStatus } from "@/types";

const STATUS_CONFIG: Record<EmailQueueStatus, { label: string; color: string; icon: React.ElementType }> = {
  queued: { label: "Queued", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Inbox },
  scheduled: { label: "Scheduled", color: "text-violet-400 bg-violet-400/10 border-violet-400/20", icon: Clock },
  sent: { label: "Sent", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  delivered: { label: "Delivered", color: "text-teal-400 bg-teal-400/10 border-teal-400/20", icon: CheckCircle },
  failed: { label: "Failed", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: XCircle },
};

export function EmailQueue() {
  const {
    emailQueue,
    updateEmailStatus,
    removeFromQueue,
    clearQueue,
    gmailConnected,
    accessToken,
    updateContact,
    contacts,
  } = useAppStore();

  const [previewEmail, setPreviewEmail] = useState<QueuedEmail | null>(null);
  const [executing, setExecuting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | EmailQueueStatus>("all");

  const filtered = activeFilter === "all"
    ? emailQueue
    : emailQueue.filter((e) => e.status === activeFilter);

  const queued = emailQueue.filter((e) => e.status === "queued");
  const scheduled = emailQueue.filter((e) => e.status === "scheduled");
  const sent = emailQueue.filter((e) => e.status === "sent");

  const sendEmail = async (email: QueuedEmail): Promise<boolean> => {
    if (!gmailConnected || !accessToken) return false;

    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        to: email.to,
        subject: email.subject,
        emailBody: email.body,
      }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    updateEmailStatus(email.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
      gmailMessageId: data.messageId,
      gmailThreadId: data.threadId,
    });

    // Update contact status
    const contact = contacts.find((c) => c.id === email.contactId);
    if (contact) {
      updateContact(email.contactId, {
        status: "sent",
        lastOutreach: new Date().toISOString(),
      });
    }

    return true;
  };

  const handleSendSingle = async (email: QueuedEmail) => {
    if (!gmailConnected) {
      toast.error("Connect Gmail first");
      return;
    }
    setSendingId(email.id);
    try {
      const success = await sendEmail(email);
      if (success) {
        toast.success(`Sent to ${email.contactName} ✓`);
      } else {
        toast.error(`Failed to send to ${email.contactName}`);
        updateEmailStatus(email.id, { status: "failed" });
      }
    } catch {
      toast.error("Send failed");
      updateEmailStatus(email.id, { status: "failed" });
    } finally {
      setSendingId(null);
    }
  };

  const handleExecutePipeline = async () => {
    if (!gmailConnected) {
      toast.error("Connect Gmail to execute the pipeline");
      return;
    }
    if (queued.length === 0) {
      toast.info("No queued emails to send");
      return;
    }

    setExecuting(true);
    let successCount = 0;
    let failCount = 0;

    for (const email of queued) {
      setSendingId(email.id);
      try {
        const success = await sendEmail(email);
        if (success) successCount++;
        else {
          failCount++;
          updateEmailStatus(email.id, { status: "failed" });
        }
        await new Promise((r) => setTimeout(r, 1200));
      } catch {
        failCount++;
        updateEmailStatus(email.id, { status: "failed" });
      }
    }

    setSendingId(null);
    setExecuting(false);
    toast.success(`Pipeline complete: ${successCount} sent, ${failCount} failed`);
  };

  const handleCancel = (id: string) => {
    updateEmailStatus(id, { status: "cancelled" });
    toast.success("Email cancelled");
  };

  const filters: { id: "all" | EmailQueueStatus; label: string; count: number }[] = [
    { id: "all", label: "All", count: emailQueue.length },
    { id: "queued", label: "Queued", count: queued.length },
    { id: "scheduled", label: "Scheduled", count: scheduled.length },
    { id: "sent", label: "Sent", count: sent.length },
    { id: "failed", label: "Failed", count: emailQueue.filter((e) => e.status === "failed").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border">
        {[
          { label: "Total", value: emailQueue.length, icon: Mail, color: "text-foreground" },
          { label: "Queued", value: queued.length, icon: Inbox, color: "text-blue-400" },
          { label: "Scheduled", value: scheduled.length, icon: Clock, color: "text-violet-400" },
          { label: "Sent", value: sent.length, icon: CheckCircle, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-base p-3 flex items-center gap-3">
            <Icon className={cn("w-5 h-5", color)} />
            <div>
              <div className={cn("text-xl font-mono font-bold", color)}>{value}</div>
              <div className="micro-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        {/* Filters */}
        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs transition-colors",
                activeFilter === f.id
                  ? "bg-indigo-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {f.label}
              {f.count > 0 && (
                <span className={cn(
                  "ml-1.5 text-[10px] font-mono",
                  activeFilter === f.id ? "text-indigo-200" : "text-muted-foreground"
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {queued.length > 0 && (
            <button
              onClick={handleExecutePipeline}
              disabled={executing || !gmailConnected}
              className="btn-primary text-xs"
            >
              {executing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {executing ? "Executing..." : `Execute Pipeline (${queued.length})`}
            </button>
          )}
          {emailQueue.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all emails from queue?")) clearQueue();
              }}
              className="btn-ghost text-xs text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Inbox className="w-12 h-12 mb-3 opacity-20" />
            <div className="text-sm">
              {activeFilter === "all" ? "Queue is empty" : `No ${activeFilter} emails`}
            </div>
            <div className="text-xs mt-1 opacity-60">
              Compose an email and add it to the queue
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((email) => {
              const statusCfg = STATUS_CONFIG[email.status];
              const StatusIcon = statusCfg.icon;
              const isSending = sendingId === email.id;

              return (
                <div key={email.id} className="flex items-start gap-4 px-4 py-4 hover:bg-accent/30 transition-colors group">
                  {/* Status Icon */}
                  <div className={cn("mt-0.5 p-1.5 rounded", statusCfg.color)}>
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <StatusIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{email.contactName}</span>
                      <span className="text-[11px] text-muted-foreground">{email.contactFirm}</span>
                      {email.isFollowUp && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          FOLLOW-UP {email.followUpDay}D
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground truncate">{email.subject}</div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>{email.to}</span>
                      {email.scheduledFor && email.status === "scheduled" && (
                        <span className="flex items-center gap-1 text-violet-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(email.scheduledFor, "MMM d 'at' h:mm a")}
                        </span>
                      )}
                      {email.sentAt && (
                        <span>Sent {formatRelativeDate(email.sentAt)}</span>
                      )}
                      <span className="capitalize">{email.variant.replace("_", " ")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewEmail(email)}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {(email.status === "queued") && (
                      <button
                        onClick={() => handleSendSingle(email)}
                        disabled={isSending || !gmailConnected}
                        className="p-1.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400"
                        title="Send Now"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(email.status === "queued" || email.status === "scheduled") && (
                      <button
                        onClick={() => handleCancel(email.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        title="Cancel"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => removeFromQueue(email.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <span className={cn("status-badge shrink-0", statusCfg.color)}>
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewEmail(null)}
        >
          <div
            className="card-base w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <div className="text-sm font-medium">Email Preview</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  To: {previewEmail.to}
                </div>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="btn-ghost text-xs">
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              <div>
                <div className="micro-label mb-1">Subject</div>
                <div className="text-sm font-medium text-foreground">{previewEmail.subject}</div>
              </div>
              <div>
                <div className="micro-label mb-1">Body</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {previewEmail.body}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              {previewEmail.status === "queued" && gmailConnected && (
                <button
                  onClick={() => {
                    handleSendSingle(previewEmail);
                    setPreviewEmail(null);
                  }}
                  className="btn-primary text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Now
                </button>
              )}
              <button onClick={() => setPreviewEmail(null)} className="btn-ghost text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
