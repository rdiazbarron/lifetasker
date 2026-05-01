# LifeTasker Engineering Rules

## Product direction
- LifeTasker is a weekly-flexible progress system, not a daily todo list.
- Prioritize planning by weekly blocks, adaptive capacity, and progress visibility.
- Avoid daily streak mechanics as the primary interaction model.

## Architecture guardrails
- Keep monorepo structure under `apps/web` and `apps/api`.
- Web stack: Next.js App Router + TypeScript + TailwindCSS.
- API stack: NestJS + TypeScript.
- Persistence: PostgreSQL with Prisma ORM in backend.
- Build modules with clear boundaries; avoid business logic in framework bootstrap files.

## Delivery rules for future tasks
- No production secrets in repo; use `.env.example` as contract.
- Keep endpoints versionable and documented.
- Add tests with each new business module when introduced.
- Prefer incremental features over large rewrites.
