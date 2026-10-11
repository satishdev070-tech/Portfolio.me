import { createServiceSupabase } from '@/lib/supabase/admin'
import { serverEnv } from '@/lib/env.server'
import { tryRateLimit } from '@/lib/rate-limit'
import { deviceFromUA, isBot, referrerHost, sanitizePath, visitorHash } from '@/lib/analytics/ingest'

export const runtime = 'nodejs'

const EVENTS = new Set(['page_view', 'contact_click', 'cta_click', 'outbound_click'])

// Beacon endpoint for published sites. Always answers 204 so it reveals nothing to scrapers.
export async function POST(request: Request) {
  const done = () => new Response(null, { status: 204 })
  const ua = request.headers.get('user-agent')
  if (isBot(ua) || request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return done()
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || '0.0.0.0'
  if (!tryRateLimit(`track:${ip}`, 120, 60_000)) return done()

  let body: { slug?: unknown; domain?: unknown; event?: unknown; path?: unknown; referrer?: unknown }
  try {
    body = await request.json()
  } catch {
    return done()
  }
  const slug = typeof body.slug === 'string' && /^[a-z0-9-]{1,63}$/.test(body.slug) ? body.slug : null
  const domain = typeof body.domain === 'string' && /^[a-z0-9.-]{3,253}$/.test(body.domain) ? body.domain : null
  const event = typeof body.event === 'string' && EVENTS.has(body.event) ? body.event : null
  if ((!slug && !domain) || !event) return done()

  const host = request.headers.get('host')
  const country = (request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? '').toUpperCase()
  await createServiceSupabase().rpc('record_site_event', {
    p_slug: slug ?? '', p_domain: domain as string, p_event: event, p_path: sanitizePath(body.path),
    p_referrer_host: referrerHost(body.referrer, host) as string, p_device: deviceFromUA(ua!), p_country: country,
    p_visitor_hash: visitorHash(serverEnv.analyticsSalt(), domain ?? slug!, ip, ua!),
  })
  return done()
}
