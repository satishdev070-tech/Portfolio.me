import type { Metadata } from 'next'
import { getPublishedSiteBySlug } from '@/lib/sites'
import { siteMetadata } from '@/lib/seo/metadata'
import { PublishedSite } from '@/components/site/published-site'

// Path-based address (/u/<slug>) for environments without wildcard DNS. Canonical stays the subdomain.
type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = await getPublishedSiteBySlug((await params).username.toLowerCase())
  return doc ? siteMetadata(doc) : { title: 'Not found', robots: { index: false } }
}

export default async function UserPage({ params }: Params) {
  return <PublishedSite doc={await getPublishedSiteBySlug((await params).username.toLowerCase())} />
}
