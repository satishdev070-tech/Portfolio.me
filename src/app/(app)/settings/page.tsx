import type { Metadata } from 'next'
import { requireViewer, listWebsites } from '@/lib/auth'
import { getEntitlements, limitOf } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { getTemplates } from '@/lib/catalog'
import { siteUrl } from '@/lib/env'
import { PageHeader } from '@/components/app/page-header'
import { AccountForm, PasswordForm, NewWebsiteForm } from '@/components/settings/settings-forms'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const viewer = await requireViewer()
  const supabase = await createServerSupabase()
  const [{ data: ws }, sites, ent, templates] = await Promise.all([
    supabase.from('workspaces').select('name').eq('id', viewer.workspaceId).single(),
    listWebsites(viewer.workspaceId),
    getEntitlements(viewer.workspaceId),
    getTemplates(),
  ])
  const limit = limitOf(ent, 'max_websites')
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-3xl gap-6">
        <section className="panel p-5"><h2 className="mb-4 font-medium">Account</h2><AccountForm fullName={viewer.fullName ?? ''} locale={viewer.locale} workspaceName={ws?.name ?? ''} canRename={viewer.role === 'owner' || viewer.role === 'admin'} email={viewer.email} /></section>
        <section className="panel p-5"><h2 className="mb-4 font-medium">Password</h2><PasswordForm /></section>
        <section className="panel p-5">
          <h2 className="font-medium">Websites</h2>
          <p className="mt-1 text-sm text-muted-foreground">{sites.length} of {limit === -1 ? 'unlimited' : limit} on your plan.</p>
          <ul className="mt-4 grid gap-1 text-sm">{sites.map((s) => <li key={s.id} className="flex justify-between rounded-md border px-3 py-2"><span>{s.name}</span><a href={siteUrl(s.slug)} target="_blank" rel="noopener" className="text-muted-foreground hover:underline">{s.slug} · {s.status}</a></li>)}</ul>
          {limit === -1 || sites.length < limit ? <NewWebsiteForm templates={templates.map((t) => ({ slug: t.slug, name: t.name }))} /> : <p className="mt-4 text-sm text-muted-foreground">Need more websites? The Advanced plan includes up to 3.</p>}
        </section>
        <section className="panel p-5">
          <h2 className="font-medium">Your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">Download everything you’ve added as a JSON file.</p>
          <a href="/api/export" className="mt-3 inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">Export my data</a>
        </section>
      </div>
    </>
  )
}
