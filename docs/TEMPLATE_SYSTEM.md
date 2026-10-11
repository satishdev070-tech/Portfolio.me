# Template system

Websites are not hand-built pages. A website is **data rendered by one engine**:

```
template_versions.config ──┐
  tokens (colours, type,    │
  spacing, components)      ├─► resolveTheme() ─► CSS custom properties (--hm-*)
website.theme (overrides) ──┘
website_sections (type, variant, position, enabled, content)
profile + collections (experience, services, …)        ─► build_site_document() ─► SiteDocument
                                                                                     │
                                                       src/site/renderer.tsx ◄──────┘
                                                         shell (centered | sidebar | split | editorial)
                                                         SECTION_COMPONENTS[type] (variant)
```

## Template config (`template_versions.config`)

```jsonc
{
  "tokens": {
    "colors": { "background", "surface", "text", "muted", "primary", "primaryContrast", "accent", "border" },
    "typography": { "heading": "fraunces", "body": "source-serif", "scale": "default", "headingWeight": 600 },
    "spacing": { "section": "default", "width": "narrow" },
    "components": { "radius": "sm", "button": "outline", "card": "flat" }
  },
  "layout": { "shell": "editorial", "heroAlign": "left" },
  "sections": [{ "type": "hero", "variant": "minimal" }, { "type": "publications", "variant": "list" }],
  "features": ["print", "publications"]
}
```

Validated by `src/lib/validation/template-config.ts` (admin editor) and re-validated on render: every
token passes an allowlist in `src/site/theme.ts` (hex colours, known fonts, known enums), so theme JSON
can never inject CSS.

## Template metadata (`templates`)

slug, name, description, style, layout, tier (free | premium), status (draft | published | archived),
featured, colour family, tags, features, preview image (optional; the marketplace shows a live scaled
demo), demo profile key, use count, current version. Compatibility: `template_professions`,
`template_categories`.

**Versioning.** Published versions are immutable (trigger). Editing a template means creating a new
version and publishing it (`admin_publish_template_version`). Published *websites* snapshot the
template config, so a template update never changes a live site until its owner republishes.

## Sections

`section_types` (30 seeded) declare key, name (+ Hindi), category, data source, allowed variants,
`is_advanced` (paid), singleton flag and default content. Components live in `src/site/sections/`:

| Family | Types |
|---|---|
| Core | hero (default, split, minimal, banner), about (default, columns), contact (default, split), social_links, cta, whatsapp |
| Career | experience (timeline, list), education, skills (chips, grouped, bars), awards, certifications, achievements (stats, list) |
| Showcase | services (cards, list), projects (grid, list), portfolio, gallery, videos, publications, testimonials (cards, quote), service_areas, appointments |
| Item lists | specialization, research, teaching, speaking, timeline, press, news, products, faq: one `Items` component over `section.content.items` |

Collection-backed sections read the profile; item sections store their items on the section.
Empty sections are hidden on live sites (and from the nav) and shown as placeholders in the editor.

**Adding a section type:** insert a `section_types` row, add a component to `SECTION_COMPONENTS`, a
label key in `src/i18n`, and (if needed) a `sectionHasContent` rule.

## Professions drive defaults

`professions.recommended_sections` sets the initial section list for a new website (in order);
the template supplies each section's variant. Examples from the seed:

* Doctor: hero, about, experience, specialization, services, education, certifications, awards, testimonials, appointments, contact
* Professor: hero, about, research, publications, teaching, education, projects, awards, speaking, contact
* Electrician: hero, about, services, experience, projects, gallery, testimonials, service areas, contact, WhatsApp

Advanced sections in a recommendation are added **disabled** for plans without `advanced_sections`.

## Customization (editor → Design)

Palette presets, the 8 colour tokens (with WCAG contrast warnings), heading/body fonts (9 self-hosted
families + Devanagari fallbacks), text scale, heading weight, page width, section spacing, corner
radius, button style, card style. Stored as overrides in `websites.theme`; "Reset to template" clears
them. Switching template keeps content and (optionally) design overrides.

## Seeded templates (12)

Free: Minimal CV, Medical Pro, Academic Scholar, Modern Engineer, Public Profile, Skilled Professional.
Premium: Legal Executive, Researcher, Creative Portfolio, Executive Profile, Creator Portfolio,
Business Consultant. Premium templates can be used and previewed on any plan; publishing one requires
`premium_templates`.

## Marketplace

`/templates`: search, profession, category, style, layout, colour, free/premium, sort (featured /
popular / new), favorites. Cards show a live miniature, name, profession fit, layout, tier, "Use
template" and "Preview". `/templates/[slug]`: device preview (desktop/tablet/mobile), sections,
features, version, use count, "Preview with my content" for signed-in users.

## Design principles applied

Restrained palettes, real typographic hierarchy, thin rules instead of heavy cards, no decorative
gradients or scroll animations, `prefers-reduced-motion` respected, skip link, semantic landmarks,
44px touch targets on primary actions, and a print stylesheet that turns any site into a clean CV.
