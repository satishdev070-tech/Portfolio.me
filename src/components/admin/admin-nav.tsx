'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [['/admin', 'Overview'], ['/admin/users', 'Users & sites'], ['/admin/professions', 'Professions'], ['/admin/templates', 'Templates'], ['/admin/sections', 'Sections'], ['/admin/plans', 'Plans'], ['/admin/ai', 'AI'], ['/admin/domains', 'Domains'], ['/admin/audit', 'Audit log']]

export function AdminNav() {
  const path = usePathname()
  return (
    <nav aria-label="Admin" className="mt-2 flex gap-1 overflow-x-auto border-b">
      {TABS.map(([href, label]) => {
        const active = href === '/admin' ? path === href : path.startsWith(href)
        return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground', active && 'border-foreground font-medium text-foreground')}>{label}</Link>
      })}
    </nav>
  )
}
