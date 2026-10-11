import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { resolveTheme, themeToCssVars, contrastRatio } from '@/site/theme'
import { safeUrl, videoEmbedUrl, contentItems, dateRange } from '@/site/utils'
import { demoDocument, withTemplate } from '@/site/demo'
import { SiteRenderer } from '@/site/renderer'
import { sectionHasContent } from '@/site/sections'
import { buildJsonLd, jsonLdString } from '@/lib/seo/schema-org'
import type { TemplateConfig } from '@/site/types'

const config: TemplateConfig = {
  tokens: {
    colors: { background: '#ffffff', surface: '#fafafa', text: '#111111', muted: '#555555', primary: '#111111', primaryContrast: '#ffffff', accent: '#2563eb', border: '#e5e5e5' },
    typography: { heading: 'fraunces', body: 'inter', scale: 'default', headingWeight: 600 },
    spacing: { section: 'default', width: 'default' },
    components: { radius: 'sm', button: 'solid', card: 'flat' },
  },
  layout: { shell: 'centered', heroAlign: 'left' },
  sections: [{ type: 'hero', variant: 'split' }, { type: 'about', variant: 'default' }, { type: 'experience', variant: 'timeline' }, { type: 'faq', variant: 'default' }, { type: 'contact', variant: 'default' }],
}
const template = { id: 't', slug: 'test', name: 'Test', layout: 'centered', tier: 'free' as const, version: 1, config }

describe('theme resolution', () => {
  it('applies valid overrides and rejects CSS injection', () => {
    const t = resolveTheme(config, {
      colors: { accent: '#ff0000', text: 'red;}</style><script>alert(1)</script>' as string, background: 'url(javascript:alert(1))' as string },
      typography: { heading: 'comic-sans' as never, headingWeight: 9999 },
      components: { radius: 'lg' },
    })
    expect(t.colors.accent).toBe('#ff0000')
    expect(t.colors.text).toBe('#111111')
    expect(t.colors.background).toBe('#ffffff')
    expect(t.typography.heading).toBe('fraunces')
    expect(t.typography.headingWeight).toBe(600)
    expect(t.components.radius).toBe('lg')
    expect(Object.values(themeToCssVars(t)).join(' ')).not.toMatch(/script|javascript/)
  })

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5)
  })
})

describe('rendering helpers', () => {
  it('only allows safe link schemes', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com')
    expect(safeUrl('mailto:a@b.co')).toBe('mailto:a@b.co')
    expect(safeUrl('tel:+91 98765 43210')).toBe('tel:+91 98765 43210')
    expect(safeUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeUrl('data:text/html,<script>')).toBeUndefined()
    expect(safeUrl(' JAVASCRIPT:alert(1)')).toBeUndefined()
  })

  it('embeds only YouTube/Vimeo via privacy-enhanced hosts', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(videoEmbedUrl('https://vimeo.com/123456789')).toContain('player.vimeo.com/video/123456789')
    expect(videoEmbedUrl('https://evil.example/video')).toBeUndefined()
  })

  it('sanitizes section item JSON', () => {
    const items = contentItems({ items: [{ title: 'A', url: 'https://x.y' }, { nope: 1 }, 'str', { title: 'B', extra: '<x>' }] })
    expect(items.map((i) => i.title)).toEqual(['A', 'B'])
    expect(items[1]).not.toHaveProperty('extra')
  })

  it('formats date ranges', () => {
    expect(dateRange('2020-01-01', null, true, 'en', 'Present', true)).toBe('2020 – Present')
    expect(dateRange('2018-01-01', '2018-06-01', false, 'en', 'Present', true)).toBe('2018')
  })
})

describe('SiteRenderer', () => {
  it('renders a template demo with escaped user content', () => {
    const doc = demoDocument({ template, demoKey: 'doctor', baseUrl: 'http://localhost:3000' })
    doc.profile.headline = '<img src=x onerror=alert(1)>'
    doc.sections.find((s) => s.type === 'faq')!.content = { items: [{ title: 'Q?', description: 'A <script>bad()</script>' }] }
    const html = renderToStaticMarkup(<SiteRenderer doc={doc} />)
    expect(html).toContain('Dr. Asha Rao')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<script>bad()')
    expect(html).toContain('data-shell="centered"')
  })

  it('hides empty sections on the live site but shows placeholders in preview', () => {
    const doc = demoDocument({ template, demoKey: 'professional', baseUrl: 'http://x' })
    doc.collections.experiences = []
    const exp = doc.sections.find((s) => s.type === 'experience')!
    expect(sectionHasContent(exp, doc)).toBe(false)
    expect(renderToStaticMarkup(<SiteRenderer doc={doc} />)).not.toContain('id="experience"')
    expect(renderToStaticMarkup(<SiteRenderer doc={doc} preview />)).toContain('id="experience"')
  })

  it('renders Hindi labels when the site locale is hi', () => {
    const doc = demoDocument({ template, demoKey: 'doctor', baseUrl: 'http://x', locale: 'hi' })
    const html = renderToStaticMarkup(<SiteRenderer doc={doc} />)
    expect(html).toContain('lang="hi"')
    expect(html).toContain('अनुभव')
  })

  it('swaps templates without losing content', () => {
    const doc = demoDocument({ template, demoKey: 'doctor', baseUrl: 'http://x' })
    const other = withTemplate(doc, { ...template, slug: 'other', config: { ...config, layout: { shell: 'sidebar', heroAlign: 'left' }, sections: [{ type: 'experience', variant: 'list' }] } })
    expect(other.collections.experiences.length).toBe(doc.collections.experiences.length)
    expect(other.sections.find((s) => s.type === 'experience')?.variant).toBe('list')
    expect(renderToStaticMarkup(<SiteRenderer doc={other} />)).toContain('data-shell="sidebar"')
  })
})

describe('schema.org', () => {
  it('describes a Person, and a Physician only when a practice location exists', () => {
    const doc = demoDocument({ template, demoKey: 'doctor', baseUrl: 'http://x' })
    doc.profile.profession = { slug: 'doctor', name: 'Doctor', schema_org_type: 'Physician', category: 'medical' }
    const withPlace = buildJsonLd(doc, 'https://dr.example')
    expect(withPlace['@graph'].map((g) => g['@type'])).toEqual(['Person', 'Physician'])
    doc.collections.locations = []
    expect(buildJsonLd(doc, 'https://dr.example')['@graph'].map((g) => g['@type'])).toEqual(['Person'])
  })

  it('cannot break out of the script tag', () => {
    expect(jsonLdString({ name: '</script><script>alert(1)</script>' })).not.toContain('</script>')
  })
})
