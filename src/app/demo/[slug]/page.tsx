import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTemplate } from '@/lib/catalog'
import { demoDocument } from '@/site/demo'
import { SiteRenderer } from '@/site/renderer'
import { publicEnv } from '@/lib/env'

// Full-screen live demo of a template with sample content. Embedded by the marketplace.
export const metadata: Metadata = { robots: { index: false } }

export default async function TemplateDemo({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ as?: string; lang?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const t = await getTemplate(slug)
  if (!t) notFound()
  const demoKey = sp.as && /^[a-z-]+$/.test(sp.as) ? sp.as : t.demo_profile_key
  return <SiteRenderer doc={demoDocument({ template: t, demoKey, baseUrl: publicEnv.appUrl, locale: sp.lang === 'hi' ? 'hi' : 'en' })} />
}
