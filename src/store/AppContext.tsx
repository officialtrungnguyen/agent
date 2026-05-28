// ─────────────────────────────────────────────────────────────
// AppContext — the single source of truth for BulgeBracket.ai
//
// Holds user profile, the alumni ledger (with live fit scores),
// outreach queue, and Gmail auth state. Persists everything to
// localStorage and reconciles scheduled/sent items with the backend.
// ─────────────────────────────────────────────────────────────

import * as React from "react";
import type {
  AnalyticsSnapshot,
  Contact,
  EmailVariant,
  OutreachEvent,
  OutreachStatus,
  QueueItem,
  ResumeProfile,
  UserProfile,
} from "../types";
import {
  loadUser,
  saveUser,
  loadContacts,
  saveContacts,
  loadQueue,
  saveQueue,
  isOnboarded,
  setOnboarded as persistOnboarded,
} from "../lib/storage";
import { computeFitScore } from "../lib/scoring";
import { uid, daysBetween } from "../lib/utils";
import {
  getAuthStatus,
  getQueueStatus,
  sendEmail,
  type AuthStatus,
  type SendPayload,
} from "../lib/gmail";
import { useToast } from "../components/ui/Toast";

interface AddToQueueInput {
  contactId: string;
  to: string;
  subject: string;
  body: string;
  variant: EmailVariant;
  attachResume?: boolean;
  scheduledFor?: string | null;
  isFollowUp?: boolean;
}

interface AppState {
  ready: boolean;
  user: UserProfile;
  contacts: Contact[];
  queue: QueueItem[];
  auth: AuthStatus;
  onboarded: boolean;

  setUser: (u: UserProfile) => void;
  setResume: (r: ResumeProfile | undefined) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  setContactStatus: (id: string, status: OutreachStatus) => void;
  logEvent: (id: string, event: Omit<OutreachEvent, "id" | "at"> & { at?: string }) => void;
  addNote: (id: string, body: string) => void;
  setRelationship: (id: string, value: number) => void;
  markReplied: (id: string, positive?: boolean) => void;
  importContacts: (contacts: Contact[]) => void;

  addToQueue: (input: AddToQueueInput) => QueueItem;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, patch: Partial<QueueItem>) => void;
  sendQueueItem: (id: string) => Promise<void>;
  executePipeline: () => Promise<void>;

  refreshAuth: () => Promise<void>;
  setOnboarded: (v: boolean) => void;

  analytics: AnalyticsSnapshot;
  fitScoreOf: (c: Contact) => number;
}

