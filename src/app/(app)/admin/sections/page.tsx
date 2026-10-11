import { createServerSupabase } from '@/lib/supabase/server'
import { SectionTypeToggles } from '@/components/admin/forms'

export default async function AdminSections() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('section_types').select('key, name, category, data_source, variants, is_advanced, is_active').order('sort_order')
  return (
    <div className="panel overflow-x-auto">
      <p className="p-4 text-xs text-muted-foreground">Section types map to renderer components by key. Mark a type “Advanced” to make it a paid feature; existing sites keep it in drafts but can’t publish it without the plan.</p>
      <table className="w-full min-w-[44rem] text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-3 font-medium">Section</th><th className="font-medium">Data</th><th className="font-medium">Layouts</th><th className="font-medium" /></tr></thead>
        <tbody>{(data ?? []).map((s) => (
          <tr key={s.key} className="border-t"><td className="p-3"><p className="font-medium">{s.name}</p><p className="font-mono text-xs text-muted-foreground">{s.key} · {s.category}</p></td><td className="text-xs">{s.data_source ?? 'section content'}</td><td className="text-xs">{s.variants.join(', ')}</td><td><SectionTypeToggles k={s.key} active={s.is_active} advanced={s.is_advanced} /></td></tr>
        ))}</tbody>
      </table>
    </div>
  )
}
