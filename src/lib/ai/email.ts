import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../../types";

export type EmailVariant = "short" | "relationship" | "deal" | "aggressive";

interface Inputs {
  contact: Contact;
  resume: ResumeData | null;
  profile: UserProfile;
}

function candidateName(p: UserProfile, r: ResumeData | null): string {
  return p.name || r?.candidate?.name || "[Your Name]";
}

function candidateSchool(r: ResumeData | null): string | null {
  return r?.education?.[0]?.school || null;
}

function topBullet(r: ResumeData | null): string | null {
  if (!r) return null;
  const all = (r.experiences || []).flatMap((e) => e.bullets || []);
  const scored = all
    .map((b) => ({ b, s: b.length + (/(led|built|closed|owned|drove|modeled|generated|deal|m&a|valuation|lbo|ipo|client)/i.test(b) ? 30 : 0) }))
    .sort((a, b) => b.s - a.s);
  return scored[0]?.b || r.achievements?.[0] || null;
}

function topExp(r: ResumeData | null): string | null {
  if (!r) return null;
  const e = r.experiences?.[0];
  if (!e) return null;
  return `${e.title} at ${e.company}`;
}

function freshestDeal(c: Contact): string | null {
  const d = (c.recentDeals || [])[0];
  if (!d) return null;
  return d.title;
}

function sharedSchool(c: Contact, r: ResumeData | null): string | null {
  const my = candidateSchool(r);
  if (!my) return null;
  const a = simplify(my);
  const b = simplify(c.school);
  if (!a || !b) return null;
  if (a === b || a.includes(b) || b.includes(a)) return c.school;
  return null;
}

function simplify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/the |university|college/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateSubject(c: Contact, r: ResumeData | null, p: UserProfile, variant: EmailVariant): string {
  const school = sharedSchool(c, r);
  switch (variant) {
    case "short":
      return school ? `${school} grad — quick question on ${c.team.split("—")[0].trim()}` : `Quick question on ${c.firm}'s ${c.team}`;
    case "relationship":
      return school ? `Fellow ${shortSchool(school)} — 15 min next week?` : `Curious about your path to ${c.firm}`;
    case "deal":
      return `Loved the ${c.firm} ${c.coverage[0]} work — quick question`;
    case "aggressive":
      return `${p.targetRole || "Investment Banking"} — 15 min chat?`;
  }
}

function shortSchool(s: string): string {
  return s.replace(/\s*\(.*?\)/, "").replace(/University|College/g, "").trim();
}

