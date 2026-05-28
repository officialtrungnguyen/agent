import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../../types";

/**
 * Offline-first "Strategy Advisor" — a deterministic rules engine that mimics
 * a senior IB recruiting coach. Always available, even when AI quota is hit.
 */

export interface AdvisorTurn {
  role: "user" | "advisor";
  text: string;
  at: string;
}

interface AdvisorContext {
  contacts: Contact[];
  resume: ResumeData | null;
  profile: UserProfile;
  emails: OutreachEmail[];
}

export function advisorReply(prompt: string, ctx: AdvisorContext): string {
  const q = prompt.toLowerCase().trim();
  const sent = ctx.emails.filter((e) => e.status === "sent").length;
  const replied = ctx.contacts.filter((c) => c.status === "replied" || c.status === "meeting_set").length;
  const queued = ctx.emails.filter((e) => e.status === "queued" || e.status === "scheduled").length;
  const total = ctx.contacts.length;

  if (/^(hi|hello|hey)/.test(q)) {
    return `Hey — I'm your recruiting coach. You've sent ${sent} emails, queued ${queued}, and have ${replied} active conversations across ${total} tracked contacts. Ask me anything tactical: who to contact next, how to phrase a follow-up, or how to handle a tough reply.`;
  }
  if (/who.*next|top|prioritize|priority/.test(q)) {
    const top = topThisWeek(ctx.contacts, 5);
    return [
      "Top targets this week (based on fit, seniority, and momentum):",
      ...top.map((c, i) => ` ${i + 1}. ${c.firstName} ${c.lastName} — ${c.title} @ ${c.firm} (${c.team}) · Fit ${c.fitScore ?? "—"}`),
      "",
      "Lead with the VPs and Associates first — they reply the most and they staff the deal teams.",
    ].join("\n");
  }
  if (/follow.?up|no reply/.test(q)) {
    return [
      "Follow-up playbook:",
      " · Day 7: short, polite bump on the same thread. One sentence + the ask.",
      " · Day 14: pivot from coffee chat to async — offer to send 2–3 questions over email instead.",
      " · Day 21: stop. Move them to the back of the pipeline; revisit during deal-news moments.",
    ].join("\n");
  }
  if (/subject|hook/.test(q)) {
    return [
      "Strongest subject-line patterns we see:",
      " 1) `{Shared school} grad — quick question on {team}`",
      " 2) `Loved the {firm} {sector} work — quick question`",
      " 3) `Fellow {school} — 15 min next week?`",
      "",
      "Avoid generic `Coffee chat?` or `Networking request`. They get filtered out.",
    ].join("\n");
  }
  if (/resume|bullets|tailor/.test(q)) {
    return [
      "Resume tightening:",
      " · Lead every bullet with a strong verb (Led, Built, Closed, Modeled, Owned, Drove).",
      " · Quantify every bullet — $ amount, %, or count.",
      " · Re-order bullets per target: deal/transactional ones first for M&A teams.",
      " · For groups like Restructuring or LevFin, surface modeling and credit-analysis bullets up top.",
    ].join("\n");
  }
  if (/reply|response|positive|negative/.test(q)) {
    return [
      "Reply triage:",
      " · Yes/maybe → propose 3 specific 15-min slots within 48 hours; default to their timezone.",
      " · 'Send questions over email' → send 3 sharp, specific, non-Google-able questions.",
      " · 'Not the right person' → ask politely for a 1-line redirect to the right banker.",
      " · No → thank them and ask if it's okay to ping with a fresh question in 6 months.",
    ].join("\n");
  }
  if (/schedule|time|when/.test(q)) {
    return [
      "Send-time guidance (per your timezone):",
      " · Analyst: 7-9 AM",
      " · Associate / VP: 8-10 AM",
      " · Director / MD: 9-11 AM",
      " · Never Friday after 2 PM; never Sunday night; never major holidays.",
    ].join("\n");
  }
  if (/coffee|meeting|chat/.test(q)) {
    return [
      "Coffee chat etiquette:",
      " · 15 minutes max. Be ready to say `Sorry, time's up` yourself.",
      " · Show up with sector POVs and 3 specific questions.",
      " · End with one clear ask (intro, advice, resume review).",
      " · Same-day thank you note. 2-line update 2 weeks later.",
    ].join("\n");
  }
  if (/houlihan|piper|goldman|blair|moelis|evercore|centerview|lazard/.test(q)) {
    return firmSpecificAdvice(q);
  }

  // Default reflective answer
  return [
    "Here's how I'd think about that:",
    " · Tie the ask to a specific deal or sector POV.",
    " · Keep the email under 150 words.",
    " · Always offer one easy out (async questions over email).",
    " · Follow up at 7 days, then 14 — never more than twice.",
    "",
    `You currently have ${queued} emails in the queue and ${sent} already sent. If you want me to draft the next 5 — just say "draft my top 5".`,
  ].join("\n");
}

function topThisWeek(contacts: Contact[], n: number): Contact[] {
  return [...contacts]
    .filter((c) => c.status === "not_contacted")
    .sort((a, b) => {
      const af = (a.fitScore ?? 0) + a.priority * 10;
      const bf = (b.fitScore ?? 0) + b.priority * 10;
      return bf - af;
    })
    .slice(0, n);
}

function firmSpecificAdvice(q: string): string {
  if (q.includes("houlihan")) {
    return "Houlihan Lokey — lead with restructuring or middle-market M&A IQ. They love candidates who can talk credit, capital structure, and stakeholder dynamics. Mention a recent RX situation.";
  }
  if (q.includes("piper")) {
    return "Piper Sandler — healthcare/financial services is the franchise. Bring sub-sector POVs (e.g., MedTech, ins-tech, asset & wealth). Minneapolis HQ — mention coverage focus, not city.";
  }
  if (q.includes("goldman")) {
    return "Goldman — emphasize firm-wide impact, intellectual horsepower, and cross-product fluency. Talk about a recent transaction in your target group, not 'I want GS.'";
  }
  if (q.includes("blair")) {
    return "William Blair — Chicago, middle-market, growth M&A. Talk about a specific industrial or healthcare deal. Chicago network is small and tight — alumni connections matter a lot here.";
  }
  if (q.includes("moelis")) {
    return "Moelis — independent, lean teams, lots of responsibility early. Show ownership in past internships and bring a sharp sector POV.";
  }
  if (q.includes("evercore") || q.includes("centerview") || q.includes("lazard")) {
    return "Elite boutique playbook — extremely high bar on intellectual depth. Bring 2 specific transaction POVs and prepare to defend them. Etiquette matters more here than anywhere else.";
  }
  return "Lead with one specific deal POV that matters to that firm's franchise.";
}
