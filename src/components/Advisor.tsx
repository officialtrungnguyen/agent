import { useEffect, useRef, useState } from "react";
import type { Contact, ResumeData, UserProfile, OutreachEmail } from "../types";
import { Button } from "./ui/Button";
import { Send, Bot, User2 } from "lucide-react";
import { advisorReply, type AdvisorTurn } from "../lib/ai/advisor";

interface Props {
  contacts: Contact[];
  emails: OutreachEmail[];
  resume: ResumeData | null;
  profile: UserProfile;
}

const PROMPTS = [
  "Who should I contact next?",
  "How do I write a 7-day follow-up?",
  "What subject lines convert best?",
  "How should I tailor my resume for Houlihan Lokey?",
  "What time should I send to a VP?",
  "How do I run a great 15-minute coffee chat?",
];

export function Advisor({ contacts, emails, resume, profile }: Props) {
  const [history, setHistory] = useState<AdvisorTurn[]>(() => [
    { role: "advisor", text: "I'm your IB recruiting coach. Ask me anything tactical — outreach strategy, follow-ups, sector positioning, resume bullets. I'm always available even when AI quotas are throttled.", at: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function ask(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text) return;
    const userTurn: AdvisorTurn = { role: "user", text, at: new Date().toISOString() };
    const reply = advisorReply(text, { contacts, emails, resume, profile });
    const advTurn: AdvisorTurn = { role: "advisor", text: reply, at: new Date().toISOString() };
    setHistory((h) => [...h, userTurn, advTurn]);
    setInput("");
  }

  return (
    <div className="panel h-[calc(100vh-220px)] flex flex-col">
      <div className="px-4 py-3 hairline-b flex items-center gap-2">
        <div className="h-7 w-7 rounded-sharp bg-graphite-900 text-graphite-50 grid place-items-center"><Bot size={14} /></div>
        <div>
          <div className="text-sm font-semibold">Strategy Advisor</div>
          <div className="micro mt-0.5">// always available · offline-first rules engine</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
        {history.map((t, i) => (
          <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[80%] px-3 py-2 rounded-sharp text-[12.5px] whitespace-pre-wrap " +
                (t.role === "user"
                  ? "bg-graphite-900 text-graphite-50"
                  : "bg-graphite-50 text-graphite-900 hairline")
              }
            >
              <div className="micro mb-1 flex items-center gap-1">
                {t.role === "user" ? <User2 size={9} /> : <Bot size={9} />} {t.role === "user" ? "you" : "advisor"}
              </div>
              {t.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-4 py-2 hairline-t flex flex-wrap gap-1">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => ask(p)} className="h-7 px-2 hairline rounded-sharp text-[11px] hover:bg-graphite-100">{p}</button>
        ))}
      </div>
      <div className="p-3 hairline-t flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="Ask anything — strategy, follow-ups, sector POV…"
          className="input-lg flex-1"
        />
        <Button variant="primary" leading={<Send size={12} />} onClick={() => ask()}>Send</Button>
      </div>
    </div>
  );
}
