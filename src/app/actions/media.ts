'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError, unwrap } from '@/lib/errors'
import { parseInput } from '@/lib/validation/schemas'

export async function updateAltText(assetId: string, alt: string) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    const res = unwrap(await supabase.from('media_assets').update({ alt_text: parseInput(z.string().trim().max(300), alt) || null }).eq('id', assetId).eq('workspace_id', viewer.workspaceId).select('id'))
    if (!res.length) throw new AppError('NOT_FOUND', 'File not found.')
    revalidatePath('/media')
    return true
  })
}

/** Add an uploaded image to the gallery, or a YouTube/Vimeo link to videos. */
export async function addToProfileMedia(input: { assetId?: string; videoUrl?: string; title?: string }) {
  return action(async () => {
    const viewer = await assertViewer()
    const site = await getCurrentWebsite()
    if (!site) throw new AppError('NOT_FOUND', 'Create your website first.')
    const data = parseInput(z.object({
      assetId: z.string().uuid().optional(),
      videoUrl: z.string().regex(/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/\S+$/i, 'Use a YouTube or Vimeo link').optional(),
      title: z.string().trim().max(200).optional(),
    }), input)
    const supabase = await createServerSupabase()
    const base = { workspace_id: viewer.workspaceId, profile_id: site.profile_id, title: data.title || null }
    if (data.assetId) unwrap(await supabase.from('profile_media_items').insert({ ...base, kind: 'image', media_asset_id: data.assetId }))
    else if (data.videoUrl) unwrap(await supabase.from('profile_media_items').insert({ ...base, kind: 'video', external_url: data.videoUrl }))
    else throw new AppError('VALIDATION_ERROR', 'Choose an image or add a video link.')
    revalidatePath('/media')
    revalidatePath('/editor')
    return true
  })
}

export async function removeProfileMedia(itemId: string) {
  return action(async () => {
    const viewer = await assertViewer()
    const supabase = await createServerSupabase()
    unwrap(await supabase.from('profile_media_items').delete().eq('id', itemId).eq('workspace_id', viewer.workspaceId))
    revalidatePath('/media')
    return true
  })
}
