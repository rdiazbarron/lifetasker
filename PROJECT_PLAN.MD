# LifeTasker Project Plan

## Product concept

LifeTasker is a personal productivity app centered on weekly flexible blocks, not daily tasks.

Users define reusable activity block types, set weekly targets, complete blocks whenever they want during the week, and track progress visually.

---

## Phase 0 - Repository setup

Status: Done

Completed:

- GitHub repository created.
- `main` branch created.
- `develop` branch created.
- Repository connected to Codex.
- Initial README added.

---

## Phase 1 - Base full-stack structure

Status: Done

Completed:

- Monorepo structure created.
- `apps/web` created with Next.js App Router.
- `apps/api` created with NestJS.
- PostgreSQL support prepared.
- Prisma prepared in backend.
- Frontend runs locally.
- Backend runs locally.
- Frontend runs on port 3000.
- Backend likely runs on port 4000.

Acceptance criteria:

- Frontend runs locally.
- Backend runs locally.
- Basic project structure exists.
- README contains initial setup instructions.

---

## Phase 2 - Prisma data model

Status: Done

Goal:
Implement the initial database model using Prisma.

Entities:

- User
- Category
- BlockType
- WeeklyPlan
- WeeklyPlanItem
- BlockInstance

Business rules:

- LifeTasker is not a daily todo-list.
- A user can create reusable block types.
- A block type belongs to a category.
- A weekly plan represents one specific week.
- A weekly plan has many plan items.
- A weekly plan item defines the target count for a block type.
- A block instance represents a completed block.
- A completed block stores a `completedAt` timestamp.
- Blocks must not be required to belong to a specific day.
- `scheduledAt` can exist as optional for future drag and drop.

Seed data:

- TECH
- SALUD
- TRABAJO
- FAMILIA

Acceptance criteria:

- Prisma schema is updated.
- Initial migration exists.
- Seed script creates default categories.
- Demo user may be created only for local testing.
- README includes Prisma/database commands.
- No authentication is implemented.
- No REST business endpoints are implemented yet.
- No frontend business screens are implemented yet.

---

## Phase 3 - Backend REST API

Status: Done

Goal:
Implement the core NestJS REST API.

Modules:

- categories
- block-types
- weekly-plans
- block-instances
- progress

Endpoints:

- GET /categories
- POST /block-types
- GET /block-types
- PATCH /block-types/:id
- DELETE /block-types/:id
- POST /weekly-plans
- GET /weekly-plans/current
- PATCH /weekly-plans/:id/items
- POST /block-instances/complete
- GET /progress/current-week

Rules:

- Use DTOs and validation.
- Use PrismaService.
- Use a temporary fixed demo user until authentication exists.
- Do not implement authentication yet.

---

## Phase 4 - Frontend MVP

Status: Done

Goal:
Build the basic functional UI.

Pages:

- /dashboard
- /block-types
- /weekly-plan

Components:

- BlockTypeForm
- BlockTypeList
- WeeklyPlanEditor
- CompleteBlockButton
- ProgressByBlockType
- ProgressByCategory
- WeeklyLevelCard

Flow:

1. Create block type.
2. Define weekly targets.
3. Complete blocks.
4. View weekly progress.

Rules:

- Do not create a daily todo-list.
- Do not require assigning blocks to days.
- The UI must focus on weekly flexible progress.

Implemented (2026-05-03):

- Added frontend routes: `/dashboard`, `/block-types`, `/weekly-plan`.
- Added components: `BlockTypeForm`, `BlockTypeList`, `WeeklyPlanEditor`, `CompleteBlockButton`, `ProgressByBlockType`, `ProgressByCategory`, `WeeklyLevelCard`.
- Added frontend API helper with `NEXT_PUBLIC_API_URL` support and fallback to `http://localhost:4000/api/v1`.

---

## Phase 5 - Weekly reset behavior

Status: Pending

Goal:
Automatically create a new weekly plan when a new week starts.

Suggested approach:

- When requesting the current weekly plan, check whether one exists for the current week.
- If none exists, clone targets from the previous week.
- Start counters from zero because no block instances exist for the new week.
- Avoid cron jobs for MVP unless needed.

---

## Phase 6 - UI improvements

Status: Pending

Goal:
Improve product experience.

Ideas:

- Better dashboard layout.
- Category colors.
- Progress cards.
- Empty states.
- Responsive improvements.

---

## Phase 7 - Optional drag and drop

Status: Pending

Goal:
Add optional visual calendar placement.

Rules:

- Drag and drop must be optional.
- Blocks must remain weekly-flexible.
- Day/time assignment must not become mandatory.
- Use `scheduledAt` optionally.

Suggested library:

- dnd-kit

---

## Phase 8 - Authentication

Status: Pending

Goal:
Add real users and remove temporary demo user.

Possible options:

- JWT auth in NestJS.
- Auth.js / NextAuth-style integration.
- Other auth provider if chosen later.

---

## Current next task

Implement Phase 4: Frontend MVP screens and components.
