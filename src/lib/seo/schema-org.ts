import type { SiteDocument } from '@/site/types'
import { displayName, safeUrl } from '@/site/utils'

// schema.org structured data. The profession suggests a type, but we only claim a business type
// (Physician, Dentist, Attorney, LocalBusiness…) when the profile has a practice location or
// service area to back it; otherwise the page is described as a Person with a jobTitle.
const BUSINESS_TYPES = new Set(['Physician', 'Dentist', 'Attorney', 'LegalService', 'LocalBusiness', 'HomeAndConstructionBusiness', 'ProfessionalService'])

export function buildJsonLd(doc: SiteDocument, url: string) {
  const p = doc.profile
  const name = displayName(p)
  const sameAs = doc.collections.social_links.map((l) => safeUrl(l.url)).filter(Boolean)
  const image = safeUrl(p.avatar_url)

  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${url}#person`,
    name,
    url,
    ...(p.headline ? { jobTitle: p.headline } : p.profession ? { jobTitle: p.profession.name } : {}),
    ...(p.bio_short ? { description: p.bio_short } : {}),
    ...(image ? { image } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(p.city ? { address: { '@type': 'PostalAddress', addressLocality: p.city, addressRegion: p.region ?? undefined, addressCountry: p.country_code ?? undefined } } : {}),
    ...(doc.collections.education.length
      ? { alumniOf: doc.collections.education.slice(0, 5).map((e) => ({ '@type': 'EducationalOrganization', name: e.institution })) }
      : {}),
    ...(doc.collections.skills.length ? { knowsAbout: doc.collections.skills.slice(0, 20).map((s) => s.name) } : {}),
    ...(p.languages?.length ? { knowsLanguage: p.languages } : {}),
  }
  const current = doc.collections.experiences.find((e) => e.is_current)
  if (current) person.worksFor = { '@type': 'Organization', name: current.organization }

  const graph: Record<string, unknown>[] = [person]
  const type = p.profession?.schema_org_type
  const places = doc.collections.locations
  if (type && BUSINESS_TYPES.has(type) && places.length) {
    const primary = places.find((l) => l.is_primary) ?? places.find((l) => !l.is_service_area) ?? places[0]
    graph.push({
      '@type': type,
      '@id': `${url}#practice`,
      name: (p.extra?.clinic_name as string | undefined) || name,
      url,
      ...(image ? { image } : {}),
      ...(p.phone || primary.phone ? { telephone: primary.phone ?? p.phone } : {}),
      ...(!primary.is_service_area && (primary.address_line || primary.city)
        ? { address: { '@type': 'PostalAddress', streetAddress: primary.address_line ?? undefined, addressLocality: primary.city ?? undefined, addressRegion: primary.region ?? undefined, postalCode: primary.postal_code ?? undefined, addressCountry: primary.country_code ?? undefined } }
        : {}),
      ...(places.some((l) => l.is_service_area) ? { areaServed: places.filter((l) => l.is_service_area).map((l) => l.label) } : {}),
      employee: { '@id': `${url}#person` },
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

/** Serialize JSON-LD for a <script> tag without allowing "</script>" breakouts. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
