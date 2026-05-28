import { useEffect, useMemo, useState } from "react";
import { Building2, Calendar, Copy, ExternalLink, FileText, GraduationCap, Linkedin, MapPin, Sparkles, Star, StickyNote, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { api, buildGoogleSearchUrl, buildLinkedInUrl } from "@/lib/api";
import { formatRelative, cn, daysBetween } from "@/lib/utils";
import { computeFitScore } from "@/lib/scoring";
import type { OutreachStatus } from "@/types";

const STATUS_OPTIONS: OutreachStatus[] = ["not_contacted", "queued", "scheduled", "sent", "opened", "replied", "no_reply", "meeting_set", "closed"];

export function ContactIntelligenceDialog() {
  const id = useAppStore((s) => s.intelOpenForId);
  const openIntel = useAppStore((s) => s.openIntel);
  const openComposer = useAppStore((s) => s.openComposer);
  const contact = useAppStore((s) => (id ? s.contacts.find((c) => c.id === id) : undefined));
  const updateContact = useAppStore((s) => s.updateContact);
  const notes = useAppStore((s) => (id ? s.notes.filter((n) => n.contactId === id) : []));
  const addNote = useAppStore((s) => s.addNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const resume = useAppStore((s) => s.resume);
  const setStars = useAppStore((s) => s.setStars);
  const drafts = useAppStore((s) => (id ? s.drafts.filter((d) => d.contactId === id) : []));

  const [intel, setIntel] = useState<Awaited<ReturnType<typeof api.aiIntel>> | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [noteText, setNoteText] = useState("");

  const live = useMemo(() => (contact && resume ? computeFitScore(contact, resume) : null), [contact, resume]);

  useEffect(() => {
    setIntel(null);
    if (!contact) return;
    let cancelled = false;
    (async () => {
      setLoadingIntel(true);
      const res = await api.aiIntel({ contact });
      if (!cancelled) {
        setIntel(res);
        setLoadingIntel(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contact]);

  if (!contact) return null;

  const linkedIn = buildLinkedInUrl(contact.firstName, contact.lastName, contact.firm, contact.school);
  const google = buildGoogleSearchUrl(contact.firstName, contact.lastName, contact.firm, contact.school);
  const noReplyDays = contact.status === "no_reply" && contact.lastOutreachAt ? daysBetween(contact.lastOutreachAt) : null;

  const handleStatus = (s: OutreachStatus) => updateContact(contact.id, { status: s });

  return (
    <Dialog open={!!id} onOpenChange={(open) => { if (!open) openIntel(null); }}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-graphite-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={contact.fullName} className="h-10 w-10" />
            <div>
              <DialogTitle>{contact.fullName}</DialogTitle>
              <p className="text-xs text-graphite-500">{contact.title} · {contact.firm}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" asChild>
              <a href={linkedIn} target="_blank" rel="noreferrer"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</a>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href={google} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Google</a>
            </Button>
            <Button size="sm" variant="default" onClick={() => openComposer(contact.id)}>
              <Sparkles className="h-3.5 w-3.5" /> Draft Email
            </Button>
            <button onClick={() => openIntel(null)} aria-label="Close"><X className="h-4 w-4 text-graphite-500 hover:text-graphite-900" /></button>
          </div>
        </div>

        <div className="grid max-h-[calc(90vh-72px)] grid-cols-1 overflow-hidden md:grid-cols-[260px_1fr]">
          <aside className="border-r border-graphite-100 bg-graphite-50 p-4">
            <div className="space-y-3">
              <Detail icon={<Building2 className="h-3.5 w-3.5" />} label="Desk" value={contact.desk} />
              <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="City" value={contact.city} />
              <Detail icon={<GraduationCap className="h-3.5 w-3.5" />} label="School" value={`${contact.school}${contact.gradYear ? ` · ${contact.gradYear}` : ""}`} />
              <Detail icon={<Calendar className="h-3.5 w-3.5" />} label="Last touch" value={formatRelative(contact.lastOutreachAt)} />

              <Separator />

              <div>
                <p className="microlabel mb-1">Priority</p>
                <Badge
                  variant={contact.priority === "S" ? "priority_s" : contact.priority === "A" ? "priority_a" : contact.priority === "B" ? "priority_b" : "priority_c"}
                  className="text-[11px]"
                >
                  Tier {contact.priority}
                </Badge>
              </div>

              <div>
                <p className="microlabel mb-1">AI Fit Score</p>
                <div className="flex items-center gap-2">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-graphite-200">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-graphite-900" style={{ width: `${live?.score ?? contact.fitScore}%` }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-graphite-900">{live?.score ?? contact.fitScore}</span>
                </div>
                {live && live.score !== contact.fitScore && (
                  <p className="mt-1 text-[10px] text-graphite-500">Live recompute vs your resume (was {contact.fitScore})</p>
                )}
              </div>

              <div>
                <p className="microlabel mb-1">Status</p>
                <select
                  value={contact.status}
                  onChange={(e) => handleStatus(e.target.value as OutreachStatus)}
                  className="w-full rounded-md border border-graphite-200 bg-white px-2 py-1 text-[12px]"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                {noReplyDays !== null && noReplyDays >= 7 && (
                  <Badge variant="warn" className="mt-1.5 text-[10px]">⚠ No reply · {noReplyDays}d</Badge>
                )}
              </div>

              <div>
                <p className="microlabel mb-1">Relationship</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setStars(contact.id, n as 1|2|3|4|5)} className="text-graphite-300 hover:text-graphite-900">
                      <Star className={cn("h-4 w-4", n <= contact.relationshipStars && "fill-graphite-900 text-graphite-900")} />
                    </button>
                  ))}
                </div>
              </div>

              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <p className="microlabel mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto">
            <Tabs defaultValue="intel" className="px-5 py-4">
              <TabsList>
                <TabsTrigger value="intel">Intel</TabsTrigger>
                <TabsTrigger value="deals">Deals · Desk</TabsTrigger>
                <TabsTrigger value="icebreakers">Icebreakers</TabsTrigger>
                <TabsTrigger value="notes">Notes · History</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="intel">
                <div className="space-y-4">
                  <Block label="AI Fit Reasoning">
                    <ul className="space-y-1 text-[12px] text-graphite-700">
                      {(live?.reasoning ?? contact.fitReasoning).map((r, i) => (
                        <li key={i} className="flex gap-2"><span className="text-graphite-400">•</span>{r}</li>
                      ))}
                    </ul>
                  </Block>
                  <Block label="Coverage / Products">
                    <div className="flex flex-wrap gap-1">
                      {contact.coverage.map((c) => <Badge key={c} variant="default" className="text-[11px]">{c}</Badge>)}
                      {contact.products.map((p) => <Badge key={p} variant="outline" className="text-[11px]">{p}</Badge>)}
                    </div>
                  </Block>
                  <Block label="Personal Style & Interests">
                    <div className="flex flex-wrap gap-1">
                      {contact.interests.map((i) => <Badge key={i} variant="muted" className="text-[11px]">{i}</Badge>)}
                    </div>
                  </Block>
                </div>
              </TabsContent>

              <TabsContent value="deals">
                <div className="space-y-4">
                  <Block label={`Recent Key Transactions (${contact.recentDeals.length})`}>
                    <div className="overflow-hidden rounded-md border border-graphite-200">
                      <table className="w-full text-[12px]">
                        <thead className="bg-graphite-50">
                          <tr>
                            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-microcap text-graphite-500">Target / Acquirer</th>
                            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-microcap text-graphite-500">Value</th>
                            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-microcap text-graphite-500">Product</th>
                            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-microcap text-graphite-500">Date</th>
                            <th className="px-3 py-1.5 text-left text-[10px] uppercase tracking-microcap text-graphite-500">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contact.recentDeals.map((d, i) => (
                            <tr key={i} className="border-t border-graphite-100">
                              <td className="px-3 py-2 font-medium text-graphite-900">
                                {d.target}{d.acquirer ? ` → ${d.acquirer}` : ""}
                              </td>
                              <td className="px-3 py-2 tabular-nums text-graphite-900">{d.value}</td>
                              <td className="px-3 py-2 text-graphite-700">{d.product}</td>
                              <td className="px-3 py-2 text-graphite-500">{d.date.slice(0, 10)}</td>
                              <td className="px-3 py-2 text-graphite-700">{d.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Block>

                  {intel && (
                    <>
                      <Block label="Team Moves & Desk Signal">
                        <ul className="space-y-1 text-[12px] text-graphite-700">
                          {intel.teamMoves.map((m, i) => <li key={i} className="flex gap-2"><span className="text-graphite-400">•</span>{m}</li>)}
                        </ul>
                      </Block>
                      <Block label="Desk Metrics">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {intel.deskMetrics.map((m, i) => (
                            <div key={i} className="rounded-md border border-graphite-200 bg-white p-2">
                              <p className="microlabel">{m.label}</p>
                              <p className="text-[12px] font-medium text-graphite-900">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </Block>
                      {intel.offline && (
                        <p className="text-[10px] text-graphite-400">
                          Source: high-fidelity offline intel cache. Configure OPENAI_API_KEY in your environment to layer real-time enrichment.
                        </p>
                      )}
                    </>
                  )}
                  {loadingIntel && <p className="text-[11px] text-graphite-500">Loading intel…</p>}
                </div>
              </TabsContent>

              <TabsContent value="icebreakers">
                <div className="space-y-2">
                  <p className="text-[11px] text-graphite-500">Tap to copy — drop straight into the composer.</p>
                  {(intel?.icebreakers ?? contact.icebreakers).map((ice, i) => (
                    <button
                      key={i}
                      onClick={() => navigator.clipboard.writeText(ice)}
                      className="group flex w-full items-start gap-3 rounded-md border border-graphite-200 bg-white px-3 py-2 text-left text-[12px] text-graphite-900 hover:border-graphite-400"
                    >
                      <span className="mt-0.5 text-graphite-400 group-hover:text-graphite-900"><Copy className="h-3.5 w-3.5" /></span>
                      <span className="flex-1 leading-relaxed">{ice}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="space-y-3">
                  <div>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="Add a note: deal mentioned, mutual contact, callback action…"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" variant="default" onClick={() => { if (noteText.trim()) { addNote(contact.id, noteText.trim()); setNoteText(""); }}}>
                        <StickyNote className="h-3.5 w-3.5" /> Add note
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  {notes.length === 0 ? (
                    <p className="text-[11px] text-graphite-400">No notes yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((n) => (
                        <li key={n.id} className="rounded-md border border-graphite-200 bg-white p-3 text-[12px] text-graphite-900">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-microcap text-graphite-500">{formatRelative(n.createdAt)}</span>
                            <button onClick={() => removeNote(n.id)} className="text-graphite-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drafts">
                {drafts.length === 0 ? (
                  <p className="text-[12px] text-graphite-400">No drafts yet. Click "Draft Email" to generate hyper-personalized variants.</p>
                ) : (
                  <ul className="space-y-2">
                    {drafts.map((d) => (
                      <li key={d.id} className="rounded-md border border-graphite-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-graphite-500" />
                            <span className="text-[12px] font-medium text-graphite-900">{d.subject}</span>
                          </div>
                          <Badge variant={d.status === "sent" ? "success" : d.status === "scheduled" ? "info" : "muted"}>{d.status}</Badge>
                        </div>
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[12px] text-graphite-700">{d.body}</p>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openComposer(contact.id)}>Open</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-graphite-500">{icon}<span className="microlabel">{label}</span></div>
      <p className="mt-0.5 text-[12px] font-medium text-graphite-900">{value}</p>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface px-4 py-3">
      <p className="microlabel mb-2">{label}</p>
      {children}
    </div>
  );
}
