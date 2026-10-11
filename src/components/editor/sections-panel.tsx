'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronDown, Lock, Plus, Trash2 } from 'lucide-react'
import { addSection, removeSection, reorderSections, updateSection } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SectionType } from '@/lib/catalog'
import { cn } from '@/lib/utils'

export interface EditorSection { id: string; section_type: string; variant: string; is_enabled: boolean; position: number; content: Record<string, unknown> }
type Item = { title: string; subtitle?: string; description?: string; date?: string; url?: string; price?: string }

const ITEM_TYPES = new Set(['specialization', 'research', 'teaching', 'speaking', 'timeline', 'press', 'news', 'products', 'faq'])
// Where the data for collection-backed sections is edited.
const SOURCE_LINK: Record<string, string> = {
  experiences: '/profile/experiences', education: '/profile/education', skills: '/profile/skills', services: '/profile/services',
  projects: '/profile/projects', publications: '/profile/publications', awards: '/profile/awards', certifications: '/profile/certifications',
  testimonials: '/profile/testimonials', social_links: '/profile/social_links', locations: '/profile/locations', achievements: '/profile/achievements', media: '/media',
}
const VARIANT_LABEL: Record<string, string> = { default: 'Standard', split: 'Split with photo', minimal: 'Minimal', banner: 'Cover banner', columns: 'With facts', timeline: 'Timeline', list: 'List', chips: 'Chips', grouped: 'Grouped', bars: 'Bars', cards: 'Cards', grid: 'Grid', quote: 'Featured quote', stats: 'Numbers' }

