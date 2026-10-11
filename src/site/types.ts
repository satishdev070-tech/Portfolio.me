// Contract between the database (private.build_site_document) and the renderer.
// Changing a shape here means bumping SiteDocument.schema and handling old snapshots.

export const FONT_KEYS = [
  'inter', 'dm-sans', 'ibm-plex-sans', 'space-grotesk', 'source-serif', 'lora', 'fraunces', 'playfair', 'jetbrains-mono',
] as const
export type FontKey = (typeof FONT_KEYS)[number]

export const SHELLS = ['centered', 'sidebar', 'split', 'editorial'] as const
export type Shell = (typeof SHELLS)[number]

export interface ColorTokens {
  background: string
  surface: string
  text: string
  muted: string
  primary: string
  primaryContrast: string
  accent: string
  border: string
}

export interface ThemeTokens {
  colors: ColorTokens
  typography: {
    heading: FontKey
    body: FontKey
    mono?: FontKey
    scale: 'compact' | 'default' | 'large'
    headingWeight: number
  }
  spacing: { section: 'compact' | 'default' | 'airy'; width: 'narrow' | 'default' | 'wide' }
  components: { radius: 'none' | 'sm' | 'md' | 'lg'; button: 'solid' | 'outline' | 'pill'; card: 'flat' | 'bordered' | 'elevated' }
}

export type ThemeOverrides = {
  colors?: Partial<ColorTokens>
  typography?: Partial<ThemeTokens['typography']>
  spacing?: Partial<ThemeTokens['spacing']>
  components?: Partial<ThemeTokens['components']>
}

export interface TemplateSectionConfig {
  type: string
  variant: string
}

export interface TemplateConfig {
  tokens: ThemeTokens
  layout: { shell: Shell; heroAlign: 'left' | 'center' }
  sections: TemplateSectionConfig[]
  features?: string[]
}

export interface SiteSection {
  id: string
  type: string
  variant: string
  content: Record<string, unknown>
  settings: Record<string, unknown>
}

export interface ProfileDoc {
  full_name: string
  display_name: string | null
  headline: string | null
  tagline: string | null
  bio_short: string | null
  bio_long: string | null
  avatar_url: string | null
  cover_url: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  website_url: string | null
  city: string | null
  region: string | null
  country_code: string | null
  languages: string[]
  years_experience: number | null
  availability: string | null
  pronouns: string | null
  extra: Record<string, unknown>
  profession: { slug: string; name: string; name_i18n?: Record<string, string>; schema_org_type: string; category: string } | null
}

type Row = { id: string } & Record<string, unknown>
export interface Experience extends Row { organization: string; title: string; employment_type: string | null; location: string | null; start_date: string | null; end_date: string | null; is_current: boolean; description: string | null; highlights: string[] }
export interface Education extends Row { institution: string; degree: string | null; field_of_study: string | null; start_date: string | null; end_date: string | null; grade: string | null; description: string | null }
export interface Skill extends Row { name: string; category: string | null; level: number | null }
export interface Service extends Row { title: string; description: string | null; price_text: string | null; duration_text: string | null; cta_label: string | null; cta_url: string | null }
export interface Project extends Row { title: string; role: string | null; description: string | null; url: string | null; image_url: string | null; tags: string[]; start_date: string | null; end_date: string | null; is_featured: boolean }
export interface Publication extends Row { title: string; authors: string | null; venue: string | null; published_on: string | null; pub_type: string; url: string | null; doi: string | null; abstract: string | null }
export interface Award extends Row { title: string; issuer: string | null; awarded_on: string | null; description: string | null; url: string | null }
export interface Certification extends Row { name: string; issuer: string | null; issued_on: string | null; expires_on: string | null; credential_id: string | null; credential_url: string | null }
export interface Testimonial extends Row { author_name: string; author_title: string | null; author_org: string | null; quote: string; rating: number | null; avatar_url: string | null }
export interface SocialLink extends Row { platform: string; url: string; label: string | null }
export interface Location extends Row { label: string; address_line: string | null; city: string | null; region: string | null; country_code: string | null; postal_code: string | null; phone: string | null; hours: string | null; map_url: string | null; is_service_area: boolean; is_primary: boolean }
export interface Achievement extends Row { title: string; description: string | null; metric: string | null; achieved_on: string | null }
export interface MediaItem { id: string; kind: 'image' | 'video' | 'document'; title: string | null; caption: string | null; url: string; mime_type: string | null; width: number | null; height: number | null; alt: string | null }

export interface Collections {
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  services: Service[]
  projects: Project[]
  publications: Publication[]
  awards: Award[]
  certifications: Certification[]
  testimonials: Testimonial[]
  social_links: SocialLink[]
  locations: Location[]
  achievements: Achievement[]
  media: MediaItem[]
}

export interface SeoConfig {
  title?: string
  description?: string
  keywords?: string[]
  og_image_url?: string
  og_description?: string
  canonical_url?: string
  noindex?: boolean
}

export interface SiteDocument {
  schema: 1
  generated_at: string
  published_at?: string
  version?: number
  website: {
    id: string
    slug: string
    name: string
    locale: string
    custom_domain: string | null
    show_branding: boolean
    settings: Record<string, unknown>
  }
  template: {
    id: string
    slug: string
    name: string
    layout: Shell
    tier: 'free' | 'premium'
    version: number
    version_id: string
    config: TemplateConfig
  }
  theme: ThemeOverrides
  seo: SeoConfig
  profile: ProfileDoc
  collections: Collections
  sections: SiteSection[]
}
