import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { TemplateMetaForm } from '@/components/admin/template-forms'

export default async function AdminTemplates() {
  const supabase = await createServerSupabase()
  const [{ data: templates }, { data: profs }, { data: cats }] = await Promise.all([
    supabase.from('templates').select('id, slug, name, tier, status, is_featured, use_count, current:template_versions!templates_current_version_fk(version)').order('created_at'),
    supabase.from('professions').select('id, name').order('name'),
    supabase.from('profession_categories').select('id, name').order('sort_order'),
  ])
  return (
    <div className="grid gap-6">
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-3 font-medium">Template</th><th className="font-medium">Tier</th><th className="font-medium">Status</th><th className="font-medium">Version</th><th className="font-medium">Sites</th></tr></thead>
          <tbody>{(templates ?? []).map((t) => (
            <tr key={t.id} className="border-t"><td className="p-3"><Link href={`/admin/templates/${t.id}`} className="font-medium hover:underline">{t.name}</Link><p className="font-mono text-xs text-muted-foreground">{t.slug}</p></td>
              <td>{t.tier}</td><td><Badge variant={t.status === 'published' ? 'default' : 'secondary'}>{t.status}</Badge>{t.is_featured ? <span className="ml-1 text-xs text-brand">featured</span> : null}</td>
              <td>{(t.current as { version: number } | null)?.version ? `v${(t.current as { version: number }).version}` : '—'}</td><td className="tabular-nums">{t.use_count}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <section className="panel p-5"><h2 className="mb-1 font-medium">New template</h2><p className="mb-4 text-xs text-muted-foreground">Create as a draft, then add a version with its configuration, preview it, and publish.</p>
        <TemplateMetaForm professions={profs ?? []} categories={cats ?? []} /></section>
    </div>
  )
}
