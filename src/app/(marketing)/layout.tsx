import Link from 'next/link'
import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'
import { getViewer } from '@/lib/auth'
import { publicEnv } from '@/lib/env'
import { cn } from '@/lib/utils'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-(--container-content) items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Main">
              <Link href="/templates" className="hover:text-foreground">Templates</Link>
              <Link href="/features" className="hover:text-foreground">Features</Link>
              <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="/about" className="hover:text-foreground">About</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {viewer ? (
              <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'hidden sm:inline-flex')}>Sign in</Link>
                <Link href="/signup" className={buttonVariants({ size: 'lg' })}>Create your site</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto grid max-w-(--container-content) gap-8 px-4 py-10 text-sm sm:grid-cols-4 sm:px-6">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-muted-foreground">Create your professional identity once. Publish it everywhere.</p>
          </div>
          <nav className="grid gap-2 text-muted-foreground" aria-label="Product">
            <Link href="/templates" className="hover:text-foreground">Templates</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/features" className="hover:text-foreground">Features</Link>
          </nav>
          <nav className="grid gap-2 text-muted-foreground" aria-label="Professions">
            <Link href="/profession/doctor" className="hover:text-foreground">For doctors</Link>
            <Link href="/profession/lawyer" className="hover:text-foreground">For lawyers</Link>
            <Link href="/profession/professor" className="hover:text-foreground">For academics</Link>
            <Link href="/profession/electrician" className="hover:text-foreground">For tradespeople</Link>
          </nav>
        </div>
        <p className="mx-auto max-w-(--container-content) px-4 pb-8 text-xs text-muted-foreground sm:px-6">© {new Date().getFullYear()} {publicEnv.appName}</p>
      </footer>
    </div>
  )
}
