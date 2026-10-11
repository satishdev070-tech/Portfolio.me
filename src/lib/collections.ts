import { z } from 'zod'

// Declarative description of every profile collection. Drives the generic editor UI, the zod
// validation in server actions, and the AI/import mapping. Adding a field = one entry here
// (+ the column in a migration).

export type FieldType = 'text' | 'textarea' | 'url' | 'email' | 'month' | 'date' | 'number' | 'boolean' | 'select' | 'tags' | 'lines'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  max?: number
  placeholder?: string
  hint?: string
  options?: { value: string; label: string }[]
  width?: 'full' | 'half'
}

export interface CollectionDef {
  key: CollectionKey
  table: string
  label: string
  singular: string
  description: string
  titleField: string
  subtitle: (row: Record<string, unknown>) => string
  fields: FieldDef[]
  empty: { title: string; body: string }
  aiTask?: 'experience_generation' | 'service_generation' | 'project_generation'
}

export const COLLECTION_KEYS = [
  'experiences', 'education', 'skills', 'services', 'projects', 'publications', 'awards', 'certifications',
  'testimonials', 'social_links', 'locations', 'achievements',
] as const
export type CollectionKey = (typeof COLLECTION_KEYS)[number]

const s = (v: unknown) => (typeof v === 'string' ? v : '')
const yr = (v: unknown) => s(v).slice(0, 4)
const join = (...parts: unknown[]) => parts.map(s).filter(Boolean).join(' · ')

