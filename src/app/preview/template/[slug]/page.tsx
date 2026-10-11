import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getTemplate } from '@/lib/catalog'
import { getDraftDocument } from '@/lib/preview'
import { withTemplate } from '@/site/demo'
import { SiteRenderer } from '@/site/renderer'

// "Preview with my content": the viewer's draft rendered with another template, without applying it.
export const metadata: Metadata = { title: 'Template preview', robots: { index: false, follow: false } }

export default async function TemplateWithMyContent({ params }: { params: Promise<{ slug: string }> }) {
  await requireViewer()
  const [t, website] = await Promise.all([getTemplate((await params).slug), getCurrentWebsite()])
  if (!t || !website) notFound()
  const doc = await getDraftDocument(website.id)
  return <SiteRenderer doc={withTemplate(doc, t)} preview />
}
