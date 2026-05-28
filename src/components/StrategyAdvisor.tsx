import { FormEvent, useState } from "react";
import { Bot, SendHorizontal } from "lucide-react";
import { Contact, ParsedResume, StrategyMessage, UserProfile } from "../types";
import { strategyAdvice } from "../lib/aiEngine";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface StrategyAdvisorProps {
  contacts: Contact[];
  resume?: ParsedResume;
  profile: UserProfile;
}

export function StrategyAdvisor({ contacts, resume, profile }: StrategyAdvisorProps) {
  const [messages, setMessages] = useState<StrategyMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "I can help prioritize bankers, sharpen your pitch, select hooks, and decide when to follow up based on your pipeline.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [prompt, setPrompt] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    const userMessage: StrategyMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString()
    };
    const assistantMessage: StrategyMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: strategyAdvice(prompt, contacts, resume, profile, messages),
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setPrompt("");
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Strategy Advisor</p>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5" /> Recruiting coach
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bb-scrollbar max-h-72 space-y-2 overflow-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 text-sm ${
                message.role === "assistant"
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-slate-950 bg-slate-950 text-white"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={submit}>
          <input
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask for target list, follow-up, hook, or resume advice..."
          />
          <Button type="submit" size="sm">
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
