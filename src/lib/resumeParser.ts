import type { UserResume } from "@/types";

/**
 * Resume text parser — heuristic, no LLM required. Extracts headline, summary,
 * achievements (bullets), skills, education, experience.
 * Robust to plain-text dumps from PDFs.
 */

export function parseResumeText(rawText: string, fileName?: string): UserResume {
  const text = rawText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter((l) => l.length > 0);

  const headline = nonEmpty[0] ?? "Aspiring Investment Banking Analyst";

  const educationSection = sliceSection(text, ["education", "academic"]);
  const experienceSection = sliceSection(text, ["experience", "work experience", "professional experience"]);
  const skillsSection = sliceSection(text, ["skills", "technical skills", "competencies"]);

  const skills = (skillsSection ?? "")
    .split(/[,\n•\u2022]/)
    .map((s) => s.replace(/^[•\-\u2022\s]+/, "").trim())
    .filter((s) => s.length > 1 && s.length < 60)
    .slice(0, 24);

  const bulletRegex = /(?:^|\n)\s*(?:[•\-\u2022]|\*)\s*(.+)/g;
  const bullets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = bulletRegex.exec(text)) !== null) {
    const b = m[1]?.trim();
    if (b && b.length > 8 && b.length < 400) bullets.push(b);
  }

  const education: UserResume["education"] = [];
  if (educationSection) {
    const eduLines = educationSection.split("\n").filter((l) => l.trim().length > 0);
    for (let i = 0; i < eduLines.length; i++) {
      const l = eduLines[i]!;
      if (/(university|college|school|institute|wharton|harvard|stern|booth|kellogg|sloan|mendoza|haas|mccombs|ross|tepper|olin|carlson|kelley)/i.test(l)) {
        const next = eduLines[i + 1] ?? "";
        const gradMatch = (l + " " + next).match(/(20\d{2})/);
        const degreeMatch = (l + " " + next).match(/(B\.?S\.?|B\.?A\.?|M\.?B\.?A\.?|Bachelor|Master|Ph\.?D\.?)[^\n,]*/i);
        education.push({
          school: l,
          degree: degreeMatch?.[0] ?? "Bachelor of Science",
          graduation: gradMatch?.[1] ?? "",
        });
      }
    }
  }

  const experience: UserResume["experience"] = [];
  if (experienceSection) {
    const blocks = experienceSection.split(/\n{2,}/).filter((b) => b.trim().length > 20);
    for (const block of blocks.slice(0, 6)) {
      const blLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const company = blLines[0] ?? "Company";
      const role = blLines[1] ?? "Role";
      const dates = blLines.find((l) => /\b(20\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(l)) ?? "";
      const blockBullets = blLines.filter((l) => /^[•\-\u2022*]/.test(l)).map((l) => l.replace(/^[•\-\u2022*\s]+/, ""));
      experience.push({ company, role, dates, bullets: blockBullets });
    }
  }

  const summary =
    nonEmpty
      .find((l) => /summary|objective|profile/i.test(l) === false && l.length > 80 && l.length < 400) ??
    `${headline} · Targeting Investment Banking Analyst roles at top firms.`;

  return {
    rawText: text,
    fileName,
    updatedAt: new Date().toISOString(),
    summary,
    headline,
    targetRole: "Summer Investment Banking Analyst",
    targetFirms: [],
    achievements: bullets.slice(0, 24),
    skills,
    education,
    experience,
  };
}

function sliceSection(text: string, headers: string[]): string | null {
  const lower = text.toLowerCase();
  for (const h of headers) {
    const idx = lower.indexOf(h);
    if (idx >= 0) {
      const nextHeaderIdx = findNextHeader(lower, idx + h.length);
      return text.slice(idx + h.length, nextHeaderIdx === -1 ? text.length : nextHeaderIdx);
    }
  }
  return null;
}

const HEADERS = [
  "education",
  "experience",
  "professional experience",
  "work experience",
  "skills",
  "technical skills",
  "competencies",
  "projects",
  "leadership",
  "awards",
  "honors",
  "certifications",
];

function findNextHeader(lower: string, from: number): number {
  let best = -1;
  for (const h of HEADERS) {
    const i = lower.indexOf(`\n${h}`, from + 1);
    if (i > -1 && (best === -1 || i < best)) best = i;
  }
  return best;
}
