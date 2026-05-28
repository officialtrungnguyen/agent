import type { GmailAuthState, OutreachRecord, QueuedEmail, ResumeProfile } from "../types";

const keys = {
  resume: "bb.resume.v1",
  queue: "bb.queue.v1",
  outreach: "bb.outreach.v1",
  auth: "bb.gmailAuth.v1",
  target: "bb.target.v1"
};

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getResume: () => read<ResumeProfile | undefined>(keys.resume, undefined),
  setResume: (resume: ResumeProfile) => write(keys.resume, resume),
  getQueue: () => read<QueuedEmail[]>(keys.queue, []),
  setQueue: (queue: QueuedEmail[]) => write(keys.queue, queue),
  getOutreach: () => read<OutreachRecord[]>(keys.outreach, []),
  setOutreach: (records: OutreachRecord[]) => write(keys.outreach, records),
  getAuth: () => read<GmailAuthState>(keys.auth, {}),
  setAuth: (auth: GmailAuthState) => write(keys.auth, auth)
};
