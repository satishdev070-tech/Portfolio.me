import { z } from 'zod'
import { FONT_KEYS } from '@/site/types'
import { AppError } from '@/lib/errors'

const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : typeof v === 'string' ? v.trim() : v)
const optText = (max: number) => z.preprocess(blank, z.string().max(max).nullable().optional())
const optUrl = z.preprocess(blank, z.string().max(2000).regex(/^https?:\/\/\S+$/i, 'Enter a full link starting with https://').nullable().optional())

export const profileBasicsSchema = z.object({
  full_name: z.string().trim().min(1, 'Your name is required').max(120),
  display_name: optText(120),
  headline: optText(160),
  tagline: optText(200),
  bio_short: optText(600),
  bio_long: optText(8000),
  profession_id: z.preprocess(blank, z.string().uuid().nullable().optional()),
  email_public: z.preprocess(blank, z.string().email('Enter a valid email').max(200).nullable().optional()),
  phone_public: optText(32),
  whatsapp_number: z.preprocess(
    (v) => (typeof v === 'string' ? (v.replace(/[\s()-]/g, '') || null) : v),
    z.string().regex(/^\+?[0-9]{8,15}$/, 'Use digits with country code, e.g. +919876543210').nullable().optional(),
  ),
  website_url: optUrl,
  city: optText(80),
  region: optText(80),
  country_code: z.preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() || null : v), z.string().regex(/^[A-Z]{2}$/).nullable().optional()),
  languages: z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : v),
    z.array(z.string().max(40)).max(20).optional(),
  ),
  years_experience: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(0).max(80).nullable().optional()),
  availability: optText(200),
  pronouns: optText(40),
  avatar_url: optUrl,
  cover_url: optUrl,
  extra: z.record(z.string(), z.string().max(300)).optional(),
})
export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>

export const seoSchema = z.object({
  title: optText(70),
  description: optText(170),
  og_description: optText(200),
  og_image_url: optUrl,
  canonical_url: optUrl,
  keywords: z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : v),
    z.array(z.string().max(60)).max(20).optional(),
  ),
  noindex: z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean()).optional(),
})
export type SeoInput = z.infer<typeof seoSchema>

const hex = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
export const themeSchema = z.object({
  colors: z.object({
    background: hex, surface: hex, text: hex, muted: hex, primary: hex, primaryContrast: hex, accent: hex, border: hex,
  }).partial().optional(),
  typography: z.object({
    heading: z.enum(FONT_KEYS), body: z.enum(FONT_KEYS), scale: z.enum(['compact', 'default', 'large']),
    headingWeight: z.number().int().min(300).max(900),
  }).partial().optional(),
  spacing: z.object({ section: z.enum(['compact', 'default', 'airy']), width: z.enum(['narrow', 'default', 'wide']) }).partial().optional(),
  components: z.object({
    radius: z.enum(['none', 'sm', 'md', 'lg']), button: z.enum(['solid', 'outline', 'pill']), card: z.enum(['flat', 'bordered', 'elevated']),
  }).partial().optional(),
}).strict()

export const sectionItemSchema = z.object({
  title: z.string().trim().min(1).max(300),
  subtitle: optText(300),
  description: optText(3000),
  date: optText(40),
  url: optUrl,
  price: optText(60),
})

export const sectionContentSchema = z.object({
  heading: optText(120),
  intro: optText(600),
  body: optText(600),
  cta_label: optText(40),
  button_label: optText(40),
  button_url: optUrl,
  booking_url: optUrl,
  note: optText(600),
  message: optText(200),
  items: z.array(sectionItemSchema).max(50).optional(),
}).strict()

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'At least 3 characters')
  .max(30, 'At most 30 characters')
  .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/, 'Lowercase letters, numbers and single hyphens only')

/** Suggest a slug from a name: "Dr. Rahul Sharma" → "dr-rahul-sharma". */
export function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '')
}

/** Parse with a schema or throw a VALIDATION_ERROR with per-field messages. */
export function parseInput<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input)
  if (r.success) return r.data
  const fields: Record<string, string> = {}
  for (const issue of r.error.issues) fields[issue.path.join('.') || '_'] ??= issue.message
  throw new AppError('VALIDATION_ERROR', Object.values(fields)[0] ?? 'Some values are not valid.', { fields })
}
