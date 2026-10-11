import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Admin' }

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString()

export default async function AdminOverview() {
  const supabase = await createServerSupabase()
  const since = daysAgo(30)
  const count = async (table: string, f?: (q: ReturnType<ReturnType<typeof supabase.from>['select']>) => unknown) => {
    let q = supabase.from(table as 'users').select('*', { count: 'exact', head: true })
    if (f) q = f(q as never) as typeof q
    return (await q).count ?? 0
  }
  const [users, workspaces, sites, live, templates, paid, aiCalls, aiFailed, domains, imports] = await Promise.all([
    count('users'), count('workspaces'), count('websites', (q) => q.is('deleted_at', null)), count('websites', (q) => q.eq('status', 'published').is('deleted_at', null)),
    count('templates', (q) => q.eq('status', 'published')), count('subscriptions', (q) => q.in('status', ['active', 'trialing', 'past_due'])),
    count('ai_generations', (q) => q.gte('created_at', since)), count('ai_generations', (q) => q.gte('created_at', since).eq('status', 'refunded')),
    count('domains', (q) => q.eq('status', 'active')), count('imports', (q) => q.gte('created_at', since)),
  ])
  const { data: credits } = await supabase.from('ai_generations').select('credits_used, input_tokens, output_tokens, provider').gte('created_at', since).limit(5000)
  const byProvider = new Map<string, { calls: number; credits: number; tokens: number }>()
  for (const g of credits ?? []) {
    const k = g.provider ?? 'unknown'
    const v = byProvider.get(k) ?? { calls: 0, credits: 0, tokens: 0 }
    v.calls++; v.credits += g.credits_used; v.tokens += (g.input_tokens ?? 0) + (g.output_tokens ?? 0)
    byProvider.set(k, v)
  }
  const stats = [['Users', users], ['Workspaces', workspaces], ['Websites', sites], ['Published', live], ['Live templates', templates], ['Paid subscriptions', paid], ['Custom domains', domains], ['Imports (30d)', imports], ['AI requests (30d)', aiCalls], ['AI failures (30d)', aiFailed]] as const
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([l, v]) => <div key={l} className="panel p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{v.toLocaleString('en-IN')}</p></div>)}
      </div>
      <section className="panel p-5">
        <h2 className="mb-3 text-sm font-medium">AI usage by provider, last 30 days</h2>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Provider</th><th className="font-medium">Requests</th><th className="font-medium">Credits</th><th className="font-medium">Tokens</th></tr></thead>
          <tbody>{[...byProvider].map(([k, v]) => <tr key={k} className="border-t tabular-nums"><td className="py-1.5">{k}</td><td>{v.calls}</td><td>{v.credits}</td><td>{v.tokens.toLocaleString('en-IN')}</td></tr>)}
            {!byProvider.size ? <tr><td colSpan={4} className="py-3 text-muted-foreground">No AI usage yet.</td></tr> : null}</tbody></table>
      </section>
    </div>
  )
}
