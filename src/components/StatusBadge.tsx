import type { Contact } from "../types";
import { Pill } from "./ui/Pill";
import { AlertTriangle } from "lucide-react";

interface Props {
  contact: Contact;
}

export function StatusBadge({ contact }: Props) {
  switch (contact.status) {
    case "not_contacted":
      return <Pill tone="neutral">Not contacted</Pill>;
    case "queued":
      return <Pill tone="blue">Queued</Pill>;
    case "scheduled":
      return <Pill tone="blue">Scheduled</Pill>;
    case "sent":
      return <Pill tone="ink">Sent</Pill>;
    case "replied":
      return <Pill tone="green">Replied</Pill>;
    case "meeting_set":
      return <Pill tone="green">Meeting Set</Pill>;
    case "no_reply": {
      const days = contact.lastOutreachAt
        ? Math.floor((Date.now() - Date.parse(contact.lastOutreachAt)) / (1000 * 60 * 60 * 24))
        : 7;
      return (
        <Pill tone="amber">
          <AlertTriangle size={10} /> No reply · {days}d
        </Pill>
      );
    }
    case "passed":
      return <Pill tone="red">Passed</Pill>;
  }
}
