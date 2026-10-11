'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError, unwrap } from '@/lib/errors'
import { IMPORT_SCHEMA } from '@/lib/ai/tasks'
import { parseInput } from '@/lib/validation/schemas'
import { asJson } from '@/lib/supabase/json'
import type { Database } from '@/lib/supabase/database.types'

const SOCIAL = new Set(['linkedin', 'github', 'x', 'instagram', 'facebook', 'youtube', 'tiktok', 'medium', 'behance', 'dribbble', 'orcid', 'google_scholar', 'researchgate', 'stackoverflow', 'telegram', 'whatsapp', 'threads', 'website'])
const date = (v: string | null | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v && /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v && /^\d{4}$/.test(v) ? `${v}-01-01` : null)
const httpUrl = (v: string | null | undefined) => (v && /^https?:\/\/\S+$/i.test(v) ? v.slice(0, 2000) : null)
const email = (v: string | null | undefined) => (v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : null)

const applySchema = z.object({
  importId: z.string().uuid(),
  data: IMPORT_SCHEMA,
  profileFields: z.array(z.enum(['full_name', 'headline', 'bio_short', 'email', 'phone', 'city', 'website_url', 'languages'])).max(8),
})

/**
 * Save reviewed import data. The client sends only items the user kept (and may have edited);
 * everything is re-validated here. Profile fields are written only when explicitly selected.
 */
export async function applyImport(input: z.input<typeof applySchema>) {
  return action(async () => {
    const viewer = await assertViewer()
    const { importId, data, profileFields } = parseInput(applySchema, input)
    const site = await getCurrentWebsite()
    if (!site) throw new AppError('NOT_FOUND', 'Create your website first.')
    const supabase = await createServerSupabase()
    const { data: job } = await supabase.from('imports').select('id, status, workspace_id').eq('id', importId).maybeSingle()
    if (!job || job.workspace_id !== viewer.workspaceId) throw new AppError('NOT_FOUND', 'Import not found.')
    if (job.status !== 'review') throw new AppError('CONFLICT', 'This import has already been handled.')

    const base = { workspace_id: viewer.workspaceId, profile_id: site.profile_id }
    const summary: Record<string, number> = {}
    const count = (k: string, n: number) => { if (n) summary[k] = n }

    // Profile fields (explicitly chosen only).
    const p = data.profile
    const patch: Database['public']['Tables']['profiles']['Update'] = {}
    if (profileFields.includes('full_name') && p.full_name) patch.full_name = p.full_name
    if (profileFields.includes('headline') && p.headline) patch.headline = p.headline
    if (profileFields.includes('bio_short') && p.bio_short) patch.bio_short = p.bio_short
    if (profileFields.includes('email') && email(p.email)) patch.email_public = email(p.email)
    if (profileFields.includes('phone') && p.phone) patch.phone_public = p.phone.slice(0, 32)
    if (profileFields.includes('city') && p.city) patch.city = p.city
    if (profileFields.includes('website_url') && httpUrl(p.website_url)) patch.website_url = httpUrl(p.website_url)
    if (profileFields.includes('languages') && p.languages?.length) patch.languages = p.languages
    if (Object.keys(patch).length) { unwrap(await supabase.from('profiles').update(patch).eq('id', site.profile_id)); count('profile_fields', Object.keys(patch).length) }

    const insert = async (table: string, rows: Record<string, unknown>[]) => {
      if (!rows.length) return
      unwrap(await supabase.from(table as 'profile_skills').insert(rows.map((r, i) => ({ ...base, sort_order: 500 + i * 10, ...r })) as never))
      count(table.replace('profile_', ''), rows.length)
    }

    await insert('profile_experiences', data.experiences.map((e) => ({
      title: e.title, organization: e.organization, location: e.location ?? null, start_date: date(e.start_date),
      end_date: e.is_current ? null : date(e.end_date), is_current: !!e.is_current, description: e.description ?? null,
    })).map((e) => (e.start_date && e.end_date && e.end_date < e.start_date ? { ...e, end_date: null } : e)))
    await insert('profile_education', data.education.map((e) => ({ institution: e.institution, degree: e.degree ?? null, field_of_study: e.field_of_study ?? null, start_date: date(e.start_date), end_date: date(e.end_date), grade: e.grade ?? null })))

    const { data: existingSkills } = await supabase.from('profile_skills').select('name').eq('profile_id', site.profile_id)
    const have = new Set((existingSkills ?? []).map((s) => s.name.toLowerCase()))
    await insert('profile_skills', [...new Set(data.skills.map((s) => s.trim()).filter((s) => s && !have.has(s.toLowerCase())))].map((name) => ({ name: name.slice(0, 80) })))
    await insert('profile_certifications', data.certifications.map((c) => ({ name: c.name, issuer: c.issuer ?? null, issued_on: date(c.issued_on) })))
    await insert('profile_awards', data.awards.map((a) => ({ title: a.title, issuer: a.issuer ?? null, awarded_on: date(a.awarded_on) })))
    await insert('profile_publications', data.publications.map((x) => ({ title: x.title, venue: x.venue ?? null, authors: x.authors ?? null, published_on: date(x.published_on), url: httpUrl(x.url) })))
    await insert('profile_projects', data.projects.map((x) => ({ title: x.title, description: x.description ?? null, url: httpUrl(x.url) })))

    const { data: existingLinks } = await supabase.from('profile_social_links').select('url').eq('profile_id', site.profile_id)
    const haveLinks = new Set((existingLinks ?? []).map((l) => l.url.toLowerCase()))
    await insert('profile_social_links', data.social_links
      .map((l) => ({ platform: SOCIAL.has(l.platform.toLowerCase()) ? l.platform.toLowerCase() : 'other', url: httpUrl(l.url) }))
      .filter((l): l is { platform: string; url: string } => !!l.url && !haveLinks.has(l.url.toLowerCase())))

    unwrap(await supabase.from('imports').update({ status: 'applied', applied_summary: asJson(summary) }).eq('id', importId))
    revalidatePath('/', 'layout')
    return summary
  })
}

export async function discardImport(importId: string) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    const res = unwrap(await supabase.from('imports').update({ status: 'discarded', extracted_text: null }).eq('id', importId).eq('workspace_id', viewer.workspaceId).select('id'))
    if (!res.length) throw new AppError('NOT_FOUND', 'Import not found.')
    revalidatePath('/import')
    return true
  })
}
