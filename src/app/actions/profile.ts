'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { assertViewer } from '@/lib/auth'
import { action, AppError, unwrap } from '@/lib/errors'
import { parseInput, profileBasicsSchema } from '@/lib/validation/schemas'
import { COLLECTIONS, collectionSchema, isCollectionKey, type CollectionKey } from '@/lib/collections'

// All writes go through the user's session: RLS + composite foreign keys make cross-tenant writes
// impossible even if ids are tampered with. The checks here exist for clear error messages.

async function ownedProfile(profileId: string) {
  const viewer = await assertViewer()
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('profiles').select('id, workspace_id').eq('id', profileId).is('deleted_at', null).maybeSingle()
  if (!data || data.workspace_id !== viewer.workspaceId) throw new AppError('NOT_FOUND', 'Profile not found.')
  return { supabase, profile: data, viewer }
}

function refresh() {
  revalidatePath('/profile', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/editor')
}

export async function updateProfileBasics(profileId: string, input: unknown) {
  return action(async () => {
    const { supabase } = await ownedProfile(profileId)
    const data = parseInput(profileBasicsSchema.partial(), input)
    unwrap(await supabase.from('profiles').update(data).eq('id', profileId))
    refresh()
    return true
  })
}

function table(key: CollectionKey) {
  // Table names come from the static config, never from the request.
  return COLLECTIONS[key].table as 'profile_experiences'
}

export async function createCollectionItem(profileId: string, key: string, input: unknown) {
  return action(async () => {
    if (!isCollectionKey(key)) throw new AppError('VALIDATION_ERROR', 'Unknown collection.')
    const { supabase, profile } = await ownedProfile(profileId)
    const data = parseInput(collectionSchema(key), input)
    const { data: last } = await supabase.from(table(key)).select('sort_order').eq('profile_id', profileId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    const row = unwrap(
      await supabase.from(table(key)).insert({ ...data, workspace_id: profile.workspace_id, profile_id: profileId, sort_order: (last?.sort_order ?? 0) + 10 } as never).select('id').single(),
    )
    refresh()
    return row
  })
}

export async function updateCollectionItem(profileId: string, key: string, id: string, input: unknown) {
  return action(async () => {
    if (!isCollectionKey(key)) throw new AppError('VALIDATION_ERROR', 'Unknown collection.')
    const { supabase } = await ownedProfile(profileId)
    const data = parseInput(collectionSchema(key).partial(), input)
    const res = unwrap(await supabase.from(table(key)).update(data as never).eq('id', id).eq('profile_id', profileId).select('id'))
    if (!res.length) throw new AppError('NOT_FOUND', 'Item not found.')
    refresh()
    return true
  })
}

export async function deleteCollectionItem(profileId: string, key: string, id: string) {
  return action(async () => {
    if (!isCollectionKey(key)) throw new AppError('VALIDATION_ERROR', 'Unknown collection.')
    const { supabase } = await ownedProfile(profileId)
    unwrap(await supabase.from(table(key)).delete().eq('id', id).eq('profile_id', profileId))
    refresh()
    return true
  })
}

export async function reorderCollection(profileId: string, key: string, ids: string[]) {
  return action(async () => {
    if (!isCollectionKey(key)) throw new AppError('VALIDATION_ERROR', 'Unknown collection.')
    const parsed = parseInput(z.array(z.string().uuid()).max(200), ids)
    const { supabase } = await ownedProfile(profileId)
    await Promise.all(parsed.map((id, i) => supabase.from(table(key)).update({ sort_order: (i + 1) * 10 }).eq('id', id).eq('profile_id', profileId)))
    refresh()
    return true
  })
}
