import { useEffect, useState } from "react";
import type { UserProfile } from "../types";
import { Button } from "./ui/Button";
import { Pill } from "./ui/Pill";
import { Mail, ExternalLink, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  oauthEmail?: string | null;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
}

interface ApiStatus {
  ok: boolean;
  gmailConfigured: boolean;
  configured?: boolean;
  redirectUri?: string;
  clientIdPrefix?: string;
  scopes?: string[];
  error?: string;
}

export function Settings({ profile, setProfile, oauthEmail, onConnectGmail, onDisconnectGmail }: Props) {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/health").then((r) => r.json()).catch(() => ({ ok: false })),
        fetch("/auth/google/config").then((r) => r.json()).catch(() => ({})),
      ]);
      setApiStatus({ ...a, ...b });
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="panel p-5 space-y-3">
        <div className="text-sm font-semibold flex items-center gap-2"><Mail size={14} /> Gmail Authorization</div>
        <div className="micro">// real Gmail REST API · send + schedule · zero proxies</div>

        {profile.gmailConnected ? (
          <div className="hairline rounded-sharp p-3 flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-medium">{oauthEmail || "Gmail account connected"}</div>
              <div className="micro mt-1">Token stored locally in your browser only.</div>
            </div>
            <Button variant="ghost" onClick={onDisconnectGmail}>Disconnect</Button>
          </div>
        ) : (
          <div className="hairline rounded-sharp p-3 space-y-2">
            <div className="text-[12.5px]">
              Connect your Gmail to enable real email sending and scheduling. You'll be redirected to Google's official consent screen — credentials never touch our servers.
            </div>
            <Button variant="primary" leading={<Mail size={12} />} onClick={onConnectGmail}>
              Authorize Gmail
            </Button>
            <div className="micro">
              If the popup is blocked, the flow will continue in this tab.
            </div>
          </div>
        )}

        <div className="hairline-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="micro-strong">// API STATUS</div>
            <Button variant="ghost" size="sm" leading={<RefreshCw size={11} />} onClick={refresh} disabled={refreshing}>
              Refresh
            </Button>
          </div>
          {apiStatus ? (
            <>
              <Row k="API server" v={apiStatus.ok ? <Pill tone="green">online</Pill> : <Pill tone="red">offline</Pill>} />
              <Row k="OAuth configured" v={apiStatus.configured ? <Pill tone="green"><ShieldCheck size={10} /> yes</Pill> : <Pill tone="amber"><AlertTriangle size={10} /> set env vars</Pill>} />
              {apiStatus.clientIdPrefix && <Row k="Client ID prefix" v={<code className="font-mono text-[11px]">{apiStatus.clientIdPrefix}</code>} />}
              {apiStatus.redirectUri && (
                <div className="hairline rounded-sharp p-2">
                  <div className="micro">// Authorized redirect URI (configure in Google Cloud Console)</div>
                  <code className="font-mono text-[11px] break-all">{apiStatus.redirectUri}</code>
                </div>
              )}
              {apiStatus.scopes && (
                <div className="hairline rounded-sharp p-2">
                  <div className="micro">// Scopes requested</div>
                  <ul className="text-[11px] font-mono mt-1 space-y-0.5">
                    {apiStatus.scopes.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
              {!apiStatus.configured && (
                <div className="hairline rounded-sharp p-3 bg-amber-50 border-amber-200">
                  <div className="text-[12px] text-amber-900">
                    <div className="font-semibold mb-1">Set up Gmail OAuth (one-time)</div>
                    <ol className="list-decimal pl-5 space-y-0.5">
                      <li>Create OAuth credentials in <a className="underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href="https://console.cloud.google.com/apis/credentials">Google Cloud Console <ExternalLink size={10} /></a></li>
                      <li>Add <code>http://localhost:8787/auth/google/callback</code> as an authorized redirect URI</li>
                      <li>Export <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> as env vars</li>
                      <li>Restart <code>npm run dev:api</code></li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-[12px] text-graphite-500">Checking…</div>
          )}
        </div>
      </section>

      <section className="panel p-5 space-y-3">
        <div className="text-sm font-semibold">Profile</div>
        <Field label="Your name" value={profile.name || ""} onChange={(v) => setProfile({ ...profile, name: v })} />
        <Field label="Target role" value={profile.targetRole} onChange={(v) => setProfile({ ...profile, targetRole: v })} />
        <Field label="Target class" value={profile.targetClass || ""} onChange={(v) => setProfile({ ...profile, targetClass: v })} />
        <Field label="Timezone" value={profile.timezone} onChange={(v) => setProfile({ ...profile, timezone: v })} />
        <Field label="Priority firms (comma-separated)" value={profile.preferredFirms.join(", ")} onChange={(v) => setProfile({ ...profile, preferredFirms: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
        <div>
          <label className="label">Personal Pitch</label>
          <textarea
            className="input min-h-[100px] py-2"
            value={profile.personalPitch}
            onChange={(e) => setProfile({ ...profile, personalPitch: e.target.value })}
          />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="micro">{k}</div>
      <div>{v}</div>
    </div>
  );
}
