import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { TemplatePreview } from './template-preview'
import { FavoriteButton } from './favorite-button'
import type { TemplateSummary } from '@/lib/catalog'

const LAYOUT_LABEL: Record<string, string> = { centered: 'Single column', sidebar: 'Sidebar', split: 'Split hero', editorial: 'Editorial' }

export function TemplateCard({ t, favorite, signedIn, professionLabel }: { t: TemplateSummary; favorite?: boolean; signedIn?: boolean; professionLabel?: string }) {
  return (
    <article className="group overflow-hidden rounded-xl border bg-card shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-pop)">
      <Link href={`/templates/${t.slug}`} className="block" aria-label={`${t.name} details`}>
        <TemplatePreview slug={t.slug} as={t.demo_profile_key} title={t.name} className="border-b" />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium"><Link href={`/templates/${t.slug}`} className="hover:underline">{t.name}</Link></h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{professionLabel ?? t.categories.join(', ')} · {LAYOUT_LABEL[t.layout] ?? t.layout}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {t.tier === 'premium' ? <Badge className="bg-brand-soft text-brand">Premium</Badge> : <Badge variant="secondary">Free</Badge>}
            {signedIn ? <FavoriteButton templateId={t.id} initial={!!favorite} /> : null}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
        <div className="mt-4 flex gap-2">
          <Link href={`/templates/${t.slug}/use`} className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85">Use template</Link>
          <Link href={`/templates/${t.slug}`} className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">Preview</Link>
        </div>
      </div>
    </article>
  )
}
