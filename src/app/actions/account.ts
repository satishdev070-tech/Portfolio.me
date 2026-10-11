'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError, unwrap } from '@/lib/errors'
import { parseInput } from '@/lib/validation/schemas'

export async function updateAccount(input: { full_name?: string; locale?: string; workspace_name?: string }) {
  return action(async () => {
    const viewer = await assertViewer()
    const data = parseInput(z.object({ full_name: z.string().trim().min(1).max(120).optional(), locale: z.enum(['en', 'hi']).optional(), workspace_name: z.string().trim().min(1).max(120).optional() }), input)
    const supabase = await createServerSupabase()
    if (data.full_name || data.locale) unwrap(await supabase.from('users').update({ full_name: data.full_name, locale: data.locale }).eq('id', viewer.userId))
    if (data.workspace_name) {
      if (viewer.role !== 'owner' && viewer.role !== 'admin') throw new AppError('FORBIDDEN', 'Only owners can rename the workspace.')
      unwrap(await supabase.from('workspaces').update({ name: data.workspace_name }).eq('id', viewer.workspaceId))
    }
    revalidatePath('/', 'layout')
    return true
  })
}

export async function changePassword(password: string) {
  return action(async () => {
    await assertViewer()
    const pw = parseInput(z.string().min(8, 'Use at least 8 characters').max(128), password)
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) throw new AppError('VALIDATION_ERROR', error.message)
    return true
  })
}
