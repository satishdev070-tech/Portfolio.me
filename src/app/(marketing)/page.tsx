import Link from 'next/link'
import { ArrowRight, Check, FileUp, Globe, Palette, Sparkles } from 'lucide-react'
import { getCategories, getPlans, getProfessions, getTemplates, formatPrice } from '@/lib/catalog'
import { TemplatePreview } from '@/components/marketing/template-preview'
import { buttonVariants } from '@/components/ui/button'
import { siteAddress } from '@/lib/env'
import { cn } from '@/lib/utils'

const STEPS = [
  { icon: Sparkles, title: 'Tell us what you do', body: 'Doctor, advocate, professor, electrician, creator: pick your profession and we suggest the right sections.' },
  { icon: FileUp, title: 'Import or write', body: 'Upload your CV or LinkedIn PDF. AI drafts your bio and services; you review every line before it is saved.' },
  { icon: Palette, title: 'Choose a design', body: 'Professional templates you can tune: colours, fonts, spacing and sections. Switch any time without losing content.' },
  { icon: Globe, title: 'Publish', body: `Go live on ${siteAddress('yourname')} for free. Connect your own domain when you are ready.` },
]

export default async function Home() {
  const [templates, categories, professions, plans] = await Promise.all([getTemplates(), getCategories(), getProfessions(), getPlans()])
  const showcase = ['medical-pro', 'academic-scholar', 'skilled-professional'].map((s) => templates.find((t) => t.slug === s)).filter(Boolean) as typeof templates

  return (
    <>
      <section className="border-b">
        <div className="mx-auto max-w-(--container-content) px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <p className="eyebrow">Personal websites for professionals</p>
          <h1 className="display mt-4 max-w-4xl text-5xl sm:text-7xl">Create your professional identity once. Publish it everywhere.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            A complete website for your practice, research or trade, written with AI help and designed for your profession. Ready in minutes, free to start.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5 text-base')}>Create your website <ArrowRight /></Link>
            <Link href="/templates" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-11 px-5 text-base')}>Browse templates</Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card. Your site stays free on the Free plan.</p>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {showcase.map((t) => (
              <Link key={t.id} href={`/templates/${t.slug}`} className="group overflow-hidden rounded-xl border bg-card shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-pop)">
                <TemplatePreview slug={t.slug} as={t.demo_profile_key} title={t.name} />
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground group-hover:text-foreground">Preview →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-(--container-content) px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Built around what you do</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Each profession gets the sections that matter: clinic hours for doctors, publications for academics, service areas and WhatsApp for tradespeople.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((c) => (
              <div key={c.id}>
                <h3 className="text-sm font-medium">{c.name}</h3>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {professions.filter((p) => p.category_id === c.id).slice(0, 4).map((p) => (
                    <li key={p.id}><Link href={`/profession/${p.slug}`} className="hover:text-foreground">{p.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-(--container-content) px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">From nothing to published in four steps</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full border text-sm font-medium tabular-nums">{i + 1}</span>
                  <s.icon className="size-4 text-brand" />
                </div>
                <h3 className="mt-4 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-(--container-content) px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Simple pricing</h2>
              <p className="mt-2 text-muted-foreground">Start free. Upgrade for premium designs and your own domain.</p>
            </div>
            <Link href="/pricing" className="text-sm font-medium underline-offset-4 hover:underline">Compare plans →</Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className={cn('rounded-xl border p-6', p.is_featured && 'border-brand/40 ring-1 ring-brand/20')}>
                <p className="font-medium">{p.name}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{formatPrice(p.price_minor, p.currency)}{p.price_minor ? <span className="text-sm font-normal text-muted-foreground"> / {p.billing_interval}</span> : null}</p>
                <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
                  {p.highlights.slice(0, 4).map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-success" />{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-(--container-content) px-4 py-20 text-center sm:px-6">
          <h2 className="display mx-auto max-w-2xl text-4xl">Your work deserves a proper home on the web.</h2>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'mt-8 h-11 px-5 text-base')}>Get started free <ArrowRight /></Link>
        </div>
      </section>
    </>
  )
}
