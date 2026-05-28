import { useEffect, useState } from "react";
import { Pill } from "./ui/Pill";
import type { UserProfile } from "../types";
import { Button } from "./ui/Button";
import { Mail, RefreshCw } from "lucide-react";

interface Props {
  profile: UserProfile;
  oauthEmail?: string | null;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onRefreshIntel: () => void;
}

export function TopBar({ profile, oauthEmail, onConnectGmail, onDisconnectGmail, onRefreshIntel }: Props) {
  const [now, setNow] = useState<string>(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const id = setInterval(
      () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      30_000
    );
    return () => clearInterval(id);
  }, []);

  const connected = profile.gmailConnected;

  return (
    <header className="h-14 hairline-b bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden lg:block micro">// {profile.targetClass || "target class"}</div>
          <Pill tone="ink">{profile.targetRole || "Target role unset"}</Pill>
          <Pill tone="neutral" title="Local timezone">{profile.timezone}</Pill>
          <Pill tone="neutral">{now} local</Pill>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" leading={<RefreshCw size={12} />} onClick={onRefreshIntel}>
            Re-score
          </Button>
          {connected ? (
            <>
              <Pill tone="green">
                <Mail size={10} /> Gmail · {oauthEmail || "connected"}
              </Pill>
              <Button variant="outline" size="sm" onClick={onDisconnectGmail}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" leading={<Mail size={12} />} onClick={onConnectGmail}>
              Connect Gmail
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
