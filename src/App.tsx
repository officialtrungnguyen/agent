import { differenceInDays, format } from "date-fns";
import { useEffect, useMemo } from "react";
import { nanoid } from "nanoid";
import { contactsData } from "@/contactsData";
import { ContactIntelligence } from "@/components/ContactIntelligence";
import { ContactsDashboard } from "@/components/ContactsDashboard";
import { GmailQueuePanel } from "@/components/GmailQueuePanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { OutreachComposer } from "@/components/OutreachComposer";
import { ResumeIntelligencePanel } from "@/components/ResumeIntelligencePanel";
import { StrategyAdvisor } from "@/components/StrategyAdvisor";
import { TopTargetsPanel } from "@/components/TopTargetsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { generateEmailDraft } from "@/lib/emailGeneration";
import { computeFitScore, getTopTargets } from "@/lib/scoring";
import type {
  Contact,
  EmailDraft,
  FiltersState,
  GmailSession,
  ResumeProfile,
  ScheduledQueueItem,
  StrategyMessage,
} from "@/types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

function hydrateContacts(initialResume: ResumeProfile | null) {
  return contactsData.map((contact) => ({
    ...contact,
    fitScore: computeFitScore(contact, initialResume),
  }));
}

export default function App() {
  const [resumeProfile, setResumeProfile] = useLocalStorageState<ResumeProfile | null>("bb-resume-profile", null);
  const [contacts, setContacts] = useLocalStorageState<Contact[]>("bb-contacts", hydrateContacts(resumeProfile));
  const [filters, setFilters] = useLocalStorageState<FiltersState>("bb-filters", {
    query: "",
    firm: "all",
    status: "all",
    priority: "all",
    school: "all",
    view: "table",
  });
  const [selectedContactId, setSelectedContactId] = useLocalStorageState<string | null>(
    "bb-selected-contact-id",
    contacts[0]?.id ?? null,
  );
  const [currentDraft, setCurrentDraft] = useLocalStorageState<EmailDraft | null>("bb-current-draft", null);
  const [draftsById, setDraftsById] = useLocalStorageState<Record<string, EmailDraft>>("bb-drafts-by-id", {});
  const [queue, setQueue] = useLocalStorageState<ScheduledQueueItem[]>("bb-queue", []);
  const [strategyMessages, setStrategyMessages] = useLocalStorageState<StrategyMessage[]>("bb-strategy-chat", []);
  const [gmailSession, setGmailSession] = useLocalStorageState<GmailSession | null>("bb-gmail-session", null);

  const contactsById = useMemo(
    () =>
      contacts.reduce<Record<string, Contact>>((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {}),
    [contacts],
  );

  const selectedContact = selectedContactId ? contactsById[selectedContactId] ?? null : null;
  const topTargets = useMemo(() => getTopTargets(contacts, 20), [contacts]);

  useEffect(() => {
    setContacts((previous) =>
      previous.map((contact) => ({
        ...contact,
        fitScore: computeFitScore(contact, resumeProfile),
      })),
    );
  }, [resumeProfile, setContacts]);

  function updateContactStatus(contactId: string, status: Contact["status"]) {
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              status,
              lastOutreach:
                status === "sent" || status === "scheduled" || status === "queued"
                  ? new Date().toISOString()
                  : contact.lastOutreach,
              lastInteraction: new Date().toISOString(),
            }
          : contact,
      ),
    );
  }

  function queueDraft(draft: EmailDraft) {
    setDraftsById((prev) => ({ ...prev, [draft.id]: draft }));
    setQueue((previous) => [
      {
        id: nanoid(),
        draftId: draft.id,
        contactId: draft.contactId,
        status: "queued",
      },
      ...previous,
    ]);
    updateContactStatus(draft.contactId, "queued");
  }

  function mergeImportedContacts(imported: Contact[]) {
    setContacts(imported.map((contact) => ({ ...contact, fitScore: computeFitScore(contact, resumeProfile) })));
  }

  function addFollowUpDraft(days: 7 | 14) {
    if (!selectedContact) return;
    const followup = generateEmailDraft(selectedContact, resumeProfile, "relationship_first");
    const dayReference = selectedContact.lastOutreach
      ? `${differenceInDays(new Date(), new Date(selectedContact.lastOutreach))}`
      : `${days}`;
    const body = [
      `Hi ${selectedContact.firstName},`,
      "",
      `Wanted to follow up on my note from ${dayReference} days ago in case it got buried.`,
      "I remain very interested in learning more about your team and would be grateful for a quick coffee chat at your convenience.",
      "",
      "Thank you again for considering.",
      "",
      "Best,",
      resumeProfile?.personalPitch || "Candidate targeting investment banking",
    ].join("\n");
    const followUpDraft: EmailDraft = {
      ...followup,
      id: nanoid(),
      body,
      chosenSubject: `Following up on my note regarding ${selectedContact.teamDesk}`,
      subjectOptions: [
        `Quick follow-up on ${selectedContact.teamDesk} outreach`,
        `Following up: coffee chat request`,
      ],
    };
    setCurrentDraft(followUpDraft);
  }

  function updateSelectedContactNotes(value: string) {
    if (!selectedContact) return;
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === selectedContact.id ? { ...contact, notes: value, lastInteraction: new Date().toISOString() } : contact,
      ),
    );
  }

  function updateRelationshipStrength(strength: Contact["relationshipStrength"]) {
    if (!selectedContact) return;
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === selectedContact.id
          ? { ...contact, relationshipStrength: strength, lastInteraction: new Date().toISOString() }
          : contact,
      ),
    );
  }

  function recordSuccessfulSend(contactId: string, status: Contact["status"]) {
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              status,
              lastOutreach: new Date().toISOString(),
              lastInteraction: new Date().toISOString(),
              outreachHistory: [
                {
                  id: nanoid(),
                  contactId,
                  timestamp: new Date().toISOString(),
                  subject: "Queued outreach sent",
                  body: "Message sent via Gmail integration.",
                  direction: "outbound",
                  channel: "gmail",
                },
                ...contact.outreachHistory,
              ],
            }
          : contact,
      ),
    );
  }

  const noReplyCandidates = contacts.filter((contact) => {
    if (!contact.lastOutreach) return false;
    const days = differenceInDays(new Date(), new Date(contact.lastOutreach));
    return (contact.status === "sent" || contact.status === "scheduled") && days >= 7;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1800px] px-4 py-4">
        <header className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">BulgeBracket.ai</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">
            Investment Banking Recruiting AI Command Center
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            End-to-end alumni intelligence, resume-aware personalization, real Gmail delivery, and pipeline automation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">240+ Alumni Contacts</Badge>
            <Badge variant="success">Real Gmail OAuth + API</Badge>
            <Badge variant="warning">7-Day Follow-Up Automation</Badge>
          </div>
        </header>

        <div className="space-y-4">
          <MetricsPanel contacts={contacts} />

          <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <ContactsDashboard
              contacts={contacts}
              filters={filters}
              onFiltersChange={setFilters}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              onContactsBulkMerge={mergeImportedContacts}
              onContactStatusUpdate={updateContactStatus}
            />
            <ContactIntelligence apiBaseUrl={apiBaseUrl} contact={selectedContact} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <ResumeIntelligencePanel
              apiBaseUrl={apiBaseUrl}
              selectedContact={selectedContact}
              resumeProfile={resumeProfile}
              onUpdateResume={setResumeProfile}
            />
            <OutreachComposer
              contact={selectedContact}
              resumeProfile={resumeProfile}
              currentDraft={currentDraft}
              onDraftChange={setCurrentDraft}
              onQueueDraft={queueDraft}
            />
            <TopTargetsPanel contacts={topTargets} onSelectContact={setSelectedContactId} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <GmailQueuePanel
              apiBaseUrl={apiBaseUrl}
              queue={queue}
              draftsById={draftsById}
              contactsById={contactsById}
              resumeProfile={resumeProfile}
              gmailSession={gmailSession}
              onGmailSessionChange={setGmailSession}
              onQueueChange={setQueue}
              onContactUpdateAfterSend={recordSuccessfulSend}
            />
            <StrategyAdvisor
              apiBaseUrl={apiBaseUrl}
              resumeProfile={resumeProfile}
              contacts={contacts}
              messages={strategyMessages}
              onMessagesChange={setStrategyMessages}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>7-Day No-Reply Follow-Up Engine</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addFollowUpDraft(7)} disabled={!selectedContact}>
                    Generate 7-Day Follow-up
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addFollowUpDraft(14)} disabled={!selectedContact}>
                    Generate 14-Day Follow-up
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {noReplyCandidates.length === 0 && <p className="text-sm text-slate-500">No stale outreach currently flagged.</p>}
                {noReplyCandidates.slice(0, 12).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between rounded-md border border-slate-800 p-2">
                    <div>
                      <p className="text-sm text-slate-100">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-amber-300">
                        No reply ({differenceInDays(new Date(), new Date(contact.lastOutreach || new Date()))} days)
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedContactId(contact.id)}>
                      Review
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relationship CRM</CardTitle>
                {selectedContact && (
                  <p className="text-xs text-slate-500">
                    {selectedContact.firstName} {selectedContact.lastName} · Last interaction{" "}
                    {selectedContact.lastInteraction ? format(new Date(selectedContact.lastInteraction), "MMM d, h:mm a") : "—"}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedContact ? (
                  <>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateRelationshipStrength(star as Contact["relationshipStrength"])}
                          className={`rounded border px-2 py-1 text-sm ${
                            selectedContact.relationshipStrength >= star
                              ? "border-amber-400 bg-amber-300 text-slate-950"
                              : "border-slate-700 text-slate-400"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={selectedContact.notes}
                      onChange={(event) => updateSelectedContactNotes(event.target.value)}
                      placeholder="Store notes, response quality, and next-step details..."
                    />
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Outreach History</p>
                      <div className="max-h-40 space-y-2 overflow-y-auto">
                        {selectedContact.outreachHistory.length === 0 && (
                          <p className="text-xs text-slate-500">No outreach logs yet.</p>
                        )}
                        {selectedContact.outreachHistory.map((entry) => (
                          <div key={entry.id} className="rounded border border-slate-800 p-2">
                            <p className="text-xs text-slate-200">{entry.subject}</p>
                            <p className="text-[11px] text-slate-500">{format(new Date(entry.timestamp), "MMM d, h:mm a")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a contact to update relationship strength and notes.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
