import { createHmac } from 'node:crypto'

// Privacy-friendly analytics helpers (pure functions; unit-tested).

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|httpclient/i

export function isBot(ua: string | null) {
  return !ua || BOT.test(ua)
}

export function deviceFromUA(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  if (/mobi|iphone|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

/** Referrer reduced to its host; self-referrals and invalid URLs become null (direct). */
export function referrerHost(referrer: unknown, ownHost: string | null) {
  if (typeof referrer !== 'string' || !referrer) return null
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
    if (ownHost && host === ownHost.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '')) return null
    return host.slice(0, 255)
  } catch {
    return null
  }
}

/** A visitor id that changes every UTC day and per site, so visits can't be linked across days or sites. */
export function visitorHash(secret: string, site: string, ip: string, ua: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10)
  return createHmac('sha256', secret).update(`${day}|${site}|${ip}|${ua}`).digest('base64url').slice(0, 32)
}

export function sanitizePath(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/')) return '/'
  return path.split('?')[0].slice(0, 300)
}
