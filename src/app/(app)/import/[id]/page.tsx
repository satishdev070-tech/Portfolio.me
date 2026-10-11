import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import type { ImportData } from '@/lib/ai/tasks'
import { PageHeader } from '@/components/app/page-header'
import { ImportReview } from '@/components/import/import-review'

export const metadata: Metadata = { title: 'Review import' }

export default async function ReviewImport({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer()
  const supabase = await createServerSupabase()
  const { data: job } = await supabase.from('imports').select('id, status, structured, raw_metadata, source_key, error_message, applied_summary, workspace_id').eq('id', (await params).id).maybeSingle()
  if (!job || job.workspace_id !== viewer.workspaceId) notFound()
  const meta = (job.raw_metadata ?? {}) as { method?: string; fallback_reason?: string }

  if (job.status !== 'review') {
    return (
      <>
        <PageHeader title="Import" description={job.status === 'applied' ? 'This import has been saved to your profile.' : job.status === 'failed' ? job.error_message ?? 'This import failed.' : 'This import was discarded.'} />
        <div className="flex gap-3 text-sm"><Link href="/profile" className="font-medium underline">Go to profile</Link><Link href="/import" className="underline">Import something else</Link></div>
      </>
    )
  }
  return (
    <>
      <PageHeader title="Review what we found" description="Untick anything you don’t want, fix any mistakes, then save. Nothing is published until you publish your website." />
      {meta.method === 'rules' ? (
        <p className="mb-6 rounded-lg border bg-warning/10 p-3 text-sm">
          {meta.fallback_reason === 'AI_CREDITS_EXHAUSTED' ? 'You’re out of AI credits, so we used basic extraction.' : meta.fallback_reason === 'FEATURE_NOT_AVAILABLE' ? 'AI import isn’t in your plan, so we used basic extraction.' : 'We used basic extraction (AI wasn’t available).'} It catches less detail. Please check carefully.
        </p>
      ) : null}
      <ImportReview importId={job.id} data={job.structured as unknown as ImportData} />
    </>
  )
}
