# Implementation status

_Last updated: 2026-10-11_

Legend: ✅ built and verified · 🟡 built, not verified end-to-end (needs external accounts) · ⬜ not built (extension point only)

## Phase 1: Core product ✅

| Item | Status | Notes |
|---|---|---|
| Auth (password, magic link, callback, sign-out) | ✅ | Supabase Auth; Google OAuth not configured |
| Workspace provisioning on signup | ✅ | DB trigger; owner membership |
| Profession catalog (10 categories, 59 professions, Hindi names) | ✅ | Admin-editable |
| Onboarding (profession → about → template → address) | ✅ | Live slug availability; import-or-manual choice |
| Profile: basics + 12 normalized collections, profession-specific fields | ✅ | One config-driven editor (`src/lib/collections.ts`) |
| Template marketplace (search, filters, sort, favorites, detail, live demo, device preview, use) | ✅ | 12 templates |
| Template engine (tokens, 4 shells, 30 section types, variants) | ✅ | Unit-tested renderer |
| Website builder (sections add/remove/reorder/toggle/layout/content) | ✅ | |
| Theme customization (palettes, 8 colours, fonts, scale, weight, width, spacing, radius, buttons, cards) | ✅ | Contrast warnings |
| Preview (draft, desktop/tablet/mobile, template-with-my-content) | ✅ | |
| Publishing (validation, snapshot, versions, checkpoints, rollback, unpublish) | ✅ | DB-tested |
| Subdomain routing (`<slug>.<root>`), `/u/<slug>`, reserved slugs, change cooldown | ✅ | Verified via Host headers and the browser |

## Phase 2: Content & growth ✅ (provider calls 🟡)

| Item | Status | Notes |
|---|---|---|
| AI provider abstraction, routing, credits, fallback, refunds | ✅ | Mock provider in tests |
| NVIDIA NIM / xAI adapters | 🟡 | Endpoints verified from docs; no keys here, so never called |
| AI Studio (bio, headlines, experience, services, project, SEO, rewrite, translate) | ✅ | "Use this" applies to profile |
| Import: PDF, DOCX, LinkedIn PDF, website URL, GitHub, text | ✅ | Text import verified end-to-end; rule-based fallback |
| OCR (image import) | 🟡 | Routed to a vision model; needs a provider key |
| Review-before-save import UI | ✅ | |
| Media library (upload → WebP, alt text, gallery, videos, delete, quota) | ✅ | Upload verified incl. spoofed files |
| SEO (title, description, OG, Twitter, canonical, robots, sitemaps, schema.org) | ✅ | |
| Privacy-friendly analytics (views, uniques, referrers, devices, countries, clicks) | ✅ | Ingestion verified |
| Multilingual (en, hi) with translation keys; Hindi site labels + Devanagari fonts | ✅ | Dashboard copy is partly English literals (see below) |

## Phase 3: Monetization ✅ (payments 🟡)

| Item | Status | Notes |
|---|---|---|
| Plans, features, limits in DB; admin editor | ✅ | |
| Central entitlement service + DB enforcement | ✅ | DB-tested |
| Premium templates / advanced sections gating at publish | ✅ | |
| BillingProvider + SubscriptionService; dev provider | ✅ | |
| Razorpay adapter (checkout, cancel, webhooks) | 🟡 | Signature check unit-tested; not run against Razorpay |
| Custom domains (add, DNS instructions, verify, SSL via hosting adapter) | 🟡 | Gating + state machine tested; real DNS/SSL not exercised |

## Phase 4: Scale & teams ⬜ (architected)

Multiple websites ✅ (Advanced plan, up to 3). Agencies/teams (organizations, roles exist; no invite UI),
white label, public API/SDK, advanced analytics exports: not built. See PRODUCT_ARCHITECTURE.md → Extension points.

## Admin ✅

Overview metrics, users & sites, professions & categories, templates (metadata, compatibility, versions,
JSON config editor, preview, publish), section types (active/advanced), plans & features, AI providers /
models / routing, domains, audit log.

## Verification (2026-10-11)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ 0 problems |
| `npm test` (unit) | ✅ 29 tests |
| `npm run test:db` (local Supabase) | ✅ 21 tests |
| `npm run build` | ✅ 43 routes |
| Browser: signup → onboarding → editor → publish → live subdomain | ✅ |
| HTTP: all 21 authenticated pages render for an admin; host routing; robots/sitemap; tracking; headers | ✅ |

## Known gaps / next steps

1. **Real provider accounts:** add `NVIDIA_API_KEY` / `XAI_API_KEY`, confirm model ids via `/v1/models`;
   Razorpay test-mode purchase; deploy and verify a real custom domain + SSL.
2. **Hosting:** wildcard DNS `*.hellome.in` → app; set `NEXT_PUBLIC_ROOT_DOMAIN`, `CUSTOM_DOMAIN_*`.
3. **Scheduled jobs:** `ai_release_stale_reservations()`, analytics retention, media orphan cleanup
   (assets not referenced by profile/sections/snapshots).
4. **i18n coverage:** navigation, onboarding labels and all public-site labels use keys; most dashboard
   page copy is still English literals and should move to `src/i18n` progressively.
5. **Rate limiting** in a shared store for multi-instance deployments.
6. Team invites UI, Google sign-in, GST invoices, contact form/lead capture, digital card/QR, PDF export.
7. Drag-and-drop section ordering (up/down controls today).
