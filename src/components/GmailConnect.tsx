import { useState } from "react";
import { Mail, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getAuthUrl, getGmailStatus } from "@/lib/gmailClient";
import { loadSettings, saveSettings } from "@/lib/storage";

interface Props {
  onConnected: () => void;
}

export function GmailConnect({ onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settings = loadSettings();

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await getAuthUrl();
      const popup = window.open(
        url,
        "gmail-oauth",
        "width=520,height=640,scrollbars=yes"
      );
      if (!popup) {
        setError(
          "Popup blocked. Click 'Open in new tab' below to complete Gmail authorization."
        );
        window.open(url, "_blank");
        setLoading(false);
        return;
      }
      const poll = setInterval(async () => {
        try {
          const status = await getGmailStatus();
          if (status.connected) {
            clearInterval(poll);
            popup.close();
            saveSettings({
              ...loadSettings(),
              gmailConnected: true,
              gmailEmail: status.email,
            });
            onConnected();
            setLoading(false);
          }
        } catch {
          /* retry */
        }
        if (popup.closed) {
          clearInterval(poll);
          const status = await getGmailStatus();
          if (status.connected) {
            saveSettings({
              ...loadSettings(),
              gmailConnected: true,
              gmailEmail: status.email,
            });
            onConnected();
          }
          setLoading(false);
        }
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
      setLoading(false);
    }
  };

  const openTab = async () => {
    try {
      const url = await getAuthUrl();
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {settings.gmailConnected ? (
        <Badge variant="replied">
          <Mail className="mr-1 inline h-3 w-3" />
          {settings.gmailEmail ?? "Gmail Connected"}
        </Badge>
      ) : (
        <>
          <Button size="sm" onClick={connect} disabled={loading}>
            <Mail className="h-4 w-4" />
            {loading ? "Connecting…" : "Connect Gmail"}
          </Button>
          <Button size="sm" variant="outline" onClick={openTab}>
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </Button>
        </>
      )}
      {error && (
        <span className="max-w-xs text-xs text-amber-700">{error}</span>
      )}
    </div>
  );
}
