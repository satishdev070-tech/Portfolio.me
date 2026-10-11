'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError, unwrap } from '@/lib/errors'
import { parseInput } from '@/lib/validation/schemas'
import { revalidateCatalog } from '@/lib/catalog'
import { asJson } from '@/lib/supabase/json'
import { SHELLS } from '@/site/types'
import { templateConfigSchema } from '@/lib/validation/template-config'

// Platform-admin mutations. Each re-checks admin (requireAdmin) and RLS enforces
// private.is_platform_admin() on every catalog/plan/AI table independently.

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,60}$/, 'Lowercase letters, numbers and hyphens')
const done = (path: string) => { revalidateCatalog(); revalidatePath(path, 'layout') }

// ---- Professions & categories ------------------------------------------------------------

export async function saveCategory(input: unknown) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({ id: z.string().uuid().optional(), slug, name: z.string().trim().min(1).max(80), name_hi: z.string().trim().max(80).optional(), icon: z.string().max(40).optional(), sort_order: z.coerce.number().int().default(0), is_active: z.boolean().default(true) }), input)
    const supabase = await createServerSupabase()
    const row = { slug: d.slug, name: d.name, name_i18n: d.name_hi ? { hi: d.name_hi } : {}, icon: d.icon || null, sort_order: d.sort_order, is_active: d.is_active }
    unwrap(d.id ? await supabase.from('profession_categories').update(row).eq('id', d.id) : await supabase.from('profession_categories').insert(row))
    done('/admin')
    return true
  })
}

export async function saveProfession(input: unknown) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({
      id: z.string().uuid().optional(), slug, name: z.string().trim().min(1).max(80), name_hi: z.string().trim().max(80).optional(),
      category_id: z.string().uuid(), schema_org_type: z.enum(['Person', 'Physician', 'Dentist', 'Attorney', 'LegalService', 'EducationalOrganization', 'LocalBusiness', 'HomeAndConstructionBusiness', 'ProfessionalService', 'Organization']),
      recommended_sections: z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().regex(/^[a-z_]+$/)).max(20)),
      synonyms: z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(60)).max(20)),
      sort_order: z.coerce.number().int().default(0), is_active: z.boolean().default(true),
    }), input)
    const supabase = await createServerSupabase()
    const { data: types } = await supabase.from('section_types').select('key')
    const known = new Set((types ?? []).map((t) => t.key))
    const unknown = d.recommended_sections.filter((s) => !known.has(s))
    if (unknown.length) throw new AppError('VALIDATION_ERROR', `Unknown section types: ${unknown.join(', ')}`)
    const row = { slug: d.slug, name: d.name, name_i18n: d.name_hi ? { hi: d.name_hi } : {}, category_id: d.category_id, schema_org_type: d.schema_org_type, recommended_sections: d.recommended_sections, synonyms: d.synonyms, sort_order: d.sort_order, is_active: d.is_active }
    unwrap(d.id ? await supabase.from('professions').update(row).eq('id', d.id) : await supabase.from('professions').insert(row))
    done('/admin/professions')
    return true
  })
}

// ---- Templates -------------------------------------------------------------------------------

export async function saveTemplateMeta(input: unknown) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({
      id: z.string().uuid().optional(), slug, name: z.string().trim().min(1).max(80), description: z.string().trim().max(400).optional(),
      style: z.enum(['classic', 'modern', 'minimal', 'editorial', 'bold', 'warm']), layout: z.enum(SHELLS), tier: z.enum(['free', 'premium']),
      is_featured: z.boolean(), status: z.enum(['draft', 'published', 'archived']), color_family: z.string().max(30).optional(),
      demo_profile_key: z.string().max(40).optional(), preview_image_url: z.preprocess((v) => (v === '' ? null : v), z.string().url().nullable().optional()),
      profession_ids: z.array(z.string().uuid()).max(100).default([]), category_ids: z.array(z.string().uuid()).max(20).default([]),
    }), input)
    const supabase = await createServerSupabase()
    const { profession_ids, category_ids, id, ...row } = d
    if (row.status === 'published' && id) {
      const { data: t } = await supabase.from('templates').select('current_version_id').eq('id', id).single()
      if (!t?.current_version_id) throw new AppError('VALIDATION_ERROR', 'Publish a template version first.')
    }
    if (row.status === 'published' && !id) throw new AppError('VALIDATION_ERROR', 'Create the template as a draft, add a version, then publish.')
    const saved = unwrap(id ? await supabase.from('templates').update(row).eq('id', id).select('id').single() : await supabase.from('templates').insert({ ...row, status: 'draft' }).select('id').single())
    unwrap(await supabase.from('template_professions').delete().eq('template_id', saved.id))
    unwrap(await supabase.from('template_categories').delete().eq('template_id', saved.id))
    if (profession_ids.length) unwrap(await supabase.from('template_professions').insert(profession_ids.map((p) => ({ template_id: saved.id, profession_id: p, is_recommended: true }))))
    if (category_ids.length) unwrap(await supabase.from('template_categories').insert(category_ids.map((c) => ({ template_id: saved.id, category_id: c }))))
    done('/admin/templates')
    return { id: saved.id }
  })
}

