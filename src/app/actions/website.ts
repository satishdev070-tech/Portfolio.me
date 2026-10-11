'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { assertViewer, SITE_COOKIE } from '@/lib/auth'
import { action, AppError, unwrap } from '@/lib/errors'
import { invalidateSite } from '@/lib/sites'
import { parseInput, sectionContentSchema, seoSchema, slugSchema, themeSchema } from '@/lib/validation/schemas'
import { asJson } from '@/lib/supabase/json'
import { publicEnv, rootHostname } from '@/lib/env'

async function ownedWebsite(websiteId: string) {
  const viewer = await assertViewer()
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('websites').select('id, workspace_id, slug, status, theme, seo').eq('id', websiteId).is('deleted_at', null).maybeSingle()
  if (!data || data.workspace_id !== viewer.workspaceId) throw new AppError('NOT_FOUND', 'Website not found.')
  return { supabase, website: data, viewer }
}

async function activeDomains(supabase: Awaited<ReturnType<typeof createServerSupabase>>, websiteId: string) {
  const { data } = await supabase.from('domains').select('domain').eq('website_id', websiteId).eq('status', 'active')
  return (data ?? []).map((d) => d.domain)
}

function refreshEditor() {
  revalidatePath('/editor')
  revalidatePath('/dashboard')
}

// ---- Sections -------------------------------------------------------------------------------

export async function addSection(websiteId: string, sectionType: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    const { data: type } = await supabase.from('section_types').select('key, variants, default_content, is_singleton').eq('key', sectionType).maybeSingle()
    if (!type) throw new AppError('VALIDATION_ERROR', 'Unknown section type.')
    if (type.is_singleton) {
      const { count } = await supabase.from('website_sections').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).eq('section_type', sectionType)
      if (count) throw new AppError('CONFLICT', 'This section is already on your site.')
    }
    const { data: last } = await supabase.from('website_sections').select('position').eq('website_id', websiteId).order('position', { ascending: false }).limit(1).maybeSingle()
    const row = unwrap(await supabase.from('website_sections').insert({
      workspace_id: website.workspace_id, website_id: websiteId, section_type: sectionType,
      variant: type.variants[0] ?? 'default', position: (last?.position ?? 0) + 10, content: type.default_content,
    }).select('id').single())
    refreshEditor()
    return row
  })
}

export async function updateSection(websiteId: string, sectionId: string, input: { is_enabled?: boolean; variant?: string; content?: unknown }) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const patch: { is_enabled?: boolean; variant?: string; content?: ReturnType<typeof asJson> } = {}
    if (typeof input.is_enabled === 'boolean') patch.is_enabled = input.is_enabled
    if (input.variant !== undefined) {
      const { data: section } = await supabase.from('website_sections').select('section_type').eq('id', sectionId).eq('website_id', websiteId).single()
      const { data: type } = await supabase.from('section_types').select('variants').eq('key', section?.section_type ?? '').single()
      if (!type?.variants.includes(input.variant)) throw new AppError('VALIDATION_ERROR', 'Unknown layout for this section.')
      patch.variant = input.variant
    }
    if (input.content !== undefined) patch.content = asJson(stripNulls(parseInput(sectionContentSchema, input.content)))
    const res = unwrap(await supabase.from('website_sections').update(patch).eq('id', sectionId).eq('website_id', websiteId).select('id'))
    if (!res.length) throw new AppError('NOT_FOUND', 'Section not found.')
    refreshEditor()
    return true
  })
}

export async function removeSection(websiteId: string, sectionId: string) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const { data: s } = await supabase.from('website_sections').select('section_type').eq('id', sectionId).eq('website_id', websiteId).maybeSingle()
    if (s?.section_type === 'hero') throw new AppError('VALIDATION_ERROR', 'The hero section is required. You can change its layout instead.')
    unwrap(await supabase.from('website_sections').delete().eq('id', sectionId).eq('website_id', websiteId))
    refreshEditor()
    return true
  })
}

export async function reorderSections(websiteId: string, ids: string[]) {
  return action(async () => {
    const parsed = parseInput(z.array(z.string().uuid()).max(100), ids)
    const { supabase } = await ownedWebsite(websiteId)
    unwrap(await supabase.rpc('reorder_sections', { p_website: websiteId, p_section_ids: parsed }))
    refreshEditor()
    return true
  })
}

// ---- Design, SEO, settings -----------------------------------------------------------------

export async function updateTheme(websiteId: string, theme: unknown) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const data = parseInput(themeSchema, theme)
    unwrap(await supabase.from('websites').update({ theme: asJson(data) }).eq('id', websiteId))
    refreshEditor()
    return true
  })
}

export async function updateSeo(websiteId: string, input: unknown) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const data = stripNulls(parseInput(seoSchema, input))
    unwrap(await supabase.from('websites').update({ seo: asJson(data) }).eq('id', websiteId))
    revalidatePath('/seo')
    refreshEditor()
    return true
  })
}

export async function updateWebsiteSettings(websiteId: string, input: unknown) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const data = parseInput(z.object({ name: z.string().trim().min(1).max(120).optional(), locale: z.enum(['en', 'hi']).optional() }), input)
    unwrap(await supabase.from('websites').update(data).eq('id', websiteId))
    refreshEditor()
    revalidatePath('/settings')
    return true
  })
}

