import type { Metadata } from 'next'
import { getPublishedSiteBySlug } from '@/lib/sites'
import { siteMetadata } from '@/lib/seo/metadata'
import { PublishedSite } from '@/components/site/published-site'

// Rewrite target for <slug>.<root domain> (see src/proxy.ts).
type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = await getPublishedSiteBySlug((await params).slug)
  return doc ? siteMetadata(doc) : { title: 'Not found', robots: { index: false } }
}

export default async function SitePage({ params }: Params) {
  return <PublishedSite doc={await getPublishedSiteBySlug((await params).slug)} />
}
