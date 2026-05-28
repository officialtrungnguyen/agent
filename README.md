# BulgeBracket.ai

BulgeBracket.ai is an investment banking recruiting command center built with React, TypeScript, Tailwind, and Express. It combines an alumni CRM, offline-first AI fit scoring, resume intelligence, hyper-personalized outreach drafting, Gmail OAuth sending/scheduling, analytics, and a strategy advisor into one desktop-first workflow.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Express 5 backend
- Google OAuth + Gmail REST API via `googleapis`
- Offline-first intelligence and localStorage persistence

## Features

- 240-contact alumni ledger with search, filters, AI fit scores, and kanban pipeline
- Deep banker intelligence panel with exact LinkedIn search URL generation
- Resume upload and structured parsing for PDF/text resumes
- Tailored one-pager bullet generation by banker, group, and coverage vertical
- Gmail OAuth, real Gmail send, and persisted scheduling queue
- 7-day and 14-day follow-up generation
- Metrics dashboard, top 20 targets list, CSV import/export, and strategy advisor

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8787`

## Required Google OAuth setup

Create a Google Cloud OAuth client and add:

- `http://localhost:8787/api/auth/google/callback`

as an authorized redirect URI.

Populate `.env` with:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
SERVER_ORIGIN=http://localhost:8787
CLIENT_ORIGIN=http://localhost:5173
```

## Production build

```bash
npm run build
npm run start
```
