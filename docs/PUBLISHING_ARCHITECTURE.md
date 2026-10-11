# Publishing architecture

## Draft → publish → rollback

```
Draft (live tables)                     Published (immutable)
profiles + collections ┐
websites.theme / seo    ├─ build_site_document() ─► website_versions.snapshot  ◄── websites.published_version_id
website_sections        ┘   (public fields only)        kind = published | checkpoint
template_versions.config
```

* Editors change the draft freely; visitors never see it.
* **Publish** (`publish_website`): locks the website row → `validate_website_for_publish` → snapshot →
  new version → `status = published`, `published_version_id` → audit log. Returns structured errors
  instead of throwing, so the UI can show a checklist.
* **Checks:** name + headline, hero section present, template published, premium template ⇒
  `premium_templates`, enabled advanced sections ⇒ `advanced_sections`, published-site count ⇒
  `max_websites`, valid avatar URL. Warnings: no bio, no SEO title (defaults used). Slug validity and
  uniqueness are enforced when the slug is set.
* **Checkpoint** (`create_checkpoint`): snapshot without going live.
* **Rollback** (`restore_website_version`): makes a published version live again and restores the
  draft's template, design, SEO and sections from it. Profile collections are not overwritten.
* **Unpublish:** site returns 404; versions are kept.

## Serving

```
GET https://asha.hellome.in/
  proxy.ts: host → site → rewrite /sites/asha          (no auth, no cookies)
  /sites/[slug]/page.tsx → getPublishedSiteBySlug()    unstable_cache, tag site:asha, 1 h TTL
       → get_published_site(slug): one indexed query, snapshot only
  → SiteRenderer + JSON-LD + privacy beacon
```

* Publish/unpublish/rollback/slug/domain changes call `revalidateTag(tag, { expire: 0 })`, so the next
  request renders fresh. The TTL is only a safety net (e.g. a plan change affecting branding).
* Custom domains rewrite to `/domains/<host>` and resolve through `get_published_site_by_domain`.
* `/u/<slug>` serves the same site on the app domain (no wildcard DNS needed); its canonical URL is
  the subdomain (or the custom domain).
* Per-site `robots.txt` and `sitemap.xml`; platform `sitemap.xml` lists published, indexable sites.
* For CDN caching in production, pages can additionally send `Cache-Control: s-maxage` on the site
  routes. Next's data cache already avoids a DB query per render.

## Addresses (subdomains)

* Lowercase letters, digits, single hyphens; must start/end alphanumeric; length from
  `platform_settings` (3–30 by default).
* `reserved_slugs` (admin-editable): admin, api, app, www, support, help, login, signup, dashboard,
  billing, static, assets and ~50 more.
* Unique among non-deleted websites (partial unique index; race-safe).
* Change policy: owners only, once per `slug.change_cooldown_days` (30); the old address stops
  working immediately.

## Custom domains

```
Enter domain → add_custom_domain (feature + limit + normalization + not a platform host)
  → DNS instructions:  TXT  _hellome-verify.<domain> = hellome-verify=<token>
                       CNAME <www/sub> → CUSTOM_DOMAIN_CNAME_TARGET   (apex: A → CUSTOM_DOMAIN_A_RECORD)
  → Verify (server resolves DNS itself) → record_domain_check (service role)
  → HostingProvider.addDomain() → SSL provisioning → active (first verified domain becomes primary)
```

Domains are never activated from user input; only a server-side DNS check (TXT ownership **and**
routing) can activate them. `HostingProvider` adapters: `manual` (default; operator adds the domain at
the edge, e.g. Cloudflare for SaaS) and `vercel` (Vercel Domains API via `VERCEL_TOKEN`,
`VERCEL_PROJECT_ID`). DNS verification needs real DNS and wasn't exercised locally; the gating and
state machine are covered by DB tests.

## SEO

Per site: title (custom or "Name — Headline"), meta description, canonical, Open Graph (profile type),
X/Twitter card, favicon (profile photo), robots (noindex toggle), sitemap, and schema.org JSON-LD:
`Person` always (jobTitle, sameAs, alumniOf, knowsAbout, worksFor); a business type (`Physician`,
`Dentist`, `Attorney`, `HomeAndConstructionBusiness`, `ProfessionalService`…) **only** when the
profession suggests it *and* the profile lists a practice location or service area.
