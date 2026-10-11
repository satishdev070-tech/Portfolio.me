import type { MetadataRoute } from 'next'
import { getProfessions, getTemplates } from '@/lib/catalog'
import { createPublicSupabase } from '@/lib/supabase/admin'
import { publicEnv, siteUrl } from '@/lib/env'

// Platform sitemap: marketing pages, templates, profession landings and published sites.
// Past ~45k sites this should switch to generateSitemaps() pagination (list_published_sites is keyset-paged).
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.appUrl
  const [templates, professions, { data: sites }] = await Promise.all([
    getTemplates(), getProfessions(), createPublicSupabase().rpc('list_published_sites', { p_after: '', p_limit: 5000 }),
  ])
  return [
    ...['', '/templates', '/pricing', '/features', '/about'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const })),
    ...templates.map((t) => ({ url: `${base}/templates/${t.slug}`, lastModified: t.published_at ?? undefined })),
    ...professions.map((p) => ({ url: `${base}/profession/${p.slug}` })),
    ...(sites ?? []).map((s) => ({ url: s.custom_domain ? `https://${s.custom_domain}` : siteUrl(s.slug), lastModified: s.published_at })),
  ]
}
