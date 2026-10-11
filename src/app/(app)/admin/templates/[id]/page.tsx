import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { TemplateMetaForm, VersionEditor, PublishVersionButton } from '@/components/admin/template-forms'

export default async function AdminTemplate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const [{ data: t }, { data: versions }, { data: profs }, { data: cats }, { data: tp }, { data: tc }] = await Promise.all([
    supabase.from('templates').select('*').eq('id', id).maybeSingle(),
    supabase.from('template_versions').select('id, version, status, changelog, created_at, config').eq('template_id', id).order('version', { ascending: false }),
    supabase.from('professions').select('id, name').order('name'),
    supabase.from('profession_categories').select('id, name').order('sort_order'),
    supabase.from('template_professions').select('profession_id').eq('template_id', id),
    supabase.from('template_categories').select('category_id').eq('template_id', id),
  ])
  if (!t) notFound()
  const latest = versions?.[0]
  return (
    <div className="grid gap-6">
      <Link href="/admin/templates" className="text-sm text-muted-foreground hover:text-foreground">← Templates</Link>
      <section className="panel p-5"><h2 className="mb-4 font-medium">{t.name}</h2>
        <TemplateMetaForm template={{ ...t, profession_ids: (tp ?? []).map((x) => x.profession_id), category_ids: (tc ?? []).map((x) => x.category_id) }} professions={profs ?? []} categories={cats ?? []} />
      </section>
      <section className="panel p-5">
        <h2 className="mb-3 font-medium">Versions</h2>
        <ul className="mb-5 grid gap-1.5 text-sm">
          {(versions ?? []).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
              <span>v{v.version} · <span className={v.status === 'published' ? 'text-success' : 'text-muted-foreground'}>{v.status}</span>{v.changelog ? <span className="text-muted-foreground"> · {v.changelog}</span> : null}</span>
              <span className="flex gap-3 text-xs"><a href={`/preview/template-version/${v.id}`} target="_blank" rel="noopener" className="underline">Preview</a>{v.status === 'draft' ? <PublishVersionButton id={v.id} /> : null}</span>
            </li>
          ))}
          {!versions?.length ? <li className="text-muted-foreground">No versions yet.</li> : null}
        </ul>
        <h3 className="mb-2 text-sm font-medium">New version</h3>
        <p className="mb-2 text-xs text-muted-foreground">Published versions are immutable. Sites keep the version they were published with until their owner republishes.</p>
        <VersionEditor templateId={t.id} initial={JSON.stringify(latest?.config ?? DEFAULT_CONFIG, null, 2)} />
      </section>
    </div>
  )
}

const DEFAULT_CONFIG = {
  tokens: {
    colors: { background: '#ffffff', surface: '#fafafa', text: '#18181b', muted: '#52525b', primary: '#18181b', primaryContrast: '#ffffff', accent: '#2563eb', border: '#e4e4e7' },
    typography: { heading: 'inter', body: 'inter', scale: 'default', headingWeight: 650 },
    spacing: { section: 'default', width: 'default' },
    components: { radius: 'sm', button: 'solid', card: 'flat' },
  },
  layout: { shell: 'centered', heroAlign: 'left' },
  sections: [{ type: 'hero', variant: 'default' }, { type: 'about', variant: 'default' }, { type: 'experience', variant: 'timeline' }, { type: 'contact', variant: 'default' }],
}
