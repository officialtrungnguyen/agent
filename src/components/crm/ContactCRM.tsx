"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  MessageSquare,
  Phone,
  Coffee,
  Linkedin,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { cn, getStatusColor, getStatusLabel, getLinkedInSearchUrl, getDaysSinceOutreach, isNoReply, generateId, formatDate } from "@/lib/utils";
import type { Contact, OutreachHistory, ContactStatus } from "@/types";
import { toast } from "sonner";

export function ContactCRM() {
  const { contacts, updateContact, selectContact, setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [noteType, setNoteType] = useState<OutreachHistory["type"]>("email");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteOutcome, setNoteOutcome] = useState<OutreachHistory["outcome"]>("sent");

  const filtered = contacts.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.firm} ${c.team}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const selected = contacts.find((c) => c.id === selectedId);

  const handleAddHistory = () => {
    if (!selected || !noteText) return;

    const entry: OutreachHistory = {
      id: generateId(),
      type: noteType,
      date: new Date().toISOString(),
      subject: noteSubject,
      body: noteText,
      outcome: noteOutcome,
      notes: noteText,
    };

    updateContact(selected.id, {
      outreachHistory: [...(selected.outreachHistory || []), entry],
      status: noteOutcome === "replied" ? "replied" : noteOutcome === "positive" ? "positive" : selected.status,
      lastOutreach: new Date().toISOString(),
    });

    setNoteSubject("");
    setNoteText("");
    setAddingNote(false);
    toast.success("Activity logged");
  };

  const noReplyContacts = contacts.filter((c) => isNoReply(c));

  return (
    <div className="flex h-full">
      {/* Contact List */}
      <div className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="input-base w-full text-xs"
          />
        </div>

        {noReplyContacts.length > 0 && (
          <div className="px-3 py-2 bg-amber-500/5 border-b border-amber-500/20">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {noReplyContacts.length} no-reply follow-up{noReplyContacts.length > 1 ? "s" : ""} needed
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filtered.map((c) => {
            const noReply = isNoReply(c);
            const days = getDaysSinceOutreach(c.lastOutreach);

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                  selectedId === c.id ? "bg-indigo-600/10 border-l-2 border-l-indigo-500" : "hover:bg-accent",
                  noReply && "bg-amber-500/3"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-300 shrink-0 mt-0.5">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{c.firstName} {c.lastName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{c.firm}</div>
                  {noReply && (
                    <div className="text-[9px] font-mono text-amber-400">⚠ No reply · {days}d</div>
                  )}
                </div>
                <span className={cn("status-badge text-[9px] shrink-0", getStatusColor(c.status))}>
                  {getStatusLabel(c.status).split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CRM Detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600/30 to-blue-600/30 border-2 border-indigo-600/20 flex items-center justify-center text-lg font-bold font-mono text-indigo-200">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div>
                  <div className="text-lg font-semibold">{selected.firstName} {selected.lastName}</div>
                  <div className="text-sm text-muted-foreground">{selected.title} · {selected.firm}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getLinkedInSearchUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs"
                >
                  <Linkedin className="w-4 h-4 text-blue-400" />
                </a>
                <button
                  onClick={() => { selectContact(selected.id); setActiveTab("intelligence"); }}
                  className="btn-outline text-xs"
                >
                  View Intel
                </button>
                <button
                  onClick={() => { selectContact(selected.id); setActiveTab("composer"); }}
                  className="btn-primary text-xs"
                >
                  Compose
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Update */}
            <div>
              <div className="micro-label mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {(["not_contacted", "sent", "replied", "positive", "coffee_chat", "closed"] as ContactStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateContact(selected.id, { status: s })}
                    className={cn(
                      "status-badge cursor-pointer transition-colors",
                      selected.status === s ? getStatusColor(s) : "text-muted-foreground border-border hover:border-indigo-500/30"
                    )}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="micro-label">Activity Log</div>
                <button
                  onClick={() => setAddingNote(true)}
                  className="btn-ghost text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Activity
                </button>
              </div>

              {addingNote && (
                <div className="card-base p-4 space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="micro-label mb-1">Type</div>
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as OutreachHistory["type"])}
                        className="input-base w-full text-xs"
                      >
                        <option value="email">Email</option>
                        <option value="call">Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="coffee_chat">Coffee Chat</option>
                      </select>
                    </div>
                    <div>
                      <div className="micro-label mb-1">Outcome</div>
                      <select
                        value={noteOutcome}
                        onChange={(e) => setNoteOutcome(e.target.value as OutreachHistory["outcome"])}
                        className="input-base w-full text-xs"
                      >
                        <option value="sent">Sent</option>
                        <option value="replied">Replied</option>
                        <option value="no_reply">No Reply</option>
                        <option value="positive">Positive</option>
                        <option value="meeting_set">Meeting Set</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="micro-label mb-1">Subject (optional)</div>
                    <input
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className="input-base w-full text-xs"
                      placeholder="Email subject or call topic..."
                    />
                  </div>
                  <div>
                    <div className="micro-label mb-1">Notes</div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="input-base w-full h-20 resize-none text-xs"
                      placeholder="What happened? Key takeaways..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddHistory} className="btn-primary text-xs">
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button onClick={() => setAddingNote(false)} className="btn-ghost text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="space-y-3">
                {(selected.outreachHistory || []).length === 0 ? (
                  <div className="card-base p-6 text-center text-sm text-muted-foreground">
                    No activity logged yet
                  </div>
                ) : (
                  [...(selected.outreachHistory || [])].reverse().map((h) => {
                    const TypeIcon = h.type === "email" ? MessageSquare :
                      h.type === "call" ? Phone :
                      h.type === "coffee_chat" ? Coffee :
                      h.type === "linkedin" ? Linkedin :
                      MessageSquare;

                    return (
                      <div key={h.id} className="card-base p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium capitalize">{h.type.replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("status-badge text-[10px]", getStatusColor(h.outcome as ContactStatus))}>
                              {h.outcome}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {formatDate(h.date)}
                            </span>
                          </div>
                        </div>
                        {h.subject && (
                          <div className="text-xs font-medium text-foreground mb-1">{h.subject}</div>
                        )}
                        {h.notes && (
                          <div className="text-xs text-muted-foreground">{h.notes}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="micro-label mb-2">Private Notes</div>
              <textarea
                value={selected.notes}
                onChange={(e) => updateContact(selected.id, { notes: e.target.value })}
                className="input-base w-full h-28 resize-none text-sm"
                placeholder="Private notes about this contact — what did you learn? What's your strategy?"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
          <div className="text-sm">Select a contact to view CRM details</div>
        </div>
      )}
    </div>
  );
}
