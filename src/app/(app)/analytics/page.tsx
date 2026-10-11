import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { UpgradeNotice } from '@/components/app/upgrade-notice'
import { ViewsChart } from '@/components/analytics/views-chart'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Analytics' }

type KV = { key: string; count: number }
type Analytics = {
  from: string; advanced: boolean; totals: { views: number; unique_visitors: number }
  daily: { day: string; views: number; unique_visitors: number }[]
  top_pages?: KV[]; referrers?: KV[]; devices?: KV[]; countries?: KV[]; events?: KV[]
}
const RANGES = [7, 30, 90] as const
const EVENT_LABEL: Record<string, string> = { contact_click: 'Contact clicks', cta_click: 'Button clicks', outbound_click: 'Outbound link clicks' }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireViewer()
  const site = (await getCurrentWebsite())!
  const { days: daysParam } = await searchParams
  const days = RANGES.find((r) => String(r) === daysParam) ?? 30
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_site_analytics', { p_website: site.id, p_days: days })
  const a = data as unknown as Analytics | null

  // Fill missing days with zeros so the chart's time axis is continuous.
  const filled = a ? Array.from({ length: days }, (_, i) => {
    const d = new Date(`${a.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    return a.daily.find((x) => x.day === key) ?? { day: key, views: 0, unique_visitors: 0 }
  }) : []

  return (
    <>
      <PageHeader title="Analytics" description="Privacy-friendly: no cookies, no IP addresses stored, and visitors can’t be followed across days or sites."
        actions={<nav className="flex rounded-lg border p-0.5" aria-label="Date range">{RANGES.map((r) => <Link key={r} href={`/analytics?days=${r}`} aria-current={r === days ? 'page' : undefined} className={cn('rounded-md px-3 py-1 text-sm text-muted-foreground', r === days && 'bg-muted font-medium text-foreground')}>{r} days</Link>)}</nav>} />
      {error ? <UpgradeNotice title="Analytics aren’t included in your plan" body="Upgrade to see who visits your website." /> : !a || (a.totals.views === 0 && site.status !== 'published') ? (
        <EmptyState icon={BarChart3} title="No visits yet" body={site.status === 'published' ? 'Share your link. Visits will appear here within a minute.' : 'Publish your website to start seeing visits.'} actions={<Link href="/editor" className="text-sm font-medium underline">Go to editor</Link>} />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Page views" value={a.totals.views} />
            <Stat label="Unique visitors" value={a.totals.unique_visitors} hint="Counted once per day" />
            <Stat label="Contact clicks" value={(a.events ?? []).find((e) => e.key === 'contact_click')?.count ?? null} hint={a.advanced ? undefined : 'Advanced analytics'} />
          </div>
          <section className="panel p-5" aria-labelledby="views-h">
            <h2 id="views-h" className="mb-4 text-sm font-medium">Page views per day</h2>
            <ViewsChart days={filled} />
          </section>
          {a.advanced ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Breakdown title="Referrers" rows={a.referrers ?? []} />
              <Breakdown title="Devices" rows={a.devices ?? []} />
              <Breakdown title="Countries" rows={a.countries ?? []} />
              <Breakdown title="Clicks" rows={(a.events ?? []).map((e) => ({ ...e, key: EVENT_LABEL[e.key] ?? e.key }))} />
            </div>
          ) : <UpgradeNotice title="See where visitors come from" body="Referrers, devices, countries and contact clicks are part of advanced analytics." />}
        </div>
      )}
    </>
  )
}

function Stat({ label, value, hint }: { label: string; value: number | null; hint?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value === null ? '—' : value.toLocaleString('en-IN')}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: KV[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className="panel p-5" aria-label={title}>
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {rows.length ? (
        <ul className="grid gap-2 text-sm">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="relative overflow-hidden rounded-md px-2 py-1">
                <div className="absolute inset-y-0 left-0 rounded-r-[4px] bg-brand/12" style={{ width: `${(r.count / max) * 100}%` }} aria-hidden="true" />
                <span className="relative truncate">{r.key}</span>
              </div>
              <span className="tabular-nums text-muted-foreground">{r.count.toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No data yet.</p>}
    </section>
  )
}
