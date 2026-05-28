import { useMemo } from "react";
import { Copy, Linkedin, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Contact, ResumeData } from "@/types";
import {
  enrichContactIntel,
  getTeamMoves,
  getLiveEnrichmentStatus,
} from "@/data/offlineIntel";
import { generateIcebreakers } from "@/data/offlineAI";
import { googleSearchUrl, linkedInSearchUrl } from "@/lib/utils";

interface Props {
  contact: Contact;
  resume: ResumeData | null;
  onClose: () => void;
}

export function ContactIntelligence({ contact, resume, onClose }: Props) {
  const enriched = useMemo(() => enrichContactIntel(contact), [contact]);
  const icebreakers = useMemo(
    () => generateIcebreakers(enriched, resume),
    [enriched, resume]
  );
  const teamMoves = getTeamMoves(enriched.firm, enriched.team);
  const mode = getLiveEnrichmentStatus();

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const linkedIn = linkedInSearchUrl(
    enriched.firstName,
    enriched.lastName,
    enriched.firm,
    enriched.school
  );
  const google = googleSearchUrl(
    enriched.firstName,
    enriched.lastName,
    enriched.firm,
    enriched.school
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-graphite-200 bg-white shadow-none">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-graphite-900">
            {enriched.firstName} {enriched.lastName}
          </h2>
          <p className="text-sm text-graphite-600">
            {enriched.title} · {enriched.firm}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <a href={linkedIn} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
          </a>
          <a href={google} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <Search className="h-4 w-4" />
              Google
            </Button>
          </a>
          <Badge variant={mode === "offline" ? "medium" : "replied"}>
            Intel: {mode}
          </Badge>
        </div>

        <Section title="Team / Desk">
          <p className="text-sm">{enriched.team}</p>
          <p className="mt-1 text-xs text-graphite-500">{enriched.deskMetrics}</p>
        </Section>

        <Section title="Coverage Sectors">
          <div className="flex flex-wrap gap-1">
            {enriched.coverage.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </Section>

        <Section title="Recent Key Transactions">
          <ul className="space-y-2 text-sm">
            {enriched.recentDeals.map((d, i) => (
              <li
                key={i}
                className="rounded border border-graphite-100 px-2 py-1.5"
              >
                <span className="font-medium">{d.company}</span>
                <span className="text-graphite-500"> · {d.value}</span>
                <br />
                <span className="text-xs text-graphite-500">
                  {d.date} — {d.role}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="AI Intel Scoping Agent">
          <div className="flex items-center gap-2 text-xs text-graphite-500">
            <Sparkles className="h-3 w-3" />
            Team moves & desk metrics (offline enrichment)
          </div>
          <ul className="mt-2 list-inside list-disc text-xs text-graphite-700">
            {teamMoves.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>

        <Section title="Shared Alumni Interests">
          <ul className="text-sm text-graphite-700">
            {enriched.alumniInterests.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
            <li className="mt-1 text-graphite-500">School: {enriched.school}</li>
          </ul>
        </Section>

        <Section title="Personal Style / Icebreakers">
          <p className="text-sm text-graphite-700">{enriched.personalStyle}</p>
          <div className="mt-3 space-y-2">
            {icebreakers.map((ib, i) => (
              <div
                key={i}
                className="group flex items-start justify-between gap-2 rounded border border-graphite-100 p-2 text-xs"
              >
                <p>{ib}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-70 group-hover:opacity-100"
                  onClick={() => copy(ib)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
          {title}
        </span>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
