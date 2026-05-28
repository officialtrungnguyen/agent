import * as React from "react";
import { Mail, CheckCircle2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Dialog, DialogHeader } from "./ui/Dialog";
import { Badge } from "./ui/Badge";
import { useApp } from "../store/AppContext";
import { useToast } from "./ui/Toast";
import { getAuthUrl, openOAuthPopup, disconnectGmail } from "../lib/gmail";

export function GmailConnect() {
  const { auth, refreshAuth } = useApp();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [authUrl, setAuthUrl] = React.useState<string | null>(null);

  const beginConnect = async () => {
    setConnecting(true);
    const url = await getAuthUrl();
    if (!url) {
      toast.push("Gmail isn't configured on the server yet. See setup steps.", "error");
      setConnecting(false);
      setOpen(true);
      return;
    }
    setAuthUrl(url);
    const ok = await openOAuthPopup(url);
    if (!ok) {
      // popup blocked → keep dialog open with the "open in new tab" CTA
      setOpen(true);
    }
    // Give the backend a beat, then refresh status.
    await new Promise((r) => setTimeout(r, 800));
    await refreshAuth();
    setConnecting(false);
  };

  React.useEffect(() => {
    if (auth.connected) {
      setOpen(false);
      setConnecting(false);
    }
  }, [auth.connected]);

  const disconnect = async () => {
    await disconnectGmail();
    await refreshAuth();
    toast.push("Disconnected from Gmail.", "info");
  };

  if (auth.connected) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="green" mono>
          <CheckCircle2 className="h-3 w-3" /> Gmail Live
        </Badge>
        <button
          onClick={disconnect}
          className="hidden text-xs text-graphite-400 hover:text-graphite-700 sm:inline"
          title={auth.email}
        >
          {auth.email}
        </button>
      </div>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={beginConnect} disabled={connecting}>
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Connect Gmail
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} size="sm">
        <DialogHeader
          title="Connect Gmail"
          subtitle="Real OAuth + Gmail API for live send & scheduling"
          onClose={() => setOpen(false)}
        />
        <div className="space-y-4 px-5 py-4">
          {!auth.configured ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Server not yet configured for Gmail.</p>
                  <p className="mt-1 text-amber-700">
                    Add Google OAuth credentials to <code className="rounded bg-amber-100 px-1">.env</code> on the
                    server, then restart:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-700">
                    <li>Create OAuth credentials in Google Cloud Console</li>
                    <li>Enable the Gmail API</li>
                    <li>
                      Set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and the redirect URI
                    </li>
                    <li>Add your email as a test user on the OAuth consent screen</li>
                  </ul>
                  <p className="mt-2 text-amber-700">
                    The rest of BulgeBracket.ai works fully offline — you can compose, score, and queue now, then
                    flip on live sending anytime.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-graphite-600">
              A Google sign-in window should have opened. If it was blocked by your browser, open it in a new tab:
            </p>
          )}

          {authUrl && (
            <a href={authUrl} target="_blank" rel="noreferrer">
              <Button variant="primary" className="w-full">
                <ExternalLink className="h-4 w-4" /> Open Google sign-in
              </Button>
            </a>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await refreshAuth();
              if (auth.connected) setOpen(false);
            }}
          >
            I've finished — refresh status
          </Button>
        </div>
      </Dialog>
    </>
  );
}
