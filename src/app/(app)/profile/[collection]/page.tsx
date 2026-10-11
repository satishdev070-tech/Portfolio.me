import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { COLLECTIONS, isCollectionKey } from '@/lib/collections'
import { PageHeader } from '@/components/app/page-header'
import { CollectionEditor } from '@/components/profile/collection-editor'

type Params = { params: Promise<{ collection: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { collection } = await params
  return { title: isCollectionKey(collection) ? COLLECTIONS[collection].label : 'Profile' }
}

export default async function CollectionPage({ params }: Params) {
  await requireViewer()
  const { collection } = await params
  if (!isCollectionKey(collection)) notFound()
  const def = COLLECTIONS[collection]
  const website = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const { data } = await supabase.from(def.table as 'profile_skills').select('*').eq('profile_id', website.profile_id).order('sort_order').order('created_at')
  return (
    <>
      <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">← Profile</Link>
      <div className="mt-3"><PageHeader title={def.label} description={def.description} /></div>
      {/* Only the key is passed: the client re-derives the definition (functions can't cross the boundary). */}
      <CollectionEditor collection={collection} profileId={website.profile_id} rows={(data ?? []) as unknown as ({ id: string } & Record<string, unknown>)[]} />
    </>
  )
}
