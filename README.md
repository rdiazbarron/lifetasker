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
npm run prisma:seed -w apps/api
```

## Environment variables
Frontend reads backend URL from:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

If missing, frontend uses default fallback: `http://localhost:4000/api/v1`.

## Run
```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
npm run dev       # both
```

## Frontend MVP pages (Phase 4)
- `/dashboard`: weekly level, progress by category/block type, and block completion actions.
- `/block-types`: create, list, update, and delete block types.
- `/weekly-plan`: load/create current weekly plan and edit weekly target counts by block type.

## Notes
- No authentication in MVP.
- No daily planning screens.
- Weekly flexible model only.
