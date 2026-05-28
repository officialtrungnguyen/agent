# BulgeBracket.ai

**The AI recruiting command center for investment banking.** Upload your résumé once and BulgeBracket.ai becomes your personal IB recruiting coach — it scores 240+ elite alumni bankers against your profile, researches each one deeply, writes hyper-personalized outreach, sends and schedules via **real Gmail**, and tracks every reply with automatic follow-ups.

Built for students and analysts targeting Houlihan Lokey, Piper Sandler, Goldman Sachs, William Blair, Moelis, Evercore, Centerview, and every other elite firm.

---

## Highlights

- **Smart Alumni Ledger + AI Scoring** — 240+ realistic, richly-detailed bankers with a transparent 0–100 AI Fit Score (alumni tie · coverage fit · responsiveness · priority · deal momentum). Table **and** Kanban views, advanced multi-filters, full-text search, and auto amber "⚠ X days no reply" flags after 7 days.
- **Deep Profile Intelligence + Research Agent** — one-click profile with team/desk, coverage sectors, recent transactions ($ values, dates, companies), shared interests, personal style, and 3–5 copyable, hyper-personalized icebreakers. **Exact LinkedIn people-search URLs with the school injected**, plus Google search.
- **Résumé Intelligence** — drag-and-drop PDF/text upload, local parsing into structured education / experience / skills / achievements, per-banker tailored bullet generation, and optional résumé attachment when sending.
- **Hyper-Personalized Outreach Composer** — "Generate best email" in four proven variants (Short · Relationship-first · Deal-referenced · High-conviction), smart subject lines with A/B alternatives, live Wall-Street-etiquette word counter (<150 words), and résumé attach.
- **Real Gmail + Intelligent Scheduler** — full Google OAuth (robust popup + "open in new tab" fallback), real Gmail REST API send (with attachments), and **true server-side scheduling** dispatched at AI-optimal windows (Analysts 7–9 AM, VPs 8–10 AM, MDs 9–11 AM — localized to each banker, weekends rolled to Monday). Bottom **conveyor pipeline** with review modal, Send Now, Auto-Schedule, and **Execute Pipeline** batch send.
- **7-Day No-Reply + Smart Follow-ups** — automatic detection + one-click 7-day and 14-day follow-up drafts that reference the original thread.
- **CRM + Analytics + Strategy Advisor** — per-contact notes & activity log, relationship strength (1–5★), metrics dashboard (sent, reply rate, best hooks, best send windows), CSV import/export, a **Top 20 Targets This Week** smart list, and an AI **Strategy Advisor** chat that reads your live pipeline.

> **Offline-first by design.** Every AI feature ships with high-fidelity offline data, so the app never breaks on quota/429 errors. Live Gmail sending and optional live AI enrichment turn on the moment you add credentials.

---

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, shadcn-style components, lucide-react icons
- **Backend:** Express + `googleapis` (Gmail send + OAuth), server-side scheduler
- **Persistence:** `localStorage` (profile, CRM state, queue) + server-authoritative scheduled sends
- **Design:** Clean Minimalism — deep graphite grays, soft slate, thin crisp borders, mono uppercase micro-labels, flat badges, minimal shadows

---

## Quick start

```bash
npm install

# Run the web app + API together (Vite proxies /api -> :8787)
npm run dev
# web → http://localhost:5173   api → http://localhost:8787
```

The app is **fully usable immediately** in offline mode — score bankers, research, compose, queue, and schedule. To enable **live Gmail sending**, add credentials:

```bash
cp .env.example .env
# then fill in the Google OAuth values (see below) and restart
```

### Enabling real Gmail send + scheduling

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project and **enable the Gmail API**.
2. Configure the **OAuth consent screen** (External) and add your Google account as a **test user**.
3. Create an **OAuth 2.0 Client ID** (Web application) with redirect URI:
   `http://localhost:8787/api/auth/google/callback`
4. Put the values in `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
   ```
5. Restart (`npm run dev`) and click **Connect Gmail** in the top bar.

Scopes requested: `gmail.send`, `userinfo.email`, `userinfo.profile`. Tokens are kept per session on the server; scheduled emails are held server-side and dispatched at their scheduled time.

### Optional: live AI enrichment

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL` / `OPENAI_BASE_URL`) in `.env` to let the composer and Strategy Advisor call a live model first. If the key is missing or the provider returns a quota/error, the app silently uses its premium offline engine.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run web (Vite) + API (Express) together |
| `npm run dev:web` | Vite dev server only |
| `npm run dev:api` | Express API only (watch mode) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | `tsc --noEmit` type check |
| `npm run server` | Run the API once (no watch) |

---

## Project structure

```
server/
  server.ts              # Express: OAuth, Gmail send, scheduler, AI bridge, health
src/
  types.ts               # Core domain types
  data/contactsData.ts   # 240+ deterministic, richly-detailed alumni bankers
  lib/
    ai.ts                # Email/icebreaker/intel/advisor/résumé engines (offline-first)
    scoring.ts           # Transparent 0–100 AI Fit Score engine
    scheduler.ts         # AI-optimal, timezone-aware send windows
    gmail.ts             # Client for the backend Gmail API
    storage.ts           # localStorage persistence + CRM hydration
    csv.ts               # CSV import / export
    labels.tsx           # Status/priority labels + exact LinkedIn/Google URLs
    utils.ts             # Formatting + helpers
  store/
    AppContext.tsx       # Single source of truth (contacts, queue, auth, analytics)
    UIContext.tsx        # Tabs + dialog state
  components/
    AlumniLedger.tsx     # Table + Kanban + filters
    ContactIntelligence.tsx
    OutreachComposer.tsx
    ResumePanel.tsx
    Pipeline.tsx         # Follow-ups + CRM activity
    Analytics.tsx        # Metrics + Top 20 targets
    QueuePanel.tsx       # Bottom conveyor pipeline
    StrategyAdvisor.tsx
    GmailConnect.tsx
    Onboarding.tsx
    ui/                  # Button, Badge, Card, Dialog, Input, Toast, Misc
  App.tsx                # Shell: top bar, sidebar, routing, overlays
```

---

## Notes

- All data persists in `localStorage`; your résumé file (for attachment) is held in `sessionStorage` and never uploaded to a third party.
- Exact LinkedIn search URLs follow the required format:
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(firstName + " " + lastName + " " + firm + " " + school)}`
- The seed ledger is generated deterministically so it's stable across reloads while staying realistic.
