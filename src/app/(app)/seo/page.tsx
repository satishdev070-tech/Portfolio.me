import type { Metadata } from 'next'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getEntitlements, hasFeature } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/env'
import { PageHeader } from '@/components/app/page-header'
import { SeoForm } from '@/components/seo/seo-form'
import type { SeoConfig } from '@/site/types'

export const metadata: Metadata = { title: 'SEO' }

export default async function SeoPage() {
  const viewer = await requireViewer()
  const site = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [entitlements, { data: w }, { data: p }] = await Promise.all([
    getEntitlements(viewer.workspaceId),
    supabase.from('websites').select('seo').eq('id', site.id).single(),
    supabase.from('profiles').select('full_name, display_name, headline, bio_short, avatar_url, professions(name, schema_org_type)').eq('id', site.profile_id).single(),
  ])
  const prof = p?.professions as { name: string; schema_org_type: string } | null
  return (
    <>
      <PageHeader title="SEO" description="How your site appears in search results and when shared. Changes apply when you publish." />
      <SeoForm
        websiteId={site.id}
        seo={(w?.seo ?? {}) as SeoConfig}
        url={siteUrl(site.slug)}
        defaults={{ title: [p?.display_name || p?.full_name, p?.headline].filter(Boolean).join(' — '), description: p?.bio_short || p?.headline || '', image: p?.avatar_url ?? null }}
        advanced={hasFeature(entitlements, 'advanced_seo')}
        schemaType={prof?.schema_org_type ?? 'Person'}
      />
    </>
  )
}
