const API = "/api";

export async function getAuthUrl(): Promise<string> {
  const res = await fetch(`${API}/auth/google/url`);
  const data = (await res.json()) as { url?: string; error?: string };
  if (!data.url) throw new Error(data.error ?? "Failed to get auth URL");
  return data.url;
}

export async function getGmailStatus(): Promise<{
  connected: boolean;
  email?: string;
}> {
  const res = await fetch(`${API}/gmail/status`);
  return res.json() as Promise<{ connected: boolean; email?: string }>;
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  body: string;
  scheduledFor?: string;
  attachResumeText?: string;
}): Promise<{ success: boolean; messageId?: string; scheduled?: boolean }> {
  const res = await fetch(`${API}/gmail/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{
    success: boolean;
    messageId?: string;
    scheduled?: boolean;
  }>;
}

export async function executePipeline(
  items: {
    to: string;
    subject: string;
    body: string;
    scheduledFor?: string;
    attachResumeText?: string;
  }[]
): Promise<{ results: { success: boolean; index: number }[] }> {
  const res = await fetch(`${API}/gmail/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.json() as Promise<{
    results: { success: boolean; index: number }[];
  }>;
}
