import { format } from "date-fns";
import { Copy, ExternalLink, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { Contact } from "@/types";
import { buildGoogleSearchUrl, buildLinkedInSearchUrl, formatCurrencyMillions } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactIntelligenceProps {
  apiBaseUrl: string;
  contact: Contact | null;
}

interface IntelPayload {
  generatedAt: string;
  deskMetrics: string[];
  teamMoves: string[];
  marketSignals: string[];
}

const defaultIntel: IntelPayload = {
  generatedAt: new Date().toISOString(),
  deskMetrics: [
    "Middle-market M&A pipelines are +14% QoQ across sponsor-backed sell-side mandates.",
    "Cross-border strategic activity increased in software and business services over the last six weeks.",
  ],
  teamMoves: [
    "Associate class expansion expected after summer analyst conversion decisions.",
    "Sector-focused execution teams continue shifting toward speedier diligence cycles.",
  ],
  marketSignals: [
    "Valuation spreads narrowed for profitable software assets with mission-critical retention metrics.",
    "Healthcare services buyer appetite remains strongest in physician services roll-ups.",
  ],
};

export function ContactIntelligence({ apiBaseUrl, contact }: ContactIntelligenceProps) {
  const [intel, setIntel] = useState<IntelPayload>(defaultIntel);
  const [loading, setLoading] = useState(false);

  const linkedInUrl = useMemo(() => (contact ? buildLinkedInSearchUrl(contact) : "#"), [contact]);
  const googleUrl = useMemo(() => (contact ? buildGoogleSearchUrl(contact) : "#"), [contact]);

  async function runIntelAgent() {
    if (!contact) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/intel/contact/${contact.id}?live=true`);
      if (!response.ok) throw new Error("intel request failed");
      const payload = (await response.json()) as IntelPayload;
      setIntel(payload);
    } catch {
      setIntel({
        ...defaultIntel,
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  if (!contact) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Contact Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Select a banker to view deep profile intelligence.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle>Profile Intelligence</CardTitle>
          <p className="mt-1 text-sm text-slate-300">
            {contact.firstName} {contact.lastName} · {contact.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runIntelAgent}>
            <RefreshCcw className="h-3 w-3" />
            {loading ? "Scanning..." : "Run Intel"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{contact.firm}</Badge>
          <Badge>{contact.teamDesk}</Badge>
          <Badge>{contact.school}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={linkedInUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full">
              LinkedIn Search
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full">
              Google Search
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Team / Desk</h4>
          <p className="text-sm text-slate-200">{contact.teamDesk}</p>
          <p className="text-xs text-slate-400">Coverage: {contact.coverageSectors.join(", ")}</p>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Recent Key Transactions
          </h4>
          <div className="space-y-2">
            {contact.recentDeals.map((deal) => (
              <div key={deal.id} className="rounded-md border border-slate-800 p-2">
                <p className="text-sm text-slate-100">
                  {deal.company} × {deal.counterparty}
                </p>
                <p className="text-xs text-slate-400">
                  {deal.transactionType} · {formatCurrencyMillions(deal.valueUSDMillions)} ·{" "}
                  {format(new Date(deal.announcementDate), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Shared Alumni Interests & Style
          </h4>
          <p className="text-sm text-slate-200">{contact.personalStyle}</p>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            AI Intel Scoping Agent
          </h4>
          <p className="text-xs text-slate-500">Updated {format(new Date(intel.generatedAt), "MMM d, h:mm a")}</p>
          <ul className="space-y-1 text-sm text-slate-200">
            {intel.deskMetrics.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <ul className="space-y-1 text-sm text-slate-200">
            {intel.teamMoves.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <ul className="space-y-1 text-sm text-slate-200">
            {intel.marketSignals.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Hyper-Personalized Icebreakers
          </h4>
          <div className="space-y-2">
            {contact.icebreakers.slice(0, 5).map((line) => (
              <div key={line} className="flex items-start justify-between gap-2 rounded-md border border-slate-800 p-2">
                <p className="text-sm text-slate-200">{line}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(line)}
                  aria-label="Copy icebreaker"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
