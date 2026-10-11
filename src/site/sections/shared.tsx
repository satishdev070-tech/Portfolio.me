import type { ReactNode } from 'react'
import type { Translate, MessageKey } from '@/i18n'
import type { SiteDocument, SiteSection } from '../types'
import { contentString } from '../utils'

export interface SectionProps {
  section: SiteSection
  doc: SiteDocument
  t: Translate
  locale: string
  /** Editor preview: show placeholders for empty sections instead of hiding them. */
  preview: boolean
}

export function sectionHeading(props: SectionProps) {
  return contentString(props.section.content, 'heading', 120) ?? props.t(`site.section.${props.section.type}` as MessageKey)
}

export function Section({ props, children, className }: { props: SectionProps; children: ReactNode; className?: string }) {
  const id = props.section.type
  const intro = contentString(props.section.content, 'intro', 600)
  return (
    <section id={id} className={`hm-section hm-section--${id} hm-v--${props.section.variant} ${className ?? ''}`} aria-labelledby={`${id}-h`}>
      <div className="hm-container hm-section__grid">
        <header className="hm-section__head">
          <h2 id={`${id}-h`} className="hm-h2">{sectionHeading(props)}</h2>
          {intro ? <p className="hm-section__intro">{intro}</p> : null}
        </header>
        <div className="hm-section__body">{children}</div>
      </div>
    </section>
  )
}

/** Shown only in the editor preview when a section has nothing to display yet. */
export function Empty({ props, hint }: { props: SectionProps; hint: string }) {
  if (!props.preview) return null
  return (
    <Section props={props}>
      <p className="hm-empty">{hint}</p>
    </Section>
  )
}