const Ctx = React.createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [ready, setReady] = React.useState(false);
  const [user, setUserState] = React.useState<UserProfile>(() => loadUser());
  const [contactsRaw, setContactsRaw] = React.useState<Contact[]>(() => loadContacts());
  const [queue, setQueue] = React.useState<QueueItem[]>(() => loadQueue());
  const [auth, setAuth] = React.useState<AuthStatus>({ configured: false, connected: false });
  const [onboarded, setOnboardedState] = React.useState<boolean>(() => isOnboarded());

  // ── Live fit scores (recomputed when user/resume changes) ──
  const contacts = React.useMemo(() => {
    return contactsRaw.map((c) => ({ ...c, fitScore: computeFitScore(c, user) }));
  }, [contactsRaw, user]);

  const fitScoreOf = React.useCallback((c: Contact) => computeFitScore(c, user), [user]);

  // ── Auto no-reply detection (>=7 days since sent, no reply) ──
  React.useEffect(() => {
    setContactsRaw((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        if (c.status === "sent" && c.lastOutreachAt && !c.lastReplyAt) {
          const days = daysBetween(c.lastOutreachAt);
          if (days >= 7) {
            changed = true;
            return { ...c, status: "no_reply" as OutreachStatus };
          }
        }
        return c;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Persistence ──
  React.useEffect(() => {
    saveUser(user);
  }, [user]);
  React.useEffect(() => {
    saveContacts(contactsRaw);
  }, [contactsRaw]);
  React.useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // ── Boot: load auth status ──
  React.useEffect(() => {
    void getAuthStatus().then((s) => {
      setAuth(s);
      setReady(true);
    });
  }, []);

  const refreshAuth = React.useCallback(async () => {
    const s = await getAuthStatus();
    setAuth(s);
  }, []);

  // ── Poll backend for scheduled/sent reconciliation ──
  React.useEffect(() => {
    const hasPending = queue.some((q) => q.status === "scheduled" || q.status === "sending");
    if (!hasPending) return;
    const tick = async () => {
      const statuses = await getQueueStatus();
      setQueue((prev) =>
        prev.map((q) => {
          const s = statuses[q.id];
          if (!s) return q;
          if (s.status === "sent" && q.status !== "sent" && q.status !== "delivered") {
            // reflect completed send on the contact
            markContactSent(q.contactId, q.subject, q.isFollowUp);
            return { ...q, status: "sent", sentAt: s.sentAt ?? new Date().toISOString() };
          }
          if (s.status === "failed") return { ...q, status: "failed", error: s.error ?? "Send failed" };
          return q;
        }),
      );
    };
    const interval = setInterval(tick, 15000);
    void tick();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.map((q) => `${q.id}:${q.status}`).join(",")]);

  // ── Contact mutations ──
  const updateContact = React.useCallback((id: string, patch: Partial<Contact>) => {
    setContactsRaw((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const logEvent = React.useCallback(
    (id: string, event: Omit<OutreachEvent, "id" | "at"> & { at?: string }) => {
      setContactsRaw((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                events: [
                  { id: uid("evt"), at: event.at ?? new Date().toISOString(), type: event.type, summary: event.summary, meta: event.meta },
                  ...c.events,
                ],
              }
            : c,
        ),
      );
    },
    [],
  );

  const setContactStatus = React.useCallback((id: string, status: OutreachStatus) => {
    setContactsRaw((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              events: [
                { id: uid("evt"), at: new Date().toISOString(), type: "status_change", summary: `Status → ${status.replace("_", " ")}` },
                ...c.events,
              ],
            }
          : c,
      ),
    );
  }, []);

  const addNote = React.useCallback((id: string, body: string) => {
    if (!body.trim()) return;
    setContactsRaw((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              notes: [{ id: uid("note"), body: body.trim(), createdAt: new Date().toISOString() }, ...c.notes],
              events: [{ id: uid("evt"), at: new Date().toISOString(), type: "note", summary: "Added a note" }, ...c.events],
            }
          : c,
      ),
    );
  }, []);

  const setRelationship = React.useCallback((id: string, value: number) => {
    setContactsRaw((prev) => prev.map((c) => (c.id === id ? { ...c, relationshipStrength: value } : c)));
  }, []);

  const markReplied = React.useCallback((id: string, positive = true) => {
    setContactsRaw((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "replied",
              lastReplyAt: new Date().toISOString(),
              relationshipStrength: Math.max(c.relationshipStrength, positive ? 3 : 2),
              events: [
                { id: uid("evt"), at: new Date().toISOString(), type: "reply_received", summary: positive ? "Positive reply received" : "Reply received", meta: { positive: positive ? 1 : 0 } },
                ...c.events,
              ],
            }
          : c,
      ),
    );
  }, []);

  // helper used by queue reconciliation
  const markContactSent = React.useCallback((contactId: string, subject: string, isFollowUp?: boolean) => {
    setContactsRaw((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              status: c.status === "replied" ? "replied" : "sent",
              lastOutreachAt: new Date().toISOString(),
              events: [
                {
                  id: uid("evt"),
                  at: new Date().toISOString(),
                  type: isFollowUp ? "follow_up" : "email_sent",
                  summary: isFollowUp ? `Follow-up sent: "${subject}"` : `Email sent: "${subject}"`,
                },
                ...c.events,
              ],
            }
          : c,
      ),
    );
  }, []);

  const importContacts = React.useCallback(
    (incoming: Contact[]) => {
      setContactsRaw((prev) => {
        const byEmail = new Map(prev.map((c) => [c.email.toLowerCase(), c]));
        let added = 0;
        for (const c of incoming) {
          if (!byEmail.has(c.email.toLowerCase())) {
            byEmail.set(c.email.toLowerCase(), c);
            added++;
          }
        }
        toast.push(`Imported ${added} new contact${added === 1 ? "" : "s"}.`, "success");
        return Array.from(byEmail.values());
      });
    },
    [toast],
  );

  // ── User mutations ──
  const setUser = React.useCallback((u: UserProfile) => setUserState(u), []);
  const setResume = React.useCallback((r: ResumeProfile | undefined) => {
    setUserState((u) => ({ ...u, resume: r }));
  }, []);

  const setOnboarded = React.useCallback((v: boolean) => {
    setOnboardedState(v);
    persistOnboarded(v);
  }, []);

  // ── Queue mutations ──
  const addToQueue = React.useCallback(
    (input: AddToQueueInput): QueueItem => {
      const item: QueueItem = {
        id: uid("q"),
        contactId: input.contactId,
        to: input.to,
        subject: input.subject,
        body: input.body,
        variant: input.variant,
        attachResume: input.attachResume ?? false,
        status: input.scheduledFor ? "scheduled" : "queued",
        scheduledFor: input.scheduledFor ?? null,
        createdAt: new Date().toISOString(),
        sentAt: null,
        error: null,
        isFollowUp: input.isFollowUp,
      };
      setQueue((q) => [item, ...q]);
      setContactStatus(input.contactId, input.scheduledFor ? "scheduled" : "queued");
      return item;
    },
    [setContactStatus],
  );

  const removeFromQueue = React.useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  }, []);

  const updateQueueItem = React.useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  // Resolve resume attachment payload (base64). We store raw text resume;
  // for real PDFs uploaded, we keep base64 in sessionStorage keyed by name.
  const buildSendPayload = React.useCallback(
    (item: QueueItem): SendPayload => {
      const payload: SendPayload = {
        to: item.to,
        subject: item.subject,
        body: item.body,
        scheduledFor: item.scheduledFor,
        clientRef: item.id,
      };
      if (item.attachResume && user.resume) {
        const stored = sessionStorage.getItem("bb_resume_b64");
        if (stored) {
          payload.attachResume = true;
          payload.resumeFileName = user.resume.fileName || "resume.pdf";
          payload.resumeContentBase64 = stored;
        } else {
          // Fall back to attaching the parsed text as a .txt one-pager.
          payload.attachResume = true;
          payload.resumeFileName = (user.resume.fileName || "resume").replace(/\.[^.]+$/, "") + ".txt";
          payload.resumeContentBase64 = btoa(unescape(encodeURIComponent(user.resume.rawText)));
        }
      }
      return payload;
    },
    [user.resume],
  );

  const sendQueueItem = React.useCallback(
    async (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item) return;
      if (!auth.connected) {
        toast.push("Connect Gmail first to send.", "error");
        return;
      }
      updateQueueItem(id, { status: "sending", error: null });
      const result = await sendEmail(buildSendPayload({ ...item, scheduledFor: null }));
      if (result.ok) {
        updateQueueItem(id, { status: "sent", sentAt: new Date().toISOString() });
        markContactSent(item.contactId, item.subject, item.isFollowUp);
        toast.push(`Sent to ${item.to}.`, "success");
      } else {
        updateQueueItem(id, { status: "failed", error: result.error ?? "Send failed" });
        toast.push(result.error ?? "Send failed.", "error");
      }
    },
    [queue, auth.connected, updateQueueItem, buildSendPayload, markContactSent, toast],
  );

  const executePipeline = React.useCallback(async () => {
    const pending = queue.filter((q) => q.status === "queued" || q.status === "scheduled");
    if (!pending.length) {
      toast.push("Nothing in the pipeline to execute.", "info");
      return;
    }
    if (!auth.connected) {
      toast.push("Connect Gmail to execute the pipeline.", "error");
      return;
    }
    let dispatched = 0;
    for (const item of pending) {
      updateQueueItem(item.id, { status: item.scheduledFor ? "scheduled" : "sending" });
      const result = await sendEmail(buildSendPayload(item));
      if (result.ok) {
        if (result.scheduled) {
          updateQueueItem(item.id, { status: "scheduled" });
          setContactStatus(item.contactId, "scheduled");
        } else {
          updateQueueItem(item.id, { status: "sent", sentAt: new Date().toISOString() });
          markContactSent(item.contactId, item.subject, item.isFollowUp);
        }
        dispatched++;
      } else {
        updateQueueItem(item.id, { status: "failed", error: result.error ?? "Send failed" });
      }
    }
    toast.push(`Pipeline executed — ${dispatched} message${dispatched === 1 ? "" : "s"} dispatched.`, "success");
  }, [queue, auth.connected, updateQueueItem, buildSendPayload, markContactSent, setContactStatus, toast]);

  // ── Analytics ──
  const analytics = React.useMemo<AnalyticsSnapshot>(() => {
    const total = contactsRaw.length;
    const sentStatuses: OutreachStatus[] = ["sent", "replied", "no_reply", "meeting", "closed"];
    const sent = contactsRaw.filter((c) => sentStatuses.includes(c.status)).length;
    const replied = contactsRaw.filter((c) => c.status === "replied" || c.status === "meeting").length;
    const meetings = contactsRaw.filter((c) => c.status === "meeting").length;
    const scheduled = contactsRaw.filter((c) => c.status === "scheduled" || c.status === "queued").length;
    const noReply = contactsRaw.filter((c) => c.status === "no_reply").length;
    const contacted = sent;

    // Hook analysis from queue variants that resulted in replies.
    const repliedContactIds = new Set(contactsRaw.filter((c) => c.status === "replied" || c.status === "meeting").map((c) => c.id));
    const variantReplies = new Map<EmailVariant, number>();
    for (const q of queue) {
      if (q.status === "sent" && repliedContactIds.has(q.contactId)) {
        variantReplies.set(q.variant, (variantReplies.get(q.variant) ?? 0) + 1);
      }
    }
    const variantLabels: Record<EmailVariant, string> = {
      short: "Short & direct",
      relationship: "Relationship-first",
      deal: "Deal-referenced",
      aggressive: "High-conviction",
    };
    const topHooks = Array.from(variantReplies.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([v, n]) => ({ hook: variantLabels[v], replies: n }));

    const positiveRate = sent ? Math.round((replied / sent) * 100) : 0;

    return {
      total,
      contacted,
      sent,
      replied,
      meetings,
      replyRate: sent ? Math.round((replied / sent) * 100) : 0,
      positiveRate,
      scheduled,
      noReply,
      topHooks: topHooks.length ? topHooks : [{ hook: "Deal-referenced", replies: 0 }],
      bestSendWindows: [
        { window: "Tue 7–9 AM (Analysts)", replies: topHooks[0]?.replies ?? 0 },
        { window: "Wed 8–10 AM (VPs)", replies: 0 },
      ],
    };
  }, [contactsRaw, queue]);

  const value: AppState = {
    ready,
    user,
    contacts,
    queue,
    auth,
    onboarded,
    setUser,
    setResume,
    updateContact,
    setContactStatus,
    logEvent,
    addNote,
    setRelationship,
    markReplied,
    importContacts,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    sendQueueItem,
    executePipeline,
    refreshAuth,
    setOnboarded,
    analytics,
    fitScoreOf,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
