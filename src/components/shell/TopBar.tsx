import { Activity, Mail, Sparkles, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import { useMemo } from "react";

export function TopBar() {
  const gmail = useAppStore((s) => s.gmail);
  const setGmail = useAppStore((s) => s.setGmail);
  const contacts = useAppStore((s) => s.contacts);
  const resume = useAppStore((s) => s.resume);

  const stats = useMemo(() => {
    const total = contacts.length;
    const sent = contacts.filter((c) => ["sent", "opened", "replied", "no_reply", "meeting_set"].includes(c.status)).length;
    const replied = contacts.filter((c) => c.status === "replied" || c.status === "meeting_set").length;
    return { total, sent, replied, rate: sent === 0 ? 0 : Math.round((replied / sent) * 100) };
  }, [contacts]);

  const connect = async () => {
    const { url, error } = await api.gmailStartUrl(window.location.pathname);
    if (!url) {
      if (error) alert(`Gmail OAuth: ${error}`);
      return;
    }
    const win = window.open(url, "bb_gmail_oauth", "width=520,height=720");
    if (!win) {
      window.location.href = url;
    }
  };

  const disconnect = async () => {
    await api.gmailDisconnect();
    setGmail({ connected: false, identity: null });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-200 bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded bg-graphite-900 text-[10px] font-bold tracking-wider text-graphite-50">
              BB
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold tracking-tight text-graphite-900">BulgeBracket<span className="text-graphite-400">.ai</span></span>
              <span className="microlabel">Investment Banking Recruiting AI</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Stat label="Pipeline" value={stats.total.toString()} />
            <Stat label="Sent" value={stats.sent.toString()} />
            <Stat label="Replied" value={stats.replied.toString()} />
            <Stat label="Reply Rate" value={`${stats.rate}%`} accent />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resume ? (
            <Badge variant="success" className="hidden sm:inline-flex">
              <Sparkles className="h-3 w-3" /> Resume loaded
            </Badge>
          ) : (
            <Badge variant="warn" className="hidden sm:inline-flex">
              <Sparkles className="h-3 w-3" /> Upload resume for max AI
            </Badge>
          )}
          {!gmail.configured && (
            <Badge variant="muted" className="hidden md:inline-flex">
              <Activity className="h-3 w-3" /> Gmail simulation mode
            </Badge>
          )}
          {gmail.connected && gmail.identity?.email ? (
            <div className="flex items-center gap-2 rounded-md border border-graphite-200 bg-white px-2.5 py-1.5">
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              <span className="max-w-[180px] truncate text-xs text-graphite-700">{gmail.identity.email}</span>
              <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
            </div>
          ) : (
            <Button size="sm" variant="default" onClick={connect}>
              {gmail.configured ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{gmail.configured ? "Connect Gmail" : "Set up Gmail"}</span>
            </Button>
          )}
          <Button size="sm" variant="secondary" asChild>
            <a href="#" onClick={(e) => { e.preventDefault(); useAppStore.getState().setView("settings"); }}>
              <Mail className="h-3.5 w-3.5" />
              Settings
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="microlabel">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent ? "text-graphite-900" : "text-graphite-700"}`}>
        {value}
      </span>
    </div>
  );
}
