# BulgeBracket.ai

**The most powerful Investment Banking Recruiting AI command center.**

Real Gmail send + true scheduling. Deep banker intel. Hyper-personalized outreach.
Built for ambitious finance students targeting Houlihan Lokey, Piper Sandler,
Goldman, William Blair, Moelis, Evercore, and every other elite firm.

---

## Quick start

```bash
# 1. install
npm install

# 2. (optional but recommended) configure Gmail
cp .env.example .env
# fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# 3. run the web app + API server together
npm run dev
```

- Web app: <http://localhost:5173>
- API server: <http://localhost:8787>

Open the web app and connect Gmail from the **Settings & Gmail** screen, or
from the top-right **Connect Gmail** button.

---

## Features

- **Smart Alumni Ledger** — 250+ realistic IB contacts across Bulge Bracket,
  Elite Boutique, and Middle-Market firms. Advanced filters, sort, search,
  table view and Kanban view.
- **AI Fit Score (0–100)** — deterministic, offline-first scoring that combines
  your resume, target role, shared school, sector overlap, banker seniority,
  recent-deal momentum, and priority-firm list.
- **Deep Profile Intelligence** — desk metrics, team moves, recent transactions
  with $ values, shared alumni interests, and 3–5 instantly copyable
  hyper-personalized icebreakers per banker.
- **Resume Intelligence Panel** — drag-and-drop PDF/text upload, browser-side
  parsing (no upload), structured education/experience/skills/achievements.
- **Hyper-Personalized Outreach Composer** — one-click "Generate Best Email"
  with four variants: Short, Relationship-First, Deal-Referenced, Aggressive.
  Smart subject-line generator. Etiquette checklist (≤150 words, polite
  sign-off, low-pressure 15-min ask, clear question).
- **Full Gmail Integration** — real OAuth, real Gmail REST send via
  `users.messages.send`, optional resume one-pager attachment.
- **Intelligent Scheduler** — auto-pick optimal send window per banker
  seniority (Analyst 7–9 AM, Associate/VP 8–10 AM, Director/MD 9–11 AM),
  user-timezone aware, weekend-skipping.
- **Outreach Conveyor** — bottom queue panel with Review, Send Now, and
  Execute Pipeline (batch send) actions, plus live server-side status polling.
- **7-Day No-Reply + Smart Follow-up** — automatic detection with amber flags
  and one-click polite 7-day and 14-day follow-up drafts that reference the
  original email.
- **CRM + Analytics** — per-contact notes & history, best subject hooks,
  best send times, reply/positive rates, CSV import/export.
- **Strategy Advisor** — built-in IB recruiting coach chat. Always available,
  zero quota risk — works fully offline.
- **Clean Minimalism design** — deep graphite grays, soft slate, thin crisp
  borders, mono uppercase micro-labels, flat badges, high-contrast
  professional feel.
- **Offline-first** — every AI feature works without an API key. Premium feel
  even when quotas are hit.

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (custom design
  system inspired by shadcn primitives)
- **Backend:** Express + `googleapis` for OAuth + Gmail REST API
- **State:** React hooks + localStorage with safe JSON serialization

---

## File structure

```
src/
  App.tsx                       # main shell + routing
  main.tsx
  types.ts                      # Contact, ResumeData, OutreachEmail, etc.
  store/useStore.ts             # central state + localStorage sync
  data/
    contactsData.ts             # 250+ realistic IB contacts
    firms.ts                    # firm metadata (BB / EB / MM)
  lib/
    ai/
      scoring.ts                # AI fit score engine
      email.ts                  # 4 email variants + follow-up generator
      intel.ts                  # deep intel report (offline-first)
      resume.ts                 # PDF + text parser
      advisor.ts                # Strategy Advisor rules engine
      scheduler.ts              # optimal-send-time engine
    gmailClient.ts              # browser client for /api/gmail + OAuth popup
    linkedin.ts                 # exact LinkedIn search URL builder
    storage.ts                  # localStorage helpers
    cn.ts
  components/
    Sidebar.tsx, TopBar.tsx
    Dashboard.tsx
    AlumniLedger.tsx
    ContactIntelligence.tsx
    ResumePanel.tsx
    OutreachComposer.tsx
    OutreachView.tsx
    Analytics.tsx
    Advisor.tsx
    Settings.tsx
    QueueConveyor.tsx
    FitScore.tsx
    StatusBadge.tsx
    ui/  (Button, Pill, Modal, Drawer, Stat)
server/
  index.ts                      # Express app
  routes/
    auth.ts                     # Gmail OAuth (start, callback, refresh)
    gmail.ts                    # send, schedule, queue, check-replies
```

---

## Gmail OAuth setup

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Create **OAuth 2.0 Client ID** of type **Web application**.
3. Add this **Authorized redirect URI** exactly:
   `http://localhost:8787/auth/google/callback`
4. Copy the Client ID & Client Secret into `.env`.
5. Restart `npm run dev`.

Tokens live only in the user's browser (`localStorage`). The server is
stateless aside from a short-lived in-memory schedule queue.

---

## LinkedIn deep links

Every contact uses the exact spec:

```ts
https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(firstName + " " + lastName + " " + firm + " " + school)}
```

No proxies. No previews. Always opens the highest-signal LinkedIn search.

---

## Scripts

| script              | purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | run web + API together                   |
| `npm run dev:web`   | Vite only                                |
| `npm run dev:api`   | Express only                             |
| `npm run build`     | typecheck + production web build         |
| `npm run typecheck` | TypeScript-only check (web + server)     |
| `npm run preview`   | preview prod build                       |

---

BulgeBracket.ai — the unfair advantage for IB recruiting.
