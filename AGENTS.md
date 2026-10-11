<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HelloMe: project rules

Read `docs/PRODUCT_ARCHITECTURE.md`, `docs/SECURITY.md` and `docs/IMPLEMENTATION_STATUS.md` first.

- Authorization lives in Postgres. The browser has the anon key: any rule that matters (tenancy, plan limits,
  publishing, domains, credits) must be enforced by RLS, column grants or a SECURITY DEFINER RPC, not only in TS.
- New tenant table: `workspace_id` + FK, `select private.apply_tenant_rls('<table>')` in the same migration,
  composite FK to its parent's `(id, workspace_id)`, and a test in `tests/db`.
- Tenant comes from the session (`getViewer()` / `getCurrentWebsite()`), never from request input. Filter queries
  explicitly: admin RLS policies widen what `select` returns.
- Plans: ask `hasFeature` / `limitOf` (`src/lib/entitlements.ts`); never compare plan slugs or prices.
- Validate every input with zod via `parseInput`; return `Result` (`action()` / `route()`); throw `AppError`.
- AI only through `runAITask` (`src/lib/ai/service.ts`); no vendor SDKs; secrets stay server-side.
- User content renders as text; links through `safeUrl`; theme values through `resolveTheme`.
- Pass `null`, not `undefined`, to RPC parameters without defaults (supabase-js drops undefined keys).
- Run `npm run check` before calling work done, then update `docs/IMPLEMENTATION_STATUS.md`.
