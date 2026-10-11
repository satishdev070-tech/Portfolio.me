import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/page-header'
import { ImportForm } from '@/components/import/import-form'

export const metadata: Metadata = { title: 'Import' }

const STATUS: Record<string, string> = { review: 'Ready to review', applied: 'Saved', failed: 'Failed', discarded: 'Discarded', extracting: 'Reading…', structuring: 'Structuring…', queued: 'Queued' }

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const viewer = await requireViewer()
  const supabase = await createServerSupabase()
  const [sp, { data: sources }, { data: recent }] = await Promise.all([
    searchParams,
    supabase.from('import_sources').select('key, name, input_kind, guidance, is_enabled').order('sort_order'),
    supabase.from('imports').select('id, source_key, status, created_at, error_message').eq('workspace_id', viewer.workspaceId).order('created_at', { ascending: false }).limit(8),
  ])
  return (
    <>
      <PageHeader eyebrow={sp.welcome ? 'Step 2 of 3' : undefined} title="Import your details"
        description="Bring in your CV, LinkedIn export, GitHub or an existing website. You’ll review everything we find before anything is saved." />
      <ImportForm sources={(sources ?? []).filter((s) => s.is_enabled)} />
      {sp.welcome ? <p className="mt-4 text-sm text-muted-foreground">No CV handy? <Link href="/editor" className="font-medium text-foreground underline">Skip and edit manually</Link></p> : null}
      {recent?.length ? (
        <section className="mt-10" aria-labelledby="recent-h">
          <h2 id="recent-h" className="mb-3 text-sm font-medium">Recent imports</h2>
          <ul className="panel divide-y text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate">{(sources ?? []).find((s) => s.key === r.source_key)?.name ?? r.source_key}<span className="ml-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                {r.status === 'review' ? <Link href={`/import/${r.id}`} className="text-xs font-medium text-brand hover:underline">Review →</Link> : <span className="truncate text-xs text-muted-foreground" title={r.error_message ?? undefined}>{STATUS[r.status] ?? r.status}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
