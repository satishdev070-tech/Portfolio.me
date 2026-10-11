import type { Metadata } from 'next'
import { getPublishedSiteByDomain } from '@/lib/sites'
import { siteMetadata } from '@/lib/seo/metadata'
import { PublishedSite } from '@/components/site/published-site'

// Rewrite target for verified custom domains (see src/proxy.ts).
type Params = { params: Promise<{ domain: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = await getPublishedSiteByDomain(decodeURIComponent((await params).domain))
  return doc ? siteMetadata(doc) : { title: 'Not found', robots: { index: false } }
}

export default async function DomainPage({ params }: Params) {
  return <PublishedSite doc={await getPublishedSiteByDomain(decodeURIComponent((await params).domain))} />
}
