import { ExternalLink, Sparkles } from "lucide-react";
import { Contact, ParsedResume } from "../types";
import { generateIcebreakers, generateTailoredBullets } from "../lib/aiEngine";
import { formatCurrency } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface ContactIntelligenceProps {
  contact?: Contact;
  resume?: ParsedResume;
  onCopy: (text: string) => void;
}

export function ContactIntelligence({ contact, resume, onCopy }: ContactIntelligenceProps) {
  if (!contact) {
    return (
      <Card className="h-full">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Research Agent</p>
          <h2 className="text-lg font-semibold">Select a banker</h2>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Open any profile to see exact search links, deal intelligence, icebreakers, desk metrics, and tailored
          resume bullets.
        </CardContent>
      </Card>
    );
  }

  const icebreakers = generateIcebreakers(contact, resume);
  const bullets = generateTailoredBullets(contact, resume);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deep Profile Intelligence</p>
            <h2 className="text-xl font-semibold">
              {contact.firstName} {contact.lastName}
            </h2>
            <p className="text-sm text-slate-600">
              {contact.title}, {contact.firm} - {contact.geography}
            </p>
          </div>
          <Badge tone="blue">{contact.priority}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.open(contact.linkedinUrl, "_blank")}>
            Exact LinkedIn <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.open(contact.googleSearchUrl, "_blank")}>
            Google Research <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="bb-scrollbar max-h-[74vh] space-y-5 overflow-auto">
        <section className="grid gap-3 md:grid-cols-3">
          <Metric label="Team/Desk" value={contact.team} />
          <Metric label="Active Mandates" value={String(contact.deskMetrics.activeMandates)} />
          <Metric label="Warmth" value={`${contact.deskMetrics.responseWarmth}/100`} />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Coverage Sectors</p>
          <div className="flex flex-wrap gap-2">
            {contact.coverageSectors.map((sector) => (
              <Badge key={sector}>{sector}</Badge>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5" /> AI Intel Scoping Agent
          </p>
          <div className="space-y-3">
            {contact.recentTransactions.map((deal) => (
              <div key={`${deal.company}-${deal.announced}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">
                      {deal.company} / {deal.counterparty}
                    </p>
                    <p className="text-xs text-slate-500">
                      {deal.role} - {deal.sector} - {new Date(deal.announced).getFullYear()}
                    </p>
                  </div>
                  <Badge tone="green">{formatCurrency(deal.value)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{deal.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shared Alumni Interests</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {contact.alumniInterests.map((interest) => (
              <li key={interest}>- {interest}</li>
            ))}
          </ul>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Copyable Icebreakers</p>
          <div className="space-y-2">
            {icebreakers.map((icebreaker) => (
              <button
                key={icebreaker}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm text-slate-700 transition hover:border-slate-400"
                onClick={() => onCopy(icebreaker)}
              >
                {icebreaker}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tailored Resume Bullets</p>
          <div className="space-y-2">
            {bullets.map((bullet) => (
              <button
                key={bullet}
                className="w-full rounded-lg border border-slate-200 bg-slate-950 p-3 text-left text-sm text-white transition hover:bg-slate-800"
                onClick={() => onCopy(bullet)}
              >
                {bullet}
              </button>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