export async function applyTemplate(websiteId: string, templateSlug: string, resetTheme = true) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    unwrap(await supabase.rpc('apply_template', { p_website: websiteId, p_template_slug: templateSlug, p_reset_theme: resetTheme }))
    refreshEditor()
    revalidatePath('/templates')
    return true
  })
}

// ---- Publishing & versions -----------------------------------------------------------------

export interface PublishCheck {
  ok: boolean
  errors: { code: string; message: string; feature?: string; field?: string }[]
  warnings: { code: string; message: string }[]
}

export async function validateForPublish(websiteId: string) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    return unwrap(await supabase.rpc('validate_website_for_publish', { p_website: websiteId })) as unknown as PublishCheck
  })
}

export async function publishWebsite(websiteId: string, note?: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    const result = unwrap(await supabase.rpc('publish_website', { p_website: websiteId, p_note: note?.slice(0, 200) })) as unknown as
      { published: true; version: number; slug: string } | ({ published: false } & PublishCheck)
    if (result.published) {
      invalidateSite(website.slug, await activeDomains(supabase, websiteId))
      refreshEditor()
    }
    return result
  })
}

export async function unpublishWebsite(websiteId: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    unwrap(await supabase.rpc('unpublish_website', { p_website: websiteId }))
    invalidateSite(website.slug, await activeDomains(supabase, websiteId))
    refreshEditor()
    return true
  })
}

export async function saveCheckpoint(websiteId: string, note?: string) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const version = unwrap(await supabase.rpc('create_checkpoint', { p_website: websiteId, p_note: note?.slice(0, 200) }))
    revalidatePath('/editor')
    return { version }
  })
}

export async function restoreVersion(websiteId: string, versionId: string, makeLive = true) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    unwrap(await supabase.rpc('restore_website_version', { p_website: websiteId, p_version_id: versionId, p_make_live: makeLive }))
    invalidateSite(website.slug, await activeDomains(supabase, websiteId))
    refreshEditor()
    return true
  })
}

export async function changeSlug(websiteId: string, slug: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    const next = parseInput(slugSchema, slug)
    unwrap(await supabase.rpc('change_website_slug', { p_website: websiteId, p_slug: next }))
    invalidateSite(website.slug)
    invalidateSite(next)
    revalidatePath('/', 'layout')
    return { slug: next }
  })
}

// ---- Multiple websites ---------------------------------------------------------------------

export async function selectWebsite(websiteId: string) {
  return action(async () => {
    await ownedWebsite(websiteId)
    ;(await cookies()).set(SITE_COOKIE, websiteId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    revalidatePath('/', 'layout')
    return true
  })
}

export async function createAdditionalWebsite(input: { name: string; slug: string; templateSlug: string }) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    const data = parseInput(z.object({ name: z.string().trim().min(1).max(120), slug: slugSchema, templateSlug: z.string().regex(/^[a-z0-9-]+$/) }), input)
    const { data: profile } = await supabase.from('profiles').select('id').eq('workspace_id', viewer.workspaceId).is('deleted_at', null).order('created_at').limit(1).single()
    if (!profile) throw new AppError('NOT_FOUND', 'Create your profile first.')
    const id = unwrap(await supabase.rpc('create_website', { p_profile: profile.id, p_name: data.name, p_slug: data.slug, p_template_slug: data.templateSlug })) as string
    ;(await cookies()).set(SITE_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    revalidatePath('/', 'layout')
    return { id }
  })
}

export async function deleteWebsite(websiteId: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    unwrap(await supabase.rpc('delete_website', { p_website: websiteId }))
    invalidateSite(website.slug)
    ;(await cookies()).delete(SITE_COOKIE)
    revalidatePath('/', 'layout')
    return true
  })
}

// ---- Custom domains --------------------------------------------------------------------------

export async function addDomain(websiteId: string, domain: string) {
  return action(async () => {
    const { supabase } = await ownedWebsite(websiteId)
    const row = unwrap(await supabase.rpc('add_custom_domain', { p_website: websiteId, p_domain: domain, p_platform_domain: rootHostname() }))
    revalidatePath('/domain')
    return row
  })
}

export async function removeDomain(websiteId: string, domainId: string) {
  return action(async () => {
    const { supabase, website } = await ownedWebsite(websiteId)
    const { data: d } = await supabase.from('domains').select('domain').eq('id', domainId).eq('website_id', websiteId).maybeSingle()
    unwrap(await supabase.rpc('remove_custom_domain', { p_domain_id: domainId }))
    if (d) invalidateSite(website.slug, [d.domain])
    revalidatePath('/domain')
    return true
  })
}

// ---- Favorites ---------------------------------------------------------------------------------

export async function toggleFavorite(templateId: string) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('favorites').select('template_id').eq('template_id', templateId).maybeSingle()
    if (data) unwrap(await supabase.from('favorites').delete().eq('template_id', templateId).eq('user_id', viewer.userId))
    else unwrap(await supabase.from('favorites').insert({ template_id: templateId, user_id: viewer.userId }))
    revalidatePath('/templates')
    return { favorite: !data }
  })
}

function stripNulls<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length))) as Partial<T>
}

export async function siteLinks(slug: string) {
  return { subdomain: `${slug}.${publicEnv.rootDomain}`, path: `${publicEnv.appUrl}/u/${slug}` }
}
