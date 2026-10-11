'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3, CreditCard, FileUp, Globe, Image, LayoutDashboard, LayoutTemplate, PenSquare, Search, Settings, Shield, Sparkles, UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  'layout-dashboard': LayoutDashboard, 'pen-square': PenSquare, 'user-round': UserRound, 'layout-template': LayoutTemplate, image: Image,
  sparkles: Sparkles, 'file-up': FileUp, search: Search, 'bar-chart-3': BarChart3, globe: Globe, 'credit-card': CreditCard, settings: Settings, shield: Shield,
} as const

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; group: string }

export function SidebarNav({ items, groups, onNavigate }: { items: NavItem[]; groups: Record<string, string>; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="grid gap-6">
      {Object.entries(groups).map(([group, label]) => (
        <div key={group}>
          {label ? <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p> : null}
          <ul className="grid gap-0.5">
            {items.filter((i) => i.group === group).map((item) => {
              const Icon = ICONS[item.icon]
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                    className={cn('flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent', active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground')}>
                    <Icon className="size-4 opacity-70" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
