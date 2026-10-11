/* eslint-disable @next/next/no-img-element -- user images come from arbitrary storage hosts */
import { Section, Empty, type SectionProps } from './shared'
import {
  contentString, displayName, initials, locationLine, paragraphs, safeUrl, SOCIAL_LABELS, whatsappLink,
} from '../utils'

export function Avatar({ props, size }: { props: SectionProps; size: 'sm' | 'lg' | 'portrait' }) {
  const p = props.doc.profile
  const src = safeUrl(p.avatar_url)
  const name = displayName(p)
  if (src) return <img className={`hm-avatar hm-avatar--${size}`} src={src} alt={name} width={size === 'sm' ? 72 : 480} height={size === 'sm' ? 72 : 600} />
  return <div className={`hm-avatar hm-avatar--${size} hm-avatar--initials`} aria-hidden="true">{initials(name)}</div>
}

export function ContactButtons({ props, compact = false }: { props: SectionProps; compact?: boolean }) {
  const p = props.doc.profile
  const { t } = props
  const primaryLabel = contentString(props.section.content, 'cta_label', 40) ?? t('site.contact_me')
  return (
    <div className="hm-actions">
      {p.email ? (
        <a className="hm-btn hm-btn--primary" href={`mailto:${p.email}`} data-track="contact_click">{compact ? t('site.email') : primaryLabel}</a>
      ) : (
        <a className="hm-btn hm-btn--primary" href="#contact">{primaryLabel}</a>
      )}
      {p.whatsapp ? (
        <a className="hm-btn hm-btn--secondary" href={whatsappLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" data-track="contact_click">{t('site.whatsapp')}</a>
      ) : p.phone ? (
        <a className="hm-btn hm-btn--secondary" href={`tel:${p.phone.replace(/\s/g, '')}`} data-track="contact_click">{t('site.call')}</a>
      ) : null}
    </div>
  )
}

function HeroMeta({ props }: { props: SectionProps }) {
  const p = props.doc.profile
  const bits = [
    locationLine(p),
    p.years_experience ? props.t('site.years_experience', { n: p.years_experience }) : '',
    p.availability ?? '',
  ].filter(Boolean)
  if (!bits.length) return null
  return <p className="hm-hero__meta">{bits.join(' · ')}</p>
}

export function Hero(props: SectionProps) {
  const p = props.doc.profile
  const variant = props.section.variant === 'banner' && !safeUrl(p.cover_url) ? 'split' : props.section.variant
  const name = displayName(p)
  const kicker = p.profession ? (props.locale !== 'en' && p.profession.name_i18n?.[props.locale]) || p.profession.name : null
  const text = (
    <div className="hm-hero__text">
      {kicker && variant !== 'minimal' ? <p className="hm-kicker">{kicker}</p> : null}
      <h1 className="hm-h1">{name}</h1>
      {p.headline ? <p className="hm-hero__headline">{p.headline}</p> : null}
      {p.tagline ? <p className="hm-hero__tagline">{p.tagline}</p> : null}
      <HeroMeta props={props} />
      <ContactButtons props={props} />
    </div>
  )

  if (variant === 'split') {
    return (
      <section className="hm-hero hm-hero--split" id="top">
        <div className="hm-container hm-hero__split">
          {text}
          <div className="hm-hero__media"><Avatar props={props} size="portrait" /></div>
        </div>
      </section>
    )
  }
  if (variant === 'banner') {
    return (
      <section className="hm-hero hm-hero--banner" id="top">
        <img className="hm-hero__cover" src={safeUrl(p.cover_url)} alt="" />
        <div className="hm-container hm-hero__banner-body">
          <Avatar props={props} size="sm" />
          {text}
        </div>
      </section>
    )
  }
  if (variant === 'minimal') {
    return (
      <section className="hm-hero hm-hero--minimal" id="top">
        <div className="hm-container hm-hero__minimal">
          <Avatar props={props} size="sm" />
          {text}
        </div>
      </section>
    )
  }
  return (
    <section className="hm-hero hm-hero--centered" id="top">
      <div className="hm-container hm-hero__centered">
        <Avatar props={props} size="lg" />
        {text}
      </div>
    </section>
  )
}

export function About(props: SectionProps) {
  const p = props.doc.profile
  const body = paragraphs(p.bio_long || p.bio_short)
  if (!body.length) return <Empty props={props} hint="Add a bio in Profile → Basic info, or generate one in AI Studio." />
  const facts = [
    p.languages?.length ? { label: props.t('site.languages'), value: p.languages.join(', ') } : null,
    locationLine(p) ? { label: props.t('site.location'), value: locationLine(p) } : null,
  ].filter(Boolean) as { label: string; value: string }[]
  return (
    <Section props={props}>
      <div className={props.section.variant === 'columns' ? 'hm-about hm-about--columns' : 'hm-about'}>
        <div className="hm-prose">{body.map((para, i) => <p key={i}>{para}</p>)}</div>
        {props.section.variant === 'columns' && facts.length ? (
          <dl className="hm-facts">
            {facts.map((f) => (<div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>))}
          </dl>
        ) : null}
      </div>
    </Section>
  )
}

export function Contact(props: SectionProps) {
  const p = props.doc.profile
  const { t } = props
  const locations = props.doc.collections.locations.filter((l) => !l.is_service_area)
  const body = contentString(props.section.content, 'body', 600)
  const hasAny = p.email || p.phone || p.whatsapp || locations.length
  if (!hasAny) return <Empty props={props} hint="Add a public email, phone or WhatsApp number in Profile → Contact." />
  return (
    <Section props={props} className="hm-contact">
      <div className={props.section.variant === 'split' ? 'hm-contact__split' : 'hm-contact__stack'}>
        <div>
          {body ? <p className="hm-lead">{body}</p> : null}
          <ul className="hm-contact__list">
            {p.email ? <li><span>{t('site.email')}</span><a href={`mailto:${p.email}`} data-track="contact_click">{p.email}</a></li> : null}
            {p.phone ? <li><span>{t('site.call')}</span><a href={`tel:${p.phone.replace(/\s/g, '')}`} data-track="contact_click">{p.phone}</a></li> : null}
            {p.whatsapp ? <li><span>{t('site.whatsapp')}</span><a href={whatsappLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" data-track="contact_click">{t('site.chat_whatsapp')}</a></li> : null}
          </ul>
        </div>
        {locations.length ? (
          <div className="hm-cards hm-cards--1">
            {locations.map((l) => (
              <address key={l.id} className="hm-card hm-location">
                <strong>{l.label}</strong>
                {[l.address_line, [l.city, l.region, l.postal_code].filter(Boolean).join(', ')].filter(Boolean).map((line, i) => <span key={i}>{line}</span>)}
                {l.hours ? <span className="hm-muted">{t('site.hours')}: {l.hours}</span> : null}
                {l.phone ? <a href={`tel:${l.phone.replace(/\s/g, '')}`}>{l.phone}</a> : null}
                {safeUrl(l.map_url) ? <a href={safeUrl(l.map_url)} target="_blank" rel="noopener noreferrer">{t('site.directions')} →</a> : null}
              </address>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  )
}

export function SocialLinks(props: SectionProps) {
  const links = props.doc.collections.social_links.filter((l) => safeUrl(l.url))
  if (!links.length) return <Empty props={props} hint="Add your profiles in Profile → Social links." />
  return (
    <Section props={props}>
      <ul className="hm-social">
        {links.map((l) => (
          <li key={l.id}><a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer me" data-track="outbound_click">{l.label || SOCIAL_LABELS[l.platform] || l.platform}<span aria-hidden="true"> ↗</span></a></li>
        ))}
      </ul>
    </Section>
  )
}

export function CallToAction(props: SectionProps) {
  const c = props.section.content
  const heading = contentString(c, 'heading', 120)
  const label = contentString(c, 'button_label', 40)
  const url = safeUrl(contentString(c, 'button_url', 500))
  if (!heading) return <Empty props={props} hint="Write a heading and button for this call to action." />
  return (
    <section className="hm-section hm-cta" id={`cta-${props.section.id.slice(0, 6)}`}>
      <div className="hm-container hm-cta__inner">
        <h2 className="hm-h2">{heading}</h2>
        {contentString(c, 'body', 600) ? <p className="hm-lead">{contentString(c, 'body', 600)}</p> : null}
        {label ? <a className="hm-btn hm-btn--primary" href={url ?? '#contact'} data-track="cta_click">{label}</a> : null}
      </div>
    </section>
  )
}

/** Floating WhatsApp button; renders nothing without a number. */
export function WhatsApp(props: SectionProps) {
  const n = props.doc.profile.whatsapp
  if (!n) return props.preview ? <Empty props={props} hint="Add a WhatsApp number in Profile → Contact to show the chat button." /> : null
  return (
    <a className="hm-whatsapp-fab" href={whatsappLink(n, contentString(props.section.content, 'message', 200))} target="_blank" rel="noopener noreferrer" data-track="contact_click">
      {props.t('site.chat_whatsapp')}
    </a>
  )
}
