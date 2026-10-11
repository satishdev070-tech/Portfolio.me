import type { ComponentType } from 'react'
import type { SectionProps } from './shared'
import { About, CallToAction, Contact, Hero, SocialLinks, WhatsApp } from './core'
import { Achievements, Awards, Certifications, Education, Experience, Skills } from './career'
import { Appointments, Gallery, Portfolio, Projects, Publications, ServiceAreas, Services, Testimonials, Videos } from './showcase'
import { Items } from './items'
import type { SiteDocument, SiteSection } from '../types'

// section_types.key → component. A new section type needs a row in section_types and an entry here;
// templates and professions reference it by key only.
export const SECTION_COMPONENTS: Record<string, ComponentType<SectionProps>> = {
  hero: Hero,
  about: About,
  experience: Experience,
  education: Education,
  skills: Skills,
  services: Services,
  projects: Projects,
  portfolio: Portfolio,
  publications: Publications,
  awards: Awards,
  certifications: Certifications,
  achievements: Achievements,
  testimonials: Testimonials,
  gallery: Gallery,
  videos: Videos,
  service_areas: ServiceAreas,
  appointments: Appointments,
  social_links: SocialLinks,
  contact: Contact,
  cta: CallToAction,
  whatsapp: WhatsApp,
  specialization: Items,
  research: Items,
  teaching: Items,
  speaking: Items,
  timeline: Items,
  press: Items,
  news: Items,
  products: Items,
  faq: Items,
}

/** Section types whose content is an editable item list on the section (see Items). */
export const ITEM_SECTION_TYPES = ['specialization', 'research', 'teaching', 'speaking', 'timeline', 'press', 'news', 'products', 'faq']

export type { SectionProps }

/** Whether a section has anything to show on the live site (empty sections are hidden, and left out of the nav). */
export function sectionHasContent(section: SiteSection, doc: SiteDocument): boolean {
  const c = doc.collections
  const p = doc.profile
  const items = Array.isArray(section.content.items) && section.content.items.length > 0
  switch (section.type) {
    case 'hero': return true
    case 'about': return !!(p.bio_long || p.bio_short)
    case 'experience': return c.experiences.length > 0
    case 'education': return c.education.length > 0
    case 'skills': return c.skills.length > 0
    case 'services': return c.services.length > 0
    case 'projects': return c.projects.length > 0
    case 'portfolio': return c.projects.some((x) => !!x.image_url)
    case 'publications': return c.publications.length > 0
    case 'awards': return c.awards.length > 0
    case 'certifications': return c.certifications.length > 0
    case 'achievements': return c.achievements.length > 0
    case 'testimonials': return c.testimonials.length > 0
    case 'gallery': return c.media.some((m) => m.kind === 'image')
    case 'videos': return c.media.some((m) => m.kind === 'video')
    case 'service_areas': return c.locations.some((l) => l.is_service_area)
    case 'appointments': return !!section.content.booking_url || !!p.phone || c.locations.some((l) => !l.is_service_area && (l.hours || l.phone))
    case 'social_links': return c.social_links.length > 0
    case 'contact': return !!(p.email || p.phone || p.whatsapp) || c.locations.some((l) => !l.is_service_area)
    case 'cta': return typeof section.content.heading === 'string' && section.content.heading.trim() !== ''
    case 'whatsapp': return !!p.whatsapp
    default: return items
  }
}
