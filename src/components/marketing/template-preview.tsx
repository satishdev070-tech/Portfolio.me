import { cn } from '@/lib/utils'

/** A live, non-interactive miniature of a template demo (scaled iframe, lazy-loaded). */
export function TemplatePreview({ slug, as, className, title }: { slug: string; as?: string | null; className?: string; title: string }) {
  const src = `/demo/${slug}${as ? `?as=${as}` : ''}`
  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden bg-muted', className)}>
      <iframe
        src={src}
        title={`${title} preview`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25 border-0"
      />
    </div>
  )
}
