# BulgeBracket.ai

> Production-grade Investment Banking Recruiting AI.
> Real Gmail send/schedule · advanced resume tailoring & attachment · deep AI research agent · smart scoring · full pipeline automation · zero proxies.

BulgeBracket.ai is a one-stop intelligent recruiting command center for ambitious students and analysts targeting elite Investment Banking roles at Houlihan Lokey, Piper Sandler, Goldman Sachs, William Blair, Moelis, and every other top firm.

Upload your resume once → the AI becomes your personal IB recruiting coach. It filters 240+ realistic alumni, deeply researches each banker, scores fit, generates hyper-personalized emails tailored to your resume + banker's exact team/coverage/recent deals, queues them, sends/schedules via real Gmail at optimal times, tracks replies, and auto-generates follow-ups.

## Stack

- React 18 + TypeScript + Vite (fast dev, snappy build)
- TailwindCSS + shadcn/ui-style primitives (Radix UI under the hood)
- Express backend with `googleapis` for full Gmail OAuth + REST API
- Zustand + `localStorage` persistence
- Optional OpenAI integration (`OPENAI_API_KEY`) — every AI feature has rich offline fallback so the app never breaks on quota / 429 errors

## Features

1. **Smart Alumni Ledger + AI Scoring Engine** — 240+ realistic contacts pre-seeded with team/desk, coverage, recent deals, school, priority, fit score, status, interests, icebreakers. Multi-filter table + sortable columns + CSV import/export + Kanban board.
2. **Deep Profile Intelligence + Research Agent** — exact LinkedIn search URL with school injected, Google search, organized intel panel, 3-5 instantly copyable icebreakers, AI Intel Scoping Agent with offline cache + optional live enrichment.
3. **Advanced Resume Intelligence Panel** — drag-and-drop PDF/text resume, AI parsing, persistent target role + pitch, tailored attach-on-send.
4. **Hyper-Personalized Outreach Composer** — `Short / Relationship / Deal-Referenced / High Conviction` variants, smart subject A/B options, attach tailored resume, follow-up mode, persistent autosave.
5. **Full Gmail Integration + Intelligent Scheduler** — complete Google OAuth (popup + new tab fallback), real Gmail API send, true server-side scheduling that fires at the scheduled time, AI-optimal send-time engine (Analyst 7-9am, VP 8-10am, MD 9-11am, timezone-aware).
6. **7-Day No-Reply + Smart Follow-up System** — automatic detection and amber flags, one-click polite follow-up drafts.
7. **CRM + Analytics + Strategy Advisor** — full outreach history + notes per contact, response tracker, metrics dashboard (Sent / Reply Rate / Best Hooks / Best Send Times), CSV import/export, Strategy Advisor AI chat grounded in your resume + pipeline.

## Running

```bash
npm install
npm run dev
```

This boots both:

- Vite dev server on `http://localhost:5173`
- Express API on `http://localhost:8787`

## Configuration (optional but recommended)

Create a `.env` file at the project root:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback
APP_BASE_URL=http://localhost:5173
OPENAI_API_KEY=...    # optional, enables live AI; not required
PORT=8787
```

Without these, the app stays fully usable in **premium simulation mode**: deal intel, email generation, scoring, scheduling UI and follow-up workflows all work — only the real Gmail dispatch is replaced with simulated sends that surface a clear "simulated" badge.

## Folder Structure

```
server/                     Express API + Gmail OAuth + scheduler dispatcher
  index.ts                  HTTP routes
  gmail.ts                  OAuth + send + true scheduled send queue
  ai.ts                     AI features w/ offline fallback
  env.ts                    typed env loader

src/
  types.ts                  Domain types (Contact, UserResume, DraftEmail, ...)
  data/
    contactsData.ts         240+ realistic alumni (deterministic seed)
    firmCatalog.ts          Real firm catalog + notable deals
    peopleSeed.ts           Names / schools / interests
  lib/
    api.ts                  Fetch wrapper, LinkedIn/Google URL helpers
    scoring.ts              AI fit-score engine
    resumeParser.ts         Heuristic resume parser
    csv.ts                  CSV import/export
    utils.ts                Shared utilities
  store/
    useAppStore.ts          Zustand store (persistent)
  components/
    ui/                     Button, Badge, Card, Input, Textarea, Dialog, Tabs, ...
    shell/                  TopBar, SideNav, QueueConveyor
    screens/                LedgerScreen, KanbanScreen, ResumeScreen,
                            PipelineScreen, AnalyticsScreen,
                            StrategyAdvisorScreen, SettingsScreen
    dialogs/                ContactIntelligenceDialog, OutreachComposerDialog
  App.tsx
  main.tsx
  index.css                 Clean Minimalism theme
```
