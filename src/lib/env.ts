// Public configuration (safe for the browser). Server secrets live in src/lib/env.server.ts.
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HelloMe',
  // Sites live at <slug>.<rootDomain>. Includes the port in development (localhost:3000).
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000',
}

/** Public URL of a site on the platform subdomain. */
export function siteUrl(slug: string, path = '') {
  const protocol = publicEnv.appUrl.startsWith('https') ? 'https' : 'http'
  return `${protocol}://${slug}.${publicEnv.rootDomain}${path}`
}

/** Root domain without port, e.g. "hellome.in" or "localhost". */
export function rootHostname() {
  return publicEnv.rootDomain.split(':')[0]
}
