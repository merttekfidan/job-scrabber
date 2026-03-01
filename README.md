# HuntIQ — AI-Powered Job Application Tracker

Job application tracking dashboard with **Next.js (App Router)**, **PostgreSQL**, and optional AI coaching. Supports a Chrome extension for saving jobs.

## Features

- **Dashboard**: Stats, filters, application list, and load-more.
- **Kanban**: Pipeline view (Applied → Interviewing → Offer) with drag-and-drop.
- **Coach**: CV upload and AI-powered prep (STAR, salary, 30-60-90, etc.).
- **Application detail**: Timeline, notes, company insights, SWOT, job description, tech stack.
- **Chrome extension**: Save jobs from the browser; sync with the app.
- **Auth**: NextAuth v5 (Credentials, JWT). Middleware protects routes; Edge-safe auth for `/dashboard`, `/kanban`, `/coach`, `/application/*`.

## Tech stack

- **Framework**: Next.js 14+ (App Router), TypeScript
- **Database**: PostgreSQL (`pg`)
- **Auth**: NextAuth v5, JWT; middleware uses `auth-edge.ts` (Edge-safe)
- **Data**: React Query, typed `lib/api-client`, hooks in `hooks/`
- **UI**: Tailwind CSS, Shadcn/UI, Lucide React, Sonner toasts
- **State**: Zustand (UI store)

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Environment**  
   Create `.env.local`:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/dbname
   AUTH_SECRET=<generate-with-openssl-rand-base64-32>
   ```
   Optional: `GROQ_API_KEY` for AI features.

3. **Database**  
   Apply schema (e.g. run migrations or `schema.sql`).

4. **Run**
   ```bash
   npm run dev
   ```
   App: [http://localhost:3000](http://localhost:3000) (port 3000 only).

## Scripts

- `npm run dev` — Start dev server (kills process on 3000, then starts).
- `npm run build` — Production build.
- `npm run migrate` — Run DB migrations (if configured).

## Docs

- **Product vision**: `PROJECT_OVERVIEW.md` — value proposition, user journey, and future ideas.
- **Testing**: `docs/TESTING.md` — manual test flows and checklist.
- **Roadmap**: `docs/IMPLEMENTATION_ROADMAP.md` — phase history and current status.
- **Checklist**: `docs/RECENT_CHANGES_CHECKLIST.md` — quick verification reference.

## API (overview)

- `GET /api/list` — List applications.
- `POST /api/save` — Save application (extension).
- `GET /api/stats` — Dashboard stats.
- `GET /api/filter` — Filtered list.
- Plus profile, companies, CV upload/analyze, AI insights/frameworks, etc. All require auth except health/login.

## Deployment (e.g. Railway)

Set `DATABASE_URL` and `AUTH_SECRET`. Build: `npm run build`. Start: `npm start`. Run migrations separately if needed.
