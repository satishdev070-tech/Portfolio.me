'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError, unwrap } from '@/lib/errors'
import { runAITask } from '@/lib/ai/service'
import { AI_TASKS, type AITask } from '@/lib/ai/types'
import { parseInput } from '@/lib/validation/schemas'
import { asJson } from '@/lib/supabase/json'

const STUDIO_TASKS = new Set<AITask>(['bio_generation', 'headline_generation', 'experience_generation', 'service_generation', 'project_generation', 'seo_generation', 'rewrite', 'translation', 'summarization', 'profile_generation'])

export async function generate(task: string, input: Record<string, unknown>) {
  return action(async () => {
    if (!(AI_TASKS as readonly string[]).includes(task) || !STUDIO_TASKS.has(task as AITask)) throw new AppError('VALIDATION_ERROR', 'Unknown AI task.')
    const viewer = await assertViewer()
    if (viewer.role === 'viewer') throw new AppError('FORBIDDEN', 'You cannot use AI in this workspace.')
    const res = await runAITask({ workspaceId: viewer.workspaceId, userId: viewer.userId }, task as AITask, input as never)
    revalidatePath('/ai')
    return { output: res.output as Record<string, unknown>, credits: res.credits, provider: res.provider }
  })
}

async function profileId() {
  const site = await getCurrentWebsite()
  if (!site) throw new AppError('NOT_FOUND', 'Create your website first.')
  return site.profile_id
}

/** Apply generated text to the profile. Only explicit, user-chosen fields are written. */
export async function applyToProfile(input: { headline?: string; bio_short?: string; bio_long?: string }) {
  return action(async () => {
    await assertViewer()
    const data = parseInput(z.object({ headline: z.string().trim().max(160).optional(), bio_short: z.string().trim().max(600).optional(), bio_long: z.string().trim().max(8000).optional() }), input)
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('profiles').update(data).eq('id', await profileId()))
    revalidatePath('/', 'layout')
    return true
  })
}

const svcSchema = z.array(z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000) })).min(1).max(12)
const expSchema = z.object({ title: z.string().trim().min(1).max(160), organization: z.string().trim().min(1).max(160), description: z.string().trim().max(4000), highlights: z.array(z.string().max(300)).max(10) })
const projSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(4000), tags: z.array(z.string().max(40)).max(10) })

export async function addGeneratedItems(kind: 'services' | 'experience' | 'project', payload: unknown) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    const pid = await profileId()
    const base = { workspace_id: viewer.workspaceId, profile_id: pid }
    if (kind === 'services') {
      const rows = parseInput(svcSchema, payload).map((s, i) => ({ ...base, title: s.title, description: s.description, sort_order: 1000 + i }))
      unwrap(await supabase.from('profile_services').insert(rows))
    } else if (kind === 'experience') {
      const e = parseInput(expSchema, payload)
      unwrap(await supabase.from('profile_experiences').insert({ ...base, ...e, sort_order: 0 }))
    } else {
      const p = parseInput(projSchema, payload)
      unwrap(await supabase.from('profile_projects').insert({ ...base, ...p, sort_order: 0 }))
    }
    revalidatePath('/', 'layout')
    return true
  })
}

export async function applySeo(input: { title?: string; description?: string; keywords?: string[]; og_description?: string }) {
  return action(async () => {
    await assertViewer()
    const site = await getCurrentWebsite()
    if (!site) throw new AppError('NOT_FOUND', 'Create your website first.')
    const supabase = await createServerSupabase()
    const { data: w } = await supabase.from('websites').select('seo').eq('id', site.id).single()
    const next = { ...((w?.seo ?? {}) as Record<string, unknown>), ...parseInput(z.object({ title: z.string().max(70).optional(), description: z.string().max(170).optional(), keywords: z.array(z.string().max(60)).max(20).optional(), og_description: z.string().max(200).optional() }), input) }
    unwrap(await supabase.from('websites').update({ seo: asJson(next) }).eq('id', site.id))
    revalidatePath('/seo')
    return true
  })
}