export function SectionsPanel({ websiteId, sections, sectionTypes, canAdvanced, onChange }: { websiteId: string; sections: EditorSection[]; sectionTypes: SectionType[]; canAdvanced: boolean; onChange: () => void }) {
  const { run, pending } = useServerAction()
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const typeOf = (k: string) => sectionTypes.find((t) => t.key === k)
  const present = new Set(sections.map((s) => s.section_type))
  const addable = sectionTypes.filter((t) => !t.is_singleton || !present.has(t.key))

  const move = (i: number, dir: -1 | 1) => {
    const ids = sections.map((s) => s.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    run(() => reorderSections(websiteId, ids), { onSuccess: onChange })
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">Sections show your profile content. Reorder, hide, or change each section’s layout. Content lives in <Link href="/profile" className="underline">Profile</Link>.</p>
      <ul className="grid gap-1.5">
        {sections.map((s, i) => {
          const type = typeOf(s.section_type)
          const locked = type?.is_advanced && !canAdvanced
          return (
            <li key={s.id} className={cn('rounded-lg border bg-background', !s.is_enabled && 'opacity-65')}>
              <div className="flex items-center gap-1 p-1.5 pl-2.5">
                <label className="flex items-center" title={s.is_enabled ? 'Shown' : 'Hidden'}>
                  <input type="checkbox" checked={s.is_enabled} disabled={pending || s.section_type === 'hero'} aria-label={`Show ${type?.name ?? s.section_type}`}
                    onChange={(e) => run(() => updateSection(websiteId, s.id, { is_enabled: e.target.checked }), { onSuccess: onChange })} />
                </label>
                <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 text-left text-sm" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                  <span className="truncate font-medium">{type?.name ?? s.section_type}</span>
                  {locked ? <Lock className="size-3 shrink-0 text-brand" aria-label="Needs upgrade to publish" /> : null}
                  <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform', open === s.id && 'rotate-180')} />
                </button>
                <IconBtn label="Move up" disabled={i === 0 || pending} onClick={() => move(i, -1)}><ArrowUp /></IconBtn>
                <IconBtn label="Move down" disabled={i === sections.length - 1 || pending} onClick={() => move(i, 1)}><ArrowDown /></IconBtn>
              </div>
              {open === s.id ? (
                <SectionSettings websiteId={websiteId} section={s} type={type} locked={!!locked} onChange={onChange}
                  onRemove={() => run(() => removeSection(websiteId, s.id), { success: 'Section removed', onSuccess: () => { setOpen(null); onChange() } })} />
              ) : null}
            </li>
          )
        })}
      </ul>

      {adding ? (
        <div className="rounded-lg border p-2">
          <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Add a section</p>
          <ul className="grid max-h-72 gap-0.5 overflow-y-auto">
            {addable.map((t) => (
              <li key={t.key}>
                <button type="button" disabled={pending} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => run(() => addSection(websiteId, t.key), { success: `${t.name} added`, onSuccess: () => { setAdding(false); onChange() } })}>
                  <span>{t.name}</span>
                  {t.is_advanced && !canAdvanced ? <span className="flex items-center gap-1 text-xs text-brand"><Lock className="size-3" /> Basic plan</span> : null}
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="lg" onClick={() => setAdding(true)}><Plus /> Add section</Button>
      )}
    </div>
  )
}

function SectionSettings({ websiteId, section, type, locked, onChange, onRemove }: { websiteId: string; section: EditorSection; type?: SectionType; locked: boolean; onChange: () => void; onRemove: () => void }) {
  const { run, pending } = useServerAction()
  const c = section.content
  const str = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : '')
  const [heading, setHeading] = useState(str('heading'))
  const [intro, setIntro] = useState(str('intro'))
  const [extra, setExtra] = useState<Record<string, string>>({
    body: str('body'), button_label: str('button_label'), button_url: str('button_url'), booking_url: str('booking_url'), note: str('note'), message: str('message'), cta_label: str('cta_label'),
  })
  const [items, setItems] = useState<Item[]>(Array.isArray(c.items) ? (c.items as Item[]) : [])
  const isItems = ITEM_TYPES.has(section.section_type)
  const t = section.section_type

  const save = () => {
    const content: Record<string, unknown> = { heading, intro }
    if (t === 'cta') Object.assign(content, { heading, body: extra.body, button_label: extra.button_label, button_url: extra.button_url })
    if (t === 'appointments') Object.assign(content, { booking_url: extra.booking_url, note: extra.note })
    if (t === 'whatsapp') Object.assign(content, { message: extra.message })
    if (t === 'hero') Object.assign(content, { cta_label: extra.cta_label })
    if (t === 'contact') Object.assign(content, { body: extra.body })
    if (isItems) content.items = items.filter((i) => i.title?.trim())
    run(() => updateSection(websiteId, section.id, { content }), { success: 'Section saved', onSuccess: onChange })
  }
  const setX = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setExtra({ ...extra, [k]: e.target.value })

  return (
    <div className="grid gap-3 border-t p-3">
      {locked ? <p className="rounded-md bg-brand-soft p-2 text-xs">This is an advanced section. You can preview it now; publishing it needs the Basic plan. <Link href="/billing" className="font-medium underline">See plans</Link></p> : null}
      {type && type.variants.length > 1 ? (
        <Field label="Layout" htmlFor={`v-${section.id}`}>
          <select id={`v-${section.id}`} value={section.variant} disabled={pending} className="h-8 rounded-lg border bg-transparent px-2 text-sm"
            onChange={(e) => run(() => updateSection(websiteId, section.id, { variant: e.target.value }), { onSuccess: onChange })}>
            {type.variants.map((v) => <option key={v} value={v}>{VARIANT_LABEL[v] ?? v}</option>)}
          </select>
        </Field>
      ) : null}
      {t !== 'hero' && t !== 'whatsapp' ? (
        <>
          <Field label="Heading" htmlFor={`h-${section.id}`} hint="Leave empty for the default."><Input id={`h-${section.id}`} value={heading} onChange={(e) => setHeading(e.target.value)} maxLength={120} placeholder={type?.name} /></Field>
          {t !== 'cta' ? <Field label="Intro text" htmlFor={`i-${section.id}`} optional><Textarea id={`i-${section.id}`} rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={600} /></Field> : null}
        </>
      ) : null}
      {t === 'hero' ? <Field label="Main button label" htmlFor={`cta-${section.id}`} hint="Default: “Get in touch”."><Input id={`cta-${section.id}`} value={extra.cta_label} onChange={setX('cta_label')} maxLength={40} /></Field> : null}
      {t === 'cta' ? (
        <>
          <Field label="Text" htmlFor={`b-${section.id}`}><Textarea id={`b-${section.id}`} rows={2} value={extra.body} onChange={setX('body')} maxLength={600} /></Field>
          <Field label="Button label" htmlFor={`bl-${section.id}`}><Input id={`bl-${section.id}`} value={extra.button_label} onChange={setX('button_label')} maxLength={40} /></Field>
          <Field label="Button link" htmlFor={`bu-${section.id}`}><Input id={`bu-${section.id}`} type="url" placeholder="https://" value={extra.button_url} onChange={setX('button_url')} /></Field>
        </>
      ) : null}
      {t === 'appointments' ? (
        <>
          <Field label="Booking link" htmlFor={`bk-${section.id}`} optional hint="e.g. Practo, Calendly or your clinic’s booking page."><Input id={`bk-${section.id}`} type="url" placeholder="https://" value={extra.booking_url} onChange={setX('booking_url')} /></Field>
          <Field label="Note" htmlFor={`n-${section.id}`} optional><Textarea id={`n-${section.id}`} rows={2} value={extra.note} onChange={setX('note')} maxLength={600} /></Field>
        </>
      ) : null}
      {t === 'contact' ? <Field label="Message" htmlFor={`cb-${section.id}`} optional><Textarea id={`cb-${section.id}`} rows={2} value={extra.body} onChange={setX('body')} maxLength={600} /></Field> : null}
      {t === 'whatsapp' ? <Field label="Pre-filled message" htmlFor={`m-${section.id}`} optional><Input id={`m-${section.id}`} value={extra.message} onChange={setX('message')} maxLength={200} placeholder="Hello, I found you on your website…" /></Field> : null}
      {isItems ? <ItemsEditor type={t} items={items} onChange={setItems} /> : null}
      {type?.data_source && SOURCE_LINK[type.data_source] ? (
        <p className="text-xs text-muted-foreground">Content comes from your profile. <Link href={SOURCE_LINK[type.data_source]} className="font-medium text-foreground underline">Edit {type.name.toLowerCase()}</Link></p>
      ) : null}
      <div className="flex items-center justify-between">
        {t !== 'hero' ? <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /> Remove section</button> : <span />}
        <Button size="sm" disabled={pending} onClick={save}>Save</Button>
      </div>
    </div>
  )
}

function ItemsEditor({ type, items, onChange }: { type: string; items: Item[]; onChange: (items: Item[]) => void }) {
  const set = (i: number, k: keyof Item, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))
  const faq = type === 'faq'
  return (
    <div className="grid gap-2">
      <p className="field-label">{faq ? 'Questions' : 'Items'}</p>
      {items.map((it, i) => (
        <div key={i} className="grid gap-1.5 rounded-md border p-2">
          <Input aria-label={faq ? 'Question' : 'Title'} placeholder={faq ? 'Question' : 'Title'} value={it.title ?? ''} onChange={(e) => set(i, 'title', e.target.value)} maxLength={300} />
          {!faq ? <Input aria-label="Subtitle" placeholder="Subtitle / where" value={it.subtitle ?? ''} onChange={(e) => set(i, 'subtitle', e.target.value)} maxLength={300} /> : null}
          <Textarea aria-label={faq ? 'Answer' : 'Description'} placeholder={faq ? 'Answer' : 'Description'} rows={2} value={it.description ?? ''} onChange={(e) => set(i, 'description', e.target.value)} maxLength={3000} />
          {!faq ? (
            <div className="grid grid-cols-2 gap-1.5">
              <Input aria-label="Date" placeholder="Date (e.g. 2025)" value={it.date ?? ''} onChange={(e) => set(i, 'date', e.target.value)} maxLength={40} />
              <Input aria-label="Link" placeholder="https://" type="url" value={it.url ?? ''} onChange={(e) => set(i, 'url', e.target.value)} />
            </div>
          ) : null}
          {type === 'products' ? <Input aria-label="Price" placeholder="Price" value={it.price ?? ''} onChange={(e) => set(i, 'price', e.target.value)} maxLength={60} /> : null}
          <button type="button" className="justify-self-end text-xs text-muted-foreground hover:text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { title: '' }])}><Plus /> Add {faq ? 'question' : 'item'}</Button>
    </div>
  )
}

function IconBtn({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-label={label} title={label} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-3.5" {...props}>{children}</button>
}
