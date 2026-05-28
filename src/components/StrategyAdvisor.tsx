import { ArrowUpRight, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { buildStrategyAnswer } from '../lib/recruiting';
import type { AppState } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface StrategyAdvisorProps {
  state: AppState;
  onAsk: (question: string, answer: string) => void;
}

export function StrategyAdvisor({ state, onAsk }: StrategyAdvisorProps) {
  const [question, setQuestion] = useState('Who should I prioritize this week?');
  const quickActions = [
    'Who should I prioritize this week?',
    'How should I handle my no-reply list?',
    'What should I improve on my resume bullets?',
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="micro-label">Strategy Advisor</div>
        <CardTitle className="mt-2 text-xl">Personal networking coach</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((quickAction) => (
            <Button key={quickAction} variant="outline" size="sm" onClick={() => setQuestion(quickAction)}>
              <ArrowUpRight className="h-4 w-4" /> {quickAction}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about hooks, targets, follow-ups, or send timing" />
          <Button
            onClick={() => {
              const answer = buildStrategyAnswer(question, state);
              onAsk(question, answer);
              setQuestion('');
            }}
          >
            <MessageSquareText className="h-4 w-4" /> Ask
          </Button>
        </div>

        <ScrollArea className="h-[320px] rounded-xl border border-slate-800 bg-slate-950/50">
          <div className="space-y-3 p-4">
            {state.strategyMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-3 text-sm ${
                  message.role === 'assistant'
                    ? 'border-slate-800 bg-slate-900/70 text-slate-200'
                    : 'border-slate-700 bg-slate-950 text-slate-300'
                }`}
              >
                <div className="micro-label">{message.role}</div>
                <div className="mt-2 whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
