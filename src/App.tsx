import { useEffect, useMemo, useState } from "react";
import { Download, LayoutGrid, List, Plus, RefreshCw, Upload } from "lucide-react";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { ContactsTable } from "./components/ContactsTable";
import { DashboardHeader } from "./components/DashboardHeader";
import { KanbanBoard } from "./components/KanbanBoard";
import { OutreachComposer } from "./components/OutreachComposer";
import { PipelineQueuePanel } from "./components/PipelineQueuePanel";
import { ResumeIntelligencePanel } from "./components/ResumeIntelligencePanel";
import { StrategyAdvisorPanel } from "./components/StrategyAdvisorPanel";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  analyticsSnapshot,
  bestSendSlot,
  buildContactIntel,
  computeFitScore,
  generateEmailDraft,
  generateFollowUpDraft,
  strategyAdvisor,
  topTargetsThisWeek
} from "./lib/ai";
import { api } from "./lib/api";
import { storage } from "./lib/storage";
import { daysSince } from "./lib/utils";
import { seedContacts } from "./data/contactsData";
import type {
  Contact,
  ContactStatus,
  GmailAuthState,
  OutreachEmail,
  PipelineItem,
  Priority,
  ResumeData,
  StrategyAdvice,
  UserProfile
} from "./types";

const STORAGE_KEYS = {
  contacts: "bb.contacts",
  profile: "bb.profile",
  gmail: "bb.gmail",
  emails: "bb.emails",
  queue: "bb.queue",
  advice: "bb.advice"
} as const;

const defaultProfile: UserProfile = {
  fullName: "Your Name",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
};

const defaultGmail: GmailAuthState = { isAuthed: false };

const setContactStatus = (contacts: Contact[], contactId: string, status: ContactStatus) =>
  contacts.map((contact) => {
    if (contact.id !== contactId) {
      return contact;
    }
    return {
      ...contact,
      status,
      lastOutreachAt: status === "sent" || status === "scheduled" ? new Date().toISOString() : contact.lastOutreachAt
    };
  });

const upsertEmail = (emails: OutreachEmail[], email: OutreachEmail) => {
  const existing = emails.find((item) => item.id === email.id);
  if (!existing) {
    return [email, ...emails];
  }
  return emails.map((item) => (item.id === email.id ? email : item));
};

const toCsv = (contacts: Contact[]) => {
  const header = ["firstName", "lastName", "email", "firm", "title", "teamDesk", "school", "priority", "status"];
  const rows = contacts.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.firm,
      contact.title,
      contact.teamDesk,
      contact.school,
      contact.priority,
      contact.status
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
};

const fromCsv = (csvText: string, existing: Contact[]) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return existing;
  }

  const imported = lines.slice(1).map((line, index) => {
    const cells = line
      .split(",")
      .map((cell) => cell.replaceAll(/^"|"$/g, "").replaceAll('""', '"'));

    const source = existing[index % existing.length];
    if (!source) {
      return undefined;
    }

    return {
      ...source,
      id: `import-${source.id}-${index}`,
      firstName: cells[0] || source.firstName,
      lastName: cells[1] || source.lastName,
      email: cells[2] || source.email,
      firm: cells[3] || source.firm,
      title: (cells[4] as Contact["title"]) || source.title,
      teamDesk: cells[5] || source.teamDesk,
      school: cells[6] || source.school,
      priority: (cells[7] as Priority) || source.priority,
      status: (cells[8] as ContactStatus) || source.status
    };
  });

  return imported.filter((item): item is Contact => Boolean(item));
};

