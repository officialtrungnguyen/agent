import { AppState } from "../types";
import { contactsData } from "../contactsData";

const KEY = "bulgebracket.ai.state.v1";

const defaultProfile = {
  name: "Candidate",
  email: "",
  school: "University of Michigan",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  targetRole: "Investment Banking Summer Analyst",
  personalPitch:
    "I am a finance student focused on M&A, valuation, and thoughtful relationship-building across coverage teams."
};

export function initialAppState(): AppState {
  return {
    contacts: contactsData,
    userProfile: defaultProfile,
    queue: [],
    history: [],
    gmail: {
      connected: false
    }
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialAppState();
    const parsed = JSON.parse(raw) as AppState;
    const mergedContacts = contactsData.map((contact) => {
      const existing = parsed.contacts?.find((candidate) => candidate.id === contact.id);
      return existing ? { ...contact, ...existing } : contact;
    });

    return {
      ...initialAppState(),
      ...parsed,
      contacts: mergedContacts,
      userProfile: {
        ...defaultProfile,
        ...parsed.userProfile
      }
    };
  } catch {
    return initialAppState();
  }
}

export function saveAppState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function exportState(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bulgebracket-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function contactsToCsv(state: AppState) {
  const headers = [
    "Name",
    "Firm",
    "Title",
    "Team",
    "School",
    "Priority",
    "Status",
    "Last Outreach",
    "Relationship"
  ];
  const rows = state.contacts.map((contact) => [
    `${contact.firstName} ${contact.lastName}`,
    contact.firm,
    contact.title,
    contact.team,
    contact.school,
    contact.priority,
    contact.status,
    contact.lastOutreach ?? "",
    String(contact.relationshipStrength)
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
