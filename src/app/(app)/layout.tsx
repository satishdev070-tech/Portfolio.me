import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink, LogOut } from 'lucide-react'
import { requireViewer, getCurrentWebsite, listWebsites } from '@/lib/auth'
import { getEntitlements } from '@/lib/entitlements'
import { getTranslator } from '@/i18n'
import { siteAddress, siteUrl } from '@/lib/env'
import { signOut } from '@/app/actions/auth'
import { Logo } from '@/components/logo'
import { NAV } from '@/components/shell/nav'
import { SidebarNav, type NavItem } from '@/components/shell/sidebar'
import { MobileNav } from '@/components/shell/mobile-nav'
import { SiteSwitcher } from '@/components/shell/site-switcher'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer()
  const website = await getCurrentWebsite()
  if (!website) redirect('/onboarding')
  const [sites, entitlements] = await Promise.all([listWebsites(viewer.workspaceId), getEntitlements(viewer.workspaceId)])
  const t = getTranslator(viewer.locale)

  const items: NavItem[] = NAV.map((n) => ({ href: n.href, label: t(n.key), icon: n.icon as NavItem['icon'], group: n.group }))
  if (viewer.isPlatformAdmin) items.push({ href: '/admin', label: t('nav.admin'), icon: 'shield', group: 'account' })
  const groups = { site: '', grow: 'Grow', account: 'Account' }

  const header = (
    <div className="grid gap-3">
      <Logo href="/dashboard" />
      <div className="rounded-lg border bg-card p-2.5 text-xs">
        <p className="truncate font-medium">{website.name}</p>
        <p className="mt-0.5 flex items-center justify-between text-muted-foreground">
          <span>{entitlements.plan.name} plan</span>
          <span className={website.status === 'published' ? 'text-success' : ''}>{website.status === 'published' ? '● Live' : '○ Draft'}</span>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between overflow-y-auto border-r bg-sidebar p-4 lg:flex">
        <div className="grid gap-6">
          {header}
          <SidebarNav items={items} groups={groups} />
        </div>
        <form action={signOut} className="pt-6">
          <p className="mb-2 truncate px-2.5 text-xs text-muted-foreground">{viewer.email}</p>
          <button className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><LogOut className="size-4" />{t('nav.signout')}</button>
        </form>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav items={items} groups={groups} header={header} />
            <SiteSwitcher sites={sites} currentId={website.id} />
          </div>
          {website.status === 'published' ? (
            <a href={siteUrl(website.slug)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <span className="hidden sm:inline">{siteAddress(website.slug)}</span>
              <span className="sm:hidden">View site</span>
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <Link href="/editor" className="text-sm text-muted-foreground hover:text-foreground">Not published yet →</Link>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
