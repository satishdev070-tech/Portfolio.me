# Subscriptions & entitlements

## Model

```
workspace ──► subscriptions (live one: trialing | active | past_due) ──► subscription_plans
                                                                            └─ plan_features (feature_key, enabled, limit_value)
no live subscription ──► the default plan (is_default = true, i.e. Free)
```

Prices (`price_minor`, integer paise), currency, billing interval, status, highlights and provider plan
ids are rows. **Nothing in code mentions ₹199/₹299 or compares plan slugs.** Admins edit all of it at
`/admin/plans`.

### Features (seeded)

Boolean: `premium_templates`, `advanced_sections`, `remove_branding`, `advanced_seo`, `analytics_basic`,
`analytics_advanced`, `ai_content_generation`, `ai_import`, `ai_advanced_models`, `custom_domain`,
`multiple_websites`, `custom_css` (reserved, not granted).
Limits (−1 = unlimited): `max_websites`, `ai_credits_monthly`, `storage_mb`, `max_custom_domains`.

| | Free (₹0) | Basic (₹199/mo) | Advanced (₹299/mo) |
|---|---|---|---|
| Websites | 1 | 1 | 3 |
| AI credits / month | 25 | 200 | 1,000 (+ advanced models) |
| Storage | 50 MB | 500 MB | 2 GB |
| Premium templates, advanced sections, no branding, advanced SEO, advanced analytics | — | ✓ | ✓ |
| Custom domains | — | — | 3 |

Free is a complete website: free templates, core sections, subdomain, basic SEO, AI credits, basic analytics.

## Entitlement resolution (one place)

`private.effective_plan_id(ws)` picks the plan:

* `trialing` / `active` → that plan
* `past_due` → that plan for 7 days after period end (payment retry grace)
* `cancelled` → that plan until `current_period_end`
* otherwise → the default plan

`has_feature(ws, key)` and `feature_limit(ws, key)` read `plan_features`. The app reads the whole
document once per request via `get_entitlements(ws)` (`src/lib/entitlements.ts`: `hasFeature`,
`limitOf`, `assertFeature`).

## Enforcement (server/DB, never the UI alone)

| Rule | Enforced in |
|---|---|
| Website count | `create_website` (advisory-locked count) and `validate_website_for_publish` (published count) |
| Premium template / advanced sections | `validate_website_for_publish`: usable in drafts, not publishable |
| Remove branding | `build_site_document` sets `show_branding` from the entitlement |
| Advanced SEO fields | `build_site_document` strips them from the snapshot without the feature |
| Custom domains (+ count) | `add_custom_domain` |
| Storage | `media_assets` insert trigger + storage insert policy |
| AI feature + monthly credits + rate | `ai_reserve` |
| Analytics breakdowns | `get_site_analytics` |

The UI mirrors these (locks, upgrade notices) only to explain them.

Upgrades take effect immediately. On downgrade nothing is deleted; anything above the new limits keeps
working until the next publish, which then requires fitting the plan (e.g. switch to a free template).
