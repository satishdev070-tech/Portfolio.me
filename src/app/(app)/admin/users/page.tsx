import { createServerSupabase } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/env'

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createServerSupabase()
  let users = supabase.from('users').select('id, email, full_name, created_at, is_platform_admin, onboarding_completed_at').order('created_at', { ascending: false }).limit(100)
  if (q) users = users.ilike('email', `%${q.replace(/[%_]/g, '')}%`)
  const [{ data: list }, { data: sites }, { data: subs }] = await Promise.all([
    users,
    supabase.from('websites').select('id, slug, status, workspace_id, created_by, published_at').is('deleted_at', null).limit(1000),
    supabase.from('subscriptions').select('workspace_id, status, subscription_plans(name)').in('status', ['active', 'trialing', 'past_due']),
  ])
  const { data: members } = await supabase.from('workspace_members').select('user_id, workspace_id, role').in('user_id', (list ?? []).map((u) => u.id))
  return (
    <div className="grid gap-4">
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search by email" className="h-9 w-72 rounded-lg border bg-card px-3 text-sm" aria-label="Search users" /><button className="h-9 rounded-lg border px-3 text-sm">Search</button></form>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-3 font-medium">User</th><th className="font-medium">Joined</th><th className="font-medium">Plan</th><th className="font-medium">Websites</th></tr></thead>
          <tbody>{(list ?? []).map((u) => {
            const wsIds = (members ?? []).filter((m) => m.user_id === u.id).map((m) => m.workspace_id)
            const plan = (subs ?? []).find((s) => wsIds.includes(s.workspace_id))
            const userSites = (sites ?? []).filter((s) => wsIds.includes(s.workspace_id))
            return (
              <tr key={u.id} className="border-t align-top">
                <td className="p-3"><p className="font-medium">{u.full_name ?? '—'}{u.is_platform_admin ? <span className="ml-2 text-xs text-brand">admin</span> : null}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                <td className="py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-IN')}{u.onboarding_completed_at ? '' : ' · not onboarded'}</td>
                <td className="py-3">{(plan?.subscription_plans as { name: string } | null)?.name ?? 'Free'}{plan && plan.status !== 'active' ? ` (${plan.status})` : ''}</td>
                <td className="py-3">{userSites.map((s) => <a key={s.id} href={siteUrl(s.slug)} target="_blank" rel="noopener" className="block text-xs hover:underline">{s.slug} · {s.status}</a>)}</td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
    </div>
  )
}
