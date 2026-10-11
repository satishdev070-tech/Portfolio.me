import type { Metadata } from 'next'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/page-header'
import { MediaLibrary } from '@/components/media/media-library'

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  const viewer = await requireViewer()
  const site = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [{ data: assets }, { data: items }, { data: usage }] = await Promise.all([
    supabase.from('media_assets').select('id, public_url, mime_type, size_bytes, width, height, alt_text, purpose, original_name, created_at').eq('workspace_id', viewer.workspaceId).is('deleted_at', null).order('created_at', { ascending: false }).limit(200),
    supabase.from('profile_media_items').select('id, kind, media_asset_id, external_url, title').eq('profile_id', site.profile_id).order('sort_order'),
    supabase.rpc('get_workspace_usage', { p_workspace: viewer.workspaceId }),
  ])
  const u = usage as unknown as { storage_bytes: number; storage_limit_mb: number }
  return (
    <>
      <PageHeader title="Media" description="Photos and files for your website. Images are resized and converted to WebP automatically; location data is removed." />
      <MediaLibrary assets={assets ?? []} items={items ?? []} usedBytes={u?.storage_bytes ?? 0} limitMb={u?.storage_limit_mb ?? 0} />
    </>
  )
}
