# CHANGELOG

## 2026-05-04

work

- Refactored frontend MVP screens (`/dashboard`, `/block-types`, `/weekly-plan`) to consistently use HeroUI cards, buttons, inputs, selects, chips, progress bars, dividers, tooltips, and spinners.
- Added Next.js App Router HeroUI provider wiring via `apps/web/app/providers.tsx` and wrapped root layout with `HeroUIProvider`.
- Updated dashboard quick-complete and progress views with clearer loading, empty, and status states while preserving existing weekly-flex MVP flow.


## 2026-05-03

codex/implement-phase-5-and-phase-6-features-0x1dcu

- Fixed `POST /api/v1/block-types` 500 by aligning Prisma `BlockType` model with backend/frontend DTOs (`durationMinutes`).
- Added Prisma migration for `BlockType.durationMinutes` with default value for existing rows.
- Fixed backend/frontend communication issue by enabling CORS in NestJS bootstrap.
- Added configurable `CORS_ORIGINS` (default `http://localhost:3000`) for local frontend access to `/api/v1` endpoints.
  codex/implement-phase-5-and-phase-6-features-sk52oi
- Fixed backend/frontend communication issue by enabling CORS in NestJS bootstrap.
- Added configurable `CORS_ORIGINS` (default `http://localhost:3000`) for local frontend access to `/api/v1` endpoints.

develop

- Implemented Phase 5 weekly reset behavior in backend current plan flow.
- `GET /api/v1/weekly-plans/current` now lazily creates the current week plan if missing.
- New current week plan clones previous weekly target items when a prior week exists.
- New current week plan is empty when there is no prior week.
- Implemented Phase 6 UI improvements across `/dashboard`, `/block-types`, and `/weekly-plan`.
- Added clearer progress cards, visual category markers, improved empty states, and success feedback messages.
- Weekly plan screen now assumes lazy backend creation and shows current week range with improved editor clarity.

## 2026-05-03

- Implemented Phase 4 Frontend MVP in `apps/web`.
- Added `/dashboard`, `/block-types`, and `/weekly-plan` pages.
- Added MVP components for block type management, weekly targets, block completion, and current-week progress display.
- Added frontend API helper with `NEXT_PUBLIC_API_URL` support and default fallback URL.
- Updated README with frontend usage details and MVP page list.
