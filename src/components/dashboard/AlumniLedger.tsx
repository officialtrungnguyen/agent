"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Search,
  SlidersHorizontal,
  Table2,
  Kanban,
  Download,
  Upload,
  Star,
  AlertTriangle,
  ExternalLink,
  Linkedin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  X,
} from "lucide-react";
import {
  cn,
  getStatusColor,
  getStatusLabel,
  getSeniorityColor,
  getSeniorityLabel,
  getPriorityColor,
  getFitScoreColor,
  getFitScoreBarColor,
  getLinkedInSearchUrl,
  getDaysSinceOutreach,
  isNoReply,
  exportContactsToCSV,
} from "@/lib/utils";
import { getAllFirms, getAllSectors } from "@/data/contactsData";
import type { Contact, ContactStatus, Seniority, Priority } from "@/types";
import { KanbanView } from "./KanbanView";

type SortField = "name" | "firm" | "fitScore" | "seniority" | "lastOutreach" | "priority";
type SortDir = "asc" | "desc";

export function AlumniLedger() {
  const {
    getFilteredContacts,
    filters,
    setFilters,
    resetFilters,
    viewMode,
    setViewMode,
    selectContact,
    setActiveTab,
    updateContact,
  } = useAppStore();

  const [sortField, setSortField] = useState<SortField>("fitScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const filteredContacts = getFilteredContacts();
  const allFirms = useMemo(() => getAllFirms(), []);
  const allSectors = useMemo(() => getAllSectors(), []);

  const sorted = useMemo(() => {
    const arr = [...filteredContacts];
    arr.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      switch (sortField) {
        case "name":
          va = `${a.lastName} ${a.firstName}`;
          vb = `${b.lastName} ${b.firstName}`;
          break;
        case "firm":
          va = a.firm;
          vb = b.firm;
          break;
        case "fitScore":
          va = a.fitScore;
          vb = b.fitScore;
          break;
        case "seniority":
          const order = { analyst: 1, associate: 2, vp: 3, director: 4, md: 5, partner: 6 };
          va = order[a.seniority] || 0;
          vb = order[b.seniority] || 0;
          break;
        case "lastOutreach":
          va = a.lastOutreach || "0";
          vb = b.lastOutreach || "0";
          break;
        case "priority":
          const pOrder = { high: 1, medium: 2, low: 3 };
          va = pOrder[a.priority] || 0;
          vb = pOrder[b.priority] || 0;
          break;
      }

      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return arr;
  }, [filteredContacts, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-indigo-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-indigo-400" />
    );
  };

  const handleRowClick = (contact: Contact) => {
    selectContact(contact.id);
    setActiveTab("intelligence");
  };

  const activeFilterCount = [
    filters.firms.length,
    filters.seniorities.length,
    filters.statuses.length,
    filters.priorities.length,
    filters.sectors.length,
    filters.hasNoReply ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleFilter = <T extends string>(
    current: T[],
    value: T,
    key: keyof typeof filters
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: next } as Partial<typeof filters>);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-border shrink-0 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts, firms, teams..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="input-base pl-9 w-full text-xs"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "btn-outline text-xs gap-1.5",
            activeFilterCount > 0 && "border-indigo-500/50 text-indigo-400"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="btn-ghost text-xs text-muted-foreground">
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {/* View Toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "px-2.5 py-1.5 text-xs transition-colors",
              viewMode === "table"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Table2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "px-2.5 py-1.5 text-xs transition-colors",
              viewMode === "kanban"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Kanban className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground font-mono">
            {sorted.length} / {useAppStore.getState().contacts.length} contacts
          </span>
          <button
            onClick={() => exportContactsToCSV(sorted)}
            className="btn-ghost text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-border bg-accent/30 space-y-3">
          {/* Firms */}
          <div>
            <div className="micro-label mb-2">Firm</div>
            <div className="flex flex-wrap gap-1.5">
              {allFirms.slice(0, 12).map((firm) => (
                <button
                  key={firm}
                  onClick={() => toggleFilter(filters.firms, firm, "firms")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] border transition-colors",
                    filters.firms.includes(firm)
                      ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                      : "text-muted-foreground border-border hover:border-indigo-500/30"
                  )}
                >
                  {firm}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Seniority */}
            <div>
              <div className="micro-label mb-2">Seniority</div>
              <div className="flex flex-wrap gap-1.5">
                {(["analyst", "associate", "vp", "director", "md", "partner"] as Seniority[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => toggleFilter(filters.seniorities, s, "seniorities")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] border transition-colors",
                        filters.seniorities.includes(s)
                          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                          : "text-muted-foreground border-border hover:border-indigo-500/30"
                      )}
                    >
                      {getSeniorityLabel(s)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <div className="micro-label mb-2">Priority</div>
              <div className="flex flex-wrap gap-1.5">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleFilter(filters.priorities, p, "priorities")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] border transition-colors capitalize",
                      filters.priorities.includes(p)
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                        : "text-muted-foreground border-border hover:border-indigo-500/30"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <div className="micro-label mb-2">Status</div>
              <div className="flex flex-wrap gap-1.5">
                {(["not_contacted", "sent", "replied", "positive", "no_reply"] as ContactStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => toggleFilter(filters.statuses, s, "statuses")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] border transition-colors",
                        filters.statuses.includes(s)
                          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                          : "text-muted-foreground border-border hover:border-indigo-500/30"
                      )}
                    >
                      {getStatusLabel(s)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* No Reply Filter */}
            <div>
              <div className="micro-label mb-2">Flags</div>
              <button
                onClick={() => setFilters({ hasNoReply: !filters.hasNoReply })}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border transition-colors",
                  filters.hasNoReply
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "text-muted-foreground border-border hover:border-amber-500/30"
                )}
              >
                <AlertTriangle className="w-3 h-3" />
                No Reply {">"} 7 days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <KanbanView contacts={sorted} />
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b border-border">
                  {[
                    { key: "name" as SortField, label: "Contact" },
                    { key: "firm" as SortField, label: "Firm / Team" },
                    { key: "seniority" as SortField, label: "Seniority" },
                    { key: "fitScore" as SortField, label: "Fit Score" },
                    { key: "priority" as SortField, label: "Priority" },
                    { key: "lastOutreach" as SortField, label: "Status" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left px-4 py-2.5 micro-label cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon field={key} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 micro-label text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((contact) => {
                  const noReply = isNoReply(contact);
                  const daysSince = getDaysSinceOutreach(contact.lastOutreach);

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => handleRowClick(contact)}
                      className={cn(
                        "border-b border-border/50 table-row-hover group",
                        noReply && "bg-amber-500/3"
                      )}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600/30 to-blue-600/30 border border-indigo-600/20 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-300 shrink-0">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground leading-none">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              {contact.school}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Firm */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{contact.firm}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-36">
                          {contact.team}
                        </div>
                      </td>

                      {/* Seniority */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "status-badge",
                            getSeniorityColor(contact.seniority)
                          )}
                        >
                          {getSeniorityLabel(contact.seniority)}
                        </span>
                      </td>

                      {/* Fit Score */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-mono text-sm font-bold",
                              getFitScoreColor(contact.fitScore)
                            )}
                          >
                            {contact.fitScore}
                          </span>
                          <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                getFitScoreBarColor(contact.fitScore)
                              )}
                              style={{ width: `${contact.fitScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "status-badge capitalize",
                            getPriorityColor(contact.priority)
                          )}
                        >
                          {contact.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {noReply ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-[11px] font-mono text-amber-400">
                              No reply ({daysSince}d)
                            </span>
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "status-badge",
                              getStatusColor(contact.status)
                            )}
                          >
                            {getStatusLabel(contact.status)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={getLinkedInSearchUrl(contact)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-blue-600/10 text-muted-foreground hover:text-blue-400 transition-colors"
                            title="Search LinkedIn"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => {
                              selectContact(contact.id);
                              setActiveTab("composer");
                            }}
                            className="p-1.5 rounded hover:bg-indigo-600/10 text-muted-foreground hover:text-indigo-400 transition-colors"
                            title="Compose Email"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const next = contact.priority === "high" ? "medium" : contact.priority === "medium" ? "low" : "high";
                              updateContact(contact.id, { priority: next });
                            }}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              contact.priority === "high"
                                ? "text-amber-400 hover:bg-amber-500/10"
                                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                            )}
                            title="Toggle Priority"
                          >
                            <Star className={cn("w-3.5 h-3.5", contact.priority === "high" && "fill-current")} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Filter className="w-8 h-8 mb-2 opacity-50" />
                <div className="text-sm">No contacts match your filters</div>
                <button onClick={resetFilters} className="btn-ghost text-xs mt-2">
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
