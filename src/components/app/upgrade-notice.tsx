import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function UpgradeNotice({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      <Link href="/billing" className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}>See plans</Link>
    </div>
  )
}
