import { ExternalLink, Mail, Sparkles, Star } from 'lucide-react';
        import { computeFitScore, generateIcebreakers, getContactName, getGoogleSearchUrl, getLinkedInSearchUrl } from '../lib/recruiting';
        import type { Contact, ResumeProfile } from '../types';
        import { Badge } from './ui/badge';
        import { Button } from './ui/button';
        import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
        import { Input } from './ui/input';
        import { ScrollArea } from './ui/scroll-area';
        import { Textarea } from './ui/textarea';

        interface ContactIntelligenceProps {
          contact?: Contact;
          resume: ResumeProfile;
          onUpdateContact: (contactId: string, patch: Partial<Contact>) => void;
          onCompose: (contactId: string) => void;
        }

        export function ContactIntelligence({ contact, resume, onUpdateContact, onCompose }: ContactIntelligenceProps) {
          if (!contact) {
            return (
              <Card className="h-full">
                <CardHeader>
                  <div className="micro-label">Research Agent</div>
                  <CardTitle className="mt-2 text-xl">Deep profile intelligence</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-400">
                  Select a banker to open the full intelligence panel, generate research-backed icebreakers, and queue personalized outreach.
                </CardContent>
              </Card>
            );
          }

          const icebreakers = generateIcebreakers(contact, resume);
          const fitScore = computeFitScore(contact, resume);
          const notesValue = contact.notes.join('\n');

          return (
            <Card className="h-full overflow-hidden">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="micro-label">Contact Intelligence</div>
                    <CardTitle className="mt-2 text-xl">{getContactName(contact)}</CardTitle>
                    <div className="mt-2 text-sm text-slate-400">
                      {contact.title} - {contact.team} - {contact.firm}
                    </div>
                  </div>
                  <Badge variant={fitScore >= 85 ? 'green' : fitScore >= 75 ? 'blue' : 'amber'}>{fitScore} fit</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(getLinkedInSearchUrl(contact), '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="h-4 w-4" /> LinkedIn exact search
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(getGoogleSearchUrl(contact), '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="h-4 w-4" /> Google search
                  </Button>
                  <Button size="sm" onClick={() => onCompose(contact.id)}>
                    <Mail className="h-4 w-4" /> Generate best email
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="h-[720px]">
                <CardContent className="space-y-5 pb-8">
                  <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Team / Desk</div>
                      <div className="mt-2 text-sm text-slate-100">{contact.team}</div>
                      <div className="mt-1 text-sm text-slate-400">{contact.desk}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Coverage Sectors</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {contact.coverageSectors.map((sector) => (
                          <Badge key={sector} variant="slate">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="micro-label">Recent Key Transactions</div>
                    <div className="mt-3 space-y-3">
                      {contact.recentTransactions.map((transaction) => (
                        <div key={`${transaction.company}-${transaction.date}`} className="rounded-lg border border-slate-800 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-100">{transaction.company}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                {transaction.role} | {transaction.counterparty}
                              </div>
                            </div>
                            <div className="text-right text-xs text-slate-300">
                              <div>{transaction.value}</div>
                              <div className="mt-1 text-slate-500">{transaction.date}</div>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{transaction.summary}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Shared Alumni Interests</div>
                      <div className="mt-3 space-y-2">
                        {contact.sharedInterests.map((item) => (
                          <div key={item} className="text-sm text-slate-300">- {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Personal Style / Icebreakers</div>
                      <div className="mt-3 space-y-2">
                        {contact.styleNotes.map((item) => (
                          <div key={item} className="text-sm text-slate-300">- {item}</div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Intel Scoping Agent</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        {contact.teamMoves.map((move) => (
                          <div key={move}>- {move}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="micro-label">Desk Metrics</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        {contact.deskMetrics.map((metric) => (
                          <div key={metric}>- {metric}</div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-slate-300" />
                      <div className="micro-label">Copyable Icebreakers</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {icebreakers.map((icebreaker) => (
                        <button
                          key={icebreaker}
                          type="button"
                          onClick={() => navigator.clipboard.writeText(icebreaker)}
                          className="rounded-lg border border-slate-800 p-3 text-left text-sm text-slate-300 transition hover:border-slate-600"
                        >
                          {icebreaker}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="micro-label">CRM Controls</div>
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Email</label>
                        <Input value={contact.email} onChange={(event) => onUpdateContact(contact.id, { email: event.target.value })} />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Relationship strength</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => onUpdateContact(contact.id, { relationshipStrength: rating })}
                              className="rounded-full border border-slate-700 p-2"
                            >
                              <Star
                                className={`h-4 w-4 ${rating <= contact.relationshipStrength ? 'fill-amber-300 text-amber-300' : 'text-slate-500'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">Notes</label>
                        <Textarea
                          value={notesValue}
                          onChange={(event) =>
                            onUpdateContact(contact.id, {
                              notes: event.target.value
                                .split('\n')
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                          className="min-h-[140px]"
                        />
                      </div>
                    </div>
                  </section>
                </CardContent>
              </ScrollArea>
            </Card>
          );
        }
