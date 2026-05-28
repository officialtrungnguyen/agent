import type { ResumeData } from "../../types";

/**
 * Heuristic resume parser. Works on text extracted from a PDF or a pasted resume.
 * Returns structured ResumeData. Always produces a result — never fails.
 */
export function parseResume(rawText: string, fileName?: string): ResumeData {
  const text = rawText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const candidateName = detectName(lines);
  const candidateEmail = (text.match(/[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0];
  const candidatePhone = (text.match(/(\+?\d{1,2}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/) || [])[0];

  const sectionMap = splitSections(lines);

  const education = parseEducation(sectionMap.education || []);
  const experiences = parseExperiences(sectionMap.experience || []);
  const skills = parseSkills(sectionMap.skills || []);
  const achievements = parseAchievements(
    sectionMap.achievements || sectionMap.awards || sectionMap.leadership || []
  );

  return {
    rawText: text,
    fileName,
    uploadedAt: new Date().toISOString(),
    candidate: {
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone,
    },
    education,
    experiences,
    skills,
    achievements,
  };
}

function detectName(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 6)) {
    if (line.includes("@")) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Z][a-zA-Z'-]+\.?$/.test(w))) {
      return line;
    }
  }
  return undefined;
}

const SECTION_KEYWORDS: Record<string, string[]> = {
  education: ["education", "academics"],
  experience: ["experience", "professional experience", "work experience", "internships"],
  skills: ["skills", "technical skills", "core skills", "competencies"],
  achievements: ["achievements", "awards", "honors"],
  leadership: ["leadership", "activities", "extracurricular"],
  awards: ["awards"],
};

function splitSections(lines: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[:•-]/g, "").trim();
    let matched: string | null = null;
    for (const [key, kws] of Object.entries(SECTION_KEYWORDS)) {
      if (kws.some((k) => lower === k || lower.startsWith(k + " ") || (lower.length < 30 && lower.includes(k)))) {
        matched = key;
        break;
      }
    }
    if (matched) {
      current = matched;
      out[current] = out[current] || [];
      continue;
    }
    if (current) {
      out[current] = out[current] || [];
      out[current].push(line);
    }
  }
  return out;
}

function parseEducation(lines: string[]): ResumeData["education"] {
  const out: ResumeData["education"] = [];
  let current: ResumeData["education"][number] | null = null;
  for (const line of lines) {
    if (
      /University|College|Institute|School|MIT|UCLA|USC|NYU|Wharton|Booth|Kellogg|Ross|Haas|Stern|Tepper|Stanford|Harvard|Yale|Princeton|Columbia|Cornell|Brown|Dartmouth|Duke|Notre Dame|Virginia|Michigan|Berkeley|Georgetown|Chicago|Northwestern|Carnegie|Vanderbilt|Emory|Rice|Tufts|Hopkins/.test(line)
    ) {
      if (current) out.push(current);
      current = { school: line };
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch) current.gradYear = yearMatch[0];
    } else if (current) {
      if (/B\.?S\.?|B\.?A\.?|Bachelor|M\.?B\.?A\.?|Master|MS\b|MA\b/.test(line)) {
        current.degree = (current.degree ? current.degree + "; " : "") + line;
      }
      const gpa = line.match(/GPA[:\s]+([0-9.]+)/i);
      if (gpa) current.gpa = gpa[1];
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch && !current.gradYear) current.gradYear = yearMatch[0];
    }
  }
  if (current) out.push(current);
  return out;
}

function parseExperiences(lines: string[]): ResumeData["experiences"] {
  const out: ResumeData["experiences"] = [];
  let current: ResumeData["experiences"][number] | null = null;
  for (const line of lines) {
    const isBullet = /^[•\-\*▪]/.test(line) || (current && /^[a-z]/.test(line));
    if (isBullet && current) {
      current.bullets.push(line.replace(/^[•\-\*▪]\s*/, "").trim());
    } else {
      if (current) out.push(current);
      const parts = line.split(/\s{2,}|\t|,|\u2013|\u2014| - /).map((s) => s.trim()).filter(Boolean);
      current = {
        company: parts[0] || line,
        title: parts[1] || "",
        dates: parts.slice(2).join(" "),
        bullets: [],
      };
    }
  }
  if (current) out.push(current);
  return out;
}

function parseSkills(lines: string[]): string[] {
  const joined = lines.join(", ");
  return joined
    .split(/[,•·;\u2022]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length < 40);
}

function parseAchievements(lines: string[]): string[] {
  return lines.map((l) => l.replace(/^[•\-\*▪]\s*/, "").trim()).filter(Boolean);
}

export function topResumeBullets(r: ResumeData | null, n = 5): string[] {
  if (!r) return [];
  const all = (r.experiences || []).flatMap((e) => e.bullets || []);
  return all
    .map((b) => ({ b, s: (b.length > 40 ? 1 : 0) + (/(led|built|closed|owned|drove|modeled|generated|saved|grew|raised|deal|m&a|valuation|lbo|ipo|client|million|billion|\$)/i.test(b) ? 5 : 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.b);
}

export function tailorBullet(bullet: string, contact: { firm: string; team: string; coverage: string[] }): string {
  const sector = contact.coverage[0];
  if (!sector) return bullet;
  if (bullet.toLowerCase().includes(sector.toLowerCase())) return bullet;
  return `${bullet} — directly relevant to ${contact.firm}'s ${sector} coverage.`;
}