export const COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  experiences: {
    key: 'experiences', table: 'profile_experiences', label: 'Experience', singular: 'role',
    description: 'Jobs, practices, appointments and positions.',
    titleField: 'title', subtitle: (r) => join(r.organization, [yr(r.start_date), r.is_current ? 'Present' : yr(r.end_date)].filter(Boolean).join('–')),
    aiTask: 'experience_generation',
    empty: { title: 'No experience added', body: 'Add your roles manually, or let AI build them from your CV.' },
    fields: [
      { name: 'title', label: 'Role / title', type: 'text', required: true, max: 160, placeholder: 'Consultant Cardiologist', width: 'half' },
      { name: 'organization', label: 'Organization', type: 'text', required: true, max: 160, placeholder: 'Ruby Hall Clinic', width: 'half' },
      { name: 'employment_type', label: 'Type', type: 'select', width: 'half', options: [
        { value: 'full_time', label: 'Full-time' }, { value: 'part_time', label: 'Part-time' }, { value: 'self_employed', label: 'Self-employed' },
        { value: 'freelance', label: 'Freelance' }, { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
        { value: 'volunteer', label: 'Volunteer' }, { value: 'other', label: 'Other' }] },
      { name: 'location', label: 'Location', type: 'text', max: 120, width: 'half' },
      { name: 'start_date', label: 'Start', type: 'month', width: 'half' },
      { name: 'end_date', label: 'End', type: 'month', width: 'half' },
      { name: 'is_current', label: 'I currently work here', type: 'boolean' },
      { name: 'description', label: 'Description', type: 'textarea', max: 4000 },
      { name: 'highlights', label: 'Key achievements', type: 'lines', hint: 'One per line.' },
    ],
  },
  education: {
    key: 'education', table: 'profile_education', label: 'Education', singular: 'qualification',
    description: 'Degrees, diplomas, fellowships and courses.',
    titleField: 'degree', subtitle: (r) => join(r.institution, yr(r.end_date)),
    empty: { title: 'No education added', body: 'Add degrees and qualifications, or import them from your CV.' },
    fields: [
      { name: 'institution', label: 'Institution', type: 'text', required: true, max: 200, width: 'half' },
      { name: 'degree', label: 'Degree / qualification', type: 'text', max: 200, placeholder: 'MBBS, LLB, B.Tech…', width: 'half' },
      { name: 'field_of_study', label: 'Field of study', type: 'text', max: 200, width: 'half' },
      { name: 'grade', label: 'Grade / distinction', type: 'text', max: 80, width: 'half' },
      { name: 'start_date', label: 'Start', type: 'month', width: 'half' },
      { name: 'end_date', label: 'End', type: 'month', width: 'half' },
      { name: 'description', label: 'Notes', type: 'textarea', max: 2000 },
    ],
  },
  skills: {
    key: 'skills', table: 'profile_skills', label: 'Skills', singular: 'skill',
    description: 'Skills, specialties, tools and languages.',
    titleField: 'name', subtitle: (r) => join(r.category),
    empty: { title: 'No skills added', body: 'Add the skills and specialties people should know you for.' },
    fields: [
      { name: 'name', label: 'Skill', type: 'text', required: true, max: 80, width: 'half' },
      { name: 'category', label: 'Group', type: 'text', max: 60, placeholder: 'e.g. Clinical, Frontend, Litigation', width: 'half' },
      { name: 'level', label: 'Level', type: 'select', options: [
        { value: '1', label: 'Beginner' }, { value: '2', label: 'Working' }, { value: '3', label: 'Proficient' },
        { value: '4', label: 'Advanced' }, { value: '5', label: 'Expert' }] },
    ],
  },
  services: {
    key: 'services', table: 'profile_services', label: 'Services', singular: 'service',
    description: 'What clients, patients or customers can hire you for.',
    titleField: 'title', subtitle: (r) => join(r.price_text, r.duration_text), aiTask: 'service_generation',
    empty: { title: 'No services added', body: 'List what you offer. AI can write clear descriptions for you.' },
    fields: [
      { name: 'title', label: 'Service', type: 'text', required: true, max: 160 },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { name: 'price_text', label: 'Price', type: 'text', max: 80, placeholder: '₹800 per visit', width: 'half' },
      { name: 'duration_text', label: 'Duration', type: 'text', max: 80, placeholder: '30 minutes', width: 'half' },
      { name: 'cta_label', label: 'Button label', type: 'text', max: 40, placeholder: 'Book now', width: 'half' },
      { name: 'cta_url', label: 'Button link', type: 'url', width: 'half' },
    ],
  },
  projects: {
    key: 'projects', table: 'profile_projects', label: 'Projects', singular: 'project',
    description: 'Case studies, cases, research projects, builds and portfolio work.',
    titleField: 'title', subtitle: (r) => join(r.role, yr(r.start_date)), aiTask: 'project_generation',
    empty: { title: 'No projects added', body: 'Show your best work with a short description and an image.' },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 200, width: 'half' },
      { name: 'role', label: 'Your role', type: 'text', max: 120, width: 'half' },
      { name: 'description', label: 'Description', type: 'textarea', max: 4000 },
      { name: 'url', label: 'Link', type: 'url', width: 'half' },
      { name: 'image_url', label: 'Image URL', type: 'url', width: 'half', hint: 'Upload in Media, then paste its link.' },
      { name: 'tags', label: 'Tags', type: 'tags', hint: 'Comma separated.' },
      { name: 'start_date', label: 'Start', type: 'month', width: 'half' },
      { name: 'end_date', label: 'End', type: 'month', width: 'half' },
      { name: 'is_featured', label: 'Featured', type: 'boolean' },
    ],
  },
  publications: {
    key: 'publications', table: 'profile_publications', label: 'Publications', singular: 'publication',
    description: 'Papers, books, chapters, articles and patents.',
    titleField: 'title', subtitle: (r) => join(r.venue, yr(r.published_on)),
    empty: { title: 'No publications added', body: 'Add papers and books. A DOI link is created automatically.' },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 400 },
      { name: 'authors', label: 'Authors', type: 'text', max: 400, placeholder: 'Rao A., Mehta S.' },
      { name: 'venue', label: 'Journal / publisher', type: 'text', max: 200, width: 'half' },
      { name: 'published_on', label: 'Date', type: 'date', width: 'half' },
      { name: 'pub_type', label: 'Type', type: 'select', width: 'half', options: [
        { value: 'article', label: 'Article' }, { value: 'journal', label: 'Journal paper' }, { value: 'conference', label: 'Conference paper' },
        { value: 'book', label: 'Book' }, { value: 'chapter', label: 'Chapter' }, { value: 'thesis', label: 'Thesis' },
        { value: 'report', label: 'Report' }, { value: 'patent', label: 'Patent' }, { value: 'other', label: 'Other' }] },
      { name: 'doi', label: 'DOI', type: 'text', max: 200, placeholder: '10.1000/xyz123', width: 'half' },
      { name: 'url', label: 'Link', type: 'url' },
      { name: 'abstract', label: 'Abstract', type: 'textarea', max: 4000 },
    ],
  },
  awards: {
    key: 'awards', table: 'profile_awards', label: 'Awards', singular: 'award',
    description: 'Honours, prizes, fellowships and recognition.',
    titleField: 'title', subtitle: (r) => join(r.issuer, yr(r.awarded_on)),
    empty: { title: 'No awards added', body: 'Recognition builds trust. Add honours and prizes.' },
    fields: [
      { name: 'title', label: 'Award', type: 'text', required: true, max: 200, width: 'half' },
      { name: 'issuer', label: 'Awarded by', type: 'text', max: 200, width: 'half' },
      { name: 'awarded_on', label: 'Date', type: 'date', width: 'half' },
      { name: 'url', label: 'Link', type: 'url', width: 'half' },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000 },
    ],
  },
  certifications: {
    key: 'certifications', table: 'profile_certifications', label: 'Certifications', singular: 'certification',
    description: 'Licences, registrations and certificates.',
    titleField: 'name', subtitle: (r) => join(r.issuer, yr(r.issued_on)),
    empty: { title: 'No certifications added', body: 'Add licences and certificates with verification links.' },
    fields: [
      { name: 'name', label: 'Certification', type: 'text', required: true, max: 200, width: 'half' },
      { name: 'issuer', label: 'Issued by', type: 'text', max: 200, width: 'half' },
      { name: 'issued_on', label: 'Issued', type: 'date', width: 'half' },
      { name: 'expires_on', label: 'Expires', type: 'date', width: 'half' },
      { name: 'credential_id', label: 'Credential ID', type: 'text', max: 120, width: 'half' },
      { name: 'credential_url', label: 'Verification link', type: 'url', width: 'half' },
    ],
  },
  testimonials: {
    key: 'testimonials', table: 'profile_testimonials', label: 'Testimonials', singular: 'testimonial',
    description: 'Reviews from clients, patients, students and colleagues.',
    titleField: 'author_name', subtitle: (r) => s(r.quote).slice(0, 80),
    empty: { title: 'No testimonials yet', body: 'Ask two or three happy clients for a sentence each.' },
    fields: [
      { name: 'author_name', label: 'Name', type: 'text', required: true, max: 120, width: 'half' },
      { name: 'author_title', label: 'Title', type: 'text', max: 120, width: 'half' },
      { name: 'author_org', label: 'Organization', type: 'text', max: 120, width: 'half' },
      { name: 'rating', label: 'Rating', type: 'select', width: 'half', options: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` })) },
      { name: 'quote', label: 'Testimonial', type: 'textarea', required: true, max: 1500 },
    ],
  },
  social_links: {
    key: 'social_links', table: 'profile_social_links', label: 'Social links', singular: 'link',
    description: 'Where else people can find you.',
    titleField: 'platform', subtitle: (r) => s(r.url),
    empty: { title: 'No links added', body: 'Add LinkedIn, GitHub, ORCID, Instagram or any profile.' },
    fields: [
      { name: 'platform', label: 'Platform', type: 'select', required: true, width: 'half', options: [
        'linkedin', 'github', 'x', 'instagram', 'facebook', 'youtube', 'medium', 'behance', 'dribbble', 'orcid', 'google_scholar',
        'researchgate', 'stackoverflow', 'telegram', 'threads', 'website', 'other',
      ].map((v) => ({ value: v, label: v.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()) })) },
      { name: 'url', label: 'URL', type: 'url', required: true, width: 'half' },
      { name: 'label', label: 'Label', type: 'text', max: 60, hint: 'Optional display text.' },
    ],
  },
  locations: {
    key: 'locations', table: 'profile_locations', label: 'Locations', singular: 'location',
    description: 'Clinics, chambers, offices and the areas you serve.',
    titleField: 'label', subtitle: (r) => join(r.city, r.is_service_area ? 'Service area' : r.hours),
    empty: { title: 'No locations added', body: 'Add where people can visit you, or the areas you cover.' },
    fields: [
      { name: 'label', label: 'Name', type: 'text', required: true, max: 120, placeholder: 'City Clinic, Koregaon Park', width: 'half' },
      { name: 'phone', label: 'Phone', type: 'text', max: 32, width: 'half' },
      { name: 'address_line', label: 'Address', type: 'text', max: 200 },
      { name: 'city', label: 'City', type: 'text', max: 80, width: 'half' },
      { name: 'region', label: 'State', type: 'text', max: 80, width: 'half' },
      { name: 'postal_code', label: 'PIN code', type: 'text', max: 12, width: 'half' },
      { name: 'country_code', label: 'Country code', type: 'text', max: 2, placeholder: 'IN', width: 'half' },
      { name: 'hours', label: 'Hours', type: 'text', max: 500, placeholder: 'Mon–Sat, 10am–2pm' },
      { name: 'map_url', label: 'Map link', type: 'url' },
      { name: 'is_service_area', label: 'This is an area I serve (not a visit address)', type: 'boolean' },
      { name: 'is_primary', label: 'Primary location', type: 'boolean' },
    ],
  },
  achievements: {
    key: 'achievements', table: 'profile_achievements', label: 'Highlights', singular: 'highlight',
    description: 'Numbers and milestones: patients treated, cases, students taught, projects delivered.',
    titleField: 'title', subtitle: (r) => join(r.metric),
    empty: { title: 'No highlights yet', body: 'Short, concrete numbers build credibility: "5,000+ patients treated".' },
    fields: [
      { name: 'metric', label: 'Number', type: 'text', max: 60, placeholder: '5,000+', width: 'half' },
      { name: 'title', label: 'What it measures', type: 'text', required: true, max: 200, placeholder: 'Patients treated', width: 'half' },
      { name: 'achieved_on', label: 'Date', type: 'date', width: 'half' },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000 },
    ],
  },
}

// ---- Validation derived from the field definitions -------------------------------------------

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const httpUrl = z.string().trim().max(2000).regex(/^https?:\/\/[^\s]+$/i, 'Enter a full link starting with https://')

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  let base: z.ZodTypeAny
  switch (f.type) {
    case 'boolean':
      return z.preprocess((v) => v === true || v === 'true' || v === 'on', z.boolean())
    case 'tags':
    case 'lines':
      return z.preprocess(
        (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(f.type === 'tags' ? /[,\n]/ : /\n/) : [])
          .map((x) => String(x).trim()).filter(Boolean).slice(0, 30),
        z.array(z.string().max(300)),
      )
    case 'url':
      base = httpUrl
      break
    case 'email':
      base = z.string().trim().email().max(200)
      break
    case 'month':
      return z.preprocess(
        (v) => (typeof v === 'string' && /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : emptyToNull(v)),
        f.required ? z.string().regex(/^\d{4}-\d{2}-\d{2}$/) : z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      )
    case 'date':
      base = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')
      break
    case 'number':
      return z.preprocess((v) => (v === '' || v == null ? null : Number(v)), f.required ? z.number().int() : z.number().int().nullable())
    case 'select':
      base = z.string().refine((v) => !f.options || f.options.some((o) => o.value === v), 'Choose an option')
      if (f.name === 'level' || f.name === 'rating') {
        return z.preprocess((v) => (v === '' || v == null ? null : Number(v)), f.required ? z.number().int().min(1).max(5) : z.number().int().min(1).max(5).nullable())
      }
      break
    default:
      base = z.string().trim().max(f.max ?? 2000)
  }
  if (f.type === 'text' || f.type === 'textarea') base = z.string().trim().max(f.max ?? 2000)
  return f.required ? z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), base.refine((v) => v !== '', `${f.label} is required`)) : z.preprocess(emptyToNull, base.nullable())
}

export function collectionSchema(key: CollectionKey) {
  const def = COLLECTIONS[key]
  const shape: Record<string, z.ZodTypeAny> = { is_visible: z.preprocess((v) => v !== false && v !== 'false', z.boolean()).optional() }
  // Omitted optional fields stay omitted (column default applies); blank strings become null.
  for (const f of def.fields) shape[f.name] = f.required ? fieldSchema(f) : fieldSchema(f).optional()
  return z.object(shape).strict()
}

export function isCollectionKey(v: unknown): v is CollectionKey {
  return typeof v === 'string' && (COLLECTION_KEYS as readonly string[]).includes(v)
}
