# LifeTasker

Monorepo for **LifeTasker**, a productivity app focused on **weekly flexible progress** (not a daily to-do list).

## Stack

- Frontend: Next.js App Router + TypeScript + TailwindCSS
- Backend: NestJS + TypeScript
- DB: PostgreSQL + Prisma

## Structure

- `apps/web`: frontend
- `apps/api`: backend

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api -- --name init
# if you pull new changes later:
npm run prisma:migrate -w apps/api
npm run prisma:generate -w apps/api
npm run prisma:seed -w apps/api
```

## Environment variables

Frontend reads backend URL from:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Backend CORS allows frontend origins from:

```bash
CORS_ORIGINS=http://localhost:3000
```

Use comma-separated values for multiple origins.

If `NEXT_PUBLIC_API_URL` is missing, frontend uses default fallback: `http://localhost:4000/api/v1`.

## Run

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
npm run dev       # both
```

## Current behavior highlights

- `GET /api/v1/weekly-plans/current` always returns a current-week plan.
- If no current-week plan exists, backend lazily creates one.
- New week plan clones prior week target items when available.
- Progress stays at zero at week start until current-week block completions are logged.
- No authentication in MVP (demo user flow remains active).

## Frontend MVP pages

- `/dashboard`: weekly level summary, progress by category/block type, quick completion actions.
- `/block-types`: create/list/update/delete block types with clearer category markers and form layout.
- `/weekly-plan`: current week range and weekly target editor with save feedback.

## Notes

- No authentication in MVP.
- No daily planning screens.
- Weekly flexible model only.
