import type { ResumeProfile, ResumeExperience } from "@/types";

const FINANCE_SKILLS = [
  "financial modeling", "dcf", "lbo", "valuation", "comparable companies", "comps",
  "merger model", "accretion", "dilution", "three-statement", "excel", "powerpoint",
  "bloomberg", "capital iq", "factset", "pitchbook", "python", "sql", "vba", "tableau",
  "due diligence", "m&a", "leveraged buyout", "equity research", "fp&a", "accounting",
  "private equity", "venture capital", "restructuring", "credit analysis", "fixed income",
  "derivatives", "portfolio management", "deal execution", "cap table",
];

const SCHOOL_HINTS = [
  "university", "college", "institute", "school of", "wharton", "stern", "ross",
  "mcintire", "kelley", "marshall", "haas", "mccombs", "kenan", "goizueta",
];

function findEmail(text: string): string {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : "";
}
function findPhone(text: string): string {
  const m = text.match(/(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return m ? m[0] : "";
}
function findGpa(text: string): string {
  const m = text.match(/gpa[:\s]*([0-3]?\.\d{1,2}|4\.0{1,2})/i) || text.match(/\b([0-3]\.\d{2})\s*\/?\s*4\.0/);
  return m ? m[1] : "";
}
function findGradYear(text: string): string {
  const m = text.match(/(?:class of|graduat\w*|expected|'?)\s*(20[12]\d)/i) || text.match(/\b(20[23]\d)\b/);
  return m ? m[1] : "";
}
function findSchool(lines: string[]): string {
  for (const l of lines) {
    const low = l.toLowerCase();
    if (SCHOOL_HINTS.some((h) => low.includes(h)) && l.length < 90) {
      return l.replace(/\s{2,}/g, " ").trim();
    }
  }
  return "";
}
function findName(lines: string[]): string {
  // First non-empty line that looks like a name (2–4 words, mostly letters).
  for (const l of lines.slice(0, 6)) {
    const t = l.trim();
    if (
      t &&
      /^[A-Za-z][A-Za-z.'-]+(\s+[A-Za-z][A-Za-z.'-]+){1,3}$/.test(t) &&
      !/@|\d|university|college|resume|cv/i.test(t)
    ) {
      return t;
    }
  }
  return "";
}

function extractSkills(text: string): string[] {
  const low = text.toLowerCase();
  const found = FINANCE_SKILLS.filter((s) => low.includes(s));
  return Array.from(new Set(found)).slice(0, 12);
}

function extractAchievements(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    const isBullet = /^[•\-*▪◦‣·]/.test(l);
    const quantified = /(\$|%|\d{2,}|million|billion|bps)/i.test(l);
    if ((isBullet || quantified) && l.length > 24 && l.length < 240) {
      out.push(l.replace(/^[•\-*▪◦‣·]\s*/, "").trim());
    }
  }
  // Prefer quantified bullets first.
  out.sort((a, b) => Number(/(\$|%|\d)/.test(b)) - Number(/(\$|%|\d)/.test(a)));
  return Array.from(new Set(out)).slice(0, 8);
}

function extractExperience(lines: string[]): ResumeExperience[] {
  const exps: ResumeExperience[] = [];
  let current: ResumeExperience | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    const hasDate = /(20[01]\d|19\d\d)\s*[-–to]+\s*(20[12]\d|present)/i.test(l) || /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+20\d\d/i.test(l);
    const isBullet = /^[•\-*▪◦‣·]/.test(l);
    if (hasDate && !isBullet && l.length < 110) {
      if (current) exps.push(current);
      const dateMatch = l.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*)?(20[01]\d|19\d\d)\s*[-–to]+\s*(present|20[12]\d)/i);
      current = {
        company: l.replace(dateMatch?.[0] ?? "", "").replace(/[|,]\s*$/, "").trim() || "Experience",
        role: "",
        dates: dateMatch?.[0] ?? "",
        bullets: [],
      };
    } else if (current && isBullet) {
      current.bullets.push(l.replace(/^[•\-*▪◦‣·]\s*/, "").trim());
    } else if (current && !current.role && l.length < 80 && !isBullet) {
      current.role = l;
    }
  }
  if (current) exps.push(current);
  return exps.slice(0, 5);
}

/** Parse raw resume text into a structured profile (offline, heuristic AI parse). */
export function parseResume(text: string, fileName?: string, fileDataUrl?: string): ResumeProfile {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u0000/g, "")).filter((l) => l !== undefined);
  const compact = lines.map((l) => l.trim());
  const school = findSchool(compact);

  return {
    rawText: text,
    fileName,
    fileDataUrl,
    uploadedAt: Date.now(),
    name: findName(compact),
    email: findEmail(text),
    phone: findPhone(text),
    school,
    gradYear: findGradYear(text),
    gpa: findGpa(text),
    major: detectMajor(text),
    targetRole: "Investment Banking Analyst",
    targetFirms: [],
    personalPitch: "",
    skills: extractSkills(text),
    achievements: extractAchievements(compact),
    experience: extractExperience(compact),
  };
}

function detectMajor(text: string): string {
  const m = text.match(/(?:major|b\.?s\.?|b\.?a\.?|bachelor[^,\n]*in)\s*[:,]?\s*([A-Za-z &]{3,40})/i);
  if (m) return m[1].trim();
  const known = ["finance", "economics", "accounting", "business", "mathematics", "computer science", "statistics"];
  const low = text.toLowerCase();
  const f = known.find((k) => low.includes(k));
  return f ? f.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

/**
 * Naive in-browser text extraction for PDFs that embed text streams. Pulls
 * readable runs from the raw bytes — good enough to seed the parser; users can
 * always paste/edit text. Never throws.
 */
export function extractPdfText(bytes: Uint8Array): string {
  try {
    let latin = "";
    for (let i = 0; i < bytes.length; i++) latin += String.fromCharCode(bytes[i]);
    const chunks: string[] = [];
    // Text shown via (..) Tj  and [..] TJ operators.
    const re = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*T[jJ]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(latin)) !== null) {
      const s = m[1].replace(/\\([()\\])/g, "$1").replace(/\\\d{3}/g, " ");
      if (s.trim()) chunks.push(s);
    }
    const text = chunks.join(" ").replace(/\s{2,}/g, " ");
    // If we got almost nothing useful, signal empty so UI prompts a paste.
    return /[a-z]{3,}/i.test(text) ? text : "";
  } catch {
    return "";
  }
}

const EMPTY_RESUME: ResumeProfile = {
  rawText: "",
  name: "",
  email: "",
  phone: "",
  school: "",
  gradYear: "",
  gpa: "",
  major: "",
  targetRole: "Investment Banking Analyst",
  targetFirms: [],
  personalPitch: "",
  skills: [],
  achievements: [],
  experience: [],
};

export function emptyResume(): ResumeProfile {
  return { ...EMPTY_RESUME, targetFirms: [], skills: [], achievements: [], experience: [] };
}
