import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { requireViewer } from '@/lib/auth'
import { getEntitlements } from '@/lib/entitlements'
import { getPlans, formatPrice } from '@/lib/catalog'
import { createServerSupabase } from '@/lib/supabase/server'
import { activeProvider } from '@/lib/billing'
import { PageHeader } from '@/components/app/page-header'
import { PlanButton, CancelButton } from '@/components/billing/plan-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Subscription' }

export default async function BillingPage() {
  const viewer = await requireViewer()
  const supabase = await createServerSupabase()
  const [ent, plans, { data: usage }] = await Promise.all([getEntitlements(viewer.workspaceId), getPlans(), supabase.rpc('get_workspace_usage', { p_workspace: viewer.workspaceId })])
  const u = usage as unknown as { storage_bytes: number; storage_limit_mb: number; ai_credits_used: number; ai_credits_limit: number; websites: number; websites_limit: number }
  const provider = activeProvider()
  const canManage = viewer.role === 'owner' || viewer.role === 'admin'
  const sub = ent.subscription
  const meters = [
    { label: 'AI credits this period', used: u.ai_credits_used, limit: u.ai_credits_limit },
    { label: 'Storage (MB)', used: Math.round(u.storage_bytes / 1024 / 1024), limit: u.storage_limit_mb },
    { label: 'Websites', used: u.websites, limit: u.websites_limit },
  ]

  return (
    <>
      <PageHeader title="Subscription" description="Your plan, usage and upgrades. Plan features are checked on our servers, so changes apply instantly." />
      <div className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
        <section className="panel p-5">
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{ent.plan.name}</p>
          <p className="text-sm text-muted-foreground">
            {sub ? <>{sub.status === 'past_due' ? 'Payment overdue. Please update your payment method. ' : ''}{sub.cancel_at_period_end || sub.status === 'cancelled' ? 'Ends' : 'Renews'} {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}</> : 'Free forever'}
          </p>
          {sub && canManage && !sub.cancel_at_period_end && sub.status === 'active' ? <CancelButton /> : null}
        </section>
        <section className="panel grid gap-4 p-5 sm:grid-cols-3">
          {meters.map((m) => {
            const pct = m.limit > 0 ? Math.min(100, (m.used / m.limit) * 100) : 0
            return (
              <div key={m.label}>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-medium tabular-nums">{m.used.toLocaleString('en-IN')} <span className="text-muted-foreground">/ {m.limit === -1 ? '∞' : m.limit.toLocaleString('en-IN')}</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={m.label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><div className={cn('h-full', pct >= 90 ? 'bg-warning' : 'bg-brand')} style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
        </section>
      </div>

      {!provider ? <p className="mt-6 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">Online payments aren’t configured on this server. Plans are shown for reference.</p> : provider.slug === 'dev' ? <p className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">Development billing: upgrades activate instantly without payment.</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const current = p.slug === ent.plan.slug
          return (
            <div key={p.id} className={cn('flex flex-col rounded-xl border bg-card p-5', current && 'ring-2 ring-foreground')}>
              <div className="flex items-center justify-between"><h2 className="font-semibold">{p.name}</h2>{current ? <span className="text-xs font-medium text-success">Current plan</span> : null}</div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{formatPrice(p.price_minor, p.currency)}{p.price_minor ? <span className="text-sm font-normal text-muted-foreground"> / {p.billing_interval}</span> : null}</p>
              <ul className="mt-4 grid flex-1 gap-1.5 text-sm">{p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{h}</li>)}</ul>
              {!current && !p.is_default && canManage ? <PlanButton slug={p.slug} label={`Upgrade to ${p.name}`} disabled={!provider} /> : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
