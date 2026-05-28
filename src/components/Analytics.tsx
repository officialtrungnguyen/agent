import { BarChart3, Download, Upload } from "lucide-react";
import type { Contact, Metrics, OutreachRecord } from "../types";
import { calculateMetrics } from "../lib/intelligence";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface AnalyticsProps {
  contacts: Contact[];
  records: OutreachRecord[];
  onImportRecords: (records: OutreachRecord[]) => void;
}

export function Analytics({ contacts, records, onImportRecords }: AnalyticsProps) {
  const metrics: Metrics = calculateMetrics(records);

  function exportCsv() {
    const rows = [
      ["contact", "firm", "status", "subject", "sentAt", "scheduledFor"],
      ...records.map((record) => {
        const contact = contacts.find((candidate) => candidate.id === record.contactId);
        return [
          contact ? `${contact.firstName} ${contact.lastName}` : record.contactId,
          contact?.firm ?? "",
          record.status,
          record.subject,
          record.sentAt ?? "",
          record.scheduledFor ?? ""
        ];
      })
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bulgebracket-outreach.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file?: File) {
    if (!file) return;
    const text = await file.text();
    const imported = text
      .split("\n")
      .slice(1)
      .map((line, index) => {
        const [contactName, firm, status, subject] = line.split(",").map((cell) => cell.replace(/^"|"$/g, ""));
        const contact = contacts.find((candidate) => `${candidate.firstName} ${candidate.lastName}` === contactName && candidate.firm === firm);
        if (!contact) return undefined;
        return {
          id: `import-${Date.now()}-${index}`,
          contactId: contact.id,
          subject: subject || "Imported outreach",
          body: "Imported from CSV",
          variant: "Short" as const,
          status: status === "Replied" ? "Replied" : "Sent",
          sentAt: new Date().toISOString(),
          hook: "CSV import"
        };
      })
      .filter(Boolean) as OutreachRecord[];
    onImportRecords(imported);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-700" />
          <div>
            <p className="micro-label">CRM + Analytics</p>
            <h2 className="text-lg font-semibold text-slate-950">Pipeline performance</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Sent" value={metrics.sent} />
          <Metric label="Reply rate" value={`${metrics.replyRate}%`} />
          <Metric label="Replies" value={metrics.replies} />
          <Metric label="Positive" value={metrics.positives} />
        </div>
        <div>
          <p className="micro-label mb-2">Best hooks</p>
          <div className="flex flex-wrap gap-2">
            {metrics.bestHooks.map((hook) => (
              <Badge key={hook} tone="blue">
                {hook.slice(0, 70)}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="micro-label mb-2">Best send times</p>
          <div className="flex flex-wrap gap-2">
            {metrics.bestSendTimes.map((time) => (
              <Badge key={time}>{time}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV export
          </Button>
          <label>
            <input className="hidden" type="file" accept=".csv" onChange={(event) => void importCsv(event.target.files?.[0])} />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              <Upload className="h-4 w-4" /> CSV import
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="micro-label">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
