import { Copy, ExternalLink, MailPlus } from "lucide-react";
import { buildGoogleSearchUrl, buildLinkedInSearchUrl } from "../lib/ai";
import type { Contact, ContactIntel } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ContactIntelligenceProps {
  contact?: Contact;
  intel?: ContactIntel;
  fitScore?: number;
  onQueueOutreach: () => void;
}

export const ContactIntelligence = ({ contact, intel, fitScore, onQueueOutreach }: ContactIntelligenceProps) => {
  if (!contact || !intel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deep Profile Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">Select a contact to open team/desk intel and AI research insights.</CardContent>
      </Card>
    );
  }

  const linkedInUrl = buildLinkedInSearchUrl(contact);
  const googleUrl = buildGoogleSearchUrl(contact);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Deep Profile Intelligence</CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            {contact.firstName} {contact.lastName} · {contact.firm} · {contact.teamDesk}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-slate-600 text-slate-200">AI FIT {fitScore ?? 0}</Badge>
          <Button variant="outline" size="sm" onClick={onQueueOutreach}>
            <MailPlus className="mr-1 h-3.5 w-3.5" /> Queue Outreach
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open(linkedInUrl, "_blank", "noopener,noreferrer")}>
            LinkedIn Search
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(googleUrl, "_blank", "noopener,noreferrer")}>
            Google Search
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Team / Desk</p>
            <p className="mt-1 text-sm text-slate-200">{intel.teamDesk}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Coverage Sectors</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {intel.coverageSectors.map((sector) => (
                <Badge key={sector}>{sector}</Badge>
              ))}
            </div>
          </div>
          <div className="border border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Shared Alumni Interests</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-300">
              {intel.sharedAlumniInterests.map((interest) => (
                <li key={interest}>• {interest}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border border-slate-800 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Recent Key Transactions</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            {intel.transactions.map((transaction) => (
              <li key={transaction.id}>
                • {transaction.company} vs {transaction.counterparty} · ${transaction.valueUsdBillions}B ·{" "}
                {new Date(transaction.announcedAt).toLocaleDateString()} · {transaction.sector}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-slate-800 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Personal Style / Icebreakers</p>
          <ul className="mt-2 space-y-2">
            {intel.icebreakers.slice(0, 5).map((icebreaker) => (
              <li key={icebreaker.id} className="flex items-start justify-between gap-2 border border-slate-900 p-2">
                <span className="text-sm text-slate-200">{icebreaker.text}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(icebreaker.text);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
