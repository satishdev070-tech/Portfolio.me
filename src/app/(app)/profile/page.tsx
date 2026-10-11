import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { getProfessions, getCategories } from '@/lib/catalog'
import { COLLECTIONS, COLLECTION_KEYS } from '@/lib/collections'
import { PageHeader } from '@/components/app/page-header'
import { BasicsForm } from '@/components/profile/basics-form'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  await requireViewer()
  const website = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [{ data: profile }, professions, categories, counts] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', website.profile_id).single(),
    getProfessions(),
    getCategories(),
    Promise.all(COLLECTION_KEYS.map(async (k) => {
      const { count } = await supabase.from(COLLECTIONS[k].table as 'profile_skills').select('id', { count: 'exact', head: true }).eq('profile_id', website.profile_id)
      return [k, count ?? 0] as const
    })),
  ])
  const recommended = professions.find((p) => p.id === profile?.profession_id)?.recommended_sections ?? []
  const relevant = (k: string) => recommended.some((s) => s === k || (k === 'experiences' && s === 'experience') || (k === 'achievements' && s === 'achievements') || (k === 'locations' && ['contact', 'service_areas', 'appointments'].includes(s)) || (k === 'projects' && s === 'portfolio'))

  return (
    <>
      <PageHeader title="Profile" description="Your information, entered once. Every template and section reads from here." />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className="panel p-5 sm:p-6" aria-labelledby="basics-h">
          <h2 id="basics-h" className="mb-5 font-medium">Basic information</h2>
          <BasicsForm
            profile={profile!}
            professions={professions.map((p) => ({ id: p.id, name: p.name, category: categories.find((c) => c.id === p.category_id)?.name ?? '', fields: p.profile_fields }))}
          />
        </section>
        <aside>
          <h2 className="mb-3 text-sm font-medium">Sections of your profile</h2>
          <ul className="panel divide-y">
            {counts.map(([k, n]) => (
              <li key={k}>
                <Link href={`/profile/${k}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                  <span>
                    {COLLECTIONS[k].label}
                    {relevant(k) && n === 0 ? <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">Suggested</span> : null}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground tabular-nums">{n}<ChevronRight className="size-4" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
