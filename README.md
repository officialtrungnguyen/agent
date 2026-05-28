# BulgeBracket.ai

BulgeBracket.ai is a desktop-first investment banking recruiting command center for students and analysts:

- 240+ deterministic alumni contacts across elite banks and boutiques.
- Resume-aware AI fit scoring, research intelligence, deal hooks, and outreach generation.
- Exact LinkedIn people search URLs with name, firm, and school context.
- Real Gmail OAuth + Gmail REST API sending, local scheduled queue, and optional Express scheduler.
- CRM persistence in localStorage with JSON/CSV export.
- Clean minimal graphite/slate Tailwind UI.

## Setup

```bash
npm install
cp .env.example .env.local # optional; set VITE_GOOGLE_CLIENT_ID
npm run dev
```

To use real Gmail sending, create a Google OAuth web client and set:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Optional scheduler backend:

```bash
npm run server
```

## Quality

```bash
npm run build
```
