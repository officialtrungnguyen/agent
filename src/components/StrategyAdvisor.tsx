import { useState } from "react";
import type { Contact, ResumeProfile, StrategyMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface StrategyAdvisorProps {
  apiBaseUrl: string;
  resumeProfile: ResumeProfile | null;
  contacts: Contact[];
  messages: StrategyMessage[];
  onMessagesChange: (messages: StrategyMessage[]) => void;
}

export function StrategyAdvisor({
  apiBaseUrl,
  resumeProfile,
  contacts,
  messages,
  onMessagesChange,
}: StrategyAdvisorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAdvisor() {
    if (!prompt.trim()) return;
    const userMessage: StrategyMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };
    onMessagesChange([...messages, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/strategy/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          resume: resumeProfile,
          pipelineStats: {
            total: contacts.length,
            sent: contacts.filter((contact) => contact.status === "sent" || contact.status === "scheduled").length,
            replied: contacts.filter((contact) => contact.status === "replied").length,
            noReply: contacts.filter((contact) => contact.status === "no_reply").length,
          },
        }),
      });
      if (!response.ok) throw new Error("advisor unavailable");
      const payload = (await response.json()) as { response: string };
      onMessagesChange([
        ...messages,
        userMessage,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: payload.response,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      onMessagesChange([
        ...messages,
        userMessage,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            "Offline advisor fallback: prioritize 20 high-fit contacts, send deal-referenced notes before 9:00 AM, and run 7-day follow-ups daily.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Advisor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-slate-800 p-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md border p-2 text-sm ${
                message.role === "assistant"
                  ? "border-slate-700 bg-slate-900 text-slate-100"
                  : "border-slate-800 bg-slate-950 text-slate-300"
              }`}
            >
              <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">{message.role}</p>
              <p>{message.content}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-slate-500">Ask for targeted networking strategy based on your pipeline.</p>}
        </div>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask: Which 20 bankers should I prioritize this week and why?"
        />
        <Button variant="outline" onClick={askAdvisor} disabled={loading}>
          {loading ? "Thinking..." : "Get Advice"}
        </Button>
      </CardContent>
    </Card>
  );
}
