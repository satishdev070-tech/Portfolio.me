import { redirect, notFound } from 'next/navigation'
import { getTemplate } from '@/lib/catalog'
import { getCurrentWebsite, getViewer } from '@/lib/auth'
import { ApplyTemplateForm } from '@/components/marketing/apply-template-form'

// "Use template": anonymous → signup; signed in without a site → onboarding; with a site → confirm switch.
export default async function UseTemplate({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTemplate(slug)
  if (!t) notFound()
  const viewer = await getViewer()
  if (!viewer) redirect(`/signup?template=${slug}`)
  const website = await getCurrentWebsite()
  if (!website) redirect(`/onboarding?template=${slug}`)
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Switch to {t.name}?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your content stays exactly as it is. Section layouts change to match {t.name}. Your live site doesn’t change until you publish.
      </p>
      <ApplyTemplateForm websiteId={website.id} templateSlug={t.slug} />
    </div>
  )
}
