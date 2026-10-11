import { createServerSupabase } from '@/lib/supabase/server'
import { CategoryForm, ProfessionForm } from '@/components/admin/forms'

export default async function AdminProfessions() {
  const supabase = await createServerSupabase()
  const [{ data: cats }, { data: profs }] = await Promise.all([
    supabase.from('profession_categories').select('*').order('sort_order'),
    supabase.from('professions').select('*').order('sort_order'),
  ])
  const categories = (cats ?? []).map((c) => ({ ...c, name_i18n: c.name_i18n as Record<string, string> }))
  return (
    <div className="grid gap-8">
      <section className="panel grid gap-3 p-5"><h2 className="font-medium">Categories</h2>{categories.map((c) => <CategoryForm key={c.id} c={c} />)}<div className="border-t pt-3"><CategoryForm /></div></section>
      {categories.map((c) => (
        <section key={c.id} className="panel grid gap-3 p-5"><h2 className="font-medium">{c.name}</h2>
          {(profs ?? []).filter((p) => p.category_id === c.id).map((p) => <ProfessionForm key={p.id} p={{ ...p, name_i18n: p.name_i18n as Record<string, string> }} categories={categories} />)}
        </section>
      ))}
      <section className="panel grid gap-3 p-5"><h2 className="font-medium">Add a profession</h2><p className="text-xs text-muted-foreground">New professions appear in onboarding, the marketplace filters and profession pages immediately. No deploy needed.</p><ProfessionForm categories={categories} /></section>
    </div>
  )
}
