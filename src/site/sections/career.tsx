import { Section, Empty, type SectionProps } from './shared'
import { dateRange, formatMonthYear, formatYear, paragraphs, safeUrl } from '../utils'

export function Experience(props: SectionProps) {
  const items = props.doc.collections.experiences
  if (!items.length) return <Empty props={props} hint="Add roles in Profile → Experience, or import your CV." />
  const present = props.t('site.present')
  return (
    <Section props={props}>
      <ol className={props.section.variant === 'timeline' ? 'hm-timeline' : 'hm-list'}>
        {items.map((x) => (
          <li key={x.id} className="hm-entry">
            <div className="hm-entry__when">{dateRange(x.start_date, x.end_date, x.is_current, props.locale, present)}</div>
            <div className="hm-entry__body">
              <h3 className="hm-h3">{x.title}</h3>
              <p className="hm-entry__sub">{[x.organization, x.location].filter(Boolean).join(' · ')}</p>
              {paragraphs(x.description).map((p, i) => <p key={i} className="hm-entry__text">{p}</p>)}
              {x.highlights?.length ? <ul className="hm-bullets">{x.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul> : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function Education(props: SectionProps) {
  const items = props.doc.collections.education
  if (!items.length) return <Empty props={props} hint="Add degrees and courses in Profile → Education." />
  return (
    <Section props={props}>
      <ol className={props.section.variant === 'timeline' ? 'hm-timeline' : 'hm-list'}>
        {items.map((x) => (
          <li key={x.id} className="hm-entry">
            <div className="hm-entry__when">{dateRange(x.start_date, x.end_date, false, props.locale, '', true)}</div>
            <div className="hm-entry__body">
              <h3 className="hm-h3">{[x.degree, x.field_of_study].filter(Boolean).join(', ') || x.institution}</h3>
              <p className="hm-entry__sub">{[x.degree || x.field_of_study ? x.institution : null, x.grade].filter(Boolean).join(' · ')}</p>
              {x.description ? <p className="hm-entry__text">{x.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function Skills(props: SectionProps) {
  const items = props.doc.collections.skills
  if (!items.length) return <Empty props={props} hint="Add skills in Profile → Skills." />
  const variant = props.section.variant
  if (variant === 'grouped') {
    const groups = new Map<string, typeof items>()
    for (const s of items) {
      const k = s.category?.trim() || ''
      groups.set(k, [...(groups.get(k) ?? []), s])
    }
    return (
      <Section props={props}>
        <div className="hm-skill-groups">
          {[...groups.entries()].map(([group, list]) => (
            <div key={group || '_'}>
              {group ? <h3 className="hm-h4">{group}</h3> : null}
              <ul className="hm-chips">{list.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>
    )
  }
  if (variant === 'bars') {
    return (
      <Section props={props}>
        <ul className="hm-bars">
          {items.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <span className="hm-bar" role="meter" aria-valuemin={1} aria-valuemax={5} aria-valuenow={s.level ?? 3} aria-label={s.name}>
                <span style={{ width: `${((s.level ?? 3) / 5) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </Section>
    )
  }
  return (
    <Section props={props}>
      <ul className="hm-chips">{items.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
    </Section>
  )
}

export function Awards(props: SectionProps) {
  const items = props.doc.collections.awards
  if (!items.length) return <Empty props={props} hint="Add honours in Profile → Awards." />
  return (
    <Section props={props}>
      <ul className="hm-list hm-list--compact">
        {items.map((a) => (
          <li key={a.id} className="hm-entry">
            <div className="hm-entry__when">{formatYear(a.awarded_on)}</div>
            <div className="hm-entry__body">
              <h3 className="hm-h3">{safeUrl(a.url) ? <a href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">{a.title}</a> : a.title}</h3>
              {a.issuer ? <p className="hm-entry__sub">{a.issuer}</p> : null}
              {a.description ? <p className="hm-entry__text">{a.description}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Certifications(props: SectionProps) {
  const items = props.doc.collections.certifications
  if (!items.length) return <Empty props={props} hint="Add licences and certificates in Profile → Certifications." />
  return (
    <Section props={props}>
      <ul className={props.section.variant === 'grid' ? 'hm-cards hm-cards--3' : 'hm-list hm-list--compact'}>
        {items.map((c) => (
          <li key={c.id} className={props.section.variant === 'grid' ? 'hm-card' : 'hm-entry'}>
            <div className="hm-entry__when">{formatMonthYear(c.issued_on, props.locale)}</div>
            <div className="hm-entry__body">
              <h3 className="hm-h3">{c.name}</h3>
              <p className="hm-entry__sub">{[c.issuer, c.credential_id ? `#${c.credential_id}` : null].filter(Boolean).join(' · ')}</p>
              {safeUrl(c.credential_url) ? <a className="hm-link" href={safeUrl(c.credential_url)} target="_blank" rel="noopener noreferrer">{props.t('site.credential')} ↗</a> : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Achievements(props: SectionProps) {
  const items = props.doc.collections.achievements
  if (!items.length) return <Empty props={props} hint="Add highlights such as patients treated, cases won or projects delivered." />
  if (props.section.variant === 'stats') {
    return (
      <Section props={props} className="hm-stats-section">
        <dl className="hm-stats">
          {items.map((a) => (
            <div key={a.id}>
              <dt>{a.title}</dt>
              <dd>{a.metric || '—'}</dd>
            </div>
          ))}
        </dl>
      </Section>
    )
  }
  return (
    <Section props={props}>
      <ul className="hm-list hm-list--compact">
        {items.map((a) => (
          <li key={a.id} className="hm-entry">
            <div className="hm-entry__when">{a.metric ?? formatYear(a.achieved_on)}</div>
            <div className="hm-entry__body"><h3 className="hm-h3">{a.title}</h3>{a.description ? <p className="hm-entry__text">{a.description}</p> : null}</div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
