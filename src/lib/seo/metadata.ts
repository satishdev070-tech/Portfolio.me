import type { Metadata } from 'next'
import type { SiteDocument } from '@/site/types'
import { displayName, safeUrl } from '@/site/utils'
import { siteUrl } from '@/lib/env'

export function canonicalUrl(doc: SiteDocument) {
  return safeUrl(doc.seo.canonical_url) ?? (doc.website.custom_domain ? `https://${doc.website.custom_domain}` : siteUrl(doc.website.slug))
}

export function siteMetadata(doc: SiteDocument): Metadata {
  const p = doc.profile
  const name = displayName(p)
  const title = doc.seo.title?.trim() || [name, p.headline].filter(Boolean).join(' — ')
  const description = (doc.seo.description?.trim() || p.bio_short || p.headline || `${name}'s professional website`).slice(0, 300)
  const url = canonicalUrl(doc)
  const image = safeUrl(doc.seo.og_image_url) ?? safeUrl(p.avatar_url)
  return {
    title: { absolute: title.slice(0, 120) },
    description,
    keywords: doc.seo.keywords?.slice(0, 20),
    alternates: { canonical: url },
    robots: doc.seo.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'profile',
      url,
      title,
      description: doc.seo.og_description?.trim() || description,
      siteName: name,
      locale: doc.website.locale === 'hi' ? 'hi_IN' : 'en_IN',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
    ...(safeUrl(p.avatar_url) ? { icons: { icon: safeUrl(p.avatar_url) } } : {}),
  }
}