function variantBody(args: Inputs, variant: EmailVariant): string {
  const { contact: c, resume, profile } = args;
  const me = candidateName(profile, resume);
  const mySchool = candidateSchool(resume);
  const myExp = topExp(resume);
  const myBullet = topBullet(resume);
  const school = sharedSchool(c, resume);
  const role = profile.targetRole || "an investment banking analyst role";
  const dealHook = freshestDeal(c);

  const sectorHook = c.coverage[0];

  switch (variant) {
    case "short": {
      const opener = school
        ? `Hi ${c.firstName}, I'm ${me}, ${mySchool ? `a ${shortSchool(mySchool)} student ` : ""}targeting ${role}.`
        : `Hi ${c.firstName}, I'm ${me}, exploring ${role} and have been following your work in ${sectorHook}.`;
      const body =
        `${opener}\n\n` +
        `I admire what you've built on the ${c.team} team at ${c.firm}${dealHook ? ` — especially the recent ${dealHook}` : ""}.` +
        ` ${myExp ? `I'm currently a ${myExp},` : "I'm currently building deal experience,"} and would love 15 minutes to learn how you'd approach breaking into your group.\n\n` +
        `If easier, I'm happy to send 2–3 specific questions over email. Either way, thank you for considering.\n\n` +
        `Best,\n${me}`;
      return body;
    }
    case "relationship": {
      const opener = school
        ? `Hi ${c.firstName}, I'm ${me} — a fellow ${shortSchool(school)} student targeting ${role}.`
        : `Hi ${c.firstName}, I'm ${me}, a student exploring ${role}.`;
      const body =
        `${opener}\n\n` +
        `Your path to ${c.title} at ${c.firm} stood out to me, particularly your work in ${c.coverage.slice(0, 2).join(" and ")}.` +
        ` ${myBullet ? `For context — ${truncate(myBullet, 180)}` : "I'm currently building modeling and deal-process reps."} ` +
        `Would you be open to a 15-minute call in the next two weeks? I'd value any advice you have on positioning for ${c.firm} and the ${c.team} group specifically.\n\n` +
        `Grateful for your time, and happy to work around your calendar.\n\n` +
        `Best,\n${me}`;
      return body;
    }
    case "deal": {
      const opener = dealHook
        ? `Hi ${c.firstName}, I read up on your team's recent work — the ${dealHook} caught my attention.`
        : `Hi ${c.firstName}, I've been studying ${c.firm}'s ${sectorHook} franchise and your team's positioning stood out.`;
      const body =
        `${opener}\n\n` +
        `I'm ${me}${mySchool ? ` (${shortSchool(mySchool)})` : ""}, targeting ${role}.` +
        ` ${myExp ? `I'm currently a ${myExp}` : "I'm currently sharpening modeling reps"} and have been digging into ${sectorHook} valuations.` +
        ` Would you be open to 15 minutes to walk through how you think about the sector and what makes a strong candidate for the ${c.team} team?\n\n` +
        `Even one or two pointers would be hugely appreciated.\n\n` +
        `Best,\n${me}`;
      return body;
    }
    case "aggressive": {
      const opener = school
        ? `Hi ${c.firstName}, fellow ${shortSchool(school)} alum here — ${me}, targeting ${role}.`
        : `Hi ${c.firstName}, I'm ${me} — going hard on ${role} recruiting and ${c.firm} is at the top of my list.`;
      const body =
        `${opener}\n\n` +
        `I've done my homework on the ${c.team} group${dealHook ? `, including your recent ${dealHook}` : ""}, and I think it's the strongest fit for me on the Street.` +
        ` ${myBullet ? `Quick proof: ${truncate(myBullet, 180)}` : "Happy to send a one-pager that backs that up."}\n\n` +
        `Could we grab 15 minutes this week or next? I'll come prepared with specific, non-Google-able questions and a clear ask.\n\n` +
        `Thank you for considering.\n\n` +
        `Best,\n${me}`;
      return body;
    }
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
}

export function generateEmail(args: Inputs, variant: EmailVariant): { subject: string; body: string } {
  const subject = generateSubject(args.contact, args.resume, args.profile, variant);
  const body = variantBody(args, variant);
  return { subject, body };
}

export function generateAllVariants(args: Inputs): Array<{ variant: EmailVariant; subject: string; body: string }> {
  return (["short", "relationship", "deal", "aggressive"] as EmailVariant[]).map((v) => ({
    variant: v,
    ...generateEmail(args, v),
  }));
}

export function generateFollowUp(
  args: Inputs,
  original: Pick<OutreachEmail, "subject" | "body" | "sentAt" | "scheduledFor" | "createdAt">,
  days: 7 | 14
): { subject: string; body: string } {
  const { contact: c, resume, profile } = args;
  const me = candidateName(profile, resume);
  const subject = original.subject.startsWith("Re: ") ? original.subject : `Re: ${original.subject}`;
  const opener = days === 7
    ? `Hi ${c.firstName}, gently floating this back to the top of your inbox.`
    : `Hi ${c.firstName}, one more polite nudge — totally understand if the timing isn't right.`;
  const body =
    `${opener}\n\n` +
    `I know your calendar is packed. If a 15-minute call doesn't work, I'd be grateful for any quick written pointers on how to position for the ${c.team} group at ${c.firm}.\n\n` +
    `Either way — thank you for considering, and best of luck with deals in flight.\n\n` +
    `Best,\n${me}`;
  return { subject, body };
}
