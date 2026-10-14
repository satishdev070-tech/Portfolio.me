import { assertViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { json, fail } from '@/lib/errors'
import { COLLECTIONS, COLLECTION_KEYS } from '@/lib/collections'
import { checkRateLimit } from '@/lib/rate-limit'
import { publicEnv } from '@/lib/env'

export const runtime = 'nodejs'

/** Download everything in the viewer's workspace as JSON (data portability). RLS-scoped. */
export async function GET() {
  try {
    const viewer = await assertViewer()
    checkRateLimit(`export:${viewer.userId}`, 5, 60 * 60_000)
    const supabase = await createServerSupabase()
    const ws = viewer.workspaceId
    const [profiles, websites, sections, media, domains] = await Promise.all([
      supabase.from('profiles').select('*').eq('workspace_id', ws),
      supabase.from('websites').select('id, name, slug, status, locale, theme, seo, settings, published_at, created_at').eq('workspace_id', ws),
      supabase.from('website_sections').select('website_id, section_type, variant, is_enabled, position, content').eq('workspace_id', ws),
      supabase.from('media_assets').select('public_url, mime_type, size_bytes, alt_text, purpose, created_at').eq('workspace_id', ws),
      supabase.from('domains').select('domain, status, verified_at').eq('workspace_id', ws),
    ])
    const collections = Object.fromEntries(await Promise.all(COLLECTION_KEYS.map(async (k) => [k, (await supabase.from(COLLECTIONS[k].table as 'profile_skills').select('*').eq('workspace_id', ws)).data ?? []])))
    const body = JSON.stringify({ exported_at: new Date().toISOString(), account: { email: viewer.email, name: viewer.fullName }, profiles: profiles.data, collections, websites: websites.data, sections: sections.data, media: media.data, domains: domains.data }, null, 2)
    return new Response(body, { headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="${publicEnv.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export-${new Date().toISOString().slice(0, 10)}.json"`, 'cache-control': 'no-store' } })
  } catch (e) {
    return json(fail(e))
  }
}
