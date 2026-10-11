import { Section, Empty, type SectionProps } from './shared'
import { contentItems, paragraphs, safeUrl } from '../utils'

// One component for every section whose content is a list of items stored on the section itself:
// research, teaching, speaking, specialization, timeline, press, news, products, faq.
export function Items(props: SectionProps) {
  const items = contentItems(props.section.content)
  if (!items.length) return <Empty props={props} hint="Add items to this section in the editor." />
  const type = props.section.type

  if (type === 'faq') {
    return (
      <Section props={props}>
        <div className="hm-faq">
          {items.map((i, n) => (
            <details key={n}>
              <summary>{i.title}</summary>
              {paragraphs(i.description).map((p, k) => <p key={k}>{p}</p>)}
            </details>
          ))}
        </div>
      </Section>
    )
  }

  const asCards = type === 'specialization' || type === 'products' || type === 'research'
  return (
    <Section props={props}>
      <ul className={asCards ? 'hm-cards hm-cards--2' : type === 'timeline' ? 'hm-timeline' : 'hm-list hm-list--compact'}>
        {items.map((i, n) => {
          const href = safeUrl(i.url)
          return (
            <li key={n} className={asCards ? 'hm-card' : 'hm-entry'}>
              {!asCards ? <div className="hm-entry__when">{i.date ?? ''}</div> : null}
              <div className="hm-entry__body">
                <h3 className="hm-h3">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{i.title}</a> : i.title}</h3>
                {i.subtitle || (asCards && i.date) ? <p className="hm-entry__sub">{[i.subtitle, asCards ? i.date : null].filter(Boolean).join(' · ')}</p> : null}
                {paragraphs(i.description).map((p, k) => <p key={k} className="hm-entry__text">{p}</p>)}
                {i.price ? <p className="hm-service__meta">{i.price}</p> : null}
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
