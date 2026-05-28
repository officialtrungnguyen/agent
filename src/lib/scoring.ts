// ─────────────────────────────────────────────────────────────
// AI Fit Score engine
//
// Produces a 0–100 fit score for each banker relative to the user's
// resume, target role, and the banker's coverage/seniority/school tie.
// Fully deterministic + transparent (we expose the breakdown), so it
// works with zero external calls and never breaks on quota.
// ─────────────────────────────────────────────────────────────

import type { Contact, FitBreakdown, UserProfile } from "../types";

function textBlob(user: UserProfile): string {
  const r = user.resume;
  const parts = [
    user.targetRole,
    user.personalPitch,
    user.school,
    ...(user.targetFirms ?? []),
    r?.rawText ?? "",
    ...(r?.skills ?? []),
    ...(r?.achievements ?? []),
    ...(r?.experience.flatMap((e) => [e.company, e.role, ...e.bullets]) ?? []),
  ];
  return parts.join(" ").toLowerCase();
}

function sectorOverlap(blob: string, contact: Contact): number {
  const tokens = [
    contact.division.toLowerCase(),
    ...contact.coverageSectors.map((s) => s.toLowerCase()),
    contact.team.toLowerCase(),
  ];
  let hits = 0;
  for (const t of tokens) {
    const words = t.split(/[^a-z]+/).filter((w) => w.length > 3);
    if (words.some((w) => blob.includes(w))) hits++;
  }
  return Math.min(1, hits / Math.max(3, tokens.length * 0.6));
}

const SENIORITY_RESPONSIVENESS: Record<string, number> = {
  Analyst: 1.0,
  Associate: 0.95,
  "Vice President": 0.78,
  Director: 0.6,
  "Senior Vice President": 0.55,
  "Managing Director": 0.5,
  Partner: 0.4,
};

export function computeFitBreakdown(contact: Contact, user: UserProfile): FitBreakdown {
  const blob = textBlob(user);

  // 1. School tie (max 25)
  const schoolScore = contact.sharedSchool ? 25 : contact.school === user.school ? 25 : 0;

  // 2. Sector / coverage alignment with resume + target (max 30)
  const overlap = sectorOverlap(blob, contact);
  const sectorScore = Math.round(overlap * 30);

  // 3. Seniority responsiveness — juniors reply more (max 20)
  const responsiveness = SENIORITY_RESPONSIVENESS[contact.level] ?? 0.6;
  const seniorityScore = Math.round(responsiveness * 20);

  // 4. Priority / firm desirability (max 15)
  const priorityScore =
    contact.priority === "top" ? 15 : contact.priority === "high" ? 12 : contact.priority === "medium" ? 8 : 4;

  // 5. Deal recency & richness (max 10)
  const newestDeal = contact.recentDeals[0];
  let dealScore = 0;
  if (newestDeal) {
    const days = Math.max(0, (Date.now() - new Date(newestDeal.date).getTime()) / 86400000);
    const recency = Math.max(0, 1 - days / 540);
    dealScore = Math.round(recency * 7 + Math.min(3, contact.recentDeals.length));
  }

  const components = [
    { label: "Alumni tie", score: schoolScore, max: 25, note: contact.sharedSchool ? `Shared: ${contact.school}` : "No shared school" },
    { label: "Coverage fit", score: sectorScore, max: 30, note: `${contact.division} · ${contact.coverageSectors.slice(0, 2).join(", ")}` },
    { label: "Responsiveness", score: seniorityScore, max: 20, note: `${contact.level} reply likelihood` },
    { label: "Target priority", score: priorityScore, max: 15, note: `${contact.priority.toUpperCase()} priority` },
    { label: "Deal momentum", score: dealScore, max: 10, note: newestDeal ? newestDeal.type : "no recent deals" },
  ];

  const total = Math.max(0, Math.min(100, components.reduce((s, c) => s + c.score, 0)));
  return { total, components };
}

export function computeFitScore(contact: Contact, user: UserProfile): number {
  return computeFitBreakdown(contact, user).total;
}

export function scoreBand(score: number): { label: string; tone: "strong" | "good" | "fair" | "weak" } {
  if (score >= 80) return { label: "Elite fit", tone: "strong" };
  if (score >= 65) return { label: "Strong fit", tone: "good" };
  if (score >= 48) return { label: "Fair fit", tone: "fair" };
  return { label: "Stretch", tone: "weak" };
}
