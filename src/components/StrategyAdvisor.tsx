import { useState } from "react";
import { Contact, StrategyMessage } from "../types";
import { Badge, Button, Card, SectionHeading, Textarea } from "./ui";

interface StrategyAdvisorProps {
  messages: StrategyMessage[];
  topTargets: Contact[];
  onSendMessage: (message: string) => void;
}

export const StrategyAdvisor = ({ messages, topTargets, onSendMessage }: StrategyAdvisorProps) => {
  const [input, setInput] = useState("");

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Strategy Advisor"
        title="Ask for networking sequencing, pitch calibration, or follow-up prioritization"
        description="The advisor synthesizes your resume, banker fit scores, live queue, and recent outreach momentum into actionable next steps."
      />

      <div className="grid gap-5 p-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-4">
          <div className="mono-label">Suggested Targets</div>
          <div className="mt-4 space-y-3">
            {topTargets.slice(0, 5).map((contact) => (
              <div key={contact.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="font-medium text-slate-100">
                  {contact.firstName} {contact.lastName}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {contact.firm} / {contact.teamDesk}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="muted">{contact.fitScore} fit</Badge>
                  <Badge tone="muted">{contact.coverageSectors[0]}</Badge>
                  <Badge tone="muted">{contact.school}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mono-label">Conversation</div>
          <div className="slate-scroll mt-4 flex max-h-[420px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border border-slate-800 bg-slate-950/70 text-slate-300"
                    : "ml-auto bg-slate-100 text-slate-950"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <Textarea
              value={input}
              placeholder="Examples: Which 5 bankers should I prioritize this week? / How should I tighten my cold email hook for FIG?"
              onChange={(event) => setInput(event.target.value)}
            />
            <Button
              onClick={() => {
                if (!input.trim()) return;
                onSendMessage(input.trim());
                setInput("");
              }}
            >
              Send to advisor
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
};
