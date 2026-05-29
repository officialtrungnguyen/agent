"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Coffee,
  Target,
  Award,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn, getFitScoreColor } from "@/lib/utils";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export function AnalyticsDashboard() {
  const { contacts, emailQueue } = useAppStore();

  const analytics = useMemo(() => {
    const totalContacts = contacts.length;
    const sent = contacts.filter((c) => c.status === "sent" || c.status === "replied" || c.status === "positive" || c.status === "coffee_chat").length;
    const replied = contacts.filter((c) => c.status === "replied" || c.status === "positive" || c.status === "coffee_chat").length;
    const positive = contacts.filter((c) => c.status === "positive" || c.status === "coffee_chat").length;
    const coffeeChats = contacts.filter((c) => c.status === "coffee_chat").length;
    const replyRate = sent > 0 ? (replied / sent) * 100 : 0;
    const avgFitScore = contacts.reduce((a, b) => a + b.fitScore, 0) / totalContacts;

    const byFirm = contacts.reduce<Record<string, number>>((acc, c) => {
      acc[c.firm] = (acc[c.firm] || 0) + 1;
      return acc;
    }, {});

    const byStatus = contacts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const bySeniority = contacts.reduce<Record<string, number>>((acc, c) => {
      acc[c.seniority] = (acc[c.seniority] || 0) + 1;
      return acc;
    }, {});

    const topFirms = Object.entries(byFirm)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([firm, count]) => ({ firm: firm.split(" ").slice(0, 2).join(" "), count }));

    const statusData = Object.entries(byStatus).map(([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
    }));

    const seniorityOrder = ["analyst", "associate", "vp", "director", "md", "partner"];
    const seniorityData = seniorityOrder.map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: bySeniority[s] || 0,
    }));

    const fitDistribution = [
      { range: "90-100", count: contacts.filter((c) => c.fitScore >= 90).length },
      { range: "80-89", count: contacts.filter((c) => c.fitScore >= 80 && c.fitScore < 90).length },
      { range: "70-79", count: contacts.filter((c) => c.fitScore >= 70 && c.fitScore < 80).length },
      { range: "60-69", count: contacts.filter((c) => c.fitScore >= 60 && c.fitScore < 70).length },
      { range: "<60", count: contacts.filter((c) => c.fitScore < 60).length },
    ];

    const top20 = [...contacts].sort((a, b) => b.fitScore - a.fitScore).slice(0, 20);

    return {
      totalContacts,
      sent,
      replied,
      positive,
      coffeeChats,
      replyRate,
      avgFitScore,
      topFirms,
      statusData,
      seniorityData,
      fitDistribution,
      top20,
    };
  }, [contacts, emailQueue]);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    sub,
  }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    sub?: string;
  }) => (
    <div className="card-base p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="micro-label mb-2">{label}</div>
          <div className={cn("text-2xl font-mono font-bold", color)}>{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
        </div>
        <div className={cn("p-2 rounded-md bg-current/10", color)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
    </div>
  );

  const tooltipStyle = {
    backgroundColor: "hsl(224, 15%, 8%)",
    border: "1px solid hsl(224, 15%, 13%)",
    borderRadius: "6px",
    color: "hsl(213, 31%, 91%)",
    fontSize: "12px",
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pipeline Analytics</h2>
          <div className="text-xs text-muted-foreground mt-0.5">
            Real-time recruiting pipeline metrics and insights
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-1 rounded">
          <Activity className="w-3 h-3" />
          LIVE DATA
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Contacts"
          value={analytics.totalContacts}
          icon={Users}
          color="text-foreground"
          sub="In your network"
        />
        <StatCard
          label="Emails Sent"
          value={analytics.sent}
          icon={Mail}
          color="text-blue-400"
          sub={`${((analytics.sent / analytics.totalContacts) * 100).toFixed(0)}% of contacts`}
        />
        <StatCard
          label="Reply Rate"
          value={`${analytics.replyRate.toFixed(0)}%`}
          icon={MessageSquare}
          color="text-emerald-400"
          sub={`${analytics.replied} replies received`}
        />
        <StatCard
          label="Positive Outcomes"
          value={analytics.positive}
          icon={Coffee}
          color="text-amber-400"
          sub={`${analytics.coffeeChats} coffee chats`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4">
          <div className="micro-label mb-2">Avg Fit Score</div>
          <div className={cn("text-2xl font-mono font-bold", getFitScoreColor(analytics.avgFitScore))}>
            {analytics.avgFitScore.toFixed(0)}
          </div>
          <div className="w-full h-1.5 rounded-full bg-border mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${analytics.avgFitScore}%` }}
            />
          </div>
        </div>
        <div className="card-base p-4">
          <div className="micro-label mb-2">Queue Status</div>
          <div className="text-2xl font-mono font-bold text-violet-400">
            {emailQueue.filter((e) => e.status === "queued" || e.status === "scheduled").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">emails pending</div>
        </div>
        <div className="card-base p-4">
          <div className="micro-label mb-2">No-Reply Flags</div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {contacts.filter((c) => {
              if (c.status !== "sent" || !c.lastOutreach) return false;
              return Math.floor((Date.now() - new Date(c.lastOutreach).getTime()) / 86400000) >= 7;
            }).length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">follow-ups needed</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Firm */}
        <div className="card-base p-4">
          <div className="micro-label mb-4">Contacts by Firm</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.topFirms} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="firm" type="category" width={80} tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Seniority */}
        <div className="card-base p-4">
          <div className="micro-label mb-4">Contacts by Seniority</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.seniorityData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card-base p-4">
          <div className="micro-label mb-4">Status Distribution</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analytics.statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {analytics.statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{d.name}</span>
                  <span className="font-mono text-foreground ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fit Score Distribution */}
        <div className="card-base p-4">
          <div className="micro-label mb-4">Fit Score Distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analytics.fitDistribution} barSize={32}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 20 Targets */}
      <div className="card-base overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <div className="micro-label">Top 20 Targets This Week</div>
        </div>
        <div className="divide-y divide-border">
          {analytics.top20.slice(0, 10).map((contact, i) => (
            <div key={contact.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-[11px] font-mono text-muted-foreground w-5">{i + 1}</span>
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-mono text-indigo-300 shrink-0">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">
                  {contact.firstName} {contact.lastName}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {contact.title} · {contact.firm}
                </div>
              </div>
              <div className={cn("text-sm font-mono font-bold shrink-0", getFitScoreColor(contact.fitScore))}>
                {contact.fitScore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
