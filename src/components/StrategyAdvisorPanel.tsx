import { useState } from "react";
import type { StrategyAdvice } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

interface StrategyAdvisorPanelProps {
  latestAdvice?: StrategyAdvice;
  topTargets: string[];
  onGenerateAdvice: (prompt: string) => void;
}

export const StrategyAdvisorPanel = ({ latestAdvice, topTargets, onGenerateAdvice }: StrategyAdvisorPanelProps) => {
  const [prompt, setPrompt] = useState("How should I prioritize this week's outreach?");
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Strategy Advisor</CardTitle>
        <Button size="sm" variant="outline" onClick={() => onGenerateAdvice(prompt)}>
          Generate Advice
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-[70px]" />
        <div className="border border-slate-800 p-3 text-sm text-slate-200">
          {latestAdvice?.summary ?? "Ask the advisor for networking strategy recommendations."}
        </div>

        <div className="border border-slate-800 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Top 20 Targets This Week</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {topTargets.slice(0, 20).map((target) => (
              <span key={target} className="border border-slate-800 px-2 py-1 text-xs text-slate-300">
                {target}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
