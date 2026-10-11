import type { CSSProperties } from 'react'
import { getTranslator, type MessageKey } from '@/i18n'
import { publicEnv } from '@/lib/env'
import { siteFontVariables } from './fonts'
import { resolveTheme, themeToCssVars } from './theme'
import { SECTION_COMPONENTS, sectionHasContent, type SectionProps } from './sections'
import { Avatar, ContactButtons } from './sections/core'
import { contentString, displayName, locationLine, safeUrl, SOCIAL_LABELS } from './utils'
import type { SiteDocument, SiteSection } from './types'
import './site.css'

// Renders a SiteDocument. Pure server component: same output for preview, template demos and the
// published site, so what users see in the editor is what visitors get.

const NO_NAV = new Set(['hero', 'cta', 'whatsapp'])

export function SiteRenderer({ doc, preview = false }: { doc: SiteDocument; preview?: boolean }) {
  const locale = doc.website.locale || 'en'
  const t = getTranslator(locale)
  const config = doc.template.config
  const theme = resolveTheme(config, doc.theme)
  const shell = config.layout?.shell ?? doc.template.layout ?? 'centered'
  // Live sites drop empty sections entirely; the editor preview keeps them as placeholders.
  const sections = doc.sections.filter((s) => SECTION_COMPONENTS[s.type] && (preview || sectionHasContent(s, doc)))
  const name = displayName(doc.profile)
  const props = (section: SiteSection): SectionProps => ({ section, doc, t, locale, preview })

  const navItems = sections
    .filter((s) => !NO_NAV.has(s.type))
    .map((s) => ({ id: s.type, label: contentString(s.content, 'heading', 40) ?? t(`site.section.${s.type}` as MessageKey) }))

  const style = { ...themeToCssVars(theme) } as CSSProperties
  const rendered = (list: SiteSection[]) =>
    list.map((s) => {
      const Component = SECTION_COMPONENTS[s.type]
      return <Component key={s.id} {...props(s)} />
    })

  const heroSection = sections.find((s) => s.type === 'hero')
  const rest = sections.filter((s) => s.type !== 'hero')

  return (
    <div
      className={`hm-site ${siteFontVariables}`}
      data-shell={shell}
      data-button={theme.components.button}
      data-card={theme.components.card}
      data-hero-align={config.layout?.heroAlign ?? 'left'}
      lang={locale}
      style={style}
    >
      <a className="hm-skip" href="#main">{t('site.skip_to_content')}</a>
      {shell !== 'sidebar' ? (
        <header className="hm-nav">
          <div className="hm-container hm-nav__inner">
            <a className="hm-nav__brand" href="#top">{name}</a>
            {navItems.length ? (
              <>
                <nav className="hm-nav__links" aria-label="Sections">
                  {navItems.slice(0, 6).map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
                </nav>
                <details className="hm-nav__menu">
                  <summary>{t('site.menu')}</summary>
                  <nav aria-label="Sections">{navItems.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}</nav>
                </details>
              </>
            ) : null}
          </div>
        </header>
      ) : null}

      {shell === 'sidebar' ? (
        <div className="hm-container hm-sidebar-layout">
          <aside className="hm-sidebar" id="top">
            <ProfileAside doc={doc} heroProps={heroSection ? props(heroSection) : props({ id: 'hero', type: 'hero', variant: 'minimal', content: {}, settings: {} })} />
          </aside>
          <main id="main" className="hm-main">{rendered(rest)}</main>
        </div>
      ) : (
        <main id="main" className="hm-main">{rendered(sections)}</main>
      )}

      <footer className="hm-footer">
        <div className="hm-container hm-footer__inner">
          <p>© {new Date(doc.published_at ?? doc.generated_at).getUTCFullYear()} {name}</p>
          <div className="hm-footer__links">
            <a href="#" className="hm-print" data-print="true">{t('site.print')}</a>
            {doc.website.show_branding ? (
              <a href={`${publicEnv.appUrl}/?ref=site`} rel="noopener">{t('site.made_with', { app: publicEnv.appName })}</a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  )
}

function ProfileAside({ doc, heroProps }: { doc: SiteDocument; heroProps: SectionProps }) {
  const p = doc.profile
  const links = doc.collections.social_links.filter((l) => safeUrl(l.url))
  return (
    <div className="hm-aside">
      <Avatar props={heroProps} size="sm" />
      <h1 className="hm-h1 hm-aside__name">{displayName(p)}</h1>
      {p.headline ? <p className="hm-hero__headline">{p.headline}</p> : null}
      {p.tagline ? <p className="hm-hero__tagline">{p.tagline}</p> : null}
      {locationLine(p) ? <p className="hm-muted">{locationLine(p)}</p> : null}
      <ContactButtons props={heroProps} compact />
      {links.length ? (
        <ul className="hm-aside__links">
          {links.map((l) => <li key={l.id}><a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer me">{l.label || SOCIAL_LABELS[l.platform] || l.platform}</a></li>)}
        </ul>
      ) : null}
    </div>
  )
}
