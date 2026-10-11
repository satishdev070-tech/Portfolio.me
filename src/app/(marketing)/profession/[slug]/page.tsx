import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getProfessions, getSectionTypes, getTemplates, rankTemplates } from '@/lib/catalog'
import { TemplateCard } from '@/components/marketing/template-card'
import { buttonVariants } from '@/components/ui/button'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = (await params).slug
  const prof = (await getProfessions()).find((x) => x.slug === slug)
  return prof ? { title: `Website builder for ${prof.name.toLowerCase()}s`, description: `Create a professional ${prof.name.toLowerCase()} website in minutes.` } : {}
}

export default async function ProfessionPage({ params }: Params) {
  const { slug } = await params
  const [professions, categories, templates, sectionTypes] = await Promise.all([getProfessions(), getCategories(), getTemplates(), getSectionTypes()])
  const p = professions.find((x) => x.slug === slug)
  if (!p) notFound()
  const category = categories.find((c) => c.id === p.category_id)
  const ranked = rankTemplates(templates, p.slug, category?.slug).slice(0, 3)
  const sectionName = (k: string) => sectionTypes.find((s) => s.key === k)?.name ?? k

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-14 sm:px-6">
      <p className="eyebrow">{category?.name}</p>
      <h1 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">A professional website for {p.name.toLowerCase()}s</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Start with the sections {p.name.toLowerCase()}s actually need: {p.recommended_sections.map(sectionName).join(', ').toLowerCase()}. Add or remove anything later.
      </p>
      <Link href={`/signup?profession=${p.slug}`} className={`${buttonVariants({ size: 'lg' })} mt-8`}>Create my {p.name.toLowerCase()} website</Link>
      <h2 className="mt-14 text-lg font-semibold">Recommended templates</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((t) => <TemplateCard key={t.id} t={t} />)}
      </div>
    </div>
  )
}
