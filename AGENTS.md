# Rapiexpress Monorepo

## Interaction rules

- Respond in Spanish. Code, comments, and commit messages in English.
- Implement directly when the task is clear. If requirements are ambiguous,
  ask before coding — do not guess and build on assumptions. Check documentations
  if it's necessary.
- Challenge flawed premises before executing a task. Directness over politeness.
- Distinguish verified facts from inference. Say "I'm not sure" when applicable.
- If you lack current information (library APIs, versions, docs), search the
  web and official documentation instead of relying on memory.

## Production guardrails (require explicit confirmation before acting)

- Any command against a production environment or production database.
- Destructive operations: DROP, TRUNCATE, DELETE without WHERE, force push,
  history rewrites, deleting branches/files not created in this session.
- Schema migrations on existing tables with data.
- Dependency major-version upgrades and lockfile regeneration.
- Changes to auth, payments, or anything touching secrets/env vars.
- Never commit secrets. If a secret appears in a diff, stop and flag it.

## Stack conventions

- TypeScript strict mode. No `any` without a justifying comment.
- ORMs: Prisma is the one for this project.
  Migrations generated via ORM tooling, never hand-edited after applying.
- Validation: Zod schemas as the single source of truth for input shapes.
- Package manager: pnpm. Monorepos: pnpm workspaces; add Turborepo only
  when task orchestration/caching justifies it. This case: pnpm workspaces.
- Project-specific stack (frontend framework, DB, infra) is defined in each
  repo AGENTS.md or CLAUDE.md — defer to it.

## Database principles (non-negotiable)

- Idempotency lives in the database, not application logic.
  `INSERT ... ON CONFLICT ... DO NOTHING RETURNING *`, never SELECT-then-INSERT.
- State transitions must be conditional; always check affected rows.
- Never maintain two sources of truth for the same metric.
- Index every foreign key and columns used in frequent WHERE/ORDER BY.
  Justify each index with a real query pattern — do not index preventively.

## Code quality (verifiable rules)

- Before finishing any task: list edge cases and race conditions considered,
  and how each is handled or why it's out of scope.
- All user input crosses a Zod schema before reaching business logic.
- No duplicated business logic across modules; shared logic gets extracted.

## Git workflow

- `main` and `develop` are protected. Never commit directly to either one.
- Every change goes on its own branch, created from `develop` — not from
  `main`. Check the base before starting: `git merge-base HEAD develop`
  should be the tip of `develop`.
- Branch naming: `type/short-description`, using the same type as the
  Conventional Commit (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`).
- Branches merge into `develop`. `main` only receives releases from
  `develop`.
- Commits: Conventional Commits (`type(scope): description`). Small, atomic
  commits — one logical change each. Never mix refactors with features.
- Never push without being asked.
