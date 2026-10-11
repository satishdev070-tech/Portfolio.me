import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { demoDocument } from '@/site/demo'
import { SiteRenderer } from '@/site/renderer'
import { publicEnv } from '@/lib/env'
import type { TemplateConfig } from '@/site/types'

// Admin preview of any template version (including drafts) with sample content.
export const metadata: Metadata = { robots: { index: false } }

export default async function TemplateVersionPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ as?: string }> }) {
  await requireAdmin()
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const supabase = await createServerSupabase()
  const { data: v } = await supabase.from('template_versions').select('id, version, config, templates(id, slug, name, layout, tier, demo_profile_key)').eq('id', id).maybeSingle()
  const t = v?.templates as { id: string; slug: string; name: string; layout: string; tier: 'free' | 'premium'; demo_profile_key: string | null } | null
  if (!v || !t) notFound()
  return <SiteRenderer doc={demoDocument({ template: { ...t, version: v.version, config: v.config as unknown as TemplateConfig }, demoKey: sp.as ?? t.demo_profile_key, baseUrl: publicEnv.appUrl })} />
}
