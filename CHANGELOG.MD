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
