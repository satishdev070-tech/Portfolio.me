import { notFound } from 'next/navigation'
import { SiteRenderer } from '@/site/renderer'
import { SiteRuntime } from '@/site/runtime'
import { buildJsonLd, jsonLdString } from '@/lib/seo/schema-org'
import { canonicalUrl } from '@/lib/seo/metadata'
import type { SiteDocument } from '@/site/types'

export function PublishedSite({ doc }: { doc: SiteDocument | null }) {
  if (!doc) notFound()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(buildJsonLd(doc, canonicalUrl(doc))) }} />
      <SiteRenderer doc={doc} />
      <SiteRuntime slug={doc.website.slug} domain={doc.website.custom_domain} track />
    </>
  )
}
