"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Brain,
  Linkedin,
  Search,
  ExternalLink,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Star,
  ChevronRight,
  Copy,
  CheckCircle,
  RefreshCw,
  Zap,
  DollarSign,
  Calendar,
  BarChart2,
  Users,
  AlertTriangle,
  Mail,
} from "lucide-react";
import {
  cn,
  getLinkedInSearchUrl,
  getGoogleSearchUrl,
  getSeniorityColor,
  getSeniorityLabel,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getFitScoreColor,
  getFitScoreBarColor,
  formatRelativeDate,
  isNoReply,
  getDaysSinceOutreach,
} from "@/lib/utils";
import { toast } from "sonner";
import type { Contact, ContactStatus } from "@/types";

const STATUS_OPTIONS: ContactStatus[] = [
  "not_contacted", "sent", "replied", "no_reply", "positive", "coffee_chat", "closed"
];

export function ContactIntelligence() {
  const { getSelectedContact, selectContact, contacts, updateContact, setActiveTab } = useAppStore();
  const contact = getSelectedContact();
  const [copiedIcebreaker, setCopiedIcebreaker] = useState<number | null>(null);
  const [researching, setResearching] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Brain className="w-12 h-12 mb-3 opacity-30" />
        <div className="text-sm font-medium">Select a contact to view intelligence</div>
        <div className="text-xs mt-1 opacity-60">Click any contact in the Alumni Ledger</div>
        <button
          onClick={() => setActiveTab("ledger")}
          className="btn-outline text-xs mt-4"
        >
          Go to Ledger
        </button>
      </div>
    );
  }

  const noReply = isNoReply(contact);
  const daysSince = getDaysSinceOutreach(contact.lastOutreach);

  const handleCopyIcebreaker = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIcebreaker(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIcebreaker(null), 2000);
  };

  const handleResearch = async () => {
    setResearching(true);
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.icebreakers?.length) {
          updateContact(contact.id, {
            icebreakers: data.icebreakers,
            personalStyle: data.personalStyle || contact.personalStyle,
          });
          toast.success("Research updated with fresh intelligence");
        } else {
          toast.info("Research complete — offline data used");
        }
      }
    } catch {
      toast.error("Research failed. Using offline data.");
    } finally {
      setResearching(false);
    }
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "deals", label: `Deals (${contact.recentDeals?.length || 0})` },
    { id: "icebreakers", label: "Icebreakers" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="flex h-full">
      {/* Contact List Sidebar */}
      <div className="w-52 border-r border-border flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-border">
          <div className="micro-label">Contacts</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.slice(0, 30).map((c) => (
            <button
              key={c.id}
              onClick={() => selectContact(c.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-border/50 transition-colors",
                c.id === contact.id
                  ? "bg-indigo-600/10 border-l-2 border-l-indigo-500"
                  : "hover:bg-accent"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-300 shrink-0">
                {c.firstName[0]}{c.lastName[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {c.firstName} {c.lastName}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {c.firm}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-card/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600/40 to-blue-600/40 border-2 border-indigo-600/30 flex items-center justify-center text-xl font-bold font-mono text-indigo-200">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {contact.firstName} {contact.lastName}
                </h2>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {contact.title} · {contact.firm}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {contact.team}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Fit Score */}
              <div className={cn("fit-score-ring border-2 border-current", getFitScoreColor(contact.fitScore))}>
                {contact.fitScore}
              </div>

              {/* LinkedIn */}
              <a
                href={getLinkedInSearchUrl(contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                title="Search LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>

              {/* Google */}
              <a
                href={getGoogleSearchUrl(contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Google Search"
              >
                <Search className="w-4 h-4" />
              </a>

              {/* Compose */}
              <button
                onClick={() => setActiveTab("composer")}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Compose
              </button>
            </div>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className={cn("status-badge", getSeniorityColor(contact.seniority))}>
              {getSeniorityLabel(contact.seniority)}
            </span>
            <span className={cn("status-badge capitalize", getPriorityColor(contact.priority))}>
              {contact.priority} priority
            </span>

            {/* Status Selector */}
            <select
              value={contact.status}
              onChange={(e) => updateContact(contact.id, { status: e.target.value as ContactStatus })}
              className={cn(
                "status-badge bg-transparent cursor-pointer border",
                getStatusColor(contact.status)
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-background text-foreground">
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>

            {noReply && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-mono text-amber-400">No reply · {daysSince}d</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { icon: Building2, label: "Firm", value: contact.firm },
              { icon: GraduationCap, label: "MBA", value: contact.school },
              { icon: GraduationCap, label: "Undergrad", value: contact.undergrad },
              { icon: Briefcase, label: "Team", value: contact.team.split(" ").slice(0, 4).join(" ") },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card-base p-3">
                <div className="micro-label mb-1">{label}</div>
                <div className="text-xs font-medium text-foreground truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Nav */}
        <div className="flex border-b border-border px-6">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeSection === s.id
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="p-6 space-y-5">
          {activeSection === "overview" && (
            <>
              {/* Coverage Sectors */}
              <div>
                <div className="micro-label mb-2">Coverage Sectors</div>
                <div className="flex flex-wrap gap-2">
                  {contact.coverageSectors.map((sector) => (
                    <span key={sector} className="deal-tag px-2 py-1 text-xs">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personal Style */}
              <div>
                <div className="micro-label mb-2">Communication Style & Profile</div>
                <div className="card-base p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {contact.personalStyle || "Professional communication style. Direct and analytical approach to conversations."}
                  </p>
                </div>
              </div>

              {/* Relationship Strength */}
              <div>
                <div className="micro-label mb-2">Relationship Strength</div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateContact(contact.id, { relationshipStrength: star })}
                      className="transition-colors"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5",
                          star <= contact.relationshipStrength
                            ? "text-amber-400 fill-amber-400"
                            : "text-border"
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {contact.relationshipStrength === 0 ? "Not established" :
                      contact.relationshipStrength === 1 ? "Cold" :
                      contact.relationshipStrength === 2 ? "Warm" :
                      contact.relationshipStrength === 3 ? "Connected" :
                      contact.relationshipStrength === 4 ? "Strong" : "Champion"}
                  </span>
                </div>
              </div>

              {/* Fit Score Breakdown */}
              <div>
                <div className="micro-label mb-2">Fit Score Breakdown</div>
                <div className="card-base p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Overall Fit Score</span>
                    <span className={cn("font-mono font-bold text-sm", getFitScoreColor(contact.fitScore))}>
                      {contact.fitScore} / 100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", getFitScoreBarColor(contact.fitScore))}
                      style={{ width: `${contact.fitScore}%` }}
                    />
                  </div>
                  <div className="pt-2 space-y-1">
                    {contact.priority === "high" && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Top priority target
                      </div>
                    )}
                    {contact.seniority === "analyst" || contact.seniority === "associate" ? (
                      <div className="text-[11px] text-blue-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Junior banker — more accessible
                      </div>
                    ) : null}
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> {contact.coverageSectors.length} coverage sectors
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="micro-label mb-2">Notes</div>
                <textarea
                  value={contact.notes}
                  onChange={(e) => updateContact(contact.id, { notes: e.target.value })}
                  placeholder="Add notes about this contact..."
                  className="input-base w-full h-24 resize-none text-xs"
                />
              </div>
            </>
          )}

          {activeSection === "deals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="micro-label">Recent Transactions</div>
                <button
                  onClick={handleResearch}
                  disabled={researching}
                  className="btn-ghost text-xs"
                >
                  {researching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  {researching ? "Researching..." : "Refresh Intel"}
                </button>
              </div>

              {contact.recentDeals?.length > 0 ? (
                contact.recentDeals.map((deal, i) => (
                  <div key={i} className="card-base p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{deal.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{deal.description}</div>
                      </div>
                      <span className="deal-tag shrink-0">{deal.type}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-mono font-bold">{deal.value}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{deal.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{deal.role}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {deal.companies.map((company) => (
                        <span
                          key={company}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card-base p-8 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <div className="text-sm text-muted-foreground">No deal data available</div>
                  <button onClick={handleResearch} className="btn-outline text-xs mt-3">
                    <Zap className="w-3.5 h-3.5" />
                    Research Deals
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === "icebreakers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="micro-label">AI-Generated Icebreakers</div>
                <button
                  onClick={handleResearch}
                  disabled={researching}
                  className="btn-ghost text-xs"
                >
                  {researching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Regenerate
                </button>
              </div>

              <div className="space-y-3">
                {(contact.icebreakers?.length > 0 ? contact.icebreakers : [
                  `I've been following ${contact.firm}'s ${contact.coverageSectors[0]} coverage — particularly the ${contact.recentDeals?.[0]?.title || "recent transactions"}.`,
                  `Your path from ${contact.undergrad} → ${contact.school} → ${contact.firm} is exactly the trajectory I'm targeting.`,
                  `The ${contact.coverageSectors[0]} sector dynamics in 2024 have been fascinating — would love your perspective on where things are heading.`,
                ]).map((icebreaker, idx) => (
                  <div key={idx} className="card-base p-4 group">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-[11px] font-mono text-indigo-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{icebreaker}</p>
                      </div>
                      <button
                        onClick={() => handleCopyIcebreaker(icebreaker, idx)}
                        className="shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        {copiedIcebreaker === idx ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-base p-4 bg-indigo-600/5 border-indigo-600/20">
                <div className="micro-label mb-2 text-indigo-400">Pro Tip</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use these icebreakers in the subject line or opening sentence of your email. 
                  The best hooks reference a specific deal or team development rather than generic compliments.
                </p>
              </div>
            </div>
          )}

          {activeSection === "history" && (
            <div className="space-y-4">
              <div className="micro-label">Outreach History</div>

              {contact.outreachHistory?.length > 0 ? (
                <div className="space-y-3">
                  {contact.outreachHistory.map((h, i) => (
                    <div key={i} className="card-base p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium capitalize">{h.type}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{h.date}</span>
                      </div>
                      {h.subject && <div className="text-xs text-foreground">{h.subject}</div>}
                      {h.notes && <div className="text-xs text-muted-foreground mt-1">{h.notes}</div>}
                      <div className={cn("mt-2 text-[10px] font-mono uppercase", getStatusColor(h.outcome as ContactStatus))}>
                        {h.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-base p-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <div className="text-sm text-muted-foreground">No outreach history yet</div>
                  <button
                    onClick={() => setActiveTab("composer")}
                    className="btn-primary text-xs mt-3"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Compose First Email
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
