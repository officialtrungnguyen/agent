import { useCallback, useMemo, useState } from "react";
import type { Contact, OutreachEmail } from "./types";
import { useStore } from "./store/useStore";
import { Sidebar, type View } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { AlumniLedger } from "./components/AlumniLedger";
import { ContactIntelligence } from "./components/ContactIntelligence";
import { ResumePanel } from "./components/ResumePanel";
import { OutreachComposer } from "./components/OutreachComposer";
import { OutreachView } from "./components/OutreachView";
import { Analytics } from "./components/Analytics";
import { Advisor } from "./components/Advisor";
import { Settings } from "./components/Settings";
import { QueueConveyor } from "./components/QueueConveyor";
import { startGoogleOAuth } from "./lib/gmailClient";
import { generateFollowUp, type EmailVariant } from "./lib/ai/email";
import { Modal } from "./components/ui/Modal";

export function App() {
  const s = useStore();
  const [view, setView] = useState<View>("dashboard");
  const [openContact, setOpenContact] = useState<Contact | null>(null);
  const [composerContact, setComposerContact] = useState<Contact | null>(null);
  const [composerVariant, setComposerVariant] = useState<EmailVariant | undefined>(undefined);
  const [composerPreset, setComposerPreset] = useState<{ subject: string; body: string; followUpOf?: string } | null>(null);
  const [reviewEmail, setReviewEmail] = useState<OutreachEmail | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const pending = s.contacts.filter((c) => c.status === "not_contacted").length;
    const queued = s.emails.filter((e) => e.status === "queued" || e.status === "scheduled").length;
    const replied = s.contacts.filter((c) => c.status === "replied" || c.status === "meeting_set").length;
    const noReply = s.contacts.filter((c) => c.status === "no_reply").length;
    return { pending, queued, replied, noReply };
  }, [s.contacts, s.emails]);

  const handleConnectGmail = useCallback(async () => {
    setAuthError(null);
    try {
      const { tokens, profile } = await startGoogleOAuth();
      s.setOauth({ tokens: tokens as never, profile });
      s.setProfile({ ...s.profile, gmailConnected: true, gmailScopeOk: true, email: profile.email || s.profile.email, name: s.profile.name || profile.name, picture: profile.picture });
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  }, [s]);

  const handleDisconnect = useCallback(() => {
    s.setOauth({ tokens: null, profile: null });
    s.setProfile({ ...s.profile, gmailConnected: false, gmailScopeOk: false });
  }, [s]);

  const openCompose = useCallback((c: Contact, variant?: EmailVariant) => {
    setComposerContact(c);
    setComposerVariant(variant);
    setComposerPreset(null);
  }, []);

  const openFollowup = useCallback((c: Contact, original: OutreachEmail, days: 7 | 14) => {
    const fu = generateFollowUp({ contact: c, resume: s.resume, profile: s.profile }, original, days);
    setComposerContact(c);
    setComposerVariant(days === 7 ? "short" : "short");
    setComposerPreset({ subject: fu.subject, body: fu.body, followUpOf: original.id });
  }, [s.resume, s.profile]);

  // mark contact when an email is sent
  const onSent = useCallback((e: OutreachEmail) => {
    s.upsertEmail(e);
    s.logActivity({ contactId: e.contactId, type: "email_sent", text: `Sent: ${e.subject}` });
  }, [s]);

  const onQueued = useCallback((e: OutreachEmail) => {
    s.upsertEmail(e);
    s.updateContact(e.contactId, { status: e.status === "scheduled" ? "scheduled" : "queued" });
    s.logActivity({ contactId: e.contactId, type: "email_scheduled", text: `Queued: ${e.subject}` });
  }, [s]);

  const markContactSent = useCallback((id: string) => {
    s.updateContact(id, { status: "sent", lastOutreachAt: new Date().toISOString() });
  }, [s]);

  const handleImportContacts = useCallback((rows: Partial<Contact>[]) => {
    s.setContacts((prev) => {
      const next = [...prev];
      rows.forEach((r, i) => {
        if (!r.firstName || !r.lastName || !r.firm) return;
        next.unshift({
          id: "imp_" + Date.now().toString(36) + "_" + i,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          firm: r.firm,
          firmGroup: (r.firmGroup as Contact["firmGroup"]) || "Middle Market",
          title: r.title || "Banker",
          seniority: (r.seniority as Contact["seniority"]) || "Associate",
          team: r.team || "M&A",
          coverage: r.coverage || ["Generalist"],
          school: r.school || "Unknown",
          city: r.city || "New York, NY",
          priority: (r.priority as Contact["priority"]) || 3,
          status: "not_contacted",
        });
      });
      return next;
    });
  }, [s]);

  return (
    <div className="h-screen flex bg-graphite-50 text-graphite-900">
      <Sidebar view={view} onChange={setView} metrics={metrics} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          profile={s.profile}
          oauthEmail={s.oauth.profile?.email}
          onConnectGmail={handleConnectGmail}
          onDisconnectGmail={handleDisconnect}
          onRefreshIntel={s.rescore}
        />
        <main className="flex-1 overflow-y-auto scroll-thin px-6 py-5 pb-[280px]">
          {authError && (
            <div className="mb-4 hairline rounded-sharp p-3 bg-red-50 border-red-200 text-red-800 text-[12.5px]">
              OAuth error: {authError}
            </div>
          )}
          {view === "dashboard" && (
            <Dashboard
              contacts={s.contacts}
              emails={s.emails}
              resume={s.resume}
              profile={s.profile}
              onOpenContact={setOpenContact}
              onCompose={(c) => openCompose(c)}
              onSwitchView={(v) => setView(v as View)}
            />
          )}
          {view === "contacts" && (
            <AlumniLedger
              contacts={s.contacts}
              onOpenContact={setOpenContact}
              onCompose={(c) => openCompose(c)}
            />
          )}
          {view === "resume" && (
            <ResumePanel
              resume={s.resume}
              setResume={s.setResume}
              profile={s.profile}
              setProfile={s.setProfile}
            />
          )}
          {view === "outreach" && (
            <OutreachView
              emails={s.emails}
              contacts={s.contacts}
              resume={s.resume}
              profile={s.profile}
              onCompose={(c) => openCompose(c)}
              onSendFollowup={(c, e, d) => openFollowup(c, e, d)}
            />
          )}
          {view === "analytics" && (
            <Analytics contacts={s.contacts} emails={s.emails} onImportContacts={handleImportContacts} />
          )}
          {view === "advisor" && (
            <Advisor contacts={s.contacts} emails={s.emails} resume={s.resume} profile={s.profile} />
          )}
          {view === "settings" && (
            <Settings
              profile={s.profile}
              setProfile={s.setProfile}
              oauthEmail={s.oauth.profile?.email}
              onConnectGmail={handleConnectGmail}
              onDisconnectGmail={handleDisconnect}
            />
          )}
        </main>
      </div>

      <ContactIntelligence
        open={!!openContact}
        contact={openContact}
        onClose={() => setOpenContact(null)}
        resume={s.resume}
        profile={s.profile}
        onCompose={(c, v) => { setOpenContact(null); openCompose(c, v); }}
        onAddNote={s.addNoteToContact}
        onUpdateContact={s.updateContact}
      />

      <OutreachComposer
        open={!!composerContact}
        onClose={() => { setComposerContact(null); setComposerVariant(undefined); setComposerPreset(null); }}
        contact={composerContact}
        resume={s.resume}
        profile={s.profile}
        oauthTokens={s.oauth.tokens}
        presetVariant={composerVariant}
        presetPayload={composerPreset || undefined}
        onQueued={onQueued}
        onSent={onSent}
        markContactSent={markContactSent}
      />

      <QueueConveyor
        emails={s.emails}
        contacts={s.contacts}
        oauthTokens={s.oauth.tokens}
        gmailConnected={s.profile.gmailConnected}
        onEmailUpdate={s.upsertEmail}
        onMarkSent={markContactSent}
        onRemove={s.removeEmail}
        onReview={setReviewEmail}
      />

      <Modal open={!!reviewEmail} onClose={() => setReviewEmail(null)} title="Review Email" size="lg">
        {reviewEmail && (
          <div className="space-y-3">
            <div>
              <div className="micro">// SUBJECT</div>
              <div className="text-[13px] font-medium mt-1">{reviewEmail.subject}</div>
            </div>
            <div>
              <div className="micro">// BODY</div>
              <pre className="whitespace-pre-wrap text-[12.5px] mt-1 hairline rounded-sharp p-3 bg-graphite-50">{reviewEmail.body}</pre>
            </div>
            {reviewEmail.scheduledFor && (
              <div className="micro">Scheduled for {new Date(reviewEmail.scheduledFor).toLocaleString()}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
