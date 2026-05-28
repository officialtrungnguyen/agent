import { useMemo } from "react";
import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../types";
import { Stat } from "./ui/Stat";
import { Pill } from "./ui/Pill";
import { Button } from "./ui/Button";
import { FitScore } from "./FitScore";
import { StatusBadge } from "./StatusBadge";
import { ArrowRight, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { priorityRank } from "../lib/ai/scoring";
import { describeWindow, optimalSendTime } from "../lib/ai/scheduler";

interface Props {
  contacts: Contact[];
  emails: OutreachEmail[];
  resume: ResumeData | null;
  profile: UserProfile;
  onOpenContact: (c: Contact) => void;
  onCompose: (c: Contact) => void;
  onSwitchView: (v: "contacts" | "resume" | "outreach" | "analytics" | "advisor" | "settings") => void;
}

export function Dashboard({ contacts, emails, resume, profile, onOpenContact, onCompose, onSwitchView }: Props) {
  const sent = emails.filter((e) => e.status === "sent").length;
  const queued = emails.filter((e) => e.status === "queued" || e.status === "scheduled").length;
  const replied = contacts.filter((c) => c.status === "replied" || c.status === "meeting_set").length;
  const noReply = contacts.filter((c) => c.status === "no_reply").length;

  const topThisWeek = useMemo(() => {
    return [...contacts]
      .filter((c) => c.status === "not_contacted")
      .sort((a, b) => priorityRank(b) - priorityRank(a))
      .slice(0, 20);
  }, [contacts]);

  const followups = useMemo(() => contacts.filter((c) => c.status === "no_reply").slice(0, 8), [contacts]);

  const replyRate = sent > 0 ? Math.round((replied / Math.max(1, sent)) * 100) : 0;

  return (
    <div className="space-y-5">
      {!resume && (
        <div className="panel p-4 flex items-start justify-between gap-4 bg-graphite-900 text-graphite-50 border-graphite-900">
          <div>
            <div className="micro-strong text-graphite-300">// step 1</div>
            <div className="text-sm font-semibold mt-1">Upload your resume to activate hyper-personalization</div>
            <div className="text-[12.5px] mt-1 text-graphite-300">Every email, every fit score, every icebreaker gets tailored to your actual experience.</div>
          </div>
          <Button variant="ghost" onClick={() => onSwitchView("resume")}>Upload Resume <ArrowRight size={12} /></Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Tracked" value={contacts.length} sub="alumni & bankers" />
        <Stat label="Sent" value={sent} sub="all-time" />
        <Stat label="Queued" value={queued} sub="scheduled / pending" />
        <Stat label="Replied" value={replied} sub="active dialogues" />
        <Stat label="No-reply (7d+)" value={noReply} sub="needs follow-up" />
        <Stat label="Reply rate" value={`${replyRate}%`} sub="positive responses" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <section className="panel">
          <div className="px-4 py-3 hairline-b flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={14} /> Top 20 targets this week
              </div>
              <div className="micro mt-1">// ranked by fit × priority × momentum</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSwitchView("contacts")}>All contacts <ArrowRight size={11} /></Button>
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-[12.5px]">
              <thead className="hairline-b bg-graphite-50/60 text-graphite-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]">Fit</th>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]">Name</th>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]">Firm · Team</th>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]">Best Send</th>
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-micro text-[10px]"></th>
                </tr>
              </thead>
              <tbody>
                {topThisWeek.map((c) => (
                  <tr key={c.id} className="hairline-b hover:bg-graphite-50/60">
                    <td className="px-3 py-2"><FitScore score={c.fitScore} size="sm" /></td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.firstName} {c.lastName}</div>
                      <div className="text-[11px] text-graphite-500">{c.seniority}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{c.firm}</div>
                      <div className="text-[11px] text-graphite-500">{c.team}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-[11.5px]">{optimalSendTime(c).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</div>
                      <div className="micro inline-flex items-center gap-1"><Clock size={9} /> {describeWindow(c)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => onOpenContact(c)}>Open</Button>
                        <Button size="sm" variant="primary" onClick={() => onCompose(c)}>Compose</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!topThisWeek.length && (
                  <tr><td colSpan={5} className="p-6 text-center text-graphite-500">All caught up — every priority contact has been touched.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="panel">
            <div className="px-4 py-3 hairline-b flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-700" /> 7-Day follow-ups
              </div>
              <Pill tone="amber">{followups.length}</Pill>
            </div>
            <div className="p-3 space-y-2">
              {followups.map((c) => (
                <div key={c.id} className="hairline rounded-sharp p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[12.5px]">{c.firstName} {c.lastName}</div>
                    <StatusBadge contact={c} />
                  </div>
                  <div className="text-[11px] text-graphite-500 mt-0.5">{c.firm} · {c.team}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onOpenContact(c)}>Open</Button>
                    <Button size="sm" variant="primary" onClick={() => onCompose(c)}>Follow up</Button>
                  </div>
                </div>
              ))}
              {!followups.length && <div className="text-[12.5px] text-graphite-500">No follow-ups due. Nice work.</div>}
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-sm font-semibold">Pitch & Targets</div>
            <div className="micro mt-1">// used to personalize every email</div>
            <div className="mt-2 space-y-2 text-[12.5px]">
              <div><span className="micro">Target role: </span>{profile.targetRole}</div>
              <div><span className="micro">Pitch: </span>{profile.personalPitch}</div>
              <div className="flex items-center flex-wrap gap-1">
                <span className="micro">Priority firms: </span>
                {profile.preferredFirms.map((f) => <Pill key={f}>{f}</Pill>)}
              </div>
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={() => onSwitchView("resume")}>Edit pitch <ArrowRight size={11} /></Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
