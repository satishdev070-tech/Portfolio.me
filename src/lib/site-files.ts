import 'server-only'
import type { SiteDocument } from '@/site/types'
import { canonicalUrl } from '@/lib/seo/metadata'

export function siteRobots(doc: SiteDocument | null) {
  if (!doc || doc.seo.noindex) return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } })
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${canonicalUrl(doc)}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain' } })
}

export function siteSitemap(doc: SiteDocument | null) {
  if (!doc) return new Response('Not found', { status: 404 })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonicalUrl(doc)}/</loc>${doc.published_at ? `<lastmod>${doc.published_at.slice(0, 10)}</lastmod>` : ''}</url></urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml' } })
}
