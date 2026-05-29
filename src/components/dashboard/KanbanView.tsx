"use client";

import { useAppStore } from "@/store/useAppStore";
import { cn, getLinkedInSearchUrl, isNoReply, getDaysSinceOutreach, getFitScoreColor } from "@/lib/utils";
import { AlertTriangle, Linkedin, Mail } from "lucide-react";
import type { Contact, ContactStatus } from "@/types";

const COLUMNS: { status: ContactStatus; label: string; color: string }[] = [
  { status: "not_contacted", label: "Not Contacted", color: "border-slate-600/30" },
  { status: "sent", label: "Sent", color: "border-blue-600/30" },
  { status: "replied", label: "Replied", color: "border-emerald-600/30" },
  { status: "positive", label: "Positive", color: "border-green-600/30" },
  { status: "coffee_chat", label: "Coffee Chat", color: "border-teal-600/30" },
];

interface KanbanViewProps {
  contacts: Contact[];
}

export function KanbanView({ contacts }: KanbanViewProps) {
  const { updateContact, selectContact, setActiveTab } = useAppStore();

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData("contactId", contactId);
  };

  const handleDrop = (e: React.DragEvent, status: ContactStatus) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    if (contactId) {
      updateContact(contactId, { status });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto p-4">
      {COLUMNS.map((col) => {
        const colContacts = contacts.filter((c) => c.status === col.status);
        const noReplies = col.status === "sent"
          ? colContacts.filter((c) => isNoReply(c))
          : [];

        return (
          <div
            key={col.status}
            className="flex flex-col w-72 shrink-0"
            onDrop={(e) => handleDrop(e, col.status)}
            onDragOver={handleDragOver}
          >
            {/* Column Header */}
            <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg border-t-2 bg-card border-x border-border", col.color)}>
              <span className="text-xs font-medium text-foreground">{col.label}</span>
              <div className="flex items-center gap-1.5">
                {noReplies.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {noReplies.length}
                  </span>
                )}
                <span className="text-[11px] font-mono text-muted-foreground bg-border px-1.5 py-0.5 rounded">
                  {colContacts.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto bg-accent/20 border-x border-b border-border rounded-b-lg p-2 space-y-2 min-h-24">
              {colContacts.map((contact) => (
                <KanbanCard
                  key={contact.id}
                  contact={contact}
                  onDragStart={handleDragStart}
                  onClick={() => {
                    selectContact(contact.id);
                    setActiveTab("intelligence");
                  }}
                  onCompose={() => {
                    selectContact(contact.id);
                    setActiveTab("composer");
                  }}
                />
              ))}

              {colContacts.length === 0 && (
                <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground border border-dashed border-border rounded-lg">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  contact,
  onDragStart,
  onClick,
  onCompose,
}: {
  contact: Contact;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
  onCompose: () => void;
}) {
  const noReply = isNoReply(contact);
  const days = getDaysSinceOutreach(contact.lastOutreach);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, contact.id)}
      onClick={onClick}
      className={cn(
        "card-base p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/30 transition-all group",
        noReply && "border-amber-500/30 bg-amber-500/3"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">
            {contact.firstName} {contact.lastName}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {contact.title} · {contact.firm}
          </div>
          <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
            {contact.team}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("text-xs font-mono font-bold", getFitScoreColor(contact.fitScore))}>
            {contact.fitScore}
          </span>
        </div>
      </div>

      {/* School */}
      <div className="mt-2 text-[10px] font-mono text-muted-foreground/60 truncate">
        {contact.school}
      </div>

      {/* No Reply Warning */}
      {noReply && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-amber-400">
          <AlertTriangle className="w-2.5 h-2.5" />
          No reply · {days}d ago
        </div>
      )}

      {/* Actions */}
      <div
        className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={getLinkedInSearchUrl(contact)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded hover:bg-blue-600/10 text-muted-foreground hover:text-blue-400 transition-colors"
        >
          <Linkedin className="w-3 h-3" />
        </a>
        <button
          onClick={onCompose}
          className="p-1 rounded hover:bg-indigo-600/10 text-muted-foreground hover:text-indigo-400 transition-colors"
        >
          <Mail className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
