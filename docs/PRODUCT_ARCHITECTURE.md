# Product architecture

HelloMe: *Create your professional identity once. Publish it everywhere.* A multi-tenant SaaS where
any professional (doctor, advocate, professor, electrician, creator…) builds and publishes a personal
website from structured profile data, a profession-aware template and AI help.

## Core journey

```
Signup ──► workspace auto-provisioned (DB trigger)
   │
Onboarding: profession → name + headline → template (ranked for profession) → address (live check)
   │        └─ creates profile + website; sections seeded from the profession's recommended list
   ▼
Import (CV / LinkedIn PDF / GitHub / website / text / image) → review → save selected items
   │
Profile editing (12 normalized collections) ◄── AI Studio (bio, services, SEO, rewrite…)
   │
Editor: sections (order, visibility, layout, content) · design tokens · versions · settings
   │        live draft preview in desktop / tablet / mobile frames
   ▼
Publish: validation → immutable snapshot (website_versions) → live at <slug>.<root domain>
   │
Upgrade (billing provider) → premium templates, advanced sections, custom domain …
```

## System overview

```
Browser ──► Next.js 16 (App Router, single app)
              │  src/proxy.ts  host-based routing + session refresh
              │    <root>/…          product (marketing, auth, dashboard, admin)
              │    <slug>.<root>/    → /sites/<slug>      published site (no auth work)
              │    <custom domain>/  → /domains/<host>    published site
              │
              ├─ Server Components / Server Actions ─► Supabase (user session, RLS)
              ├─ Route handlers (/api/*): uploads, imports, track, billing webhooks, export
              └─ Service-role client: only for RPCs granted to service_role (AI settle, domain
                 verification result, billing, analytics ingestion)
                          │
Supabase: Postgres 17 (RLS on every table) · Auth · Storage (7 buckets)
External (server only): NVIDIA NIM / xAI (OpenAI-compatible) · Razorpay · DNS · GitHub API
```

Key choices (and why):

* **Supabase for auth, data and storage; Next.js for everything else.** One deployable app, no separate
  API server. The trade-off is that the database is reachable from the browser with the anon key, so
  **all authorization lives in Postgres** (RLS, column grants, SECURITY DEFINER RPCs). See SECURITY.md.
* **Published sites are snapshots.** Publishing writes a JSON document (`website_versions.snapshot`);
  public pages read only that. Drafts can't leak, rollback is trivial, and a page render is one cached
  read. See PUBLISHING_ARCHITECTURE.md.
* **Configuration over code.** Professions, categories, section types, templates (+ versions), plans,
  features, AI routes and import sources are rows. Adding a profession or template needs no deploy.
* **One renderer.** `src/site/renderer.tsx` renders draft previews, template demos and live sites from
  the same `SiteDocument`, so the editor preview is exactly what visitors get.

## Code map

| Path | Purpose |
|---|---|
| `supabase/migrations/` | Schema, RLS, RPCs (11 migrations) |
| `supabase/seed.sql` | Catalog: 10 categories, 59 professions, 30 section types, 12 templates, 3 plans, 16 features, AI routes, import sources |
| `src/proxy.ts` | Host routing, session refresh, route guards |
| `src/site/` | Template engine: types, theme tokens, fonts, sections, renderer, runtime, demo content |
| `src/lib/` | auth/workspace context, entitlements, errors, catalog, AI, imports, media, billing, domains, SEO, analytics |
| `src/app/(marketing)` | Landing, marketplace, template detail, pricing, features, about, profession pages |
| `src/app/(auth)`, `onboarding` | Sign up / in, onboarding wizard |
| `src/app/(app)` | Dashboard, editor, profile, media, AI, import, SEO, analytics, domain, billing, settings, admin |
| `src/app/sites`, `domains`, `u` | Published-site routes (+ per-site robots/sitemap) |
| `src/app/actions/` | Server actions (all return `{ success, data | error }`) |
| `src/i18n/` | Translation dictionaries (en, hi) |
| `tests/unit`, `tests/db` | Unit tests; integration tests against local Supabase |

## Routes

Public: `/`, `/templates`, `/templates/[slug]`, `/templates/[slug]/use`, `/profession/[slug]`, `/pricing`,
`/features`, `/about`, `/login`, `/signup`, `/demo/[slug]` (template live demo), `/u/[username]`.

Authenticated: `/dashboard`, `/editor` (tabs: sections, design, versions, settings), `/profile`,
`/profile/[collection]`, `/templates` (with favorites + "use"), `/media`, `/ai`, `/import`, `/import/[id]`,
`/seo`, `/domain`, `/analytics`, `/billing`, `/settings`, `/preview/site/[id]`, `/preview/template/[slug]`.
`/design`, `/content`, `/websites` redirect to their homes in the editor/profile/settings.

Admin (`users.is_platform_admin`): `/admin` overview, users & sites, professions, templates (+ versions),
sections, plans, AI, domains, audit log.

## Tenancy model

`user → workspace_members → workspace → websites / profiles / media / imports / AI usage …`.
A workspace is the tenant boundary and billing unit. Personal workspaces are created on signup;
`organizations`, `workspaces.kind` ('personal' | 'team' | 'agency') and membership roles
('owner' | 'admin' | 'editor' | 'viewer') are in place for agencies and teams. A workspace can hold
several profiles and websites (bounded by the `max_websites` entitlement).

## Extension points (architected, not built)

| Future feature | Where it plugs in |
|---|---|
| Digital business card, QR, vCard | New route reading the published snapshot (`get_published_site`) |
| Resume PDF | Print stylesheet exists; server PDF = headless render of `/u/[slug]` |
| Contact form / lead capture | New section type + `leads` tenant table + `/api/contact` with rate limit |
| Appointment booking | `appointments` section already supports external booking links |
| Blog / articles / events / courses | New collections in `src/lib/collections.ts` + section types |
| Verified profile / badge | `profiles.extra` + admin verification table + renderer badge |
| Agencies, teams, white label | `organizations`, membership roles, per-workspace settings, custom domains |
| Public API / SDK | RPCs are already the API surface; add API keys per workspace |
| More languages | Add a dictionary in `src/i18n` and to `SUPPORTED_LOCALES` |
