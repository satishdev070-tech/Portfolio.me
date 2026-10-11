import type { Metadata } from 'next'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getEntitlements, hasFeature } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSectionTypes, getTemplates } from '@/lib/catalog'
import { siteUrl } from '@/lib/env'
import { resolveTheme } from '@/site/theme'
import type { ThemeOverrides } from '@/site/types'
import { Editor } from '@/components/editor/editor'

export const metadata: Metadata = { title: 'Website editor' }

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ tab?: string; welcome?: string }> }) {
  const viewer = await requireViewer()
  const site = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [sp, entitlements, sectionTypes, templates, { data: website }, { data: sections }, { data: versions }] = await Promise.all([
    searchParams,
    getEntitlements(viewer.workspaceId),
    getSectionTypes(),
    getTemplates(),
    supabase.from('websites').select('id, name, slug, status, locale, theme, template_id, published_version_id, slug_changed_at, published_at, updated_at').eq('id', site.id).single(),
    supabase.from('website_sections').select('id, section_type, variant, is_enabled, position, content').eq('website_id', site.id).order('position').order('created_at'),
    supabase.from('website_versions').select('id, version_number, kind, note, created_at').eq('website_id', site.id).order('version_number', { ascending: false }).limit(30),
  ])
  const template = templates.find((t) => t.id === website!.template_id)
  return (
    <Editor
      initialTab={sp.tab === 'design' || sp.tab === 'versions' || sp.tab === 'settings' ? sp.tab : 'sections'}
      welcome={!!sp.welcome}
      website={{ ...website!, url: siteUrl(website!.slug) }}
      sections={(sections ?? []).map((s) => ({ ...s, content: (s.content ?? {}) as Record<string, unknown> }))}
      sectionTypes={sectionTypes}
      template={template ? { slug: template.slug, name: template.name, tier: template.tier } : null}
      templateTokens={resolveTheme(template?.config, {})}
      theme={(website!.theme ?? {}) as ThemeOverrides}
      versions={versions ?? []}
      canAdvancedSections={hasFeature(entitlements, 'advanced_sections')}
      canPremium={hasFeature(entitlements, 'premium_templates')}
      canManage={viewer.role === 'owner' || viewer.role === 'admin'}
    />
  )
}
