import { Copy, ExternalLink, Radar } from "lucide-react";
import type { Contact, ResumeProfile } from "../types";
import { createLinkedInSearchUrl } from "../contactsData";
import { buildIcebreakers, calculateFitScore } from "../lib/intelligence";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";

interface ContactIntelligenceProps {
  contact?: Contact;
  resume: ResumeProfile;
}

export function ContactIntelligence({ contact, resume }: ContactIntelligenceProps) {
  if (!contact) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Select a banker to launch the profile intelligence panel.
        </CardContent>
      </Card>
    );
  }

  const icebreakers = buildIcebreakers(contact, resume);
  const fitScore = calculateFitScore(contact, resume);
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} ${contact.team}`
  )}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="micro-label">Deep Profile Intelligence</p>
            <h2 className="text-xl font-semibold text-slate-950">
              {contact.firstName} {contact.lastName}
            </h2>
            <p className="text-sm text-slate-500">
              {contact.title} · {contact.location}
            </p>
          </div>
          <div className="text-right">
            <p className="micro-label">AI Fit</p>
            <p className="text-3xl font-bold text-slate-950">{fitScore}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <a href={createLinkedInSearchUrl(contact)} target="_blank" rel="noreferrer">
            <Button>
              <ExternalLink className="h-4 w-4" /> LinkedIn exact search
            </Button>
          </a>
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <Button>
              <ExternalLink className="h-4 w-4" /> Google with school
            </Button>
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <InfoBlock label="Team / Desk" value={contact.team} />
          <InfoBlock label="Shared alumni tie" value={contact.school} />
        </div>

        <div>
          <p className="micro-label mb-2">Coverage sectors</p>
          <div className="flex flex-wrap gap-2">
            {contact.coverageSectors.map((sector) => (
              <Badge key={sector} tone="blue">
                {sector}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <Radar className="h-4 w-4 text-slate-600" />
            <p className="micro-label">AI Intel Scoping Agent</p>
          </div>
          <div className="divide-y divide-slate-200">
            {contact.recentDeals.map((deal) => (
              <div key={`${deal.company}-${deal.counterparty}`} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {deal.company} / {deal.counterparty}
                  </p>
                  <Badge tone="green">
                    {deal.value} · {deal.date}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {deal.type}: {deal.angle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="micro-label mb-2">Personal style and icebreakers</p>
          <div className="space-y-2">
            {contact.personalStyle.map((style) => (
              <p key={style} className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">
                {style}
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="micro-label mb-2">Copyable hooks</p>
          <div className="space-y-2">
            {icebreakers.slice(0, 5).map((hook) => (
              <button
                key={hook}
                className="flex w-full items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-700 transition hover:border-slate-950"
                onClick={() => void navigator.clipboard.writeText(hook)}
              >
                <Copy className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>{hook}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="micro-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
