# BulgeBracket.ai

Production-grade investment banking recruiting command center for alumni targeting,
resume-aware profile intelligence, AI outreach, Gmail REST sending/scheduling, CRM
tracking, and analytics.

## Run locally

```bash
npm install
npm run dev
```

Set `VITE_GOOGLE_CLIENT_ID` for browser OAuth. Optional backend refresh-token
scheduling support uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_REFRESH_TOKEN`.

## Gmail integration

The frontend uses Google Identity Services with Gmail scopes. The Express backend
builds RFC 2822 messages, sends through `gmail/v1/users/me/messages/send`, and
persists scheduled messages in `data/scheduled-emails.json` until execution.
