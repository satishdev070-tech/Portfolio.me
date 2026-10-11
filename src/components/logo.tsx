import Link from 'next/link'
import { publicEnv } from '@/lib/env'
import { cn } from '@/lib/utils'

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)} aria-label={`${publicEnv.appName} home`}>
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">h</span>
      <span>{publicEnv.appName}</span>
    </Link>
  )
}
