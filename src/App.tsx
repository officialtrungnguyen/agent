import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { contactsData } from "./contactsData";
import { Contact, ContactFilters, GmailAuthState, QueueItem, ResumeProfile, ResumeVariant, StrategyMessage, TimelineEvent } from "./types";
import {
  buildInitialStrategyMessages,
  buildMetricsSnapshot,
  buildStrategyReply,
  buildTopTargets,
  computeFitScore,
  exportContactsCsv,
  filterContacts,
  toTimelineEvent,
} from "./utils";
import { DashboardHeader } from "./components/DashboardHeader";
import { SmartAlumniLedger } from "./components/SmartAlumniLedger";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { ResumeIntelligencePanel } from "./components/ResumeIntelligencePanel";
import { OutreachComposer } from "./components/OutreachComposer";
import { SchedulerQueue } from "./components/SchedulerQueue";
import { MetricsDashboard } from "./components/MetricsDashboard";
import { StrategyAdvisor } from "./components/StrategyAdvisor";

const usePersistentState = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

const defaultFilters: ContactFilters = {
  search: "",
  firm: "",
  school: "",
  status: "",
  priority: "",
  coverage: "",
};

const toBase64 = (value: string) => window.btoa(unescape(encodeURIComponent(value)));

const App = () => {
  const [contacts, setContacts] = usePersistentState<Contact[]>("bbai-contacts", contactsData);
  const [filters, setFilters] = usePersistentState<ContactFilters>("bbai-filters", defaultFilters);
  const [view, setView] = usePersistentState<"table" | "kanban">("bbai-view", "table");
  const [selectedId, setSelectedId] = usePersistentState<string>("bbai-selected-contact", contactsData[0].id);
  const [resume, setResume] = usePersistentState<ResumeProfile | null>("bbai-resume", null);
  const [targetRole, setTargetRole] = usePersistentState<string>("bbai-target-role", "Investment Banking Summer Analyst");
  const [personalPitch, setPersonalPitch] = usePersistentState<string>(
    "bbai-personal-pitch",
    "I am pursuing investment banking roles where I can combine strong technical reps with polished client communication and real transaction curiosity.",
  );
  const [resumeVariants, setResumeVariants] = usePersistentState<Record<string, ResumeVariant>>("bbai-resume-variants", {});
  const [timeline, setTimeline] = usePersistentState<TimelineEvent[]>("bbai-timeline", []);
  const [queue, setQueue] = usePersistentState<QueueItem[]>("bbai-queue", []);
  const [strategyMessages, setStrategyMessages] = usePersistentState<StrategyMessage[]>(
    "bbai-strategy-messages",
    buildInitialStrategyMessages(),
  );
  const [gmailAuth, setGmailAuth] = useState<GmailAuthState>({ connected: false });
  const [notice, setNotice] = useState<string>("Offline intelligence ready. Connect Gmail to unlock real send + schedule.");
  const [prefillBody, setPrefillBody] = useState<string | null>(null);

  const enrichedContacts = useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        fitScore: computeFitScore(contact, resume),
      })),
    [contacts, resume],
  );

  const filteredContacts = useMemo(
    () =>
      filterContacts(enrichedContacts, filters).sort(
        (left, right) => right.fitScore - left.fitScore || right.relationshipStrength - left.relationshipStrength,
      ),
    [enrichedContacts, filters],
  );

  const selectedContact =
    enrichedContacts.find((contact) => contact.id === selectedId) ?? enrichedContacts[0];
  const latestVariant = resumeVariants[selectedContact.id] ?? null;
  const selectedTimeline = timeline
    .filter((event) => event.contactId === selectedContact.id)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  const metrics = useMemo(() => buildMetricsSnapshot(enrichedContacts, timeline, queue), [enrichedContacts, queue, timeline]);
  const topTargets = useMemo(() => buildTopTargets(enrichedContacts), [enrichedContacts]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const updateContact = (contactId: string, updater: (contact: Contact) => Contact) => {
    setContacts((current) => current.map((contact) => (contact.id === contactId ? updater(contact) : contact)));
  };

  const syncAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status");
      if (!response.ok) return;
      const payload = (await response.json()) as GmailAuthState;
      setGmailAuth(payload);
      if (payload.connected) {
        setNotice(`Gmail live and ready for ${payload.email}.`);
      }
    } catch {
      setNotice("Offline intelligence ready. Gmail server not connected yet.");
    }
  };

  const refreshQueue = async () => {
    try {
      const response = await fetch("/api/gmail/queue");
      if (!response.ok) return;
      const payload = (await response.json()) as Array<QueueItem & { serverId?: string }>;
      setQueue((current) => {
        const merged = [...current];
        payload.forEach((serverItem) => {
          const index = merged.findIndex(
            (item) => item.serverId === serverItem.serverId || item.id === serverItem.id,
          );
          if (index >= 0) merged[index] = { ...merged[index], ...serverItem };
          else merged.push(serverItem);
        });
        return merged;
      });
    } catch {
      setNotice("Unable to refresh the live queue. Local queue remains available.");
    }
  };

  useEffect(() => {
    void syncAuthStatus();
    void refreshQueue();

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "bulgebracket-auth") return;
      if (event.data.success) {
        setNotice("Gmail connected successfully.");
        void syncAuthStatus();
      } else {
        setNotice("Gmail OAuth did not complete. You can retry in a new tab.");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const connectGmail = () => {
    const url = `/api/auth/google?origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(url, "bulgebracket-gmail-auth", "width=620,height=760");
    if (!popup) {
      window.open(url, "_blank", "noopener,noreferrer");
      setNotice("Popup blocked. OAuth opened in a new tab instead.");
    }
  };

  const addTimelineEvent = (event: TimelineEvent) => {
    setTimeline((current) => [event, ...current]);
  };

  const markContactStatus = (contactId: string, status: Contact["status"]) => {
    updateContact(contactId, (contact) => ({
      ...contact,
      status,
      lastOutreach: new Date().toISOString(),
    }));
    addTimelineEvent(
      toTimelineEvent(contactId, status === "Replied" ? "reply" : "follow-up", `Status updated to ${status}`, `${status} recorded from the intelligence panel.`),
    );
  };

  const addNote = (contactId: string, note: string) => {
    updateContact(contactId, (contact) => ({
      ...contact,
      notes: [note, ...contact.notes],
    }));
    addTimelineEvent(toTimelineEvent(contactId, "note", "CRM note added", note));
  };

  const handleImportCsv = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      complete: (result) => {
        const imported = result.data
          .filter((row) => row.firstName && row.lastName && row.firm)
          .map((row, index) => ({
            id: `import-${Date.now()}-${index}`,
            firstName: row.firstName,
            lastName: row.lastName,
            firm: row.firm,
            title: row.title || "Investment Banking Analyst",
            location: row.location || "New York",
            teamDesk: row.teamDesk || "Generalist",
            coverageSectors: (row.coverage || row.coverageSectors || "Generalist").split("/").map((item) => item.trim()),
            school: row.school || "Unknown school",
            priority: (row.priority as Contact["priority"]) || "Tier 3",
            relationshipStrength: Number(row.relationshipStrength || 1),
            email: row.email || `${row.firstName}.${row.lastName}@${row.firm.replace(/\s+/g, "").toLowerCase()}.com`,
            status: (row.status as Contact["status"]) || "Not Contacted",
            lastOutreach: row.lastOutreach || null,
            fitScore: 0,
            sharedInterests: [row.school || "School tie"],
            styleNotes: ["Imported from CSV. Add live notes after first touchpoint."],
            icebreakers: [
              `I noticed your path from ${row.school || "your school"} into ${row.firm} and wanted to learn more about the team.`,
              `I am especially interested in ${row.teamDesk || "your group"} and would value your perspective.`,
              `I would appreciate any advice on standing out for the recruiting process.`,
            ],
            recentTransactions: [],
            notes: [],
          }));

        setContacts((current) => [...imported, ...current]);
        setNotice(`Imported ${imported.length} new contacts from CSV.`);
      },
    });
  };

  const buildAttachments = (attachTailoredResume: boolean) => {
    if (attachTailoredResume && latestVariant) {
      const content = `Tailored one-pager for ${selectedContact.firstName} ${selectedContact.lastName}\n${latestVariant.bullets
        .map((bullet) => `- ${bullet}`)
        .join("\n")}`;
      return [
        {
          filename: `${selectedContact.firm.replace(/\s+/g, "-").toLowerCase()}-tailored-one-pager.txt`,
          mimeType: "text/plain",
          contentBase64: toBase64(content),
        },
      ];
    }

    if (resume) {
      const attachmentResume = resume as ResumeProfile & { attachmentMimeType?: string; attachmentContentBase64?: string };
      return [
        {
          filename: attachmentResume.attachmentContentBase64 ? resume.fileName : `${resume.fileName.replace(/\.[^.]+$/, "")}-resume-export.txt`,
          mimeType: attachmentResume.attachmentMimeType ?? "text/plain",
          contentBase64: attachmentResume.attachmentContentBase64 ?? toBase64(resume.originalText),
        },
      ];
    }

    return [];
  };

  const dispatchEmail = async (
    mode: "queue" | "send" | "schedule",
    payload: {
      variant: QueueItem["variant"];
      subject: string;
      body: string;
      scheduledFor: string;
      attachTailoredResume: boolean;
    },
  ) => {
    const newQueueItem: QueueItem = {
      id: `queue-${Date.now()}`,
      contactId: selectedContact.id,
      contactName: `${selectedContact.firstName} ${selectedContact.lastName}`,
      subject: payload.subject,
      body: payload.body,
      variant: payload.variant,
      scheduledFor: payload.scheduledFor,
      status: mode === "queue" ? "Queued" : mode === "schedule" ? "Scheduled" : "Sent",
      attachmentName: payload.attachTailoredResume
        ? latestVariant?.title ?? "Tailored one-pager"
        : resume?.fileName,
    };

    if (mode === "queue") {
      setQueue((current) => [newQueueItem, ...current]);
      updateContact(selectedContact.id, (contact) => ({
        ...contact,
        status: "Queued",
        lastOutreach: new Date().toISOString(),
      }));
      addTimelineEvent(toTimelineEvent(selectedContact.id, "email", "Added to queue", payload.subject));
      setNotice(`Queued outreach for ${selectedContact.firstName} ${selectedContact.lastName}.`);
      return;
    }

    const response = await fetch(mode === "send" ? "/api/gmail/send" : "/api/gmail/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: selectedContact.email,
        subject: payload.subject,
        body: payload.body,
        scheduledFor: payload.scheduledFor,
        label: payload.variant,
        contactId: selectedContact.id,
        contactName: `${selectedContact.firstName} ${selectedContact.lastName}`,
        attachments: buildAttachments(payload.attachTailoredResume),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setNotice(result.error ?? "Gmail action failed. Keep using offline queue while you reconnect.");
      setQueue((current) => [{ ...newQueueItem, status: "Failed", error: result.error }, ...current]);
      return;
    }

    const syncedItem = {
      ...newQueueItem,
      serverId: result.id,
      status: result.status ?? newQueueItem.status,
    };
    setQueue((current) => [syncedItem, ...current.filter((item) => item.id !== syncedItem.id)]);
    updateContact(selectedContact.id, (contact) => ({
      ...contact,
      status: mode === "schedule" ? "Scheduled" : "Sent",
      lastOutreach: new Date().toISOString(),
    }));
    addTimelineEvent(
      toTimelineEvent(
        selectedContact.id,
        "email",
        mode === "schedule" ? "Scheduled Gmail draft" : "Sent Gmail outreach",
        payload.subject,
      ),
    );
    setNotice(
      mode === "schedule"
        ? `Scheduled Gmail send for ${selectedContact.firstName} ${selectedContact.lastName}.`
        : `Sent live Gmail message to ${selectedContact.firstName} ${selectedContact.lastName}.`,
    );
    await refreshQueue();
  };

  const executePipeline = async () => {
    const queuedItems = queue.filter((item) => item.status === "Queued");
    for (const item of queuedItems) {
      const contact = enrichedContacts.find((entry) => entry.id === item.contactId);
      if (!contact) continue;
      setSelectedId(contact.id);
      await fetch("/api/gmail/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.email,
          subject: item.subject,
          body: item.body,
          scheduledFor: item.scheduledFor,
          label: item.variant,
          contactId: item.contactId,
          contactName: item.contactName,
          attachments: [],
        }),
      });
    }

    setQueue((current) =>
      current.map((item) => (item.status === "Queued" ? { ...item, status: "Scheduled" } : item)),
    );
    setNotice("Queued pipeline pushed into the live Gmail scheduler.");
    await refreshQueue();
  };

  const sendQueuedItemNow = async (item: QueueItem) => {
    const contact = enrichedContacts.find((entry) => entry.id === item.contactId);
    if (!contact) return;
    const response = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: contact.email,
        subject: item.subject,
        body: item.body,
        contactId: item.contactId,
        contactName: item.contactName,
        attachments: [],
      }),
    });
    if (response.ok) {
      setQueue((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "Sent" } : entry)));
      updateContact(item.contactId, (entry) => ({ ...entry, status: "Sent", lastOutreach: new Date().toISOString() }));
      addTimelineEvent(toTimelineEvent(item.contactId, "email", "Sent from queue panel", item.subject));
      setNotice(`Live Gmail send completed for ${item.contactName}.`);
      await refreshQueue();
    }
  };

  const removeQueueItem = (id: string) => setQueue((current) => current.filter((item) => item.id !== id));

  const handleStrategyMessage = (message: string) => {
    const userMessage: StrategyMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: StrategyMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: buildStrategyReply(message, enrichedContacts, resume, queue),
      createdAt: new Date().toISOString(),
    };
    setStrategyMessages((current) => [...current, userMessage, assistantMessage]);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
      <DashboardHeader
        gmailAuth={gmailAuth}
        metrics={metrics}
        resume={resume ? { ...resume, targetRole, personalPitch } : resume}
        timezone={timezone}
        onConnectGmail={connectGmail}
        onRefreshQueue={() => void refreshQueue()}
        onExportCsv={() => exportContactsCsv(enrichedContacts)}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">{notice}</div>

      <SmartAlumniLedger
        contacts={filteredContacts}
        selectedId={selectedContact.id}
        filters={filters}
        view={view}
        onSelect={setSelectedId}
        onChangeFilters={setFilters}
        onChangeView={setView}
        onImportCsv={handleImportCsv}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ContactIntelligence
          contact={selectedContact}
          timeline={selectedTimeline}
          onAddNote={addNote}
          onUseFollowUp={setPrefillBody}
          onMarkStatus={markContactStatus}
        />
        <ResumeIntelligencePanel
          resume={resume}
          selectedContact={selectedContact}
          latestVariant={latestVariant}
          targetRole={targetRole}
          personalPitch={personalPitch}
          onTargetRoleChange={setTargetRole}
          onPersonalPitchChange={setPersonalPitch}
          onSaveResume={(value) => {
            setResume(value);
            setTargetRole(value.targetRole);
            setPersonalPitch(value.personalPitch);
            setNotice(`Resume intelligence updated from ${value.fileName}.`);
          }}
          onSaveVariant={(variant) => {
            setResumeVariants((current) => ({ ...current, [variant.contactId]: variant }));
            setNotice(`Tailored one-pager generated for ${selectedContact.firm}.`);
          }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <OutreachComposer
          contact={selectedContact}
          resume={resume}
          latestVariant={latestVariant}
          prefillBody={prefillBody}
          onClearPrefill={() => setPrefillBody(null)}
          onDispatch={(mode, payload) => void dispatchEmail(mode, payload)}
        />
        <StrategyAdvisor messages={strategyMessages} topTargets={topTargets} onSendMessage={handleStrategyMessage} />
      </div>

      <MetricsDashboard metrics={metrics} topTargets={topTargets} />
      <SchedulerQueue
        queue={queue}
        onExecutePipeline={() => void executePipeline()}
        onRefresh={() => void refreshQueue()}
        onSendNow={(item) => void sendQueuedItemNow(item)}
        onRemove={removeQueueItem}
      />
    </div>
  );
};

export default App;
