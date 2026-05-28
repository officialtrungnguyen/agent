import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { Contact, ContactState, ResumeData } from "@/types";
import { generateFollowUp } from "@/data/offlineAI";
import { daysSince } from "@/lib/utils";
import { loadQueue, saveQueue } from "@/lib/storage";
import { v4 as uuid } from "uuid";

interface Props {
  contact: Contact;
  state: ContactState;
  resume: ResumeData | null;
}

export function FollowUpPanel({ contact, state, resume }: Props) {
  const days = daysSince(state.lastOutreach);
  const needsFollowUp =
    (state.status === "sent" || state.status === "no_reply") && days >= 7;

  const lastRecord = state.outreachHistory[state.outreachHistory.length - 1];
  const originalSubject = lastRecord?.subject ?? "Networking";

  const draft7 = generateFollowUp(contact, resume, 7, originalSubject);
  const draft14 = generateFollowUp(contact, resume, 14, originalSubject);

  const queueFollowUp = (subject: string, body: string) => {
    const q = loadQueue();
    saveQueue([
      ...q,
      {
        id: uuid(),
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName}`,
        subject,
        body,
        status: "queued",
        attachResume: false,
      },
    ]);
  };

  if (!needsFollowUp && state.status !== "sent") return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <span className="font-mono text-[10px] uppercase text-amber-800">
          {needsFollowUp
            ? `⚠ No reply (${days} days) — Smart Follow-up`
            : "Follow-up Drafts"}
        </span>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="amber"
          onClick={() => queueFollowUp(draft7.subject, draft7.body)}
        >
          7-Day Follow-up
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => queueFollowUp(draft14.subject, draft14.body)}
        >
          14-Day Follow-up
        </Button>
      </CardContent>
    </Card>
  );
}
