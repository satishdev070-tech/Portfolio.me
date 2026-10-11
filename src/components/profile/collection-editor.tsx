'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Eye, EyeOff, FileUp, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { COLLECTIONS, type CollectionKey, type FieldDef } from '@/lib/collections'
import { createCollectionItem, deleteCollectionItem, reorderCollection, updateCollectionItem } from '@/app/actions/profile'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown> & { id: string }

function toFormValue(f: FieldDef, v: unknown): string | boolean {
  if (f.type === 'boolean') return v === true
  if (Array.isArray(v)) return v.join(f.type === 'tags' ? ', ' : '\n')
  if (f.type === 'month' && typeof v === 'string') return v.slice(0, 7)
  return v == null ? '' : String(v)
}

export function CollectionEditor({ collection, profileId, rows }: { collection: CollectionKey; profileId: string; rows: Row[] }) {
  const def = COLLECTIONS[collection]
  const router = useRouter()
  const { run, pending, fieldError } = useServerAction()
  const [editing, setEditing] = useState<string | 'new' | null>(rows.length ? null : null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})

  const open = (row?: Row) => {
    setValues(Object.fromEntries(def.fields.map((f) => [f.name, toFormValue(f, row?.[f.name])])))
    setEditing(row ? row.id : 'new')
  }
  const done = () => { setEditing(null); router.refresh() }
  const save = () =>
    editing === 'new'
      ? run(() => createCollectionItem(profileId, collection, values), { success: `${capital(def.singular)} added`, onSuccess: done })
      : run(() => updateCollectionItem(profileId, collection, editing!, values), { success: 'Saved', onSuccess: done })
  const move = (i: number, dir: -1 | 1) => {
    const ids = rows.map((r) => r.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    run(() => reorderCollection(profileId, collection, ids), { onSuccess: () => router.refresh() })
  }

  const form = (
    <form className="panel grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save() }}>
      <h3 className="font-medium sm:col-span-2">{editing === 'new' ? `Add ${def.singular}` : `Edit ${def.singular}`}</h3>
      {def.fields.map((f) => <FieldInput key={f.name} f={f} value={values[f.name]} error={fieldError(f.name)} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />)}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" size="lg" onClick={() => setEditing(null)}>Cancel</Button>
        <Button type="submit" size="lg" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  )

  if (!rows.length && editing !== 'new') {
    return (
      <EmptyState
        icon={Plus}
        title={def.empty.title}
        body={def.empty.body}
        actions={
          <>
            <Button size="lg" onClick={() => open()}><Plus /> Add {def.singular}</Button>
            <Link href="/import" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><FileUp className="size-4" /> Import from CV</Link>
            {def.aiTask ? <Link href={`/ai?task=${def.aiTask}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><Sparkles className="size-4 text-brand" /> Write with AI</Link> : null}
          </>
        }
      />
    )
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {rows.map((row, i) =>
          editing === row.id ? <li key={row.id}>{form}</li> : (
            <li key={row.id} className={cn('panel flex items-center gap-3 p-3 pl-4', row.is_visible === false && 'opacity-60')}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{String(row[def.titleField] ?? row[def.fields[0].name] ?? 'Untitled')}</p>
                <p className="truncate text-sm text-muted-foreground">{def.subtitle(row) || ' '}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0 || pending}><ArrowUp /></IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === rows.length - 1 || pending}><ArrowDown /></IconBtn>
                <IconBtn label={row.is_visible === false ? 'Show on website' : 'Hide from website'} disabled={pending}
                  onClick={() => run(() => updateCollectionItem(profileId, collection, row.id, { is_visible: row.is_visible === false }), { onSuccess: () => router.refresh() })}>
                  {row.is_visible === false ? <EyeOff /> : <Eye />}
                </IconBtn>
                <IconBtn label="Edit" onClick={() => open(row)}><Pencil /></IconBtn>
                <IconBtn label="Delete" disabled={pending} onClick={() => { if (confirm(`Delete this ${def.singular}?`)) run(() => deleteCollectionItem(profileId, collection, row.id), { success: 'Deleted', onSuccess: () => router.refresh() }) }}><Trash2 /></IconBtn>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? form : (
        <div className="flex flex-wrap gap-2">
          <Button size="lg" variant="outline" onClick={() => open()}><Plus /> Add {def.singular}</Button>
          {def.aiTask ? <Link href={`/ai?task=${def.aiTask}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft"><Sparkles className="size-4" /> Improve with AI</Link> : null}
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-label={label} title={label} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-4" {...props}>{children}</button>
}

function FieldInput({ f, value, onChange, error }: { f: FieldDef; value: string | boolean | undefined; onChange: (v: string | boolean) => void; error?: string }) {
  const id = `f-${f.name}`
  const span = f.width === 'half' ? '' : 'sm:col-span-2'
  if (f.type === 'boolean') {
    return <label className={cn('flex items-center gap-2 text-sm', span)}><input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>
  }
  const common = { id, value: typeof value === 'string' ? value : '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value), required: f.required, placeholder: f.placeholder }
  let control: React.ReactNode
  if (f.type === 'textarea' || f.type === 'lines') control = <Textarea rows={f.type === 'lines' ? 3 : 4} maxLength={f.max} {...common} />
  else if (f.type === 'select') control = (
    <select {...common} className="h-8 rounded-lg border bg-transparent px-2 text-sm">
      {!f.required ? <option value="">—</option> : <option value="" disabled>Choose…</option>}
      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
  else control = <Input type={f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : f.type === 'month' ? 'month' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} maxLength={f.max} {...common} />
  return <Field label={f.label} htmlFor={id} hint={f.hint} error={error} optional={!f.required} className={span}>{control}</Field>
}

const capital = (s: string) => s[0].toUpperCase() + s.slice(1)
