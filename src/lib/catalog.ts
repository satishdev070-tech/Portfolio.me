import 'server-only'
import { unstable_cache, revalidateTag } from 'next/cache'
import { createPublicSupabase } from '@/lib/supabase/admin'
import type { TemplateConfig } from '@/site/types'

// Public catalog (professions, section types, templates, plans). Read with the anon client so it
// can be cached across users; admins invalidate with revalidateCatalog().

export const CATALOG_TAG = 'catalog'
export const revalidateCatalog = () => revalidateTag(CATALOG_TAG, { expire: 0 })

const cached = <T>(key: string, fn: () => Promise<T>) => unstable_cache(fn, ['catalog', key], { tags: [CATALOG_TAG], revalidate: 3600 })

export interface Category { id: string; slug: string; name: string; name_i18n: Record<string, string>; icon: string | null; sort_order: number }
export interface Profession { id: string; slug: string; name: string; name_i18n: Record<string, string>; category_id: string; synonyms: string[]; recommended_sections: string[]; schema_org_type: string; profile_fields: { key: string; label: string }[] }
export interface TemplateSummary {
  id: string; slug: string; name: string; description: string | null; style: string; layout: string; tier: 'free' | 'premium';
  is_featured: boolean; color_family: string | null; tags: string[]; features: string[]; use_count: number; published_at: string | null;
  demo_profile_key: string | null; preview_image_url: string | null;
  categories: string[]; professions: string[]; version: number; config: TemplateConfig
}
export interface SectionType { key: string; name: string; name_i18n: Record<string, string>; description: string | null; category: string; data_source: string | null; variants: string[]; is_advanced: boolean; is_singleton: boolean; icon: string | null; sort_order: number }
export interface Plan { id: string; slug: string; name: string; description: string | null; price_minor: number; currency: string; billing_interval: string; is_default: boolean; is_featured: boolean; highlights: string[]; sort_order: number; features: { feature_key: string; enabled: boolean; limit_value: number | null }[] }

export const getCategories = cached('categories', async (): Promise<Category[]> => {
  const { data, error } = await createPublicSupabase().from('profession_categories').select('id, slug, name, name_i18n, icon, sort_order').order('sort_order')
  if (error) throw error
  return data as Category[]
})

export const getProfessions = cached('professions', async (): Promise<Profession[]> => {
  const { data, error } = await createPublicSupabase()
    .from('professions').select('id, slug, name, name_i18n, category_id, synonyms, recommended_sections, schema_org_type, profile_fields').order('sort_order')
  if (error) throw error
  return data as unknown as Profession[]
})

export const getSectionTypes = cached('section_types', async (): Promise<SectionType[]> => {
  const { data, error } = await createPublicSupabase()
    .from('section_types').select('key, name, name_i18n, description, category, data_source, variants, is_advanced, is_singleton, icon, sort_order').order('sort_order')
  if (error) throw error
  return data as SectionType[]
})

export const getTemplates = cached('templates', async (): Promise<TemplateSummary[]> => {
  const sb = createPublicSupabase()
  const { data, error } = await sb
    .from('templates')
    .select(`id, slug, name, description, style, layout, tier, is_featured, color_family, tags, features, use_count, published_at,
             demo_profile_key, preview_image_url,
             template_categories(profession_categories(slug)), template_professions(professions(slug)),
             current:template_versions!templates_current_version_fk(version, config)`)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('use_count', { ascending: false })
  if (error) throw error
  type Row = Omit<TemplateSummary, 'categories' | 'professions' | 'version' | 'config'> & {
    template_categories: { profession_categories: { slug: string } | null }[]
    template_professions: { professions: { slug: string } | null }[]
    current: { version: number; config: TemplateConfig } | null
  }
  return (data as unknown as Row[])
    .filter((t) => t.current)
    .map(({ template_categories, template_professions, current, ...t }) => ({
      ...t,
      categories: template_categories.map((c) => c.profession_categories?.slug).filter(Boolean) as string[],
      professions: template_professions.map((p) => p.professions?.slug).filter(Boolean) as string[],
      version: current!.version,
      config: current!.config,
    }))
})

export async function getTemplate(slug: string) {
  return (await getTemplates()).find((t) => t.slug === slug) ?? null
}

export const getPlans = cached('plans', async (): Promise<Plan[]> => {
  const { data, error } = await createPublicSupabase()
    .from('subscription_plans')
    .select('id, slug, name, description, price_minor, currency, billing_interval, is_default, is_featured, highlights, sort_order, features:plan_features(feature_key, enabled, limit_value)')
    .eq('status', 'active')
    .order('sort_order')
  if (error) throw error
  return data as unknown as Plan[]
})

export function formatPrice(minor: number, currency: string, locale = 'en-IN') {
  if (minor === 0) return 'Free'
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100)
}

/** Templates ranked for a profession: exact profession match, then category match, then the rest. */
export function rankTemplates(templates: TemplateSummary[], professionSlug?: string | null, categorySlug?: string | null) {
  const score = (t: TemplateSummary) =>
    (professionSlug && t.professions.includes(professionSlug) ? 4 : 0) + (categorySlug && t.categories.includes(categorySlug) ? 2 : 0) + (t.tier === 'free' ? 0.5 : 0) + (t.is_featured ? 0.25 : 0)
  return [...templates].sort((a, b) => score(b) - score(a))
}