/** Create a new draft version from JSON config; optionally publish it (published versions are immutable). */
export async function createTemplateVersion(templateId: string, configJson: string, changelog: string, publish: boolean) {
  return action(async () => {
    const viewer = await requireAdmin()
    let parsed: unknown
    try { parsed = JSON.parse(configJson) } catch { throw new AppError('VALIDATION_ERROR', 'Config is not valid JSON.') }
    const config = parseInput(templateConfigSchema, parsed)
    const supabase = await createServerSupabase()
    const { data: types } = await supabase.from('section_types').select('key, variants')
    for (const s of config.sections) {
      const t = (types ?? []).find((x) => x.key === s.type)
      if (!t) throw new AppError('VALIDATION_ERROR', `Unknown section type "${s.type}".`)
      if (!t.variants.includes(s.variant)) throw new AppError('VALIDATION_ERROR', `Section "${s.type}" has no layout "${s.variant}".`)
    }
    const { data: last } = await supabase.from('template_versions').select('version').eq('template_id', templateId).order('version', { ascending: false }).limit(1).maybeSingle()
    const v = unwrap(await supabase.from('template_versions').insert({ template_id: templateId, version: (last?.version ?? 0) + 1, config: asJson(config), changelog: changelog.slice(0, 500) || null, created_by: viewer.userId }).select('id, version').single())
    if (publish) unwrap(await supabase.rpc('admin_publish_template_version', { p_version_id: v.id }))
    done('/admin/templates')
    return v
  })
}

export async function publishTemplateVersion(versionId: string) {
  return action(async () => {
    await requireAdmin()
    const supabase = await createServerSupabase()
    unwrap(await supabase.rpc('admin_publish_template_version', { p_version_id: versionId }))
    done('/admin/templates')
    return true
  })
}

// ---- Section types ---------------------------------------------------------------------------

export async function updateSectionType(key: string, patch: { is_active?: boolean; is_advanced?: boolean; name?: string }) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({ is_active: z.boolean().optional(), is_advanced: z.boolean().optional(), name: z.string().trim().min(1).max(80).optional() }), patch)
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('section_types').update(d).eq('key', key))
    done('/admin/sections')
    return true
  })
}

// ---- Plans & features ------------------------------------------------------------------------

export async function savePlan(input: unknown) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({
      id: z.string().uuid(), name: z.string().trim().min(1).max(60), description: z.string().trim().max(300).optional(),
      price_rupees: z.coerce.number().min(0).max(1_000_000), currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(['month', 'year']),
      status: z.enum(['active', 'hidden', 'archived']), is_featured: z.boolean(),
      highlights: z.preprocess((v) => (typeof v === 'string' ? v.split('\n').map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(120)).max(15)),
      razorpay_plan_id: z.string().max(60).optional(),
      features: z.array(z.object({ feature_key: z.string(), enabled: z.boolean(), limit_value: z.coerce.number().int().min(-1).nullable() })),
    }), input)
    const supabase = await createServerSupabase()
    const { data: existing } = await supabase.from('subscription_plans').select('provider_plan_ids, is_default').eq('id', d.id).single()
    if (existing?.is_default && d.status !== 'active') throw new AppError('VALIDATION_ERROR', 'The default (free) plan must stay active.')
    unwrap(await supabase.from('subscription_plans').update({
      name: d.name, description: d.description || null, price_minor: Math.round(d.price_rupees * 100), currency: d.currency, billing_interval: d.billing_interval,
      status: d.status, is_featured: d.is_featured, highlights: d.highlights,
      provider_plan_ids: { ...((existing?.provider_plan_ids ?? {}) as Record<string, string>), ...(d.razorpay_plan_id !== undefined ? { razorpay: d.razorpay_plan_id } : {}) },
    }).eq('id', d.id))
    unwrap(await supabase.from('plan_features').upsert(d.features.map((f) => ({ plan_id: d.id, ...f })), { onConflict: 'plan_id,feature_key' }))
    done('/admin/plans')
    return true
  })
}

// ---- AI routing ------------------------------------------------------------------------------

export async function updateAiRoute(id: string, patch: { model_id?: string; fallback_model_id?: string | null; credits_cost?: number; is_active?: boolean }) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({ model_id: z.string().uuid().optional(), fallback_model_id: z.string().uuid().nullable().optional(), credits_cost: z.coerce.number().int().min(0).max(100).optional(), is_active: z.boolean().optional() }), patch)
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('ai_task_routes').update(d).eq('id', id))
    revalidatePath('/admin/ai')
    return true
  })
}

export async function toggleAiProvider(id: string, is_active: boolean) {
  return action(async () => {
    await requireAdmin()
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('ai_providers').update({ is_active }).eq('id', id))
    revalidatePath('/admin/ai')
    return true
  })
}

export async function saveAiModel(input: unknown) {
  return action(async () => {
    await requireAdmin()
    const d = parseInput(z.object({ provider_id: z.string().uuid(), model_key: z.string().trim().min(2).max(120).regex(/^[\w./:-]+$/), display_name: z.string().trim().min(1).max(80), capabilities: z.array(z.enum(['text', 'json', 'vision'])).min(1) }), input)
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('ai_models').insert(d))
    revalidatePath('/admin/ai')
    return true
  })
}
