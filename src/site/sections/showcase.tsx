/* eslint-disable @next/next/no-img-element -- user images come from arbitrary storage hosts */
import { Section, Empty, type SectionProps } from './shared'
import { contentString, dateRange, formatYear, paragraphs, safeUrl, videoEmbedUrl } from '../utils'

export function Services(props: SectionProps) {
  const items = props.doc.collections.services
  if (!items.length) return <Empty props={props} hint="Describe what you offer in Profile → Services, or let AI Studio draft it." />
  const cards = props.section.variant !== 'list'
  return (
    <Section props={props}>
      <ul className={cards ? 'hm-cards hm-cards--3' : 'hm-list hm-list--divided'}>
        {items.map((s) => (
          <li key={s.id} className={cards ? 'hm-card hm-service' : 'hm-service hm-service--row'}>
            <h3 className="hm-h3">{s.title}</h3>
            {s.description ? <p className="hm-entry__text">{s.description}</p> : null}
            {s.price_text || s.duration_text ? <p className="hm-service__meta">{[s.price_text, s.duration_text].filter(Boolean).join(' · ')}</p> : null}
            {s.cta_label && safeUrl(s.cta_url) ? <a className="hm-link" href={safeUrl(s.cta_url)} data-track="cta_click">{s.cta_label} →</a> : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Projects(props: SectionProps) {
  const items = props.doc.collections.projects
  if (!items.length) return <Empty props={props} hint="Add projects or case studies in Profile → Projects." />
  const grid = props.section.variant === 'grid'
  return (
    <Section props={props}>
      <ul className={grid ? 'hm-cards hm-cards--2' : 'hm-list hm-list--divided'}>
        {items.map((p) => (
          <li key={p.id} className={grid ? 'hm-card hm-project' : 'hm-project hm-project--row'}>
            {grid && safeUrl(p.image_url) ? <img className="hm-project__img" src={safeUrl(p.image_url)} alt="" loading="lazy" /> : null}
            <div>
              <h3 className="hm-h3">{p.title}</h3>
              <p className="hm-entry__sub">{[p.role, dateRange(p.start_date, p.end_date, false, props.locale, '', true)].filter(Boolean).join(' · ')}</p>
              {paragraphs(p.description).slice(0, grid ? 1 : 3).map((t, i) => <p key={i} className="hm-entry__text">{t}</p>)}
              {p.tags?.length ? <ul className="hm-tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
              {safeUrl(p.url) ? <a className="hm-link" href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer" data-track="outbound_click">{props.t('site.view_project')} ↗</a> : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** Visual work grid: projects that have images. */
export function Portfolio(props: SectionProps) {
  const items = props.doc.collections.projects.filter((p) => safeUrl(p.image_url))
  if (!items.length) return <Empty props={props} hint="Add projects with a cover image to build your portfolio." />
  return (
    <Section props={props}>
      <ul className="hm-portfolio">
        {items.map((p) => (
          <li key={p.id}>
            <figure>
              <img src={safeUrl(p.image_url)} alt={p.title} loading="lazy" />
              <figcaption>
                {safeUrl(p.url) ? <a href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.title}</a> : p.title}
                {p.role ? <span>{p.role}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Gallery(props: SectionProps) {
  const items = props.doc.collections.media.filter((m) => m.kind === 'image')
  if (!items.length) return <Empty props={props} hint="Upload photos in Media and add them to your gallery." />
  return (
    <Section props={props}>
      <ul className="hm-gallery">
        {items.map((m) => (
          <li key={m.id}>
            <figure>
              <img src={safeUrl(m.url)} alt={m.alt ?? m.title ?? ''} loading="lazy" width={m.width ?? undefined} height={m.height ?? undefined} />
              {m.caption ? <figcaption>{m.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Videos(props: SectionProps) {
  const items = props.doc.collections.media.filter((m) => m.kind === 'video')
  if (!items.length) return <Empty props={props} hint="Add YouTube or Vimeo links in Profile → Media." />
  return (
    <Section props={props}>
      <ul className="hm-cards hm-cards--2">
        {items.map((m) => {
          const embed = videoEmbedUrl(m.url)
          return (
            <li key={m.id} className="hm-video">
              {embed ? (
                <iframe src={embed} title={m.title ?? 'Video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              ) : (
                <a className="hm-link" href={safeUrl(m.url)} target="_blank" rel="noopener noreferrer">{m.title ?? m.url}</a>
              )}
              {m.title && embed ? <p className="hm-entry__sub">{m.title}</p> : null}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

export function Publications(props: SectionProps) {
  const items = props.doc.collections.publications
  if (!items.length) return <Empty props={props} hint="Add papers, books and articles in Profile → Publications." />
  return (
    <Section props={props}>
      <ol className="hm-publications">
        {items.map((p) => {
          const href = safeUrl(p.url) ?? (p.doi ? `https://doi.org/${p.doi}` : undefined)
          return (
            <li key={p.id}>
              <p className="hm-cite">
                {p.authors ? <span className="hm-cite__authors">{p.authors}. </span> : null}
                {p.published_on ? <span>({formatYear(p.published_on)}). </span> : null}
                <span className="hm-cite__title">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{p.title}</a> : p.title}</span>
                {p.venue ? <>. <em>{p.venue}</em></> : null}
                {p.doi ? <span className="hm-muted"> · doi:{p.doi}</span> : null}
              </p>
              {p.abstract && props.section.settings.show_abstracts === true ? <p className="hm-entry__text">{p.abstract}</p> : null}
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

export function Testimonials(props: SectionProps) {
  const items = props.doc.collections.testimonials
  if (!items.length) return <Empty props={props} hint="Add reviews from clients, patients or colleagues in Profile → Testimonials." />
  if (props.section.variant === 'quote') {
    const [first, ...rest] = items
    return (
      <Section props={props}>
        <figure className="hm-quote">
          <blockquote>{first.quote}</blockquote>
          <figcaption>{[first.author_name, first.author_title, first.author_org].filter(Boolean).join(', ')}</figcaption>
        </figure>
        {rest.length ? (
          <ul className="hm-cards hm-cards--2">
            {rest.map((x) => (
              <li key={x.id} className="hm-card"><blockquote className="hm-entry__text">“{x.quote}”</blockquote><p className="hm-entry__sub">{x.author_name}</p></li>
            ))}
          </ul>
        ) : null}
      </Section>
    )
  }
  return (
    <Section props={props}>
      <ul className="hm-cards hm-cards--3">
        {items.map((x) => (
          <li key={x.id} className="hm-card hm-testimonial">
            {x.rating ? <p className="hm-rating" aria-label={`${x.rating} out of 5`}>{'★'.repeat(x.rating)}<span>{'★'.repeat(5 - x.rating)}</span></p> : null}
            <blockquote>“{x.quote}”</blockquote>
            <p className="hm-entry__sub"><strong>{x.author_name}</strong>{x.author_title || x.author_org ? `, ${[x.author_title, x.author_org].filter(Boolean).join(', ')}` : ''}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function ServiceAreas(props: SectionProps) {
  const areas = props.doc.collections.locations.filter((l) => l.is_service_area)
  if (!areas.length) return <Empty props={props} hint="Add the neighbourhoods or cities you cover in Profile → Locations (mark as service area)." />
  return (
    <Section props={props}>
      <ul className="hm-chips hm-chips--lg">{areas.map((a) => <li key={a.id}>{a.label}</li>)}</ul>
    </Section>
  )
}

export function Appointments(props: SectionProps) {
  const booking = safeUrl(contentString(props.section.content, 'booking_url', 500))
  const note = contentString(props.section.content, 'note', 600)
  const clinics = props.doc.collections.locations.filter((l) => !l.is_service_area && (l.hours || l.phone))
  const phone = props.doc.profile.phone
  if (!booking && !clinics.length && !phone) return <Empty props={props} hint="Add a booking link, or clinic hours in Profile → Locations." />
  return (
    <Section props={props}>
      {note ? <p className="hm-lead">{note}</p> : null}
      {clinics.length ? (
        <ul className="hm-cards hm-cards--2">
          {clinics.map((c) => (
            <li key={c.id} className="hm-card">
              <h3 className="hm-h3">{c.label}</h3>
              {c.hours ? <p className="hm-entry__text">{c.hours}</p> : null}
              {c.phone ? <a className="hm-link" href={`tel:${c.phone.replace(/\s/g, '')}`} data-track="contact_click">{c.phone}</a> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="hm-actions">
        {booking ? <a className="hm-btn hm-btn--primary" href={booking} target="_blank" rel="noopener noreferrer" data-track="cta_click">{props.t('site.book_appointment')}</a> : null}
        {!booking && phone ? <a className="hm-btn hm-btn--primary" href={`tel:${phone.replace(/\s/g, '')}`} data-track="contact_click">{props.t('site.call')}</a> : null}
      </div>
    </Section>
  )
}
