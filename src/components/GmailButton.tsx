"use client";

import React, { useEffect, useState } from "react";
import { Mail, Check, ExternalLink, X, Settings2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Modal, MicroLabel, Spinner, Badge, Input, Select } from "@/components/ui";
import {
  connectGmail,
  disconnectGmail,
  fetchGmailStatus,
  toGmailAuthState,
} from "@/lib/gmail-client";
import { seniorityLabel } from "@/lib/utils";
import type { SeniorityTier } from "@/types";

export function GmailButton() {
  const { gmail, setGmail, settings, updateSettings } = useStore();
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGmailStatus().then((s) => {
      setConfigured(s.configured);
      setGmail(toGmailAuthState(s));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    const res = await connectGmail();
    setConfigured(res.configured);
    if (res.url) setAuthUrl(res.url);
    if (res.ok) {
      const s = await fetchGmailStatus();
      setGmail(toGmailAuthState(s));
      setOpen(false);
    } else if (res.error === "popup_blocked") {
      setError("Popup blocked — use “Open in new tab” below to authorize.");
    } else if (!res.configured) {
      setError(res.error || "Gmail not configured on the server.");
    } else if (res.error && res.error !== "closed") {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    await disconnectGmail();
    const s = await fetchGmailStatus();
    setGmail(toGmailAuthState(s));
  };

  return (
    <>
      <Button
        variant={gmail.connected ? "outline" : "primary"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {gmail.connected ? (
          <>
            <Check size={14} className="text-green-600" />
            <span className="hidden sm:inline">{gmail.email || "Gmail connected"}</span>
            <span className="sm:hidden">Gmail</span>
          </>
        ) : (
          <>
            <Mail size={14} /> Connect Gmail
          </>
        )}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Gmail Integration & Send Settings">
        <div className="space-y-5 p-5">
          {/* Connection status */}
          <div className="rounded-md border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail size={15} /> Gmail Account
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {gmail.connected
                    ? `Connected as ${gmail.email}. Outreach sends from your real inbox via the Gmail API.`
                    : "Authorize Gmail to send real outreach and follow-ups directly from your inbox."}
                </div>
              </div>
              {gmail.connected ? (
                <Badge tone="green"><Check size={11} /> Live</Badge>
              ) : (
                <Badge tone="slate">Offline</Badge>
              )}
            </div>

            {configured === false && (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <div className="font-medium">Server credentials required</div>
                <p className="mt-1 text-amber-700">
                  Add <code className="font-mono">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="font-mono">GOOGLE_CLIENT_SECRET</code> (and an authorized redirect
                  to <code className="font-mono">/api/gmail/callback</code>) in your environment, then
                  reload. Until then, drafts are saved and the pipeline runs in offline mode.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {gmail.connected ? (
                <Button variant="danger" size="sm" onClick={handleDisconnect}>
                  <X size={14} /> Disconnect
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleConnect} disabled={loading}>
                  {loading ? <Spinner size={14} /> : <Mail size={14} />} Authorize Gmail
                </Button>
              )}
              {authUrl && !gmail.connected && (
                <a href={authUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink size={14} /> Open in new tab
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Send windows */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Settings2 size={14} className="text-slate-500" />
              <MicroLabel>AI-Optimal Send Windows</MicroLabel>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Auto-Schedule targets each banker&apos;s peak inbox window in your timezone ({settings.timezone}).
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(settings.sendWindows) as SeniorityTier[]).map((tier) => (
                <div key={tier} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">{seniorityLabel[tier]}</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <HourSelect
                      value={settings.sendWindows[tier][0]}
                      onChange={(v) =>
                        updateSettings({
                          sendWindows: {
                            ...settings.sendWindows,
                            [tier]: [v, settings.sendWindows[tier][1]],
                          },
                        })
                      }
                    />
                    <span>–</span>
                    <HourSelect
                      value={settings.sendWindows[tier][1]}
                      onChange={(v) =>
                        updateSettings({
                          sendWindows: {
                            ...settings.sendWindows,
                            [tier]: [settings.sendWindows[tier][0], v],
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily cap + signature */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <MicroLabel className="mb-1">Daily Send Cap</MicroLabel>
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.dailyCap}
                onChange={(e) => updateSettings({ dailyCap: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <MicroLabel className="mb-1">Timezone</MicroLabel>
              <Input value={settings.timezone} onChange={(e) => updateSettings({ timezone: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-7 text-xs">
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>
          {h.toString().padStart(2, "0")}:00
        </option>
      ))}
    </Select>
  );
}