const App = () => {
  const [contacts, setContacts] = useState<Contact[]>(() => storage.get(STORAGE_KEYS.contacts, seedContacts));
  const [profile, setProfile] = useState<UserProfile>(() => storage.get(STORAGE_KEYS.profile, defaultProfile));
  const [gmailState, setGmailState] = useState<GmailAuthState>(() => storage.get(STORAGE_KEYS.gmail, defaultGmail));
  const [emails, setEmails] = useState<OutreachEmail[]>(() => storage.get(STORAGE_KEYS.emails, []));
  const [queueItems, setQueueItems] = useState<PipelineItem[]>(() => storage.get(STORAGE_KEYS.queue, []));
  const [latestAdvice, setLatestAdvice] = useState<StrategyAdvice | undefined>(() =>
    storage.get<StrategyAdvice | undefined>(STORAGE_KEYS.advice, undefined)
  );

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [firmFilter, setFirmFilter] = useState("all");
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(contacts[0]?.id);
  const [noteInput, setNoteInput] = useState("");
  const [oauthNotice, setOauthNotice] = useState("");

  useEffect(() => {
    storage.set(STORAGE_KEYS.contacts, contacts);
  }, [contacts]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.profile, profile);
  }, [profile]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.gmail, gmailState);
  }, [gmailState]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.emails, emails);
  }, [emails]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.queue, queueItems);
  }, [queueItems]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.advice, latestAdvice);
  }, [latestAdvice]);

  useEffect(() => {
    const updated = contacts.map((contact) => {
      const staleNoReply = (contact.status === "sent" || contact.status === "no_reply") && daysSince(contact.lastOutreachAt) >= 7;
      return staleNoReply ? { ...contact, status: "no_reply" as const } : contact;
    });

    const changed = updated.some((contact, index) => contact.status !== contacts[index]?.status);
    if (changed) {
      setContacts(updated);
    }
  }, [contacts]);

  useEffect(() => {
    const listener = async (event: MessageEvent) => {
      if (typeof event.data !== "object" || event.data === null || !("type" in event.data)) {
        return;
      }
      if ((event.data as { type: string }).type !== "oauth-code") {
        return;
      }
      const code = (event.data as { code?: string }).code;
      if (!code) {
        return;
      }
      try {
        const auth = await api.exchangeAuthCode(code);
        setGmailState(auth);
        setOauthNotice("Gmail connected successfully.");
      } catch (error) {
        setOauthNotice(`OAuth failed: ${(error as Error).message}`);
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const fitScores = useMemo(
    () =>
      contacts.reduce<Record<string, number>>((acc, contact) => {
        acc[contact.id] = computeFitScore(contact, profile);
        return acc;
      }, {}),
    [contacts, profile]
  );

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return contacts
      .filter((contact) => {
        if (firmFilter !== "all" && contact.firm !== firmFilter) {
          return false;
        }
        if (statusFilter !== "all" && contact.status !== statusFilter) {
          return false;
        }
        if (priorityFilter !== "all" && contact.priority !== priorityFilter) {
          return false;
        }
        if (!query) {
          return true;
        }
        const searchable = `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} ${contact.teamDesk}`.toLowerCase();
        return searchable.includes(query);
      })
      .sort((a, b) => (fitScores[b.id] ?? 0) - (fitScores[a.id] ?? 0));
  }, [contacts, firmFilter, fitScores, priorityFilter, searchQuery, statusFilter]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? filteredContacts[0],
    [contacts, filteredContacts, selectedContactId]
  );

  const selectedIntel = useMemo(
    () => (selectedContact ? buildContactIntel(selectedContact) : undefined),
    [selectedContact]
  );

  const analytics = useMemo(() => analyticsSnapshot(emails), [emails]);

  const topTargets = useMemo(() => topTargetsThisWeek(contacts, profile), [contacts, profile]);

  const contactsById = useMemo(
    () =>
      contacts.reduce<Record<string, Contact>>((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {}),
    [contacts]
  );

  const onConnectGmail = async () => {
    try {
      const { url } = await api.getGoogleAuthUrl();
      const popup = window.open(url, "bb-google-oauth", "width=480,height=720");
      if (!popup) {
        window.open(url, "_blank", "noopener,noreferrer");
        setOauthNotice("Popup blocked. OAuth opened in new tab.");
      } else {
        setOauthNotice("OAuth popup opened. Complete sign-in to activate Gmail send/schedule.");
      }
    } catch (error) {
      setOauthNotice(`OAuth URL error: ${(error as Error).message}`);
    }
  };

  const saveDraftToQueue = (draft: OutreachEmail, includeTailoredResume: boolean) => {
    const attachedResumeText =
      includeTailoredResume && selectedContact
        ? profile.resume?.tailoredBulletsByDesk[selectedContact.teamDesk]?.join("\n") || profile.resume?.parsedText
        : undefined;

    const enrichedDraft = {
      ...draft,
      attachedResumeText,
      status: "queued" as const
    };

    setQueueItems((prev) => [
      {
        id: crypto.randomUUID(),
        contactId: draft.contactId,
        action: "send_now",
        emailDraft: enrichedDraft,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);

    setEmails((prev) => upsertEmail(prev, enrichedDraft));
    setContacts((prev) => setContactStatus(prev, draft.contactId, "queued"));
  };

  const queueFromIntel = () => {
    if (!selectedContact) {
      return;
    }
    const generated = generateEmailDraft(selectedContact, profile, "deal_referenced");
    saveDraftToQueue(
      {
        id: crypto.randomUUID(),
        contactId: selectedContact.id,
        subject: generated.subjectOptions[0] ?? "Coffee chat request",
        body: generated.draft,
        variant: "deal_referenced",
        createdAt: new Date().toISOString(),
        status: "queued"
      },
      true
    );
  };

  const sendNow = async (item: PipelineItem) => {
    const contact = contactsById[item.contactId];
    if (!contact) {
      return;
    }

    try {
      const response = await api.sendEmail(item.emailDraft, gmailState, contact.email);
      const newStatus = response.status === "sent" ? "sent" : "queued";
      setEmails((prev) =>
        upsertEmail(prev, {
          ...item.emailDraft,
          status: newStatus
        })
      );
      setContacts((prev) => setContactStatus(prev, contact.id, newStatus === "sent" ? "sent" : "queued"));
      setQueueItems((prev) => prev.filter((queueItem) => queueItem.id !== item.id));
    } catch (error) {
      setOauthNotice(`Send failed: ${(error as Error).message}`);
      setEmails((prev) => upsertEmail(prev, { ...item.emailDraft, status: "failed" }));
    }
  };

  const autoSchedule = async (item: PipelineItem, scheduledFor: string) => {
    const contact = contactsById[item.contactId];
    if (!contact) {
      return;
    }

    try {
      await api.scheduleEmail(item.emailDraft, gmailState, contact.email, scheduledFor);
      setEmails((prev) =>
        upsertEmail(prev, {
          ...item.emailDraft,
          status: "scheduled",
          scheduledFor
        })
      );
      setContacts((prev) => setContactStatus(prev, contact.id, "scheduled"));
      setQueueItems((prev) => prev.filter((queueItem) => queueItem.id !== item.id));
    } catch (error) {
      setOauthNotice(`Scheduling failed: ${(error as Error).message}`);
    }
  };

  const executePipeline = async () => {
    for (const item of queueItems) {
      const contact = contactsById[item.contactId];
      if (!contact) {
        continue;
      }
      const scheduledFor = bestSendSlot(contact.title, profile.timezone);
      // Use true scheduling for batch execution so it can run unattended.
      await autoSchedule(item, scheduledFor);
    }
  };

  const onGenerateAdvice = (prompt: string) => {
    const generated = strategyAdvisor(profile, contacts, analytics.sent);
    setLatestAdvice({
      ...generated,
      summary: `${generated.summary} Prompt context: ${prompt}`
    });
  };

  const selectedOutreachHistory = emails.filter((email) => email.contactId === selectedContact?.id);

  const addContactNote = () => {
    const trimmed = noteInput.trim();
    if (!trimmed || !selectedContact) {
      return;
    }
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedContact.id
          ? { ...contact, notes: [trimmed, ...contact.notes], lastInteractionAt: new Date().toISOString() }
          : contact
      )
    );
    setNoteInput("");
  };

  const setManualStatus = (status: ContactStatus) => {
    if (!selectedContact) {
      return;
    }
    setContacts((prev) => setContactStatus(prev, selectedContact.id, status));
  };

  const generateFollowUp = (days: 7 | 14) => {
    if (!selectedContact) {
      return;
    }

    const followUpBody = generateFollowUpDraft(selectedContact, days);
    saveDraftToQueue(
      {
        id: crypto.randomUUID(),
        contactId: selectedContact.id,
        subject: `Following up on my prior note - ${selectedContact.teamDesk}`,
        body: followUpBody,
        variant: "relationship_first",
        createdAt: new Date().toISOString(),
        status: "queued"
      },
      false
    );
  };

  const onExportCsv = () => {
    const csv = toCsv(contacts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bulgebracket-contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImportCsv = (file: File) => {
    void file.text().then((text) => {
      const imported = fromCsv(text, contacts);
      if (imported.length > 0) {
        setContacts(imported);
      }
    });
  };

  const setResume = (resume: ResumeData) => {
    setProfile((prev) => ({
      ...prev,
      resume
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-[270px] text-slate-100">
      <DashboardHeader
        totalContacts={contacts.length}
        topTargets={topTargets.length}
        gmailState={gmailState}
        onConnectGmail={onConnectGmail}
      />

      <main className="space-y-4 px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
              <List className="mr-1 h-3.5 w-3.5" /> Table
            </Button>
            <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>
              <LayoutGrid className="mr-1 h-3.5 w-3.5" /> Kanban
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 border border-slate-700 px-2.5 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300 hover:border-slate-500">
              <Upload className="h-3.5 w-3.5" /> Import CSV
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImportCsv(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {oauthNotice && <p className="text-xs uppercase tracking-[0.14em] text-amber-300">{oauthNotice}</p>}

        {viewMode === "table" ? (
          <ContactsTable
            contacts={filteredContacts}
            fitScores={fitScores}
            selectedContactId={selectedContact?.id}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            firmFilter={firmFilter}
            onSearchQueryChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onFirmFilterChange={setFirmFilter}
            onSelectContact={setSelectedContactId}
          />
        ) : (
          <KanbanBoard contacts={filteredContacts} onSelect={setSelectedContactId} />
        )}

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <ContactIntelligence
              contact={selectedContact}
              intel={selectedIntel}
              fitScore={selectedContact ? fitScores[selectedContact.id] : 0}
              onQueueOutreach={queueFromIntel}
            />
            <OutreachComposer contact={selectedContact} profile={profile} onSaveDraft={saveDraftToQueue} />
            <ResumeIntelligencePanel resume={profile.resume} selectedDesk={selectedContact?.teamDesk} onResumeChange={setResume} />
            <AnalyticsPanel snapshot={analytics} />
          </div>

          <div className="space-y-4">
            <StrategyAdvisorPanel
              latestAdvice={latestAdvice}
              topTargets={topTargets.map((contact) => `${contact.firstName} ${contact.lastName}`)}
              onGenerateAdvice={onGenerateAdvice}
            />

            <Card>
              <CardHeader>
                <CardTitle>Contact CRM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedContact ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge>{selectedContact.status}</Badge>
                      <Badge>{selectedContact.priority}</Badge>
                      <Badge>{selectedContact.email}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setManualStatus("replied")}>
                        Mark Replied
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setManualStatus("sent")}>
                        Mark Sent
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setManualStatus("no_reply")}>
                        Mark No Reply
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => generateFollowUp(7)}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" /> 7-Day Follow-up
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateFollowUp(14)}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" /> 14-Day Follow-up
                      </Button>
                    </div>

                    <div className="space-y-2 border border-slate-800 p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Notes</p>
                      <div className="space-y-1 text-sm text-slate-300">
                        {selectedContact.notes.map((note) => (
                          <p key={note}>• {note}</p>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={noteInput} onChange={(event) => setNoteInput(event.target.value)} placeholder="Add interaction note" />
                        <Button size="sm" onClick={addContactNote}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="border border-slate-800 p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Outreach History</p>
                      <div className="max-h-[180px] space-y-2 overflow-auto">
                        {selectedOutreachHistory.length === 0 && <p className="text-sm text-slate-500">No outreach history yet.</p>}
                        {selectedOutreachHistory.map((email) => (
                          <div key={email.id} className="border border-slate-900 p-2">
                            <p className="text-xs text-slate-400">{new Date(email.createdAt).toLocaleString()}</p>
                            <p className="text-sm text-slate-200">{email.subject}</p>
                            <p className="text-xs text-slate-500">{email.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a contact to manage CRM notes and follow-ups.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PipelineQueuePanel
        items={queueItems}
        contactsById={contactsById}
        profile={profile}
        gmail={gmailState}
        onSendNow={(item) => {
          void sendNow(item);
        }}
        onAutoSchedule={(item, scheduledFor) => {
          void autoSchedule(item, scheduledFor);
        }}
        onExecutePipeline={() => {
          void executePipeline();
        }}
      />
    </div>
  );
};

export default App;
