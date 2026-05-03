# Changelog

## 2026-05-01

### Added

- Created GitHub repository `lifetasker`.
- Created `main` and `develop` branches.
- Connected repository with Codex.
- Added initial README.
- Created initial full-stack monorepo structure.
- Verified frontend runs locally.
- Verified backend runs locally.
- Implemented Phase 2 Prisma domain model for weekly-flexible planning:
  - `User`
  - `Category`
  - `BlockType`
  - `WeeklyPlan`
  - `WeeklyPlanItem`
  - `BlockInstance`
- Added initial SQL migration under `apps/api/prisma/migrations/`.
- Added Prisma seed script for default categories (`TECH`, `SALUD`, `TRABAJO`, `FAMILIA`).
- Added Prisma package scripts for migration deploy, seed, and studio.
- Expanded README with Prisma/database command documentation.

### Current status

- Frontend runs on port 3000.
- Backend likely runs on port 4000.
- Prisma Phase 2 foundation is now implemented.

### Next

- Implement Phase 3 backend REST modules.


## 2026-05-03

### Added

- Implemented Phase 3 backend REST API in NestJS with modules:
  - `categories`
  - `block-types`
  - `weekly-plans`
  - `block-instances`
  - `progress`
- Added Prisma global service/module integration.
- Added DTO validation with global `ValidationPipe`.
- Added API URI versioning (`/api/v1`).
- Added current-week progress aggregation and weekly level calculation.
- Updated README with endpoint usage examples.
- Updated project plan status for Phase 3.


## 2026-05-03

### Added

- Implemented Phase 4 frontend MVP in `apps/web`.
- Added `/dashboard`, `/block-types`, and `/weekly-plan` pages.
- Added MVP components for block type management, weekly targets, block completion, and current-week progress display.
- Added frontend API helper with `NEXT_PUBLIC_API_URL` support and default fallback URL.
- Updated README with frontend usage details and MVP page list.
