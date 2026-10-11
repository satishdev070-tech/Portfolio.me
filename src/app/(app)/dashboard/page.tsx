import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Circle, Sparkles } from 'lucide-react'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getEntitlements, hasFeature } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { publicEnv, siteUrl } from '@/lib/env'
import { PageHeader } from '@/components/app/page-header'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Overview' }

type Completion = { percent: number; items: { key: string; label: string; done: boolean }[] }
type Usage = { storage_bytes: number; storage_limit_mb: number; ai_credits_used: number; ai_credits_limit: number; websites: number; websites_limit: number }

// Where to go to finish each checklist item, and whether AI can help.
const FIX: Record<string, { href: string; ai?: boolean }> = {
  basic_info: { href: '/profile' }, photo: { href: '/profile' }, about: { href: '/ai?task=bio_generation', ai: true },
  contact: { href: '/profile' }, experience: { href: '/profile/experiences', ai: true }, education: { href: '/profile/education' },
  skills: { href: '/profile/skills' }, services: { href: '/ai?task=service_generation', ai: true }, projects: { href: '/profile/projects' },
  publications: { href: '/profile/publications' }, testimonials: { href: '/profile/testimonials' }, social_links: { href: '/profile/social_links' },
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const viewer = await requireViewer()
  const website = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [sp, entitlements, completionRes, usageRes, analyticsRes, domainRes, seoRes] = await Promise.all([
    searchParams,
    getEntitlements(viewer.workspaceId),
    supabase.rpc('get_profile_completion', { p_profile: website.profile_id }),
    supabase.rpc('get_workspace_usage', { p_workspace: viewer.workspaceId }),
    supabase.rpc('get_site_analytics', { p_website: website.id, p_days: 30 }),
    supabase.from('domains').select('domain, status').eq('website_id', website.id).neq('status', 'removed').limit(1).maybeSingle(),
    supabase.from('websites').select('seo').eq('id', website.id).single(),
  ])
  const completion = completionRes.data as unknown as Completion
  const usage = usageRes.data as unknown as Usage
  const analytics = analyticsRes.data as unknown as { totals: { views: number; unique_visitors: number } } | null
  const seoDone = !!(seoRes.data?.seo as { title?: string } | null)?.title
  const items = [...(completion?.items ?? []), { key: 'seo', label: 'SEO title & description', done: seoDone }]
  const fmtLimit = (n: number) => (n === -1 ? '∞' : n.toLocaleString('en-IN'))
  const storageMb = usage ? usage.storage_bytes / 1024 / 1024 : 0

  const stats = [
    { label: 'Website', value: website.status === 'published' ? 'Live' : website.status === 'unpublished' ? 'Offline' : 'Draft', sub: website.published_at ? `Published ${new Date(website.published_at).toLocaleDateString('en-IN')}` : 'Not published yet', href: '/editor' },
    { label: 'Profile completion', value: `${completion?.percent ?? 0}%`, sub: `${items.filter((i) => i.done).length} of ${items.length} done`, href: '/profile' },
    { label: 'Views, last 30 days', value: (analytics?.totals.views ?? 0).toLocaleString('en-IN'), sub: `${(analytics?.totals.unique_visitors ?? 0).toLocaleString('en-IN')} unique visitors`, href: '/analytics' },
    { label: 'Plan', value: entitlements.plan.name, sub: entitlements.subscription?.current_period_end ? `Renews ${new Date(entitlements.subscription.current_period_end).toLocaleDateString('en-IN')}` : 'Free forever', href: '/billing' },
    { label: 'Domain', value: domainRes.data?.status === 'active' ? domainRes.data.domain : `${website.slug}.${publicEnv.rootDomain}`, sub: domainRes.data ? `Custom domain ${domainRes.data.status}` : hasFeature(entitlements, 'custom_domain') ? 'Connect your own domain' : 'Free HelloMe address', href: '/domain' },
    { label: 'AI credits', value: `${usage?.ai_credits_used ?? 0} / ${fmtLimit(usage?.ai_credits_limit ?? 0)}`, sub: 'This billing period', href: '/ai' },
    { label: 'Storage', value: `${storageMb < 10 ? storageMb.toFixed(1) : Math.round(storageMb)} MB`, sub: `of ${fmtLimit(usage?.storage_limit_mb ?? 0)} MB`, href: '/media' },
  ]

  return (
    <>
      <PageHeader
        eyebrow={sp.welcome ? 'Welcome' : undefined}
        title={`Hello, ${(viewer.fullName ?? 'there').split(' ')[0]}`}
        description={website.status === 'published' ? 'Your website is live. Keep it fresh: changes go live when you publish.' : 'Finish a few details, preview, then publish your website.'}
        actions={
          <>
            {website.status === 'published' ? <a href={siteUrl(website.slug)} target="_blank" rel="noopener" className={buttonVariants({ variant: 'outline', size: 'lg' })}>View site</a> : null}
            <Link href="/editor" className={buttonVariants({ size: 'lg' })}>{website.status === 'published' ? 'Edit website' : 'Continue editing'}</Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="panel p-4 transition-colors hover:border-foreground/20">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1.5 truncate text-xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5" aria-labelledby="completion-h">
          <div className="flex items-center justify-between">
            <h2 id="completion-h" className="font-medium">Profile completion</h2>
            <span className="text-sm tabular-nums text-muted-foreground">{completion?.percent ?? 0}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion?.percent ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <div className="h-full rounded-full bg-success" style={{ width: `${completion?.percent ?? 0}%` }} />
          </div>
          <ul className="mt-5 grid gap-1">
            {items.map((i) => {
              const fix = i.key === 'seo' ? { href: '/seo', ai: true } : FIX[i.key]
              return (
                <li key={i.key} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
                  <span className="flex items-center gap-2.5">
                    {i.done ? <Check className="size-4 text-success" aria-label="Done" /> : <Circle className="size-4 text-muted-foreground/60" aria-label="To do" />}
                    <span className={cn(i.done && 'text-muted-foreground')}>{i.label}</span>
                  </span>
                  {!i.done && fix ? (
                    <Link href={fix.href} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                      {fix.ai ? <><Sparkles className="size-3" /> Write with AI</> : <>Add <ArrowRight className="size-3" /></>}
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="panel p-5" aria-labelledby="next-h">
          <h2 id="next-h" className="font-medium">Next steps</h2>
          <ol className="mt-4 grid gap-4 text-sm">
            <li><Link href="/import" className="font-medium hover:underline">Import your CV</Link><p className="text-muted-foreground">Fill experience, education and skills in one go. You review before saving.</p></li>
            <li><Link href="/editor?tab=design" className="font-medium hover:underline">Make it yours</Link><p className="text-muted-foreground">Colours, fonts and section order.</p></li>
            <li><Link href="/editor" className="font-medium hover:underline">{website.status === 'published' ? 'Publish your changes' : 'Publish'}</Link><p className="text-muted-foreground">Go live at {website.slug}.{publicEnv.rootDomain}</p></li>
            {!hasFeature(entitlements, 'custom_domain') ? <li><Link href="/billing" className="font-medium hover:underline">Use your own domain</Link><p className="text-muted-foreground">Available on the Advanced plan.</p></li> : null}
          </ol>
        </section>
      </div>
    </>
  )
}
