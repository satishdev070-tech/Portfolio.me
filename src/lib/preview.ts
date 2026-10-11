import 'server-only'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import type { SiteDocument } from '@/site/types'

/** Draft document for a website the viewer belongs to (RLS + membership check in the RPC). */
export async function getDraftDocument(websiteId: string): Promise<SiteDocument> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_site_preview', { p_website: websiteId })
  if (error || !data) notFound()
  return data as unknown as SiteDocument
}
