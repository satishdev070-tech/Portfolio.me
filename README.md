# HelloMe

Professional websites for every profession. *Create your professional identity once. Publish it everywhere.*

Next.js 16 · React 19 · Tailwind 4 · Supabase (Postgres + RLS, Auth, Storage) · TypeScript.

## Run locally

```bash
npm install
npm run db:start        # local Supabase (Docker); applies migrations + seed
cp .env.example .env.local   # fill from `supabase status` (anon + service role keys)
npm run dev             # http://localhost:3000
```

Published sites are served at `http://<slug>.localhost:3000` (browsers resolve `*.localhost`), or at
`http://localhost:3000/u/<slug>`.

Make yourself a platform admin (after signing up): `node scripts/grant-admin.mjs you@example.com`

Development defaults: `AI_ALLOW_MOCK=true` (deterministic mock AI + rule-based CV parsing) and
`BILLING_PROVIDER=dev` (upgrades activate instantly). Never use either in production.

## Checks

```bash
npm run check   # typecheck, lint, unit tests, DB integration tests (needs db:start), build
```

## Docs

[Product architecture](docs/PRODUCT_ARCHITECTURE.md) · [Database](docs/DATABASE_ARCHITECTURE.md) ·
[Templates](docs/TEMPLATE_SYSTEM.md) · [Publishing](docs/PUBLISHING_ARCHITECTURE.md) ·
[Subscriptions](docs/SUBSCRIPTION_SYSTEM.md) · [Billing](docs/BILLING_ARCHITECTURE.md) ·
[AI](docs/AI_ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Status](docs/IMPLEMENTATION_STATUS.md)
