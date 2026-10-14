import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { getPlans, formatPrice } from '@/lib/catalog'
import { createPublicSupabase } from '@/lib/supabase/admin'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { publicEnv } from '@/lib/env'

export const metadata: Metadata = { title: 'Pricing', description: 'Free forever plan, plus Basic and Advanced plans for premium templates, custom domains and more AI.' }

export default async function PricingPage() {
  const plans = await getPlans()
  // Feature names come from the database too, so admins can rename or add features without a deploy.
  const { data: features } = await createPublicSupabase().from('features').select('key, name, description, kind, unit').eq('is_active', true).order('sort_order')
  const cell = (planId: string, key: string, kind: string, unit: string | null) => {
    const f = plans.find((p) => p.id === planId)?.features.find((x) => x.feature_key === key)
    if (!f?.enabled) return <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
    if (kind === 'boolean') return <Check className="mx-auto size-4 text-success" aria-label="Included" />
    if (f.limit_value === -1) return 'Unlimited'
    if (unit === 'MB' && (f.limit_value ?? 0) >= 1024) return `${(f.limit_value! / 1024).toLocaleString('en-IN')} GB`
    return `${(f.limit_value ?? 0).toLocaleString('en-IN')}${unit === 'MB' ? ' MB' : ''}`
  }

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-14 sm:px-6">
      <p className="eyebrow">Pricing</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Start free. Grow when you need to.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">The Free plan is a complete website, not a trial. Paid plans add premium design, deeper insight and your own domain.</p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={cn('flex flex-col rounded-xl border bg-card p-6 shadow-(--shadow-card)', p.is_featured && 'border-brand/40 ring-1 ring-brand/20')}>
            <div className="flex items-center justify-between"><h2 className="font-semibold">{p.name}</h2>{p.is_featured ? <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Most popular</span> : null}</div>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-5 text-4xl font-semibold tracking-tight">{formatPrice(p.price_minor, p.currency)}{p.price_minor ? <span className="text-base font-normal text-muted-foreground"> / {p.billing_interval}</span> : null}</p>
            <ul className="mt-6 grid flex-1 gap-2 text-sm">
              {p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{h}</li>)}
            </ul>
            <Link href={p.is_default ? '/signup' : `/signup?plan=${p.slug}`} className={cn(buttonVariants({ size: 'lg', variant: p.is_featured ? 'default' : 'outline' }), 'mt-6 w-full')}>
              {p.is_default ? 'Start free' : `Choose ${p.name}`}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-14 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">Plan comparison</caption>
          <thead><tr className="border-b"><th scope="col" className="p-4 text-left font-medium">Compare plans</th>{plans.map((p) => <th key={p.id} scope="col" className="p-4 text-center font-medium">{p.name}</th>)}</tr></thead>
          <tbody>
            <tr className="border-b"><th scope="row" className="p-4 text-left font-normal">Professional website on your {publicEnv.appName} address</th>{plans.map((p) => <td key={p.id} className="p-4 text-center"><Check className="mx-auto size-4 text-success" aria-label="Included" /></td>)}</tr>
            {(features ?? []).filter((f) => f.key !== 'custom_css').map((f) => (
              <tr key={f.key} className="border-b last:border-0">
                <th scope="row" className="p-4 text-left font-normal">{f.name}<span className="block text-xs text-muted-foreground">{f.description}</span></th>
                {plans.map((p) => <td key={p.id} className="p-4 text-center tabular-nums">{cell(p.id, f.key, f.kind, f.unit)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Prices include applicable taxes where required. Cancel any time; paid features stay active until the end of the period you paid for.</p>
    </div>
  )
}
