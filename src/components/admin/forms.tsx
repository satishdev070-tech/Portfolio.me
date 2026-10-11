'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAiModel, saveCategory, savePlan, saveProfession, toggleAiProvider, updateAiRoute, updateSectionType } from '@/app/actions/admin'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const sel = 'h-8 rounded-lg border bg-transparent px-2 text-sm'
const SCHEMA_TYPES = ['Person', 'Physician', 'Dentist', 'Attorney', 'LegalService', 'EducationalOrganization', 'LocalBusiness', 'HomeAndConstructionBusiness', 'ProfessionalService', 'Organization']

type Category = { id: string; slug: string; name: string; name_i18n: Record<string, string>; icon: string | null; sort_order: number; is_active: boolean }
type Profession = { id: string; slug: string; name: string; name_i18n: Record<string, string>; category_id: string; schema_org_type: string; recommended_sections: string[]; synonyms: string[]; sort_order: number; is_active: boolean }

export function CategoryForm({ c }: { c?: Category }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ id: c?.id, slug: c?.slug ?? '', name: c?.name ?? '', name_hi: c?.name_i18n?.hi ?? '', icon: c?.icon ?? '', sort_order: c?.sort_order ?? 100, is_active: c?.is_active ?? true })
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => saveCategory(v), { success: 'Category saved', onSuccess: () => router.refresh() }) }}>
      <Input className="w-36" placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} aria-label="Slug" required />
      <Input className="w-44" placeholder="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Name" required />
      <Input className="w-36" placeholder="हिन्दी नाम" value={v.name_hi} onChange={(e) => setV({ ...v, name_hi: e.target.value })} aria-label="Hindi name" />
      <Input className="w-20" type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })} aria-label="Sort order" />
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} /> Active</label>
      <Button size="sm" disabled={pending}>{c ? 'Save' : 'Add category'}</Button>
    </form>
  )
}

export function ProfessionForm({ p, categories }: { p?: Profession; categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ id: p?.id, slug: p?.slug ?? '', name: p?.name ?? '', name_hi: p?.name_i18n?.hi ?? '', category_id: p?.category_id ?? categories[0]?.id ?? '', schema_org_type: p?.schema_org_type ?? 'Person', recommended_sections: (p?.recommended_sections ?? ['hero', 'about', 'experience', 'contact']).join(', '), synonyms: (p?.synonyms ?? []).join(', '), sort_order: p?.sort_order ?? 100, is_active: p?.is_active ?? true })
  return (
    <form className="grid gap-2 sm:grid-cols-6" onSubmit={(e) => { e.preventDefault(); run(() => saveProfession(v), { success: 'Profession saved', onSuccess: () => router.refresh() }) }}>
      <Input placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} aria-label="Slug" required />
      <Input placeholder="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Name" required />
      <Input placeholder="हिन्दी" value={v.name_hi} onChange={(e) => setV({ ...v, name_hi: e.target.value })} aria-label="Hindi name" />
      <select className={sel} value={v.category_id} onChange={(e) => setV({ ...v, category_id: e.target.value })} aria-label="Category">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select className={sel} value={v.schema_org_type} onChange={(e) => setV({ ...v, schema_org_type: e.target.value })} aria-label="schema.org type">{SCHEMA_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} /> Active</label>
      <Input className="sm:col-span-3" placeholder="Recommended sections (comma separated keys)" value={v.recommended_sections} onChange={(e) => setV({ ...v, recommended_sections: e.target.value })} aria-label="Recommended sections" />
      <Input className="sm:col-span-2" placeholder="Synonyms" value={v.synonyms} onChange={(e) => setV({ ...v, synonyms: e.target.value })} aria-label="Synonyms" />
      <Button size="sm" disabled={pending}>{p ? 'Save' : 'Add profession'}</Button>
    </form>
  )
}

export function SectionTypeToggles({ k, active, advanced }: { k: string; active: boolean; advanced: boolean }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  return (
    <span className="flex gap-4 text-xs">
      <label className="flex items-center gap-1"><input type="checkbox" disabled={pending} checked={active} onChange={(e) => run(() => updateSectionType(k, { is_active: e.target.checked }), { onSuccess: () => router.refresh() })} /> Active</label>
      <label className="flex items-center gap-1"><input type="checkbox" disabled={pending} checked={advanced} onChange={(e) => run(() => updateSectionType(k, { is_advanced: e.target.checked }), { onSuccess: () => router.refresh() })} /> Advanced (paid)</label>
    </span>
  )
}

