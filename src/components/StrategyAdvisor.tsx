import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";
import type { ContactState, ResumeData, StrategyMessage } from "@/types";
import { strategyAdvisorReply } from "@/data/offlineAI";
import { loadStrategyChat, saveStrategyChat } from "@/lib/storage";
import { v4 as uuid } from "uuid";

interface Props {
  resume: ResumeData | null;
  states: Record<string, ContactState>;
}

export function StrategyAdvisor({ resume, states }: Props) {
  const [messages, setMessages] = useState<StrategyMessage[]>(() =>
    loadStrategyChat()
  );
  const [input, setInput] = useState("");

  const pipelineStats = {
    sent: Object.values(states).filter((s) => s.status !== "not_contacted").length,
    replies: Object.values(states).filter((s) => s.status === "replied").length,
    noReply: Object.values(states).filter((s) => s.status === "no_reply").length,
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg: StrategyMessage = {
      id: uuid(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const reply: StrategyMessage = {
      id: uuid(),
      role: "assistant",
      content: strategyAdvisorReply(input, resume, pipelineStats),
      timestamp: new Date().toISOString(),
    };
    const next = [...messages, userMsg, reply];
    setMessages(next);
    saveStrategyChat(next);
    setInput("");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-graphite-500" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
            Strategy Advisor
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {messages.length === 0 && (
            <p className="text-graphite-500 text-xs">
              Ask about Top 20 targets, follow-ups, resume attachments, or pipeline strategy.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded border px-2 py-1.5 text-xs ${
                m.role === "user"
                  ? "border-graphite-200 bg-graphite-50 ml-4"
                  : "border-graphite-100 bg-white mr-4"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Who should I follow up with this week?"
            rows={2}
            className="flex-1"
          />
          <Button size="icon" onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
