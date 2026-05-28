// Lightweight typed localStorage helper with safety guards.

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota — silently ignore (premium fallback feel)
  }
}

export const STORAGE_KEYS = {
  contacts: "bb.contacts.v1",
  resume: "bb.resume.v1",
  profile: "bb.profile.v1",
  emails: "bb.emails.v1",
  activity: "bb.activity.v1",
  oauthTokens: "bb.oauth.tokens.v1",
  oauthProfile: "bb.oauth.profile.v1",
} as const;
