import { Bot, SendHorizonal } from "lucide-react";
import { useState } from "react";
import type { Contact, OutreachRecord, ResumeProfile } from "../types";
import { calculateFitScore } from "../lib/intelligence";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Input } from "./ui/Form";

interface StrategyAdvisorProps {
  contacts: Contact[];
  records: OutreachRecord[];
  resume: ResumeProfile;
}

export function StrategyAdvisor({ contacts, records, resume }: StrategyAdvisorProps) {
  const [messages, setMessages] = useState([
    {
      role: "advisor",
      text: "I am your IB recruiting strategy advisor. Ask about sequencing, follow-ups, firm targeting, or how to position your resume."
    }
  ]);
  const [prompt, setPrompt] = useState("");

  function answer() {
    const top = contacts
      .map((contact) => ({ contact, fit: calculateFitScore(contact, resume) }))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 3)
      .map(({ contact }) => `${contact.firstName} ${contact.lastName} at ${contact.firm}`)
      .join("; ");
    const sent = records.filter((record) => record.status === "Sent" || record.status === "Delivered").length;
    const reply = records.filter((record) => record.status === "Replied" || record.status === "Positive").length;
    const response = `Based on your target role (${resume.targetRole}), prioritize high-fit alumni first: ${top}. Keep first notes under 150 words, lead with one transaction-specific observation, and batch sends into the 7:30-9:15 AM windows. Current pipeline: ${sent} sent and ${reply} replies; next move is to follow up every no-reply after day 7 with a lower-friction email asking for one pointer.`;
    setMessages((current) => [...current, { role: "user", text: prompt }, { role: "advisor", text: response }]);
    setPrompt("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-slate-700" />
          <div>
            <p className="micro-label">Strategy Advisor</p>
            <h2 className="text-lg font-semibold text-slate-950">Offline-first recruiting coach</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 space-y-2 overflow-y-auto thin-scrollbar">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-lg border p-3 text-sm ${
                message.role === "advisor" ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-950 bg-slate-950 text-white"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={prompt}
            placeholder="Ask for networking strategy..."
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && prompt.trim()) answer();
            }}
          />
          <Button variant="primary" disabled={!prompt.trim()} onClick={answer}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
