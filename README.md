# BulgeBracket.ai

BulgeBracket.ai is a full-stack investment banking recruiting command center built with:

- React + TypeScript + Vite
- Tailwind CSS
- shadcn-style UI primitives
- Express + TypeScript
- Google OAuth + Gmail API infrastructure
- Offline-first recruiting intelligence data and scoring

## What is included

- 240+ realistic seeded banker contacts across elite firms
- AI-style fit scoring based on the user's uploaded resume and target role
- Table and kanban pipeline views
- Deep contact intelligence panel with exact LinkedIn people-search URLs
- Resume parsing for PDF/text uploads
- Tailored one-pager bullet generation
- Hyper-personalized outreach composer with multiple variants
- Gmail OAuth, live send endpoint, and persisted server-side scheduling
- Queue conveyor panel and batch pipeline execution
- CRM notes, relationship strength, reply tracking, analytics, and strategy advisor

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
GMAIL_SENDER_NAME=BulgeBracket.ai
PORT=8787
```

To use live Gmail sending and scheduling, configure a Google Cloud OAuth client with Gmail API enabled and ensure the redirect URI matches `GOOGLE_REDIRECT_URI`.

## Development

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## Production build

```bash
npm run build
npm start
```

## Notes

- App state is persisted in `localStorage`.
- Gmail tokens and scheduled jobs are stored in `server-data/` at runtime.
- If Google OAuth is not configured, the app still remains fully usable with its offline recruiting intelligence, drafting, scoring, and queue workflows.
