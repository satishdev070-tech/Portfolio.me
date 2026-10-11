import { assertViewer } from '@/lib/auth'
import { assertSameOrigin } from '@/lib/csrf'
import { AppError, route, unwrap } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Delete a media asset: removes the stored object and the row (RLS-scoped to the workspace). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    assertSameOrigin(request)
    const viewer = await assertViewer()
    const { id } = await params
    const supabase = await createServerSupabase()
    const { data: asset } = await supabase.from('media_assets').select('id, bucket, path, workspace_id').eq('id', id).maybeSingle()
    if (!asset || asset.workspace_id !== viewer.workspaceId) throw new AppError('NOT_FOUND', 'File not found.')
    await supabase.storage.from(asset.bucket).remove([asset.path])
    unwrap(await supabase.from('media_assets').delete().eq('id', id))
    return true
  })
}
