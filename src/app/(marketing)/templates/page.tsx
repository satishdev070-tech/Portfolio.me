import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutTemplate } from 'lucide-react'
import { getCategories, getProfessions, getTemplates, rankTemplates } from '@/lib/catalog'
import { getViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { TemplateCard } from '@/components/marketing/template-card'
import { EmptyState } from '@/components/app/empty-state'

export const metadata: Metadata = {
  title: 'Website templates for every profession',
  description: 'Professionally designed, mobile-first templates for doctors, lawyers, academics, engineers, creators and tradespeople.',
}

type SP = { q?: string; category?: string; profession?: string; tier?: string; style?: string; layout?: string; color?: string; sort?: string; fav?: string }

const STYLES = ['classic', 'modern', 'minimal', 'editorial', 'bold', 'warm']
const LAYOUTS = [['centered', 'Single column'], ['sidebar', 'Sidebar'], ['split', 'Split hero'], ['editorial', 'Editorial']]

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const [templates, categories, professions, viewer] = await Promise.all([getTemplates(), getCategories(), getProfessions(), getViewer()])

  let favorites = new Set<string>()
  if (viewer) {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('favorites').select('template_id')
    favorites = new Set((data ?? []).map((f) => f.template_id))
  }

  const q = sp.q?.trim().toLowerCase()
  const profession = professions.find((p) => p.slug === sp.profession)
  const colors = [...new Set(templates.map((t) => t.color_family).filter(Boolean))] as string[]

  let list = templates.filter((t) =>
    (!q || [t.name, t.description, ...t.tags, ...t.professions, ...t.categories].join(' ').toLowerCase().includes(q)) &&
    (!sp.category || t.categories.includes(sp.category)) &&
    (!sp.tier || t.tier === sp.tier) &&
    (!sp.style || t.style === sp.style) &&
    (!sp.layout || t.layout === sp.layout) &&
    (!sp.color || t.color_family === sp.color) &&
    (!sp.fav || favorites.has(t.id)) &&
    // A profession filter keeps exact matches and category-compatible templates.
    (!profession || t.professions.includes(profession.slug) || t.categories.includes(categories.find((c) => c.id === profession.category_id)?.slug ?? '')),
  )
  if (sp.sort === 'popular') list = [...list].sort((a, b) => b.use_count - a.use_count)
  else if (sp.sort === 'new') list = [...list].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
  else if (profession) list = rankTemplates(list, profession.slug, categories.find((c) => c.id === profession.category_id)?.slug)

  const featured = !Object.values(sp).some(Boolean) ? templates.filter((t) => t.is_featured).slice(0, 3) : []
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug
  const select = 'h-9 rounded-lg border bg-card px-2.5 text-sm'

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-12 sm:px-6">
      <p className="eyebrow">Template marketplace</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Designed for your profession</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every template is a complete, responsive, print-ready website. Switch any time. Your content stays.
      </p>

      <form className="mt-8 flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3" role="search" aria-label="Filter templates">
        <input name="q" defaultValue={sp.q} placeholder="Search templates…" aria-label="Search" className="h-9 min-w-48 flex-1 rounded-lg border bg-background px-3 text-sm" />
        <select name="profession" defaultValue={sp.profession ?? ''} aria-label="Profession" className={select}>
          <option value="">Any profession</option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {professions.filter((p) => p.category_id === c.id).map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
            </optgroup>
          ))}
        </select>
        <select name="category" defaultValue={sp.category ?? ''} aria-label="Category" className={select}>
          <option value="">Any category</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="style" defaultValue={sp.style ?? ''} aria-label="Style" className={select}>
          <option value="">Any style</option>
          {STYLES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select name="layout" defaultValue={sp.layout ?? ''} aria-label="Layout" className={select}>
          <option value="">Any layout</option>
          {LAYOUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="color" defaultValue={sp.color ?? ''} aria-label="Color" className={select}>
          <option value="">Any colour</option>
          {colors.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select name="tier" defaultValue={sp.tier ?? ''} aria-label="Price" className={select}>
          <option value="">Free & premium</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? ''} aria-label="Sort" className={select}>
          <option value="">Featured</option>
          <option value="popular">Popular</option>
          <option value="new">New</option>
        </select>
        {viewer ? (
          <label className="flex h-9 items-center gap-2 px-2 text-sm"><input type="checkbox" name="fav" value="1" defaultChecked={!!sp.fav} /> Favorites</label>
        ) : null}
        <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Apply</button>
        {Object.values(sp).some(Boolean) ? <Link href="/templates" className="h-9 px-2 text-sm leading-9 text-muted-foreground hover:text-foreground">Clear</Link> : null}
      </form>

      {featured.length ? (
        <section className="mt-12" aria-labelledby="featured-h">
          <h2 id="featured-h" className="text-lg font-semibold">Featured</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => <TemplateCard key={t.id} t={t} signedIn={!!viewer} favorite={favorites.has(t.id)} professionLabel={t.categories.map(categoryName).join(', ')} />)}
          </div>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="all-h">
        <h2 id="all-h" className="text-lg font-semibold">{featured.length ? 'All templates' : `${list.length} template${list.length === 1 ? '' : 's'}`}</h2>
        {list.length ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => <TemplateCard key={t.id} t={t} signedIn={!!viewer} favorite={favorites.has(t.id)} professionLabel={t.categories.map(categoryName).join(', ')} />)}
          </div>
        ) : (
          <div className="mt-4"><EmptyState icon={LayoutTemplate} title="No templates match" body="Try removing a filter. Every template works for any profession: sections adapt to your content." actions={<Link href="/templates" className="text-sm font-medium underline">Show all templates</Link>} /></div>
        )}
      </section>
    </div>
  )
}
