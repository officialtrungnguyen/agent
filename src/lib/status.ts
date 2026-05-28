import type { OutreachStatus, EmailStatus, Priority } from "@/types";

type Tone = "slate" | "green" | "amber" | "red" | "blue" | "graphite";

export const statusMeta: Record<OutreachStatus, { label: string; tone: Tone }> = {
  not_contacted: { label: "Not Contacted", tone: "slate" },
  queued: { label: "Queued", tone: "blue" },
  scheduled: { label: "Scheduled", tone: "blue" },
  sent: { label: "Sent", tone: "graphite" },
  replied: { label: "Replied", tone: "green" },
  no_reply: { label: "No Reply", tone: "amber" },
  meeting: { label: "Meeting", tone: "green" },
  closed: { label: "Closed", tone: "slate" },
};

export const emailStatusMeta: Record<EmailStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "slate" },
  queued: { label: "Queued", tone: "blue" },
  scheduled: { label: "Scheduled", tone: "blue" },
  sending: { label: "Sending", tone: "amber" },
  sent: { label: "Sent", tone: "graphite" },
  delivered: { label: "Delivered", tone: "green" },
  failed: { label: "Failed", tone: "red" },
};

export const priorityMeta: Record<Priority, { label: string; tone: Tone }> = {
  tier_1: { label: "Tier 1", tone: "graphite" },
  tier_2: { label: "Tier 2", tone: "slate" },
  tier_3: { label: "Tier 3", tone: "slate" },
};

/** Kanban columns (subset of statuses). */
export const kanbanColumns: { key: OutreachStatus; label: string }[] = [
  { key: "not_contacted", label: "Not Contacted" },
  { key: "sent", label: "Sent / Scheduled" },
  { key: "replied", label: "Replied" },
  { key: "no_reply", label: "No Reply" },
];

/** Map any status into one of the four Kanban buckets. */
export function kanbanBucket(s: OutreachStatus): OutreachStatus {
  if (s === "queued" || s === "scheduled" || s === "sent") return "sent";
  if (s === "replied" || s === "meeting" || s === "closed") return "replied";
  if (s === "no_reply") return "no_reply";
  return "not_contacted";
}
