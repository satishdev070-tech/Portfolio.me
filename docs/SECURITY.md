# Security

## Threat model in one paragraph

The browser holds the Supabase anon key and the user's JWT, so **anything RLS allows, a user can do
directly** against PostgREST/Storage, bypassing our UI and server. Therefore every rule that matters
(tenant isolation, plan limits, publishing, domains, credits, billing) is enforced **in Postgres**.
Next.js server code adds validation, rate limits and friendly errors, and is not the security boundary.

## Controls

| Area | Control |
|---|---|
| Tenant isolation | RLS on every table (default deny); `workspace_id` + membership helpers; composite FKs stop cross-tenant references; anon has no table access except the public catalog |
| Privileged state | Column grants (e.g. `websites` only `name, locale, theme, seo, settings`); `SECURITY DEFINER` RPCs with `search_path = ''` for create/publish/slug/template/domains; service-role-only RPCs for subscriptions, AI settlement, domain verification, analytics |
| Public data | Only `get_published_site*` (snapshot of public fields). Private profile fields never enter snapshots. Drafts are never public |
| Admin | `users.is_platform_admin` (not user-writable; set via `scripts/grant-admin.mjs`); admin RLS policies; `requireAdmin` on pages and actions |
| AuthN | Supabase Auth (password, magic link); session refresh in `proxy.ts`; protected routes redirect; post-login redirects accept same-origin relative paths only |
| Input validation | zod on every action/route (`parseInput`); DB check constraints as a second layer; strict schemas reject unknown keys |
| XSS | All user content rendered as React text; links pass `safeUrl` (http/https/mailto/tel only); theme tokens allowlisted; JSON-LD escaped (`<` → `<`); video embeds only YouTube/Vimeo privacy hosts; SVG uploads refused |
| CSRF | Server actions: Next's Origin check. Route handlers: `assertSameOrigin` + `SameSite=Lax` cookies |
| Headers | CSP (script/frame/object/base/form restrictions, `frame-ancestors 'self'`), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production, `poweredByHeader: false` |
| Uploads | Magic-byte detection (never trust MIME/name), size caps per purpose, bucket MIME/size limits, images re-encoded to WebP via sharp (strips EXIF/GPS), workspace-prefixed paths enforced by storage RLS, quota trigger |
| SSRF (URL import) | http(s) only, no credentials/odd ports, DNS resolved and private/reserved ranges blocked, re-checked per redirect, robots.txt honoured, size/time caps |
| Rate limits | Uploads, imports, domain checks, exports, analytics (in-memory per instance); AI rate limit in Postgres (global) |
| AI abuse | Per-user/minute limit, monthly credits, input caps, prompt-injection guard for imported text, outputs schema-validated, credits refunded on failure |
| Secrets | `SUPABASE_SERVICE_ROLE_KEY`, AI keys, Razorpay secrets, `ANALYTICS_SALT` are server-only (`server-only` modules); provider keys referenced by env var *name* in the DB |
| Domains | Activated only after server-side DNS TXT + routing verification |
| Billing | Webhook HMAC verification (constant-time); idempotent event log; plan granted by webhook, not redirect |
| Privacy | Analytics: no cookies, no IP storage, daily-rotating per-site HMAC visitor id, DNT/GPC honoured, bots dropped, query strings stripped |
| Audit | `audit_logs` (append-only for clients) on website, domain, subscription and template events |
| Errors | Structured `{ success:false, error:{ code, message } }`; DB/provider internals never returned; unexpected errors logged server-side |

## Verified by tests

`tests/db/security.test.ts` (real sessions + anon key): signup provisioning, cross-tenant reads
hidden, cross-tenant inserts rejected (FK and RLS), foreign RPCs denied, foreign storage paths denied,
direct writes to status/slug/domains/subscriptions/AI usage/admin flag rejected, anon can't read tenant
tables, drafts invisible until republish, publish validation, premium gating + upgrade, website limit,
slug rules, custom-domain gating, advanced sections disabled on Free, rollback, credit metering.
`tests/unit`: theme injection, URL sanitizing, JSON-LD escaping, SSRF ranges, webhook signatures,
upload sniffing, analytics privacy.

## Lessons recorded

* Admin RLS policies widen what `select` returns for admins: never rely on "RLS only returns my row"
  with `.single()`; filter explicitly (fixed in `getViewer`).
* supabase-js drops `undefined` RPC arguments; an RPC whose parameters lack defaults then fails.
  Pass `null` explicitly (fixed in AI refunds; stale reservations also expire after 10 minutes).

## Before production

* Move rate limiting to a shared store (Redis/Upstash) when running more than one instance.
* Consider nonce-based CSP for the product app (sites can keep the static policy for caching).
* Turn on email confirmation and leaked-password protection in Supabase Auth; add CAPTCHA to signup.
* Schedule `ai_release_stale_reservations()` and analytics retention pruning.
* Rotate `ANALYTICS_SALT` only with a note that unique-visitor counts reset that day.
