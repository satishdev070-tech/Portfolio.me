import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import { getCategories, getProfessions, getSectionTypes, getTemplate } from '@/lib/catalog'
import { getCurrentWebsite, getViewer } from '@/lib/auth'
import { DevicePreview } from '@/components/device-preview'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await getTemplate((await params).slug)
  return t ? { title: `${t.name} template`, description: t.description ?? undefined } : { title: 'Template not found' }
}

export default async function TemplateDetail({ params }: Params) {
  const { slug } = await params
  const [t, sectionTypes, professions, categories, viewer] = await Promise.all([getTemplate(slug), getSectionTypes(), getProfessions(), getCategories(), getViewer()])
  if (!t) notFound()
  const website = viewer ? await getCurrentWebsite() : null
  const sectionName = (k: string) => sectionTypes.find((s) => s.key === k)?.name ?? k
  const fits = professions.filter((p) => t.professions.includes(p.slug))

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-10 sm:px-6">
      <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">← All templates</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <DevicePreview src={`/demo/${t.slug}${t.demo_profile_key ? `?as=${t.demo_profile_key}` : ''}`} title={`${t.name} live demo`} className="h-[78vh]" />
        <aside className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t.name}</h1>
              {t.tier === 'premium' ? <Badge className="bg-brand-soft text-brand">Premium</Badge> : <Badge variant="secondary">Free</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
          </div>
          <div className="grid gap-2">
            <Link href={`/templates/${t.slug}/use`} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>Use this template</Link>
            {website ? (
              <a href={`/preview/template/${t.slug}`} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>Preview with my content</a>
            ) : null}
            {t.tier === 'premium' ? <p className="text-xs text-muted-foreground">Try it free in the editor. Publishing a premium template needs the Basic plan or higher.</p> : null}
          </div>
          <dl className="grid gap-4 text-sm">
            <div><dt className="eyebrow">Best for</dt><dd className="mt-1.5">{fits.length ? fits.map((p) => p.name).join(', ') : t.categories.map((c) => categories.find((x) => x.slug === c)?.name ?? c).join(', ')}</dd></div>
            <div><dt className="eyebrow">Style</dt><dd className="mt-1.5 capitalize">{t.style} · {t.layout} layout</dd></div>
            <div><dt className="eyebrow">Sections</dt><dd className="mt-1.5 flex flex-wrap gap-1.5">{t.config.sections.map((s) => <span key={s.type} className="rounded-md border px-2 py-0.5 text-xs">{sectionName(s.type)}</span>)}</dd></div>
            <div>
              <dt className="eyebrow">Included</dt>
              <dd className="mt-1.5 grid gap-1">
                {['Mobile-first and responsive', 'Print / save as PDF CV', 'SEO metadata and structured data', 'English and हिन्दी labels', ...t.features.map((f) => f.replace('-', ' '))].map((f) => (
                  <span key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{f}</span>
                ))}
              </dd>
            </div>
            <div><dt className="eyebrow">Version</dt><dd className="mt-1.5">v{t.version} · used by {t.use_count.toLocaleString('en-IN')} {t.use_count === 1 ? 'site' : 'sites'}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
