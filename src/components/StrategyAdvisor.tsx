"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { X, Sparkles, Send, Bot } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, MicroLabel, Spinner } from "@/components/ui";
import { strategyAdvice } from "@/lib/ai";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Who should I prioritize this week?",
  "How do I handle no replies?",
  "What subject lines work best?",
  "How should I prep for a coffee chat?",
  "When is the best time to send?",
];

export function StrategyAdvisor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { contacts, getState, resume } = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "I'm your IB recruiting strategist. Ask me anything about targeting, sequencing, follow-ups, or coffee-chat prep — I'll tailor advice to your resume and current pipeline.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => {
    let sent = 0, replied = 0, queued = 0;
    const firmTally: Record<string, number> = {};
    for (const c of contacts) {
      const st = getState(c.id);
      if (st.status === "sent" || st.status === "no_reply" || st.status === "replied" || st.status === "meeting") sent++;
      if (st.status === "replied" || st.status === "meeting") replied++;
      if (st.status === "queued" || st.status === "scheduled") queued++;
      if (st.emailIds.length) firmTally[c.firm] = (firmTally[c.firm] || 0) + 1;
    }
    const topFirms = Object.entries(firmTally).sort((a, b) => b[1] - a[1]).map(([f]) => f);
    return { resume, totalContacts: contacts.length, sent, replied, queued, topFirms };
  }, [contacts, getState, resume]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);

    // Local, always-on advice (offline-first).
    const local = strategyAdvice(question, ctx);

    // Optional AI enrichment.
    try {
      const prompt = `You are an elite IB recruiting coach. The student's pipeline: ${ctx.sent} contacts reached, ${ctx.replied} replies, ${ctx.queued} queued, targeting ${resume?.targetRole || "IB Analyst"}${resume?.school ? ` from ${resume.school}` : ""}. Question: "${question}". Give specific, tactical, <120-word advice.`;
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      const text = data.ok && data.text ? String(data.text).trim() : local;
      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: local }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-slate-50"><Sparkles size={14} /></div>
            <div>
              <div className="text-sm font-semibold leading-tight">Strategy Advisor</div>
              <MicroLabel className="leading-tight">Personalized IB coaching</MicroLabel>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-50"><Bot size={12} /></div>
              )}
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-700"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-50"><Bot size={12} /></div>
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-400"><Spinner size={14} /></div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 hover:bg-slate-50">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-slate-200 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask your recruiting strategist…"
            className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm focus-ring"
          />
          <Button variant="primary" size="icon" onClick={() => ask(input)} disabled={busy}>
            <Send size={15} />
          </Button>
        </div>
      </aside>
    </div>
  );
}
