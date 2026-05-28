# BulgeBracket.ai

Production-grade Investment Banking recruiting command center — smart alumni ledger, AI scoring, deep banker research, hyper-personalized outreach, and **real Gmail OAuth send/schedule** via the Gmail REST API.

## Features

- **248+ banker contacts** with firm, team, coverage, deals, school, priority
- **AI Fit Score** (0–100) from resume + coverage + alumni ties (offline-first)
- **Table + Kanban** pipeline views with 7-day no-reply amber flags
- **Contact Intelligence** panel — exact LinkedIn URLs, Google search, deals, icebreakers
- **Resume Intelligence** — drag/drop parse, tailored bullets, attach to queue
- **Outreach Composer** — Short / Relationship / Deal / Aggressive variants, A/B subjects
- **Gmail integration** — OAuth popup + “Open in new tab”, send, batch pipeline, optimal send windows
- **Follow-ups** — 7-day and 14-day drafts
- **CRM** — notes, outreach history, reply tracking, relationship stars
- **Analytics** — sent, reply rate, best hooks, send times
- **Strategy Advisor** — offline AI networking coach

## Quick Start

```bash
cp .env.example .env
# Add Google Cloud OAuth credentials (Gmail API enabled)

npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

### Gmail OAuth Setup

1. Create a Google Cloud project and enable **Gmail API**.
2. Create OAuth 2.0 credentials (Web application).
3. Add redirect URI: `http://localhost:3001/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env`.

Without credentials, the API runs in **demo mode** (mock successful sends) so the UI remains fully testable.

## Stack

- React 18 + Vite + TypeScript + Tailwind
- Express + Google APIs (Gmail)
- localStorage persistence

## Build

```bash
npm run build
npm run start   # API only; serve dist/ via any static host
```
