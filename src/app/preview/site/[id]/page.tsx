import type { Metadata } from 'next'
import { requireViewer } from '@/lib/auth'
import { getDraftDocument } from '@/lib/preview'
import { SiteRenderer } from '@/site/renderer'
import { SiteRuntime } from '@/site/runtime'

// Draft preview shown inside the editor. Never indexed, never tracked.
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } }

export default async function DraftPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer()
  const doc = await getDraftDocument((await params).id)
  return (
    <>
      <SiteRenderer doc={doc} preview />
      <SiteRuntime slug={doc.website.slug} domain={null} track={false} />
    </>
  )
}
