import { useMemo, useState } from "react";
import { Brain, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
  offline?: boolean;
}

const SEED_MSG: Msg = {
  role: "assistant",
  content:
    "Welcome. Ask anything about your IB recruiting strategy. I have your full pipeline + resume in context. Try:\n\n• \"Who should I email this week and why?\"\n• \"Best subject lines for cold MD outreach.\"\n• \"How do I handle a 7-day no-reply gracefully?\"\n• \"Coach me through a Houlihan superday.\"",
};

const PROMPTS = [
  "Best subject lines this week",
  "How do I follow up after no reply?",
  "Build my Top 20 target list logic",
  "Coach me through a superday",
  "Resume tightening tips for IB",
];

export function StrategyAdvisorScreen() {
  const resume = useAppStore((s) => s.resume);
  const preferences = useAppStore((s) => s.preferences);
  const contacts = useAppStore((s) => s.contacts);
  const drafts = useAppStore((s) => s.drafts);
  const [messages, setMessages] = useState<Msg[]>([SEED_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const pipelineSummary = useMemo(() => {
    const total = contacts.length;
    const sent = contacts.filter((c) => ["sent", "opened", "replied", "no_reply", "meeting_set"].includes(c.status)).length;
    const replied = contacts.filter((c) => c.status === "replied" || c.status === "meeting_set").length;
    const noReply = contacts.filter((c) => c.status === "no_reply").length;
    return `${total} contacts · ${sent} sent · ${replied} replied · ${noReply} no-reply ≥7d · ${drafts.length} drafts`;
  }, [contacts, drafts]);

  async function ask(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg) return;
    setInput("");
    const newHistory: Msg[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setLoading(true);
    const res = await api.aiAdvisor({
      history: newHistory.map((m) => ({ role: m.role, content: m.content })),
      resume: resume ? { ...resume, userName: preferences.userName } : { userName: preferences.userName, targetRole: preferences.targetRole },
      pipelineSummary,
    });
    setMessages([...newHistory, { role: "assistant", content: res?.reply ?? "I lost connection — please try again.", offline: res?.offline ?? true }]);
    setLoading(false);
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="microlabel">Coaching</p>
          <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Strategy Advisor</h1>
          <p className="text-xs text-graphite-500">Personalized AI coach grounded in your resume + pipeline.</p>
        </div>
        <Badge variant="muted" className="text-[10px]">{pipelineSummary}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="surface flex h-[65vh] flex-col">
          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[680px] rounded-md px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-graphite-900 text-graphite-50" : "border border-graphite-200 bg-white text-graphite-900"}`}>
                  {m.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-microcap text-graphite-500">
                      <Brain className="h-3 w-3" />
                      Advisor
                      {m.offline && <span className="rounded-sm bg-graphite-100 px-1 text-[9px] text-graphite-500">offline</span>}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-[11px] text-graphite-400">Thinking…</div>}
          </div>
          <div className="border-t border-graphite-100 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }}
                placeholder="Ask anything · Cmd+Enter to send"
                rows={2}
              />
              <Button onClick={() => ask()} disabled={!input.trim() || loading}>
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="surface p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-graphite-700" />
              <p className="text-[12px] font-semibold text-graphite-900">Try a prompt</p>
            </div>
            <div className="space-y-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  className="block w-full rounded-md border border-graphite-200 bg-white px-2.5 py-1.5 text-left text-[12px] text-graphite-700 hover:border-graphite-400 hover:text-graphite-900"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="surface p-4 text-[11px] text-graphite-600">
            <p className="microlabel mb-1">Context</p>
            <ul className="space-y-1">
              <li>Resume: {resume ? "loaded · " + resume.achievements.length + " achievements" : "not uploaded"}</li>
              <li>Target role: {preferences.targetRole}</li>
              <li>Pipeline: {pipelineSummary}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
