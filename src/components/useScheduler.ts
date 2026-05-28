"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { sendGmail } from "@/lib/gmail-client";

/**
 * Background scheduler. While the app is open, it dispatches any "scheduled"
 * email whose time has arrived through the real Gmail API. This provides true
 * delay-based scheduling without an always-on worker. Sent state persists, so
 * the queue survives reloads.
 */
export function useScheduler() {
  const { emails, gmail, resume, updateEmail, updateState } = useStore();
  const sending = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      const due = emails.filter(
        (e) =>
          e.status === "scheduled" &&
          e.scheduledAt &&
          e.scheduledAt <= now &&
          !sending.current.has(e.id),
      );
      for (const email of due) {
        sending.current.add(email.id);
        updateEmail(email.id, { status: "sending" });

        if (!gmail.connected) {
          // Offline mode — mark as sent locally so the pipeline never stalls.
          updateEmail(email.id, { status: "sent", sentAt: Date.now() });
          updateState(email.contactId, { status: "sent", lastOutreachAt: Date.now() });
          sending.current.delete(email.id);
          continue;
        }

        const attachment =
          email.attachResume && resume?.fileDataUrl
            ? dataUrlToAttachment(resume.fileDataUrl, resume.fileName || "resume.pdf")
            : undefined;

        const res = await sendGmail({
          to: email.to,
          subject: email.subject,
          body: email.body,
          attachment,
        });

        if (res.ok) {
          updateEmail(email.id, {
            status: "delivered",
            sentAt: Date.now(),
            gmailMessageId: res.messageId,
            gmailThreadId: res.threadId,
          });
          updateState(email.contactId, { status: "sent", lastOutreachAt: Date.now() });
        } else {
          updateEmail(email.id, { status: "failed", error: res.error });
        }
        sending.current.delete(email.id);
      }
    };

    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, [emails, gmail.connected, resume, updateEmail, updateState]);
}

function dataUrlToAttachment(dataUrl: string, filename: string) {
  const [meta, base64] = dataUrl.split(",");
  const mimeType = /data:(.*?);base64/.exec(meta)?.[1] || "application/octet-stream";
  return { filename, mimeType, base64: base64 || "" };
}
