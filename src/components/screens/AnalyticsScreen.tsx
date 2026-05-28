import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

export function AnalyticsScreen() {
  const contacts = useAppStore((s) => s.contacts);
  const drafts = useAppStore((s) => s.drafts);

  const m = useMemo(() => {
    const sent = contacts.filter((c) => ["sent", "opened", "replied", "no_reply", "meeting_set"].includes(c.status));
    const replied = contacts.filter((c) => c.status === "replied" || c.status === "meeting_set");
    const meetings = contacts.filter((c) => c.status === "meeting_set");
    const byFirmTotal = new Map<string, { sent: number; replied: number }>();
    for (const c of sent) {
      const e = byFirmTotal.get(c.firm) ?? { sent: 0, replied: 0 };
      e.sent += 1;
      if (c.status === "replied" || c.status === "meeting_set") e.replied += 1;
      byFirmTotal.set(c.firm, e);
    }
    const firmTable = [...byFirmTotal.entries()]
      .map(([firm, v]) => ({ firm, ...v, rate: v.sent === 0 ? 0 : (v.replied / v.sent) * 100 }))
      .sort((a, b) => b.sent - a.sent);

    const bySector = new Map<string, { sent: number; replied: number }>();
    for (const c of sent) {
      for (const sec of c.coverage) {
        const e = bySector.get(sec) ?? { sent: 0, replied: 0 };
        e.sent += 1;
        if (c.status === "replied" || c.status === "meeting_set") e.replied += 1;
        bySector.set(sec, e);
      }
    }
    const sectorTable = [...bySector.entries()]
      .map(([sec, v]) => ({ sector: sec, ...v, rate: v.sent === 0 ? 0 : (v.replied / v.sent) * 100 }))
      .sort((a, b) => b.rate - a.rate);

    const subjectHookCounts = new Map<string, number>();
    for (const d of drafts) {
      if (d.status !== "sent") continue;
      const firstWord = (d.subject.split(/[\s—-]/)[0] ?? "").toLowerCase();
      if (!firstWord) continue;
      subjectHookCounts.set(firstWord, (subjectHookCounts.get(firstWord) ?? 0) + 1);
    }
    const hooks = [...subjectHookCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    const hoursTable = new Array<number>(24).fill(0);
    for (const d of drafts) {
      if (d.status !== "sent" || !d.sentAt) continue;
      hoursTable[new Date(d.sentAt).getHours()]! += 1;
    }
    const bestHour = hoursTable.reduce((acc, v, i) => (v > acc.v ? { i, v } : acc), { i: -1, v: -1 });

    return {
      total: contacts.length,
      sent: sent.length,
      replied: replied.length,
      meetings: meetings.length,
      rate: sent.length === 0 ? 0 : (replied.length / sent.length) * 100,
      firmTable,
      sectorTable,
      hooks,
      hoursTable,
      bestHour,
    };
  }, [contacts, drafts]);

  return (
    <div className="px-6 py-6">
      <div className="mb-4">
        <p className="microlabel">Performance</p>
        <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Analytics</h1>
        <p className="text-xs text-graphite-500">Track what's working — reply rate, top sectors, best hooks, best send times.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Pipeline" value={String(m.total)} hint="alumni tracked" />
        <KPI label="Sent" value={String(m.sent)} hint="outreaches completed" />
        <KPI label="Replied" value={String(m.replied)} hint="positive reply or meeting" />
        <KPI label="Reply rate" value={`${Math.round(m.rate)}%`} hint="goal: 25%+" accent />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="By firm">
          <Table headers={["Firm", "Sent", "Replied", "Rate"]}>
            {m.firmTable.length === 0 && <EmptyRow span={4}>No data yet — start sending.</EmptyRow>}
            {m.firmTable.map((r) => (
              <tr key={r.firm} className="border-t border-graphite-100">
                <td className="px-3 py-2 text-[12px] text-graphite-900">{r.firm}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums text-graphite-700">{r.sent}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums text-graphite-700">{r.replied}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums">
                  <Bar value={r.rate} />
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="By coverage sector">
          <Table headers={["Sector", "Sent", "Replied", "Rate"]}>
            {m.sectorTable.length === 0 && <EmptyRow span={4}>No data yet.</EmptyRow>}
            {m.sectorTable.map((r) => (
              <tr key={r.sector} className="border-t border-graphite-100">
                <td className="px-3 py-2 text-[12px] text-graphite-900">{r.sector}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums text-graphite-700">{r.sent}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums text-graphite-700">{r.replied}</td>
                <td className="px-3 py-2 text-[12px] tabular-nums"><Bar value={r.rate} /></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Best-performing subject hooks">
          {m.hooks.length === 0 ? (
            <p className="text-[11px] text-graphite-400">Send a few emails to discover what works for you.</p>
          ) : (
            <ul className="space-y-1.5">
              {m.hooks.map(([word, count]) => (
                <li key={word} className="flex items-center justify-between rounded-md border border-graphite-200 bg-white px-3 py-2">
                  <span className="text-[12px] text-graphite-900">"{word}…"</span>
                  <Badge variant="muted" className="text-[10px]">{count} sends</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Best hour to send (your data)">
          {m.bestHour.v <= 0 ? (
            <p className="text-[11px] text-graphite-400">Sliced once you've sent a few drafts. Tip: Analysts 7-9am, VP/Director 8-10am, MD 9-11am.</p>
          ) : (
            <div>
              <p className="mb-2 text-[12px] text-graphite-700">Peak send hour: <span className="font-semibold text-graphite-900">{m.bestHour.i}:00</span></p>
              <div className="grid grid-cols-12 gap-0.5">
                {m.hoursTable.map((v, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-12 w-3 overflow-hidden rounded-sm bg-graphite-100">
                      <div className="w-full bg-graphite-900" style={{ height: `${Math.min(100, v * 12)}%`, marginTop: `${100 - Math.min(100, v * 12)}%` }} />
                    </div>
                    {i % 3 === 0 && <span className="mt-1 text-[8px] tabular-nums text-graphite-400">{i}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function KPI({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-graphite-900 bg-graphite-900 text-graphite-50" : "border-graphite-200 bg-white"}`}>
      <p className={`text-[10px] uppercase tracking-microcap ${accent ? "text-graphite-300" : "text-graphite-500"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className={`text-[10px] ${accent ? "text-graphite-400" : "text-graphite-500"}`}>{hint}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface">
      <div className="border-b border-graphite-100 px-4 py-2.5">
        <p className="text-[12px] font-semibold text-graphite-900">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-[12px]">
      <thead className="bg-graphite-50 text-left">
        <tr>
          {headers.map((h) => (
            <th key={h} className="px-3 py-1.5 text-[10px] uppercase tracking-microcap text-graphite-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function EmptyRow({ span, children }: { span: number; children: React.ReactNode }) {
  return <tr><td className="px-3 py-4 text-center text-[11px] text-graphite-400" colSpan={span}>{children}</td></tr>;
}

function Bar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-graphite-100">
        <div className="absolute inset-y-0 left-0 rounded-full bg-graphite-900" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums text-graphite-900">{Math.round(value)}%</span>
    </div>
  );
}