type PlanFeature = { feature_key: string; enabled: boolean; limit_value: number | null }
export function PlanForm({ plan, features }: { plan: { id: string; name: string; description: string | null; price_minor: number; currency: string; billing_interval: string; status: string; is_featured: boolean; highlights: string[]; provider_plan_ids: Record<string, string>; is_default: boolean; features: PlanFeature[] }; features: { key: string; name: string; kind: string; unit: string | null }[] }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ id: plan.id, name: plan.name, description: plan.description ?? '', price_rupees: plan.price_minor / 100, currency: plan.currency, billing_interval: plan.billing_interval, status: plan.status, is_featured: plan.is_featured, highlights: plan.highlights.join('\n'), razorpay_plan_id: plan.provider_plan_ids.razorpay ?? '' })
  const [f, setF] = useState<PlanFeature[]>(features.map((x) => plan.features.find((p) => p.feature_key === x.key) ?? { feature_key: x.key, enabled: false, limit_value: x.kind === 'limit' ? 0 : null }))
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); run(() => savePlan({ ...v, features: f }), { success: `${v.name} saved`, onSuccess: () => router.refresh() }) }}>
      <div className="grid gap-2 sm:grid-cols-6">
        <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Plan name" />
        <Input type="number" min={0} step="1" value={v.price_rupees} onChange={(e) => setV({ ...v, price_rupees: Number(e.target.value) })} aria-label="Price (major units)" />
        <Input value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value.toUpperCase() })} maxLength={3} aria-label="Currency" />
        <select className={sel} value={v.billing_interval} onChange={(e) => setV({ ...v, billing_interval: e.target.value })} aria-label="Billing cycle"><option value="month">Monthly</option><option value="year">Yearly</option></select>
        <select className={sel} value={v.status} disabled={plan.is_default} onChange={(e) => setV({ ...v, status: e.target.value })} aria-label="Status"><option value="active">Active</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select>
        <Input placeholder="Razorpay plan id" value={v.razorpay_plan_id} onChange={(e) => setV({ ...v, razorpay_plan_id: e.target.value })} aria-label="Razorpay plan id" />
      </div>
      <Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Description" aria-label="Description" />
      <Textarea rows={4} value={v.highlights} onChange={(e) => setV({ ...v, highlights: e.target.value })} aria-label="Highlights (one per line)" />
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="font-medium">Feature</th><th className="font-medium">Enabled</th><th className="font-medium">Limit (−1 = unlimited)</th></tr></thead>
        <tbody>{features.map((x, i) => (
          <tr key={x.key} className="border-t"><td className="py-1.5">{x.name}</td>
            <td><input type="checkbox" checked={f[i].enabled} onChange={(e) => setF(f.map((y, j) => (j === i ? { ...y, enabled: e.target.checked } : y)))} aria-label={`${x.name} enabled`} /></td>
            <td>{x.kind === 'limit' ? <Input type="number" min={-1} className="h-7 w-28" value={f[i].limit_value ?? 0} onChange={(e) => setF(f.map((y, j) => (j === i ? { ...y, limit_value: Number(e.target.value) } : y)))} aria-label={`${x.name} limit`} /> : null}</td></tr>
        ))}</tbody>
      </table>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.is_featured} onChange={(e) => setV({ ...v, is_featured: e.target.checked })} /> Highlight as most popular</label>
      <Button size="lg" disabled={pending} className="justify-self-start">Save {v.name}</Button>
    </form>
  )
}

type Model = { id: string; model_key: string; display_name: string; provider: string }
export function RouteRow({ r, models }: { r: { id: string; task: string; tier: string; model_id: string; fallback_model_id: string | null; credits_cost: number; is_active: boolean }; models: Model[] }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const save = (patch: Parameters<typeof updateAiRoute>[1]) => run(() => updateAiRoute(r.id, patch), { success: 'Route updated', onSuccess: () => router.refresh() })
  return (
    <tr className="border-t">
      <td className="py-1.5 font-mono text-xs">{r.task}</td><td className="text-xs">{r.tier}</td>
      <td><select className={sel} disabled={pending} value={r.model_id} onChange={(e) => save({ model_id: e.target.value })} aria-label="Model">{models.map((m) => <option key={m.id} value={m.id}>{m.provider} · {m.model_key}</option>)}</select></td>
      <td><select className={sel} disabled={pending} value={r.fallback_model_id ?? ''} onChange={(e) => save({ fallback_model_id: e.target.value || null })} aria-label="Fallback model"><option value="">None</option>{models.map((m) => <option key={m.id} value={m.id}>{m.provider} · {m.model_key}</option>)}</select></td>
      <td><Input type="number" min={0} className="h-7 w-16" defaultValue={r.credits_cost} onBlur={(e) => Number(e.target.value) !== r.credits_cost && save({ credits_cost: Number(e.target.value) })} aria-label="Credits" /></td>
      <td><input type="checkbox" disabled={pending} checked={r.is_active} onChange={(e) => save({ is_active: e.target.checked })} aria-label="Active" /></td>
    </tr>
  )
}

export function ProviderToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  return <input type="checkbox" disabled={pending} checked={active} onChange={(e) => run(() => toggleAiProvider(id, e.target.checked), { onSuccess: () => router.refresh() })} aria-label="Provider active" />
}

export function ModelForm({ providers }: { providers: { id: string; name: string }[] }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ provider_id: providers[0]?.id ?? '', model_key: '', display_name: '', vision: false })
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); run(() => saveAiModel({ provider_id: v.provider_id, model_key: v.model_key, display_name: v.display_name, capabilities: v.vision ? ['text', 'json', 'vision'] : ['text', 'json'] }), { success: 'Model added', onSuccess: () => router.refresh() }) }}>
      <select className={sel} value={v.provider_id} onChange={(e) => setV({ ...v, provider_id: e.target.value })} aria-label="Provider">{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <Input className="w-64" placeholder="model id, e.g. meta/llama-3.3-70b-instruct" value={v.model_key} onChange={(e) => setV({ ...v, model_key: e.target.value })} aria-label="Model id" required />
      <Input className="w-48" placeholder="Display name" value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} aria-label="Display name" required />
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.vision} onChange={(e) => setV({ ...v, vision: e.target.checked })} /> Vision</label>
      <Button size="sm" disabled={pending}>Add model</Button>
    </form>
  )
}
