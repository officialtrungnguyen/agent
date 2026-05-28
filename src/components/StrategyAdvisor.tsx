import * as React from "react";
import { Send, Sparkles, X, Lightbulb } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useApp } from "../store/AppContext";
import { useUI } from "../store/UIContext";
import { cn } from "../lib/utils";
import { strategyAdvisorReply, tryLiveAI, type AdvisorContext } from "../lib/ai";

interface Msg {
  role: "user" | "advisor";
  text: string;
}

const SUGGESTIONS = [
  "Who should I target next?",
  "Is my reply rate any good?",
  "How should I follow up?",
  "What makes a great cold email?",
  "When is the best time to send?",
];

export function StrategyAdvisor() {
  const { advisorOpen, setAdvisorOpen } = useUI();
  const { contacts, analytics, user } = useApp();
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "advisor",
      text: `Hi${user.fullName ? ` ${user.fullName.split(" ")[0]}` : ""} — I'm your recruiting strategist. Ask me who to target, how to write, when to send, or how to follow up. I read your live pipeline to give specific advice.`,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const ctx = React.useMemo<AdvisorContext>(() => {
    const topTargets = [...contacts]
      .filter((c) => c.status === "not_contacted")
      .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    return {
      totalContacts: contacts.length,
      contacted: analytics.contacted,
      replied: analytics.replied,
      topTargets,
      user,
    };
  }, [contacts, analytics, user]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);

    // Try live AI first (optional), always fall back to offline reasoning.
    const offline = strategyAdvisorReply(q, ctx);
    const live = await tryLiveAI("strategy_advice", {
      question: q,
      replyRate: analytics.replyRate,
      contacted: analytics.contacted,
      topTargets: ctx.topTargets.slice(0, 5).map((c) => `${c.firstName} ${c.lastName} (${c.firm}, fit ${c.fitScore})`),
      targetRole: user.targetRole,
    });
    setMessages((m) => [...m, { role: "advisor", text: live || offline }]);
    setThinking(false);
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-40 flex h-full w-full max-w-sm transform flex-col border-l border-graphite-200 bg-white shadow-xl transition-transform duration-300",
        advisorOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-graphite-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-graphite-900 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-graphite-900">Strategy Advisor</h3>
            <p className="text-[11px] text-graphite-400">Reads your live pipeline</p>
          </div>
        </div>
        <button onClick={() => setAdvisorOpen(false)} className="rounded-md p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                m.role === "user" ? "bg-graphite-900 text-white" : "border border-graphite-200 bg-graphite-50 text-graphite-700",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-graphite-200 bg-graphite-50 px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-graphite-400" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-graphite-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="flex items-center gap-1 rounded-full border border-graphite-200 bg-white px-2.5 py-1 text-[11px] text-graphite-600 hover:border-graphite-400 hover:text-graphite-900"
            >
              <Lightbulb className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="flex items-center gap-2"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your strategist…" />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
