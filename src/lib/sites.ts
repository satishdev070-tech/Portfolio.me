import 'server-only'
import { unstable_cache, revalidateTag } from 'next/cache'
import { createPublicSupabase } from '@/lib/supabase/admin'
import type { SiteDocument } from '@/site/types'

// Published sites are immutable snapshots, so they cache well: one cached read per site, tagged
// and invalidated when the owner publishes, unpublishes, rolls back or changes a domain.
// The TTL is only a safety net (e.g. a plan downgrade changing branding without a republish).

export const siteTag = (slug: string) => `site:${slug}`
export const domainTag = (domain: string) => `domain:${domain}`

export const getPublishedSiteBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      const { data, error } = await createPublicSupabase().rpc('get_published_site', { p_slug: slug })
      if (error) throw error
      return (data as unknown as SiteDocument | null) ?? null
    },
    ['published-site', slug],
    { tags: [siteTag(slug)], revalidate: 3600 },
  )()

export const getPublishedSiteByDomain = (domain: string) =>
  unstable_cache(
    async () => {
      const { data, error } = await createPublicSupabase().rpc('get_published_site_by_domain', { p_domain: domain })
      if (error) throw error
      return (data as unknown as SiteDocument | null) ?? null
    },
    ['published-domain', domain],
    { tags: [domainTag(domain)], revalidate: 3600 },
  )()

/** Expire a site's cache immediately (publish/unpublish/rollback/domain change). */
export function invalidateSite(slug: string, domains: string[] = []) {
  revalidateTag(siteTag(slug), { expire: 0 })
  for (const d of domains) revalidateTag(domainTag(d), { expire: 0 })
}
