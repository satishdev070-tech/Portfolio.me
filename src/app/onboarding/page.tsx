import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getCategories, getProfessions, getTemplates } from '@/lib/catalog'
import { OnboardingWizard } from '@/components/onboarding/wizard'
import { Logo } from '@/components/logo'
import { publicEnv } from '@/lib/env'

export const metadata: Metadata = { title: 'Set up your website' }

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ template?: string; profession?: string }> }) {
  const viewer = await requireViewer()
  if (await getCurrentWebsite()) redirect('/dashboard')
  const [sp, categories, professions, templates] = await Promise.all([searchParams, getCategories(), getProfessions(), getTemplates()])
  return (
    <div className="min-h-screen">
      <header className="border-b"><div className="mx-auto flex h-14 max-w-4xl items-center px-4"><Logo href="/" /></div></header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <OnboardingWizard
          appName={publicEnv.appName}
          rootDomain={publicEnv.rootDomain}
          defaultName={viewer.fullName ?? ''}
          categories={categories.map(({ id, slug, name }) => ({ id, slug, name }))}
          professions={professions.map(({ id, slug, name, category_id, synonyms }) => ({ id, slug, name, category_id, synonyms }))}
          templates={templates.map(({ id, slug, name, tier, professions, categories, demo_profile_key, description }) => ({ id, slug, name, tier, professions, categories, demo_profile_key, description }))}
          initialTemplate={sp.template}
          initialProfession={sp.profession}
        />
      </main>
    </div>
  )
}
