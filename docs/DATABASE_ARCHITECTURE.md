# Database architecture

Supabase Postgres 17. Migrations in `supabase/migrations/` (apply with `supabase db reset` locally or
`supabase db push` to a linked project). Types are generated into `src/lib/supabase/database.types.ts`
with `npm run db:types`.

## Principles

* **Relational for structured, frequently queried data** (profile collections, websites, sections,
  domains, subscriptions, usage). **JSONB only for flexible configuration**: template config, theme
  overrides, SEO, section content, AI raw responses, import metadata, published snapshots.
* **Every tenant row carries `workspace_id`** and has RLS in the migration that creates it
  (`private.apply_tenant_rls`).
* **Composite foreign keys** pin children to their tenant: profile collections reference
  `(profile_id, workspace_id) → profiles(id, workspace_id)`; sections, versions and domains reference
  `(website_id, workspace_id)`. A client can't attach a row to another tenant's profile even with a
  valid id.
* **Check constraints** on enums, lengths, URL/email/phone formats, date ordering, non-negative money.
* **Money in integer minor units** (`price_minor`, paise for INR). Credits are integers.
* **Soft delete** where history matters (`websites.deleted_at`, `profiles.deleted_at`,
  `media_assets.deleted_at`); hard delete for collection rows.
* **`private` schema** holds helpers (`is_member`, `can_edit`, `has_feature`, `build_site_document`, …).
  It is not exposed through PostgREST.

## Entities

| Area | Tables |
|---|---|
| Accounts & tenancy | `users` (mirror of auth.users), `organizations`, `workspaces`, `workspace_members` |
| Catalog | `profession_categories`, `professions`, `section_types`, `templates`, `template_versions`, `template_professions`, `template_categories`, `favorites`, `template_reviews` |
| Profile | `profiles` + `profile_experiences`, `profile_education`, `profile_skills`, `profile_services`, `profile_projects`, `profile_publications`, `profile_awards`, `profile_certifications`, `profile_testimonials`, `profile_social_links`, `profile_locations`, `profile_achievements`, `profile_media_items` |
| Websites | `websites`, `website_sections`, `website_versions`, `domains`, `reserved_slugs` |
| Media | `media_assets` (+ Storage buckets) |
| Billing | `features`, `subscription_plans`, `plan_features`, `subscriptions`, `billing_events`, `usage_records` |
| AI & import | `ai_providers`, `ai_models`, `ai_task_routes`, `ai_generations` (usage ledger), `import_sources`, `imports` |
| Analytics | `analytics_events`, `website_analytics_daily` |
| Platform | `platform_settings`, `audit_logs` (append-only), `notifications` |

Naming differences from the original brief: `ai_usage` is `ai_generations` (one row per request with
user, workspace, provider, model, task, tokens, credits, status, timestamps); `import_sources` is the
catalog of import types. Gallery/videos/documents are `profile_media_items`; languages are a
`profiles.languages` array.

## Write paths

| Data | Who writes | How |
|---|---|---|
| Profile + collections, section content/order/visibility, theme, SEO, website name/locale | Editors | Direct table writes under RLS (`can_edit`) |
| Website create/delete, slug, template switch, publish/unpublish, checkpoint, rollback | Editors / owners | `SECURITY DEFINER` RPCs: `create_website`, `delete_website`, `change_website_slug`, `apply_template`, `publish_website`, `unpublish_website`, `create_checkpoint`, `restore_website_version`, `reorder_sections` |
| Custom domains | Owners | `add_custom_domain`, `remove_custom_domain`; verification result only via service role (`record_domain_check`) |
| Subscriptions | Billing service | Service role only: `billing_set_plan`, `billing_update_subscription`, `billing_record_event` |
| AI usage | Server | Service role only: `ai_reserve`, `ai_settle` |
| Analytics | `/api/track` | Service role only: `record_site_event` |
| Media rows | Upload route | Insert under RLS; quota enforced by trigger |
| Catalog, plans, AI routing | Platform admins | RLS policies on `private.is_platform_admin()` |

Column grants back this up: e.g. `websites` is updatable only on `name, locale, theme, seo, settings`;
`users` only on `full_name, avatar_url, locale, onboarding_completed_at`.

## Key functions

* `get_entitlements(ws)`: plan, subscription, features, limits, usage period.
* `get_profile_completion(profile)`: weighted checklist (items apply only if the profession needs them).
* `build_site_document(website)`: the renderer's JSON; public fields only.
* `validate_website_for_publish(website)`: `{ ok, errors[], warnings[] }`.
* `get_published_site(slug)`, `get_published_site_by_domain(host)`: anon-callable, snapshot only.
* `get_site_analytics(website, days)`: totals + daily; breakdowns only with `analytics_advanced`.
* `get_workspace_usage(ws)`, `get_ai_usage(ws)`.

## Indexes

Every tenant table is indexed by `workspace_id`; collections by `(profile_id, sort_order)`; websites
have a unique partial index on `slug where deleted_at is null`; `website_versions (website_id,
version_number desc)`; `analytics_events (website_id, occurred_at desc)`; daily rollups keyed by
`(website_id, day)`; one live subscription per workspace (partial unique index).

## Scaling notes

* `analytics_events` should be partitioned by month and pruned per `analytics.retention_days` once
  volume warrants; dashboards read `website_analytics_daily`.
* Published reads hit one indexed join and are cached in Next (`unstable_cache`, tag `site:<slug>`).
* RLS helpers are `STABLE SECURITY DEFINER` functions so membership checks are cheap and don't recurse.
