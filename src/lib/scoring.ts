import type { Contact, ContactState, ResumeData } from "../types";

export function computeFitScore(
  contact: Contact,
  resume: ResumeData | null,
  state: ContactState
): number {
  let score = 40;

  if (resume) {
    const schoolMatch =
      resume.school.toLowerCase() === contact.school.toLowerCase() ||
      resume.education.some((e) =>
        e.toLowerCase().includes(contact.school.toLowerCase())
      );
    if (schoolMatch) score += 22;

    const role = resume.targetRole.toLowerCase();
    const coverageOverlap = contact.coverage.filter((c) =>
      resume.skills.some((s) => s.toLowerCase().includes(c.toLowerCase())) ||
      resume.experience.some((e) =>
        e.bullets.some((b) => b.toLowerCase().includes(c.toLowerCase()))
      )
    );
    score += Math.min(15, coverageOverlap.length * 5);

    if (role.includes("m&a") && contact.team.toLowerCase().includes("m&a"))
      score += 8;
    if (role.includes("coverage") && contact.coverage.length >= 2) score += 5;
  }

  if (contact.priority === "high") score += 10;
  else if (contact.priority === "medium") score += 5;

  if (contact.recentDeals.length >= 2) score += 5;
  if (state.relationshipStrength >= 3) score += 8;
  if (state.status === "replied") score += 12;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getTopTargets(
  contacts: Contact[],
  states: Record<string, ContactState>,
  resume: ResumeData | null,
  limit = 20
): { contact: Contact; score: number }[] {
  return contacts
    .map((c) => ({
      contact: c,
      score: computeFitScore(c, resume, states[c.id] ?? {
        contactId: c.id,
        status: "not_contacted",
        relationshipStrength: 1,
        notes: "",
        outreachHistory: [],
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
