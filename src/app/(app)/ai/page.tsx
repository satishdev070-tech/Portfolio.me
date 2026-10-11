import type { Metadata } from 'next'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getEntitlements, hasFeature } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/page-header'
import { UpgradeNotice } from '@/components/app/upgrade-notice'
import { AIStudio } from '@/components/ai/ai-studio'

export const metadata: Metadata = { title: 'AI Studio' }

const TASK_LABEL: Record<string, string> = {
  bio_generation: 'Bio', headline_generation: 'Headlines', experience_generation: 'Experience', service_generation: 'Services',
  project_generation: 'Project', seo_generation: 'SEO', rewrite: 'Rewrite', translation: 'Translate', summarization: 'Summary',
  document_extraction: 'CV import', url_extraction: 'Web import', ocr_processing: 'OCR', profile_generation: 'Profile',
}

export default async function AIPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const viewer = await requireViewer()
  const website = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [sp, entitlements, { data: profile }, { data: skills }, { data: usage }, { data: history }] = await Promise.all([
    searchParams,
    getEntitlements(viewer.workspaceId),
    supabase.from('profiles').select('full_name, headline, city, years_experience, bio_short, professions(name)').eq('id', website.profile_id).single(),
    supabase.from('profile_skills').select('name').eq('profile_id', website.profile_id).order('sort_order').limit(20),
    supabase.rpc('get_ai_usage', { p_workspace: viewer.workspaceId }),
    supabase.from('ai_generations').select('id, task, status, credits_used, created_at, provider').eq('workspace_id', viewer.workspaceId).order('created_at', { ascending: false }).limit(8),
  ])
  const u = usage as unknown as { used: number; limit: number }
  const enabled = hasFeature(entitlements, 'ai_content_generation')
  const context = {
    name: profile?.full_name ?? '',
    profession: (profile?.professions as { name: string } | null)?.name ?? '',
    headline: profile?.headline ?? '',
    location: profile?.city ?? '',
    experience_years: profile?.years_experience ?? undefined,
    skills: (skills ?? []).map((s) => s.name).join(', '),
    bio_short: profile?.bio_short ?? '',
  }

  return (
    <>
      <PageHeader title="AI Studio" description="Draft and polish your content. Nothing is saved until you choose “Use this”, and AI never invents facts on purpose. Always check the result." />
      {!enabled ? <UpgradeNotice className="mb-6" title="AI writing isn’t included in your plan" body="Upgrade to generate bios, services and SEO text." /> : null}
      <AIStudio initialTask={sp.task} context={context} usage={u} enabled={enabled} />
      {history?.length ? (
        <section className="mt-10" aria-labelledby="hist-h">
          <h2 id="hist-h" className="mb-3 text-sm font-medium">Recent activity</h2>
          <ul className="panel divide-y text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-4 py-2.5">
                <span>{TASK_LABEL[h.task] ?? h.task}<span className="ml-2 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                <span className="text-xs text-muted-foreground">{h.status === 'completed' ? `${h.credits_used} credit${h.credits_used === 1 ? '' : 's'}` : h.status === 'refunded' ? 'Failed · refunded' : h.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
