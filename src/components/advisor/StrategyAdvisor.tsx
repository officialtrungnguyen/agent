"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  MessageSquare,
  Send,
  Zap,
  TrendingUp,
  Target,
  Brain,
  Lightbulb,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  insights?: string[];
  priority?: "high" | "medium" | "low";
}

const QUICK_QUESTIONS = [
  "Who should I reach out to first this week?",
  "How do I write a better cold email for MDs?",
  "What's my follow-up strategy for no-replies?",
  "How do I differentiate at elite boutiques like Centerview?",
  "Which firms should I prioritize given my background?",
  "How many emails should I send per week?",
];

export function StrategyAdvisor() {
  const { contacts, emailQueue, resume } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I'm your personal IB recruiting strategy advisor. I know your full pipeline, all ${contacts.length} contacts, and — if you've uploaded your resume — your background in detail.\n\nAsk me anything about your recruiting strategy.`,
      actions: [
        "Check your Top 20 Targets in the Analytics tab",
        "Upload your resume for fully personalized advice",
        "Review any contacts with no-reply flags",
      ],
      priority: "medium",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const sentCount = contacts.filter((c) =>
      ["sent", "replied", "positive", "coffee_chat"].includes(c.status)
    ).length;
    const replyCount = contacts.filter((c) =>
      ["replied", "positive", "coffee_chat"].includes(c.status)
    ).length;

    try {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contactCount: contacts.length,
          sentCount,
          replyCount,
          resume,
        }),
      });

      if (!res.ok) throw new Error("Failed to get advice");
      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.recommendation || "Here's my strategic advice for your situation.",
        actions: data.actions || [],
        insights: data.insights || [],
        priority: data.priority || "medium",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting to the AI. Here's my offline advice based on your pipeline.",
        actions: [
          "Focus on school-match contacts first — they reply 3× more often",
          "Send follow-ups to all 7+ day no-replies immediately",
          "Target analysts and associates before reaching out to MDs",
        ],
        insights: [
          `You have ${contacts.length} contacts to work with`,
          `${sentCount} emails sent so far in your pipeline`,
        ],
        priority: "medium",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const sentCount = contacts.filter((c) =>
    ["sent", "replied", "positive", "coffee_chat"].includes(c.status)
  ).length;
  const replyCount = contacts.filter((c) =>
    ["replied", "positive", "coffee_chat"].includes(c.status)
  ).length;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-60 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="micro-label mb-3">Pipeline Summary</div>
          <div className="space-y-2">
            {[
              { label: "Total Contacts", value: contacts.length, color: "text-foreground" },
              { label: "Sent", value: sentCount, color: "text-blue-400" },
              { label: "Replies", value: replyCount, color: "text-emerald-400" },
              {
                label: "Reply Rate",
                value: sentCount > 0 ? `${((replyCount / sentCount) * 100).toFixed(0)}%` : "0%",
                color: "text-amber-400",
              },
              {
                label: "Queue",
                value: emailQueue.filter((e) => e.status === "queued").length,
                color: "text-violet-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span className={cn("text-[11px] font-mono font-bold", color)}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <div className="micro-label mb-3">Quick Questions</div>
          <div className="space-y-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground px-2 py-1.5 rounded hover:bg-accent transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {resume && (
          <div className="p-4">
            <div className="micro-label mb-2">Your Profile</div>
            <div className="card-base p-3 space-y-1">
              <div className="text-xs font-medium">{resume.name}</div>
              <div className="text-[10px] text-muted-foreground">{resume.education?.[0]?.institution}</div>
              <div className="text-[10px] text-indigo-400">{resume.targetRole}</div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-600/30 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className={cn("max-w-lg", msg.role === "user" ? "max-w-sm" : "")}>
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-indigo-600 text-white ml-4"
                      : "bg-card border border-border text-foreground"
                  )}
                >
                  {msg.content}
                </div>

                {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="micro-label text-indigo-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Action Items
                    </div>
                    <div className="space-y-1.5">
                      {msg.actions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 px-3 py-2 rounded-md bg-card border border-border text-xs text-muted-foreground"
                        >
                          <div className="w-4 h-4 rounded bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-[10px] font-mono text-indigo-400 shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && msg.insights && msg.insights.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="micro-label text-amber-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Key Insights
                    </div>
                    <div className="space-y-1">
                      {msg.insights.map((insight, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <div className="text-amber-400 mt-0.5">·</div>
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-600/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-card border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce animation-delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce animation-delay-200" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your strategy advisor anything about IB recruiting..."
              className="input-base flex-1 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-4"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Your full pipeline context is included automatically in every response
          </div>
        </div>
      </div>
    </div>
  );
}
