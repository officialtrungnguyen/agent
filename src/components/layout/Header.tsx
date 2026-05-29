"use client";

import { useAppStore } from "@/store/useAppStore";
import { Mail, LogOut, User, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

const TAB_LABELS: Record<string, string> = {
  ledger: "Alumni Ledger",
  intelligence: "Contact Intelligence",
  resume: "Resume Intelligence",
  composer: "Outreach Composer",
  queue: "Email Queue",
  analytics: "Analytics",
  advisor: "Strategy Advisor",
  crm: "CRM & Notes",
};

export function Header() {
  const { activeTab, gmailConnected, userEmail, setGmailAuth, clearGmailAuth, contacts } = useAppStore();
  const { data: session } = useSession();

  const noReplyCount = contacts.filter((c) => {
    if (c.status !== "sent" || !c.lastOutreach) return false;
    const days = Math.floor((Date.now() - new Date(c.lastOutreach).getTime()) / 86400000);
    return days >= 7;
  }).length;

  const handleGmailConnect = async () => {
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch {
      toast.error("Failed to connect Gmail. Please try again.");
    }
  };

  const handleGmailDisconnect = async () => {
    await signOut({ redirect: false });
    clearGmailAuth();
    toast.success("Gmail disconnected.");
  };

  // Sync session auth with store
  if (session?.user?.email && session.accessToken && !gmailConnected) {
    setGmailAuth(session.user.email, session.accessToken);
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-foreground">
          {TAB_LABELS[activeTab] || activeTab}
        </h1>
        {noReplyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-mono text-amber-400">
              {noReplyCount} no-reply{noReplyCount > 1 ? "s" : ""} ({">"}7d)
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {gmailConnected && userEmail ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400">Gmail Connected</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {userEmail.split("@")[0]}
              </span>
            </div>
            <button
              onClick={handleGmailDisconnect}
              className="btn-ghost text-xs"
              title="Disconnect Gmail"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGmailConnect}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-indigo-500/50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span className="text-xs">Connect Gmail</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-600/10 border border-indigo-600/20">
          <Zap className="w-3 h-3 text-indigo-400" />
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">AI Ready</span>
        </div>
      </div>
    </header>
  );
}
