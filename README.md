# BulgeBracket.ai — Investment Banking Recruiting AI

The most powerful IB recruiting command center. Upload your resume once and the
AI becomes your personal recruiting coach: it scores 240+ elite-firm alumni
against your profile, researches each banker, generates hyper-personalized
outreach, sends/schedules it through **real Gmail**, tracks replies, and
auto-drafts follow-ups.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Google OAuth + Gmail REST API**. Clean Minimalism design (deep graphite grays,
soft slate, thin crisp borders, mono uppercase micro-labels, flat badges).

> **Offline-first by design.** Every AI feature ships with rich, high-fidelity
> fallback data. Quota/429/network errors never break the app — it always feels
> premium. Gmail/AI keys are optional and only unlock live delivery + enrichment.

## Features

- **Smart Alumni Ledger + AI Scoring** — 248 realistic contacts (firm, exact
  desk, coverage, recent deals, school, priority). Multi-filter + search, an
  **AI Fit Score (0–100)** computed from your resume × banker coverage × deals ×
  mutual school, sortable views, and a drag-and-drop **Kanban pipeline**.
- **Deep Profile Intelligence + Research Agent** — one-click profile with the
  **exact** LinkedIn people-search URL (school injected), Google search, team /
  desk, coverage, recent transactions ($/date/counterparty), shared interests,
  personal style, and an **AI Intel Scoping Agent** with copyable icebreakers.
- **Resume Intelligence** — drag-and-drop PDF/text upload, heuristic parsing of
  achievements/skills/education, target role & firms, personal pitch,
  per-banker **tailored bullet** generation, and resume attachment on send.
- **Hyper-Personalized Composer** — “Generate Best Email” with four variants
  (Short / Relationship-First / Deal-Referenced / Aggressive), smart subject
  **A/B** options, a <150-word Wall Street etiquette guardrail, optional AI
  enrichment, and resume attachment.
- **Real Gmail + Intelligent Scheduler** — full OAuth (popup + “open in new tab”
  fallback), real Gmail API send, **AI-optimal send windows** by seniority
  (Analyst 7–9, VP 8–10, MD 9–11, timezone-aware), and a bottom **conveyor
  queue** with review modal, Send Now, Auto-Schedule, and **Execute Pipeline**.
- **7-Day No-Reply + Follow-ups** — automatic amber flags after 7 days and
  one-click 7-/14-day follow-up drafts that reference the original.
- **CRM + Analytics + Extras** — per-contact notes, relationship stars,
  metrics (sent, reply rate, positive rate, best hooks, best send time),
  **CSV import/export**, a **Strategy Advisor** AI chat, and a smart
  **Top 20 Targets This Week** list.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — fill in to enable live Gmail/AI
npm run dev                  # http://localhost:3000
```

The app runs fully without any keys. To enable **real Gmail send/scheduling**,
add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Gmail API enabled; authorized
redirect `<origin>/api/gmail/callback`). To enable **live AI enrichment**, add
`OPENAI_API_KEY`. See `.env.example`.

## Project structure

```
src/
  types.ts                  # core domain models
  lib/
    contactsData.ts         # 248 generated alumni (regenerate: npm run gen:contacts)
    scoring.ts              # AI fit-score engine (offline, deterministic)
    ai.ts                   # email/intel/advisor generators (offline-first)
    resume.ts               # resume parsing + PDF text extraction
    store.tsx               # localStorage-backed app store (React context)
    gmail-server.ts         # OAuth client + raw MIME builder
    gmail-client.ts         # popup OAuth + send helpers
    status.ts / utils.ts    # status metadata, search URLs, time windows
  app/
    page.tsx, layout.tsx, globals.css
    api/ai, api/gmail/{auth,callback,status,disconnect,send}
  components/                # AppShell, AlumniLedger, KanbanBoard, ContactIntelligence,
                             # ResumePanel, OutreachComposer, QueueConveyor,
                             # FollowUpCenter, AnalyticsDashboard, TopTargets,
                             # StrategyAdvisor, GmailButton, ui primitives
scripts/genContacts.mjs      # deterministic ledger generator
```

## Notes

- Scheduling is delay-based and dispatched by an in-app scheduler while the tab
  is open; sent/queue state persists in `localStorage` and survives reloads.
- The LinkedIn URL format is exactly:
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(firstName + " " + lastName + " " + firm + " " + school)}`
