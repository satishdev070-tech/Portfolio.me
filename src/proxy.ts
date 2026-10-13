import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Host-based routing:
//   <root>, www.<root>, app.<root>   → the product (marketing, auth, dashboard)
//   <slug>.<root>                    → /sites/<slug>      (published site on the platform subdomain)
//   any other host                   → /domains/<host>    (verified custom domain)
// Site hosts never touch auth, so published pages stay cheap and cacheable.

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000').toLowerCase()
const APP_SUBDOMAINS = new Set(['www', 'app'])
const PROTECTED = ['/dashboard', '/editor', '/profile', '/websites', '/media', '/ai', '/import', '/seo', '/domain',
  '/analytics', '/billing', '/settings', '/onboarding', '/admin', '/preview', '/design', '/content']
const SITE_PATHS = new Set(['/', '/robots.txt', '/sitemap.xml'])

export default async function proxy(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase()
  const path = request.nextUrl.pathname

  // The hosting provider's temporary address (*.hostingersite.com) always stays attached to the site;
  // send visitors to the real domain instead of treating it as a customer domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (/\.hostingersite\.com(:\d+)?$/.test(host) && appUrl && !appUrl.includes(host)) {
    return NextResponse.redirect(new URL(`${path}${request.nextUrl.search}`, appUrl), 308)
  }

  const kind = classifyHost(host)
  if (kind.type === 'site' || kind.type === 'domain') {
    if (path.startsWith('/api/')) return NextResponse.next()
    if (!SITE_PATHS.has(path)) return new NextResponse('Not found', { status: 404 })
    const url = request.nextUrl.clone()
    const base = kind.type === 'site' ? `/sites/${kind.slug}` : `/domains/${encodeURIComponent(kind.domain)}`
    url.pathname = path === '/' ? base : `${base}${path}`
    return NextResponse.rewrite(url)
  }

  // Product host: refresh the Supabase session cookie and guard private areas.
  let response = NextResponse.next({ request })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return response
}

type HostKind = { type: 'app' } | { type: 'site'; slug: string } | { type: 'domain'; domain: string }

function classifyHost(host: string): HostKind {
  const bare = host.replace(/:\d+$/, '')
  const rootBare = ROOT.replace(/:\d+$/, '')
  if (!host || host === ROOT || bare === rootBare || bare === '127.0.0.1' || bare === '[::1]') return { type: 'app' }
  // Deployment previews (e.g. *.vercel.app) are the product, not customer domains.
  if (bare.endsWith('.vercel.app')) return { type: 'app' }
  if (bare.endsWith(`.${rootBare}`)) {
    const sub = bare.slice(0, -(rootBare.length + 1))
    if (APP_SUBDOMAINS.has(sub) || sub.includes('.')) return { type: 'app' }
    return { type: 'site', slug: sub }
  }
  return { type: 'domain', domain: bare }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
}
