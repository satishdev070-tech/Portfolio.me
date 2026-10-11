'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplateVersion, publishTemplateVersion, saveTemplateMeta } from '@/app/actions/admin'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const sel = 'h-8 rounded-lg border bg-transparent px-2 text-sm'
type T = { id: string; slug: string; name: string; description: string | null; style: string; layout: string; tier: string; is_featured: boolean; status: string; color_family: string | null; demo_profile_key: string | null; preview_image_url: string | null; profession_ids: string[]; category_ids: string[] }

export function TemplateMetaForm({ template, professions, categories }: { template?: T; professions: { id: string; name: string }[]; categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ id: template?.id, slug: template?.slug ?? '', name: template?.name ?? '', description: template?.description ?? '', style: template?.style ?? 'classic', layout: template?.layout ?? 'centered', tier: template?.tier ?? 'free', is_featured: template?.is_featured ?? false, status: template?.status ?? 'draft', color_family: template?.color_family ?? '', demo_profile_key: template?.demo_profile_key ?? 'professional', preview_image_url: template?.preview_image_url ?? '', profession_ids: template?.profession_ids ?? [], category_ids: template?.category_ids ?? [] })
  const toggle = (k: 'profession_ids' | 'category_ids', id: string) => setV({ ...v, [k]: v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id] })
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); run(() => saveTemplateMeta(v), { success: 'Template saved', onSuccess: (r) => { if (!template) router.push(`/admin/templates/${r.id}`); else router.refresh() } }) }}>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} aria-label="Slug" required />
        <Input placeholder="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Name" required />
        <select className={sel} value={v.style} onChange={(e) => setV({ ...v, style: e.target.value })} aria-label="Style">{['classic', 'modern', 'minimal', 'editorial', 'bold', 'warm'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={v.layout} onChange={(e) => setV({ ...v, layout: e.target.value })} aria-label="Layout">{['centered', 'sidebar', 'split', 'editorial'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={v.tier} onChange={(e) => setV({ ...v, tier: e.target.value })} aria-label="Tier"><option value="free">Free</option><option value="premium">Premium</option></select>
        <select className={sel} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })} aria-label="Status" disabled={!template}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        <Input placeholder="Colour family" value={v.color_family} onChange={(e) => setV({ ...v, color_family: e.target.value })} aria-label="Colour family" />
        <Input placeholder="Demo profile key" value={v.demo_profile_key} onChange={(e) => setV({ ...v, demo_profile_key: e.target.value })} aria-label="Demo profile key" />
      </div>
      <Textarea rows={2} placeholder="Description" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} aria-label="Description" />
      <Input placeholder="Preview image URL (optional; live preview is used otherwise)" value={v.preview_image_url} onChange={(e) => setV({ ...v, preview_image_url: e.target.value })} aria-label="Preview image" />
      <details className="text-sm"><summary className="cursor-pointer">Categories ({v.category_ids.length}) & professions ({v.profession_ids.length})</summary>
        <div className="mt-2 flex flex-wrap gap-2">{categories.map((c) => <label key={c.id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.category_ids.includes(c.id)} onChange={() => toggle('category_ids', c.id)} />{c.name}</label>)}</div>
        <div className="mt-3 flex flex-wrap gap-2">{professions.map((p) => <label key={p.id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.profession_ids.includes(p.id)} onChange={() => toggle('profession_ids', p.id)} />{p.name}</label>)}</div>
      </details>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.is_featured} onChange={(e) => setV({ ...v, is_featured: e.target.checked })} /> Featured</label>
      <Button size="lg" disabled={pending} className="justify-self-start">{template ? 'Save template' : 'Create draft template'}</Button>
    </form>
  )
}

export function VersionEditor({ templateId, initial }: { templateId: string; initial: string }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [json, setJson] = useState(initial)
  const [changelog, setChangelog] = useState('')
  const submit = (publish: boolean) => run(() => createTemplateVersion(templateId, json, changelog, publish), { success: publish ? 'Version published' : 'Draft version saved', onSuccess: () => router.refresh() })
  return (
    <div className="grid gap-2">
      <Textarea rows={18} value={json} onChange={(e) => setJson(e.target.value)} className="font-mono text-xs" aria-label="Template configuration JSON" spellCheck={false} />
      <Input placeholder="Changelog" value={changelog} onChange={(e) => setChangelog(e.target.value)} aria-label="Changelog" />
      <div className="flex gap-2"><Button variant="outline" size="lg" disabled={pending} onClick={() => submit(false)}>Save draft version</Button><Button size="lg" disabled={pending} onClick={() => submit(true)}>Save & publish</Button></div>
    </div>
  )
}

export function PublishVersionButton({ id }: { id: string }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  return <button type="button" disabled={pending} className="font-medium text-brand underline" onClick={() => run(() => publishTemplateVersion(id), { success: 'Published', onSuccess: () => router.refresh() })}>Publish</button>
}
