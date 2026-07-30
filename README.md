# Mentra

A task manager built around scheduling and follow-through: capture a task in plain
English, put it on a date, and get reminded before it slips.

Built with Next.js 16 (App Router), Supabase, Prisma and Postgres.

---

## Features

### Tasks
- Create, edit, complete and delete tasks
- One level of subtasks per task, with a completion progress bar
- Priority levels — urgent, high, medium, low
- Due dates with a time picker, plus optional scheduled start/end and a duration
- Tags, with colours and a tag manager
- Drag-and-drop reordering
- Full-text search across titles and descriptions
- Bulk select, bulk edit and bulk delete

### Views
- **Today** — due today, refreshing automatically at midnight
- **Upcoming** — grouped by day
- **Inbox** — anything unscheduled
- **Completed** — grouped by completion date
- **Calendar** — month view
- **Kanban** — drag tasks between columns
- **Projects** — projects with sections, each with its own progress

### Recurring tasks
Daily, weekly, monthly and yearly, with a custom step ("every 3 weeks"), specific
weekdays ("every weekday", "every Monday") and a specific day of the month
("1st of month"). Completing an occurrence schedules the next one; if a task has
been left for a while, the next occurrence is scheduled forward rather than
arriving already overdue.

### Reminders and notifications
- Web push notifications (VAPID) and email
- Reminders at an offset before the due time (`!30min`, `!2hours`, `!1day`)
- Overdue digests
- Delivered by a cron endpoint (`/api/cron/process-reminders`), scheduled daily at
  09:00 UTC in `vercel.json`

### Natural language capture
Type a task the way you'd say it and the parser fills in the fields:

```
Submit report tomorrow at 5pm p2 @work !1hour
└─ title ──────┘ └─ due ───────┘ │  │      └─ remind 1h before
                                 │  └─ tag: work
                                 └─ priority: high
```

Supported: dates and times via [chrono-node](https://github.com/wanasit/chrono),
`@tag`, `p1`–`p4` for priority, `!<offset>` for reminders, and recurrence phrases.
Unknown tags are created on the fly.

### AI assist (Gemini)
Suggests a subtask breakdown for a task, and logs each interaction to
`ai_activity_logs`. Requires `GEMINI_API_KEY`; the rest of the app works without it.

### Focus mode
Pomodoro timer with a circular progress ring, ambient sound (rain / calm), a
breathing guide, and sessions recorded to `focus_sessions`.

### Elsewhere
- Command palette (`Cmd/Ctrl+K`) and keyboard shortcuts
- Light and dark themes
- Completion streaks and achievements on the profile
- Installable as a PWA (manifest + service worker)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, React Server Components |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Animation | Framer Motion |
| Client state | Zustand |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Drag and drop | dnd-kit |
| Database | Postgres via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth (email/password, Google OAuth) |
| AI | Gemini API |
| Tests | Jest |

---

## Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://aistudio.google.com/app/apikey) — optional, only for AI assist

### 1. Install

```bash
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Fill in at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://..."
```

Optional:

| Variable | Enables |
|---|---|
| `GEMINI_API_KEY` | AI subtask breakdown |
| `SUPABASE_SERVICE_ROLE_KEY` | Full account deletion (auth user, not just data) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting shared across instances — see [Rate limiting](#rate-limiting) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push (`node scripts/generate-vapid-keys.js`) |

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

Then apply Row Level Security in the Supabase SQL editor. The policies live in
`Complete Migration codes/` — note that this directory is **gitignored**, so on a
fresh clone you will need to obtain it separately or write the policies yourself.

### 4. Run

```bash
npm run dev
```

Then open http://localhost:3000 and sign up at `/signup`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run test:coverage` | Jest with coverage |
| `npm run prisma:studio` | Browse the database |

---

## Project layout

```
prisma/schema.prisma        Database schema (18 models)
src/
├── app/
│   ├── (auth)/             login, signup
│   ├── (app)/              Authenticated routes; the layout redirects
│   │                       unauthenticated users, so every route below is
│   │                       protected by construction
│   │   ├── today/ upcoming/ inbox/ completed/
│   │   ├── calendar/ kanban/
│   │   └── projects/[id]/
│   ├── focus/
│   └── api/                auth callback, reminder cron, health, pages data
├── components/             Feature-grouped UI; ui/ holds shadcn primitives
├── lib/
│   ├── actions/            Server actions — every mutation lives here
│   ├── security/           Tenancy guards (see Security)
│   ├── parsers/            Natural language task parser
│   ├── notifications/      Push, email, overdue processing
│   ├── supabase/           Browser and server clients
│   └── utils/              Dates, recurrence maths
├── stores/                 Zustand stores
└── middleware.ts           Session refresh + API rate limiting
```

---

## Security

**Authentication.** Supabase Auth issues the session; `middleware.ts` refreshes it
on each request. The `(app)` route group's layout redirects anyone without a
session, so protection does not depend on remembering a check in each page.

**Tenancy.** Two separate boundaries, both enforced:
- *Reads* are scoped by `userId` in every query.
- *Writes* additionally verify that any relation id the client sends —
  `projectId`, `sectionId`, `tagIds` — belongs to the caller. Zod validates the
  shape of an id, never its owner. See `src/lib/security/ownership.ts`.

Postgres Row Level Security is applied on top of both.

**Input validation.** Every server action validates with Zod before touching the
database. Prisma parameterises all queries.

**Headers.** HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
and a restrictive `Permissions-Policy` are set in `next.config.ts`.

### Rate limiting

`/api/*` is limited to 30 requests per minute per IP. The limiter keys on IP only
— User-Agent is client-controlled and would be trivially rotated.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to share counters
across instances. Without them it falls back to per-process counters, which means
the real ceiling becomes `30 x number of running instances` — fine locally, not
sufficient for a multi-instance deploy.

---

## Testing

```bash
npm test
```

174 tests cover the pure, high-risk logic: the natural language parser, recurrence
date maths, the rate limiter (including the in-memory and Upstash backends), the
tenancy guards, and error handling.

Not yet covered: React components, and server actions end to end — both need a
test database or a Prisma mock layer that does not exist yet.

---

## Deployment

Deploys to Vercel as-is. `vercel.json` registers the reminder cron.

Before going live:
- Set every variable from `.env.example` in the platform's environment
- Set the Upstash variables (see [Rate limiting](#rate-limiting))
- Apply the RLS policies to the production database

---

## Status

Built and maintained solo. Working and deployable; not a finished commercial product.

Known gaps:
- **Pages / block editor** — a Notion-style block editor, database blocks and page
  sharing are implemented under `src/components/pages/` and `src/components/editor/`,
  but the routes are parked in `src/app/(app)/_pages_archive/`. The underscore makes
  the folder private to the App Router, so the feature does not currently ship.
- No component or integration tests (see [Testing](#testing)).
- Roughly 150 `any` annotations remain, mostly in Prisma `where` clauses and
  server-action payload builders.

---

## Licence

No licence has been chosen yet, so default copyright applies: all rights reserved.
