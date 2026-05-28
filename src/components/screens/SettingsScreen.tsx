import { Mail, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";

export function SettingsScreen() {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const gmail = useAppStore((s) => s.gmail);
  const setGmail = useAppStore((s) => s.setGmail);
  const resetSeed = useAppStore((s) => s.resetSeed);

  async function connect() {
    const { url, error } = await api.gmailStartUrl("/?view=settings");
    if (!url) {
      if (error) alert(`Gmail OAuth: ${error}`);
      return;
    }
    const win = window.open(url, "bb_gmail_oauth", "width=520,height=720");
    if (!win) window.location.href = url;
  }

  async function disconnect() {
    await api.gmailDisconnect();
    setGmail({ connected: false, identity: null });
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4">
        <p className="microlabel">Workspace</p>
        <h1 className="text-xl font-semibold tracking-tight text-graphite-900">Settings</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-graphite-900">Gmail Integration</h2>
              <p className="text-[11px] text-graphite-500">Real OAuth + Gmail REST API send & schedule.</p>
            </div>
            {gmail.configured ? (
              <Badge variant="success" className="text-[10px]"><Wifi className="h-3 w-3" /> Configured</Badge>
            ) : (
              <Badge variant="warn" className="text-[10px]"><WifiOff className="h-3 w-3" /> Not configured</Badge>
            )}
          </div>
          {gmail.connected ? (
            <div className="space-y-2">
              <div className="rounded-md border border-graphite-200 bg-graphite-50 p-3">
                <p className="text-[12px] font-medium text-graphite-900">{gmail.identity?.name ?? gmail.identity?.email}</p>
                <p className="text-[11px] text-graphite-500">{gmail.identity?.email}</p>
                <p className="text-[10px] text-graphite-400">Connected {gmail.identity?.connectedAt ? new Date(gmail.identity.connectedAt).toLocaleString() : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={connect}><RefreshCw className="h-3.5 w-3.5" /> Reconnect</Button>
                <Button size="sm" variant="secondary" onClick={disconnect}>Disconnect</Button>
              </div>
            </div>
          ) : gmail.configured ? (
            <Button size="sm" variant="default" onClick={connect}><Mail className="h-3.5 w-3.5" /> Connect Gmail</Button>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              To enable real Gmail send + scheduling, add these env vars (Cursor Dashboard › Cloud Agents › Secrets, or a local <span className="font-mono">.env</span>):
              <pre className="mt-2 rounded bg-graphite-900 p-2 text-[11px] text-graphite-50">{`GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback
APP_BASE_URL=http://localhost:5173`}</pre>
              <p className="mt-2 text-[11px] text-amber-900">Until configured, the app runs in <span className="font-medium">premium simulation mode</span> — every other feature is real.</p>
            </div>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold text-graphite-900">Profile</h2>
          <p className="mb-3 text-[11px] text-graphite-500">Used in every email + AI prompt.</p>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Name" value={preferences.userName} onChange={(v) => setPreferences({ userName: v })} placeholder="Alexander Chen" />
            <Field label="Email" value={preferences.userEmail} onChange={(v) => setPreferences({ userEmail: v })} placeholder="you@school.edu" />
            <Field label="School" value={preferences.school} onChange={(v) => setPreferences({ school: v })} placeholder="University of Pennsylvania — Wharton" />
            <Field label="Target role" value={preferences.targetRole} onChange={(v) => setPreferences({ targetRole: v })} />
            <Field label="Timezone" value={preferences.timezone} onChange={(v) => setPreferences({ timezone: v })} />
            <div>
              <label className="microlabel">Email signature</label>
              <Textarea rows={3} value={preferences.signature} onChange={(e) => setPreferences({ signature: e.target.value })} />
            </div>
            <div>
              <label className="microlabel">Personal pitch</label>
              <Textarea rows={3} value={preferences.pitch} onChange={(e) => setPreferences({ pitch: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold text-graphite-900">Data</h2>
          <p className="mb-3 text-[11px] text-graphite-500">Everything is stored locally in your browser.</p>
          <Button size="sm" variant="secondary" onClick={resetSeed}>Reset to seed dataset</Button>
        </div>

        <div className="surface p-5 text-[11px] text-graphite-500">
          <h2 className="mb-1 text-sm font-semibold text-graphite-900">About BulgeBracket.ai</h2>
          <p>Production-grade Investment Banking recruiting command center. Real Gmail send + schedule, AI scoring, deep deal intel, hyper-personalized outreach, smart follow-ups, analytics, and a strategy advisor — all wrapped in a Clean Minimalism interface engineered for serious finance students.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="microlabel">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
