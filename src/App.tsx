import { Download, Filter, Mail, RefreshCcw, ShieldCheck, Upload } from 'lucide-react';
    import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
    import { firmList, schoolList } from './contactsData';
    import { ContactIntelligence } from './components/ContactIntelligence';
    import { MetricsPanel } from './components/MetricsPanel';
    import { OutreachComposer } from './components/OutreachComposer';
    import { QueuePanel } from './components/QueuePanel';
    import { ResumePanel } from './components/ResumePanel';
    import { StrategyAdvisor } from './components/StrategyAdvisor';
    import { Badge } from './components/ui/badge';
    import { Button } from './components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
    import { Input } from './components/ui/input';
    import { ScrollArea } from './components/ui/scroll-area';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
    import {
      buildTailoredBullets,
      computeFitScore,
      formatRelativeOutreach,
      getAttachmentPayload,
      getAutoStatus,
      getContactName,
      getOptimalSendTime,
      isDue,
      sortByWorkflow,
    } from './lib/recruiting';
    import { usePersistentAppState } from './lib/storage';
    import { downloadTextFile, encodeCsv, fileToBase64, parseCsv, uid } from './lib/utils';
    import type { Contact, QueueItem, ResumeParseResponse } from './types';

    function App() {
      const [state, setState] = usePersistentAppState();
      const [composerOpen, setComposerOpen] = useState(false);
      const [busyQueueIds, setBusyQueueIds] = useState<Record<string, boolean>>({});
      const importRef = useRef<HTMLInputElement | null>(null);

      const selectedContact = state.contacts.find((contact) => contact.id === state.selectedContactId);
      const composerContact = state.contacts.find((contact) => contact.id === state.composerContactId);

      const displayContacts = useMemo(
        () => state.contacts.map((contact) => ({ ...contact, status: getAutoStatus(contact) })),
        [state.contacts],
      );

      const filteredContacts = useMemo(() => {
        return [...displayContacts]
          .filter((contact) => {
            const haystack = `${getContactName(contact)} ${contact.firm} ${contact.team} ${contact.school} ${contact.coverageSectors.join(' ')}`.toLowerCase();
            const matchesSearch = haystack.includes(state.filters.search.toLowerCase());
            const matchesFirm = state.filters.firm === 'All' || contact.firm === state.filters.firm;
            const matchesSchool = state.filters.school === 'All' || contact.school === state.filters.school;
            const matchesStatus = state.filters.status === 'All' || contact.status === state.filters.status;
            const matchesPriority = state.filters.priority === 'All' || contact.priority === state.filters.priority;
            return matchesSearch && matchesFirm && matchesSchool && matchesStatus && matchesPriority;
          })
          .sort((a, b) => sortByWorkflow(a, b, state.resume));
      }, [displayContacts, state.filters, state.resume]);

      useEffect(() => {
        void refreshGmailStatus();
      }, []);

      useEffect(() => {
        const handler = (event: MessageEvent) => {
          if (event.data?.type === 'bulgebracket-google-auth-success') {
            void refreshGmailStatus();
          }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
      }, []);

      async function refreshGmailStatus() {
        try {
          const response = await fetch('/api/gmail/status');
          const data = await response.json();
          setState((current) => ({
            ...current,
            gmailStatus: {
              authenticated: Boolean(data.authenticated),
              email: data.email,
              authUrl: data.authUrl,
              lastError: data.lastError,
            },
            lastSyncAt: new Date().toISOString(),
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            gmailStatus: {
              ...current.gmailStatus,
              lastError: error instanceof Error ? error.message : 'Unable to load Gmail status',
            },
          }));
        }
      }

      async function connectGmail() {
        let authUrl = state.gmailStatus.authUrl;
        if (!authUrl) {
          await refreshGmailStatus();
          authUrl = state.gmailStatus.authUrl;
        }
        if (!authUrl) {
          return;
        }
        const popup = window.open(authUrl, 'bulgebracket-gmail-auth', 'width=620,height=760');
        if (!popup) {
          window.open(authUrl, '_blank', 'noopener,noreferrer');
        }
      }

      function updateContact(contactId: string, patch: Partial<Contact>) {
        setState((current) => ({
          ...current,
          contacts: current.contacts.map((contact) => (contact.id === contactId ? { ...contact, ...patch } : contact)),
        }));
      }

      function selectContact(contact: Contact) {
        setState((current) => ({ ...current, selectedContactId: contact.id }));
      }

      async function uploadResume(file: File) {
        const formData = new FormData();
        formData.append('resume', file);
        const originalFileBase64 = await fileToBase64(file);
        const response = await fetch('/api/resume/parse', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Resume parsing failed');
        }
        const data = (await response.json()) as ResumeParseResponse;
        setState((current) => ({
          ...current,
          resume: {
            ...current.resume,
            ...data,
            fileName: file.name,
            originalFileBase64,
            originalMimeType: file.type || 'application/octet-stream',
            lastParsedAt: new Date().toISOString(),
          },
        }));
      }

      function updateResume(patch: Partial<typeof state.resume>) {
        setState((current) => ({
          ...current,
          resume: {
            ...current.resume,
            ...patch,
          },
        }));
      }

      function storeTailoredBullets(contactId: string, bullets: string[]) {
        setState((current) => ({
          ...current,
          resume: {
            ...current.resume,
            tailoredBullets: {
              ...current.resume.tailoredBullets,
              [contactId]: bullets,
            },
          },
        }));
      }

      function downloadTailored(contact: Contact, bullets: string[]) {
        const content = [
          'BulgeBracket.ai Tailored One-Pager',
          '',
          `Contact: ${getContactName(contact)}`,
          `Desk: ${contact.firm} / ${contact.team}`,
          '',
          'Personal pitch:',
          state.resume.pitch,
          '',
          'Tailored bullets:',
          ...bullets.map((bullet) => `- ${bullet}`),
          '',
          'Skills:',
          ...state.resume.skills.map((skill) => `- ${skill}`),
        ].join('\n');
        downloadTextFile(`${contact.firstName}-${contact.lastName}-tailored-one-pager.txt`.toLowerCase(), content);
      }

      function askStrategy(question: string, answer: string) {
        setState((current) => ({
          ...current,
          strategyMessages: [
            ...current.strategyMessages,
            { id: uid('strategy-user'), role: 'user', content: question, createdAt: new Date().toISOString() },
            { id: uid('strategy-assistant'), role: 'assistant', content: answer, createdAt: new Date().toISOString() },
          ],
        }));
      }

      async function deliverQueueItem(item: QueueItem, immediateOverride?: boolean) {
        const contact = state.contacts.find((candidate) => candidate.id === item.contactId);
        if (!contact) return;
        setBusyQueueIds((current) => ({ ...current, [item.id]: true }));
        try {
          const sendAt = immediateOverride ? undefined : item.sendAt;
          const response = await fetch('/api/gmail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contact.email,
              subject: item.subject,
              body: item.body,
              sendAt,
              attachment:
                item.attachmentContent && item.attachmentFileName && item.attachmentMimeType
                  ? {
                      fileName: item.attachmentFileName,
                      mimeType: item.attachmentMimeType,
                      base64Content: item.attachmentContent,
                    }
                  : undefined,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Unable to process Gmail request');
          }

          setState((current) => ({
            ...current,
            queue: current.queue.map((queueItem) =>
              queueItem.id === item.id
                ? {
                    ...queueItem,
                    status: data.status === 'scheduled' ? 'scheduled' : 'sent',
                    gmailJobId: data.jobId,
                    error: undefined,
                    sendAt: data.sendAt ?? queueItem.sendAt,
                  }
                : queueItem,
            ),
            contacts: current.contacts.map((candidate) =>
              candidate.id === item.contactId
                ? {
                    ...candidate,
                    lastOutreach: new Date().toISOString(),
                    status: data.status === 'scheduled' ? 'scheduled' : 'sent',
                  }
                : candidate,
            ),
            history:
              data.status === 'scheduled'
                ? current.history
                : [
                    {
                      id: uid('history'),
                      contactId: item.contactId,
                      subject: item.subject,
                      body: item.body,
                      hook: item.hook,
                      outcome: 'sent',
                      sentAt: new Date().toISOString(),
                    },
                    ...current.history,
                  ],
          }));
          await refreshGmailStatus();
        } catch (error) {
          setState((current) => ({
            ...current,
            queue: current.queue.map((queueItem) =>
              queueItem.id === item.id
                ? { ...queueItem, status: 'failed', error: error instanceof Error ? error.message : 'Delivery failed' }
                : queueItem,
            ),
            gmailStatus: {
              ...current.gmailStatus,
              lastError: error instanceof Error ? error.message : 'Delivery failed',
            },
          }));
        } finally {
          setBusyQueueIds((current) => ({ ...current, [item.id]: false }));
        }
      }

      function queueDraft(params: {
        contact: Contact;
        subject: string;
        body: string;
        sendAt: string;
        variantLabel: 'Short' | 'Relationship-First' | 'Deal-Referenced' | 'Aggressive';
        hook: string;
        attachmentMode: 'none' | 'original' | 'tailored';
        sendImmediately: boolean;
      }) {
        const attachment = getAttachmentPayload(params.contact, state.resume, params.attachmentMode);
        const queueItem: QueueItem = {
          id: uid('queue'),
          contactId: params.contact.id,
          subject: params.subject,
          body: params.body,
          sendAt: params.sendImmediately ? new Date().toISOString() : params.sendAt,
          status: params.sendImmediately ? 'queued' : 'scheduled',
          variantLabel: params.variantLabel,
          hook: params.hook,
          attachmentMode: params.attachmentMode,
          attachmentFileName: attachment?.fileName,
          attachmentMimeType: attachment?.mimeType,
          attachmentContent: attachment?.content,
          createdAt: new Date().toISOString(),
        };

        setState((current) => ({
          ...current,
          queue: [queueItem, ...current.queue],
          contacts: current.contacts.map((contact) =>
            contact.id === params.contact.id
              ? {
                  ...contact,
                  status: params.sendImmediately ? 'queued' : 'scheduled',
                  lastOutreach: params.sendImmediately ? new Date().toISOString() : contact.lastOutreach,
                }
              : contact,
          ),
          composerContactId: params.contact.id,
        }));
        setComposerOpen(!params.sendImmediately);
        if (params.sendImmediately) {
          void deliverQueueItem(queueItem, true);
        }
      }

      function sendNow(queueItemId: string) {
        const item = state.queue.find((candidate) => candidate.id === queueItemId);
        if (item) {
          void deliverQueueItem(item, true);
        }
      }

      function autoSchedule(queueItemId: string) {
        const item = state.queue.find((candidate) => candidate.id === queueItemId);
        const contact = state.contacts.find((candidate) => candidate.id === item?.contactId);
        if (!item || !contact) return;
        const sendAt = getOptimalSendTime(contact);
        setState((current) => ({
          ...current,
          queue: current.queue.map((queueItem) => (queueItem.id === queueItemId ? { ...queueItem, sendAt, status: 'scheduled' } : queueItem)),
        }));
        const nextItem = { ...item, sendAt, status: 'scheduled' as const };
        void deliverQueueItem(nextItem);
      }

      function executePipeline() {
        const liveQueue = state.queue.filter((item) => ['queued', 'scheduled'].includes(item.status));
        liveQueue.forEach((item) => {
          void deliverQueueItem(item, item.status === 'queued' || isDue(item.sendAt));
        });
        setState((current) => ({ ...current, lastQueueRunAt: new Date().toISOString() }));
      }

      function deleteQueueItem(queueItemId: string) {
        setState((current) => ({
          ...current,
          queue: current.queue.filter((item) => item.id !== queueItemId),
        }));
      }

      function markOutcome(contactId: string, status: Contact['status']) {
        setState((current) => ({
          ...current,
          contacts: current.contacts.map((contact) =>
            contact.id === contactId
              ? { ...contact, status, lastInteraction: new Date().toISOString() }
              : contact,
          ),
          history:
            status === 'replied' || status === 'positive'
              ? [
                  {
                    id: uid('history'),
                    contactId,
                    subject: `Manual status update: ${status}`,
                    body: '',
                    hook: 'Manual CRM status change',
                    outcome: status === 'positive' ? 'positive' : 'reply',
                    sentAt: new Date().toISOString(),
                  },
                  ...current.history,
                ]
              : current.history,
        }));
      }

      function exportContactsCsv() {
        const rows = [
          ['name', 'firm', 'title', 'team', 'school', 'email', 'priority', 'status', 'fitScore'],
          ...displayContacts.map((contact) => [
            getContactName(contact),
            contact.firm,
            contact.title,
            contact.team,
            contact.school,
            contact.email,
            contact.priority,
            contact.status,
            String(computeFitScore(contact, state.resume)),
          ]),
        ];
        downloadTextFile('bulgebracket-contacts.csv', encodeCsv(rows));
      }

      function onImportClick() {
        importRef.current?.click();
      }

      async function importContacts(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const rows = parseCsv(text);
        const [, ...dataRows] = rows;
        const imported = dataRows
          .filter((row) => row.length >= 7)
          .map((row, index) => ({
            id: uid(`import-${index}`),
            firstName: row[0].split(' ')[0] || row[0],
            lastName: row[0].split(' ').slice(1).join(' ') || 'Contact',
            firm: row[1],
            title: row[2],
            team: row[3],
            desk: row[3],
            coverageSectors: ['Imported'],
            school: row[4],
            city: 'Imported',
            email: row[5],
            priority: (row[6] as Contact['priority']) || 'B',
            status: (row[7] as Contact['status']) || 'not-contacted',
            relationshipStrength: 1,
            notes: ['Imported from CSV'],
            sharedInterests: [row[4]],
            styleNotes: ['Imported contact - enrich before sending live outreach.'],
            recentTransactions: [],
            teamMoves: ['Add live intel after import.'],
            deskMetrics: ['Imported row.'],
          } satisfies Contact));
        setState((current) => ({ ...current, contacts: [...imported, ...current.contacts] }));
        event.target.value = '';
      }

      const kanbanGroups: Array<{ label: string; status: Contact['status'] }> = [
        { label: 'Not Contacted', status: 'not-contacted' },
        { label: 'Sent', status: 'sent' },
        { label: 'Replied', status: 'replied' },
        { label: 'No Reply', status: 'no-reply' },
      ];

      return (
        <div className="min-h-screen pb-44 text-slate-100">
          <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
            <header className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="micro-label">BulgeBracket.ai</div>
                      <CardTitle className="mt-2 text-3xl">Investment Banking Recruiting AI command center</CardTitle>
                      <p className="mt-3 max-w-4xl text-sm text-slate-400">
                        AI-scored alumni coverage, resume intelligence, deal-aware outreach generation, Gmail pipeline execution, follow-up automation, and CRM analytics designed for elite investment banking recruiting.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={state.gmailStatus.authenticated ? 'secondary' : 'default'} onClick={() => void connectGmail()}>
                        <Mail className="h-4 w-4" />
                        {state.gmailStatus.authenticated ? `Gmail connected${state.gmailStatus.email ? `: ${state.gmailStatus.email}` : ''}` : 'Connect Gmail'}
                      </Button>
                      <Button variant="outline" onClick={() => void refreshGmailStatus()}>
                        <RefreshCcw className="h-4 w-4" /> Refresh auth
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <HeroStat label="Bankers tracked" value={String(state.contacts.length)} sublabel="240+ realistic contacts" />
                  <HeroStat label="Queue depth" value={String(state.queue.filter((item) => ['queued', 'scheduled'].includes(item.status)).length)} sublabel="Ready for execution" />
                  <HeroStat label="Target role" value={state.resume.targetRole} sublabel="Persistent resume profile" />
                  <HeroStat
                    label="Auth status"
                    value={state.gmailStatus.authenticated ? 'Live Gmail' : 'Needs OAuth'}
                    sublabel={state.gmailStatus.lastError || 'Real Gmail send + scheduling endpoints are wired.'}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="micro-label">System Guardrails</div>
                  <CardTitle className="mt-2 text-xl">Offline-first premium fallback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    Exact LinkedIn people-search URLs include first name, last name, firm, and school.
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    Rich seeded deal, team-move, and desk-metric data keeps research and drafting functional during quota or auth disruptions.
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-slate-300" />
                      <span>{state.gmailStatus.authenticated ? 'OAuth live for direct sending.' : 'Open auth in popup or new tab if your browser blocks popups.'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </header>

            <section className="mt-6">
              <MetricsPanel state={state} onSelectContact={(contact) => selectContact(contact)} />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="micro-label">Smart alumni ledger + scoring engine</div>
                        <CardTitle className="mt-2 text-xl">AI-ranked banker pipeline</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={exportContactsCsv}>
                          <Download className="h-4 w-4" /> Export CSV
                        </Button>
                        <Button variant="outline" onClick={onImportClick}>
                          <Upload className="h-4 w-4" /> Import CSV
                        </Button>
                        <input ref={importRef} type="file" accept=".csv" onChange={(event) => void importContacts(event)} className="hidden" />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-5">
                      <Input
                        value={state.filters.search}
                        onChange={(event) => setState((current) => ({ ...current, filters: { ...current.filters, search: event.target.value } }))}
                        placeholder="Search name, firm, desk, school"
                      />
                      <FilterSelect
                        value={state.filters.firm}
                        onChange={(value) => setState((current) => ({ ...current, filters: { ...current.filters, firm: value } }))}
                        options={['All', ...firmList]}
                      />
                      <FilterSelect
                        value={state.filters.school}
                        onChange={(value) => setState((current) => ({ ...current, filters: { ...current.filters, school: value } }))}
                        options={['All', ...schoolList]}
                      />
                      <FilterSelect
                        value={state.filters.status}
                        onChange={(value) => setState((current) => ({ ...current, filters: { ...current.filters, status: value } }))}
                        options={['All', 'not-contacted', 'queued', 'scheduled', 'sent', 'replied', 'positive', 'no-reply']}
                      />
                      <FilterSelect
                        value={state.filters.priority}
                        onChange={(value) => setState((current) => ({ ...current, filters: { ...current.filters, priority: value } }))}
                        options={['All', 'A+', 'A', 'B', 'C']}
                      />
                    </div>
                    <Tabs value={state.viewMode} onValueChange={(value) => setState((current) => ({ ...current, viewMode: value as typeof current.viewMode }))}>
                      <TabsList>
                        <TabsTrigger value="table">Table</TabsTrigger>
                        <TabsTrigger value="kanban">Kanban</TabsTrigger>
                      </TabsList>
                      <TabsContent value="table">
                        <ScrollArea className="mt-4 h-[720px] rounded-xl border border-slate-800">
                          <table className="min-w-full text-left text-sm">
                            <thead className="sticky top-0 bg-[#0f1720]">
                              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Desk</th>
                                <th className="px-4 py-3">School</th>
                                <th className="px-4 py-3">Fit</th>
                                <th className="px-4 py-3">Last outreach</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredContacts.map((contact) => (
                                <tr key={contact.id} className="border-b border-slate-900/80 text-slate-300">
                                  <td className="px-4 py-3 align-top">
                                    <button type="button" className="text-left" onClick={() => selectContact(contact)}>
                                      <div className="font-semibold text-slate-100">{getContactName(contact)}</div>
                                      <div className="mt-1 text-xs text-slate-500">
                                        {contact.firm} - {contact.title} - {contact.city}
                                      </div>
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <div>{contact.team}</div>
                                    <div className="mt-1 text-xs text-slate-500">{contact.coverageSectors.slice(0, 2).join(' / ')}</div>
                                  </td>
                                  <td className="px-4 py-3 align-top">{contact.school}</td>
                                  <td className="px-4 py-3 align-top">
                                    <Badge variant={computeFitScore(contact, state.resume) >= 85 ? 'green' : computeFitScore(contact, state.resume) >= 75 ? 'blue' : 'amber'}>
                                      {computeFitScore(contact, state.resume)}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <div>{formatRelativeOutreach(contact)}</div>
                                    {contact.status === 'no-reply' ? <div className="mt-1 text-xs text-amber-300">No reply flag active</div> : null}
                                  </td>
                                  <td className="px-4 py-3 align-top">{renderStatus(contact.status)}</td>
                                  <td className="px-4 py-3 align-top">
                                    <div className="flex flex-wrap gap-2">
                                      <Button size="sm" variant="outline" onClick={() => {
                                        setState((current) => ({ ...current, composerContactId: contact.id }));
                                        setComposerOpen(true);
                                      }}>
                                        Compose
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => markOutcome(contact.id, 'replied')}>
                                        Replied
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => markOutcome(contact.id, 'positive')}>
                                        Positive
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollArea>
                      </TabsContent>
                      <TabsContent value="kanban">
                        <div className="mt-4 grid gap-4 xl:grid-cols-4">
                          {kanbanGroups.map((group) => (
                            <div key={group.status} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="micro-label">{group.label}</div>
                                <Badge variant={group.status === 'no-reply' ? 'amber' : 'slate'}>
                                  {filteredContacts.filter((contact) => contact.status === group.status).length}
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                {filteredContacts
                                  .filter((contact) => contact.status === group.status)
                                  .slice(0, 12)
                                  .map((contact) => (
                                    <button
                                      key={contact.id}
                                      type="button"
                                      onClick={() => selectContact(contact)}
                                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-slate-600"
                                    >
                                      <div className="text-sm font-semibold text-slate-100">{getContactName(contact)}</div>
                                      <div className="mt-1 text-xs text-slate-500">
                                        {contact.firm} - {contact.team}
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardHeader>
                </Card>

                <ResumePanel
                  resume={state.resume}
                  selectedContact={selectedContact}
                  onUploadResume={uploadResume}
                  onUpdateResume={updateResume}
                  onStoreTailoredBullets={storeTailoredBullets}
                  onDownloadTailored={downloadTailored}
                />
              </div>

              <div className="space-y-6">
                <ContactIntelligence
                  contact={selectedContact}
                  resume={state.resume}
                  onUpdateContact={updateContact}
                  onCompose={(contactId) => {
                    setState((current) => ({ ...current, composerContactId: contactId, selectedContactId: contactId }));
                    setComposerOpen(true);
                  }}
                />
                <StrategyAdvisor state={state} onAsk={askStrategy} />
              </div>
            </section>
          </div>

          <OutreachComposer
            open={composerOpen}
            contact={composerContact}
            resume={state.resume}
            history={state.history}
            onOpenChange={setComposerOpen}
            onQueueDraft={queueDraft}
          />

          <QueuePanel
            queue={state.queue.map((item) => ({ ...item, status: busyQueueIds[item.id] ? item.status : item.status }))}
            contacts={state.contacts}
            onSendNow={sendNow}
            onAutoSchedule={autoSchedule}
            onExecutePipeline={executePipeline}
            onDelete={deleteQueueItem}
          />
        </div>
      );
    }

    function HeroStat({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="micro-label">{label}</div>
          <div className="mt-3 text-lg font-semibold text-slate-100">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{sublabel}</div>
        </div>
      );
    }

    function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
      return (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    function renderStatus(status: Contact['status']) {
      const config =
        status === 'positive'
          ? { variant: 'green' as const, label: 'Positive' }
          : status === 'replied'
            ? { variant: 'blue' as const, label: 'Replied' }
            : status === 'no-reply'
              ? { variant: 'amber' as const, label: 'No Reply' }
              : status === 'scheduled'
                ? { variant: 'blue' as const, label: 'Scheduled' }
                : status === 'queued'
                  ? { variant: 'slate' as const, label: 'Queued' }
                  : status === 'sent' || status === 'delivered'
                    ? { variant: 'slate' as const, label: status === 'sent' ? 'Sent' : 'Delivered' }
                    : { variant: 'slate' as const, label: 'Not Contacted' };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    export default App;
