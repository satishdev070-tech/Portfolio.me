/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { ArrowUpRight } from 'lucide-react'
import { createPublicSupabase } from '@/lib/supabase/admin'
import { getCategories, CATALOG_TAG } from '@/lib/catalog'
import { siteUrl, publicEnv } from '@/lib/env'
import { initials } from '@/site/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'Sample websites for every profession, built with the same templates you can use.',
}

type Row = { slug: string; name: string; headline: string | null; profession: string | null; category: string | null; template: string | null; avatar_url: string | null }

const getShowcase = unstable_cache(async (): Promise<Row[]> => {
  const { data, error } = await createPublicSupabase().rpc('list_showcase_sites')
  if (error) throw error
  return (data ?? []) as Row[]
}, ['showcase'], { tags: [CATALOG_TAG, 'showcase'], revalidate: 600 })

export default async function ShowcasePage() {
  const [sites, categories] = await Promise.all([getShowcase(), getCategories()])
  const groups = categories.map((c) => ({ ...c, sites: sites.filter((s) => s.category === c.slug) })).filter((g) => g.sites.length)

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-14 sm:px-6">
      <p className="eyebrow">Showcase</p>
      <h1 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">See what professionals build with {publicEnv.appName}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Sample websites for every kind of work, made with the same templates and sections you get. The people and details are fictional.
      </p>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
        {groups.map((g) => <a key={g.id} href={`#${g.slug}`} className="rounded-full border px-3 py-1 text-sm hover:border-foreground/40">{g.name}</a>)}
      </nav>

      {groups.length ? groups.map((g) => (
        <section key={g.id} id={g.slug} className="mt-14 scroll-mt-20" aria-labelledby={`${g.slug}-h`}>
          <h2 id={`${g.slug}-h`} className="text-xl font-semibold tracking-tight">{g.name}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {g.sites.map((s) => (
              <li key={s.slug}>
                <a href={siteUrl(s.slug)} target="_blank" rel="noopener" className="group flex h-full flex-col rounded-xl border bg-card p-4 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-pop)">
                  {s.avatar_url
                    ? <img src={s.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                    : <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-brand-soft font-display text-lg text-brand">{initials(s.name)}</span>}
                  <p className="mt-3 font-medium leading-snug">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.headline}</p>
                  <p className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <span>{s.profession} · {s.template}</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )) : <p className="mt-10 text-muted-foreground">Showcase sites are on their way.</p>}

      <div className="mt-16 rounded-xl border bg-card p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Make yours in minutes</h2>
        <p className="mt-2 text-muted-foreground">Pick your profession, import your CV, publish. Free to start.</p>
        <Link href="/signup" className={`${buttonVariants({ size: 'lg' })} mt-5`}>Create your website</Link>
      </div>
    </div>
  )
}
