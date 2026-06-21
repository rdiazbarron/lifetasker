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

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`gh` CLI); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
