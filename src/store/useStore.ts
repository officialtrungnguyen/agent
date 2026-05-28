import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Contact,
  ResumeData,
  UserProfile,
  OutreachEmail,
  ActivityEvent,
  ContactStatus,
} from "../types";
import { CONTACTS } from "../data/contactsData";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";
import { scoreContact } from "../lib/ai/scoring";

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  picture: "",
  gmailConnected: false,
  gmailScopeOk: false,
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York",
  targetRole: "Summer Analyst — M&A / Investment Banking",
  targetClass: "Summer 2027",
  preferredFirms: ["Houlihan Lokey", "Piper Sandler", "Moelis & Company", "William Blair", "Evercore"],
  personalPitch: "Pre-MBA analyst targeting M&A. Strong modeling reps and a track record of leading process workstreams end-to-end.",
};

interface OAuthState {
  tokens: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    scope?: string;
    token_type?: string;
    id_token?: string;
  } | null;
  profile: { email?: string; name?: string; picture?: string } | null;
}

interface Store {
  contacts: Contact[];
  setContacts: (updater: (prev: Contact[]) => Contact[]) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  setContactStatus: (id: string, status: ContactStatus) => void;
  addNoteToContact: (id: string, note: string) => void;
  resume: ResumeData | null;
  setResume: (r: ResumeData | null) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  emails: OutreachEmail[];
  upsertEmail: (e: OutreachEmail) => void;
  removeEmail: (id: string) => void;
  activity: ActivityEvent[];
  logActivity: (e: Omit<ActivityEvent, "id" | "at"> & { at?: string }) => void;
  oauth: OAuthState;
  setOauth: (o: OAuthState) => void;
  rescore: () => void;
}

export function useStore(): Store {
  const [contacts, setContactsState] = useState<Contact[]>(() => {
    const saved = loadJSON<Contact[] | null>(STORAGE_KEYS.contacts, null);
    if (saved && Array.isArray(saved) && saved.length) {
      // merge: keep saved status/notes, refresh other base fields from canonical CONTACTS
      const byId = new Map(saved.map((c) => [c.id, c]));
      return CONTACTS.map((base) => {
        const s = byId.get(base.id);
        if (!s) return base;
        return {
          ...base,
          status: s.status,
          notes: s.notes,
          tags: s.tags ?? base.tags,
          relationshipStars: s.relationshipStars,
          lastOutreachAt: s.lastOutreachAt,
          lastReplyAt: s.lastReplyAt,
          fitScore: s.fitScore,
        };
      });
    }
    return CONTACTS;
  });

  const [resume, setResumeState] = useState<ResumeData | null>(() =>
    loadJSON<ResumeData | null>(STORAGE_KEYS.resume, null)
  );
  const [profile, setProfileState] = useState<UserProfile>(() =>
    loadJSON<UserProfile>(STORAGE_KEYS.profile, defaultProfile)
  );
  const [emails, setEmails] = useState<OutreachEmail[]>(() =>
    loadJSON<OutreachEmail[]>(STORAGE_KEYS.emails, [])
  );
  const [activity, setActivity] = useState<ActivityEvent[]>(() =>
    loadJSON<ActivityEvent[]>(STORAGE_KEYS.activity, [])
  );
  const [oauth, setOauthState] = useState<OAuthState>(() => ({
    tokens: loadJSON<OAuthState["tokens"]>(STORAGE_KEYS.oauthTokens, null),
    profile: loadJSON<OAuthState["profile"]>(STORAGE_KEYS.oauthProfile, null),
  }));

  // Persist
  useEffect(() => saveJSON(STORAGE_KEYS.contacts, contacts), [contacts]);
  useEffect(() => saveJSON(STORAGE_KEYS.resume, resume), [resume]);
  useEffect(() => saveJSON(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => saveJSON(STORAGE_KEYS.emails, emails), [emails]);
  useEffect(() => saveJSON(STORAGE_KEYS.activity, activity.slice(-500)), [activity]);
  useEffect(() => {
    saveJSON(STORAGE_KEYS.oauthTokens, oauth.tokens);
    saveJSON(STORAGE_KEYS.oauthProfile, oauth.profile);
  }, [oauth]);

  // Auto-score whenever resume/profile/contacts identity changes
  useEffect(() => {
    setContactsState((prev) =>
      prev.map((c) => ({ ...c, fitScore: scoreContact(c, resume, profile).score }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, profile.targetRole, profile.personalPitch, profile.preferredFirms.join("|")]);

  // Auto "no_reply" detection after 7 days
  useEffect(() => {
    const now = Date.now();
    setContactsState((prev) =>
      prev.map((c) => {
        if ((c.status === "sent") && c.lastOutreachAt) {
          const days = (now - Date.parse(c.lastOutreachAt)) / (1000 * 60 * 60 * 24);
          if (days >= 7 && !c.lastReplyAt) {
            return { ...c, status: "no_reply" };
          }
        }
        return c;
      })
    );
  }, []);

  const setContacts = useCallback((updater: (prev: Contact[]) => Contact[]) => {
    setContactsState((prev) => updater(prev));
  }, []);
  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    setContactsState((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);
  const setContactStatus = useCallback((id: string, status: ContactStatus) => {
    setContactsState((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);
  const addNoteToContact = useCallback((id: string, note: string) => {
    setContactsState((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, notes: c.notes ? `${c.notes}\n\n${new Date().toLocaleString()}: ${note}` : `${new Date().toLocaleString()}: ${note}` }
          : c
      )
    );
  }, []);

  const setResume = useCallback((r: ResumeData | null) => setResumeState(r), []);
  const setProfile = useCallback((p: UserProfile) => setProfileState(p), []);
  const upsertEmail = useCallback((e: OutreachEmail) => {
    setEmails((prev) => {
      const idx = prev.findIndex((x) => x.id === e.id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = e;
        return copy;
      }
      return [...prev, e];
    });
  }, []);
  const removeEmail = useCallback((id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
  }, []);
  const logActivity = useCallback((e: Omit<ActivityEvent, "id" | "at"> & { at?: string }) => {
    setActivity((prev) => [
      ...prev,
      {
        ...e,
        id: "a_" + Math.random().toString(36).slice(2, 10),
        at: e.at || new Date().toISOString(),
      },
    ]);
  }, []);
  const setOauth = useCallback((o: OAuthState) => setOauthState(o), []);
  const rescore = useCallback(() => {
    setContactsState((prev) =>
      prev.map((c) => ({ ...c, fitScore: scoreContact(c, resume, profile).score }))
    );
  }, [resume, profile]);

  return useMemo(
    () => ({
      contacts,
      setContacts,
      updateContact,
      setContactStatus,
      addNoteToContact,
      resume,
      setResume,
      profile,
      setProfile,
      emails,
      upsertEmail,
      removeEmail,
      activity,
      logActivity,
      oauth,
      setOauth,
      rescore,
    }),
    [contacts, setContacts, updateContact, setContactStatus, addNoteToContact, resume, setResume, profile, setProfile, emails, upsertEmail, removeEmail, activity, logActivity, oauth, setOauth, rescore]
  );
}
