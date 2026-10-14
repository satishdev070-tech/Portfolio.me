// Public configuration (safe for the browser). Server secrets live in src/lib/env.server.ts.
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HelloMe',
  // Root domain of the product, including the port in development (localhost:3000).
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000',
  // How personal sites are addressed:
  //   subdomain → https://<slug>.<rootDomain>  (needs wildcard DNS + a host that accepts any subdomain)
  //   path      → <appUrl>/u/<slug>             (works on any host)
  siteUrls: (process.env.NEXT_PUBLIC_SITE_URLS === 'path' ? 'path' : 'subdomain') as 'path' | 'subdomain',
}

/** Public URL of a site on the platform address (subdomain or /u/ path, per NEXT_PUBLIC_SITE_URLS). */
export function siteUrl(slug: string, path = '') {
  if (publicEnv.siteUrls === 'path') return `${publicEnv.appUrl.replace(/\/$/, '')}/u/${slug}${path}`
  const protocol = publicEnv.appUrl.startsWith('https') ? 'https' : 'http'
  return `${protocol}://${slug}.${publicEnv.rootDomain}${path}`
}

/** Human-readable site address without the protocol, e.g. "parichaypage.in/u/asha" or "asha.hellome.in". */
export function siteAddress(slug: string) {
  return siteUrl(slug).replace(/^https?:\/\//, '')
}

/** The fixed text around the slug in an address input: { prefix, suffix }. */
export function siteAddressParts() {
  const host = publicEnv.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return publicEnv.siteUrls === 'path'
    ? { prefix: `${host}/u/`, suffix: '' }
    : { prefix: 'https://', suffix: `.${publicEnv.rootDomain}` }
}

/** Root domain without port, e.g. "hellome.in" or "localhost". */
export function rootHostname() {
  return publicEnv.rootDomain.split(':')[0]
}
