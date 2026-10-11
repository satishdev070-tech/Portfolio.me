'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyImport, discardImport } from '@/app/actions/imports'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ImportData } from '@/lib/ai/tasks'

type ListKey = 'experiences' | 'education' | 'certifications' | 'awards' | 'publications' | 'projects' | 'social_links'
const PROFILE_FIELDS = [['full_name', 'Name'], ['headline', 'Headline'], ['bio_short', 'Short bio'], ['email', 'Email'], ['phone', 'Phone'], ['city', 'City'], ['website_url', 'Website'], ['languages', 'Languages']] as const
const LISTS: { key: ListKey; label: string; title: (x: Record<string, unknown>) => string; sub: (x: Record<string, unknown>) => string }[] = [
  { key: 'experiences', label: 'Experience', title: (x) => String(x.title ?? ''), sub: (x) => [x.organization, yr(x.start_date), x.is_current ? 'Present' : yr(x.end_date)].filter(Boolean).join(' · ') },
  { key: 'education', label: 'Education', title: (x) => String(x.degree || x.institution || ''), sub: (x) => [x.degree ? x.institution : null, yr(x.end_date)].filter(Boolean).join(' · ') },
  { key: 'certifications', label: 'Certifications', title: (x) => String(x.name ?? ''), sub: (x) => [x.issuer, yr(x.issued_on)].filter(Boolean).join(' · ') },
  { key: 'awards', label: 'Awards', title: (x) => String(x.title ?? ''), sub: (x) => [x.issuer, yr(x.awarded_on)].filter(Boolean).join(' · ') },
  { key: 'publications', label: 'Publications', title: (x) => String(x.title ?? ''), sub: (x) => [x.venue, yr(x.published_on)].filter(Boolean).join(' · ') },
  { key: 'projects', label: 'Projects', title: (x) => String(x.title ?? ''), sub: (x) => String(x.url ?? '') },
  { key: 'social_links', label: 'Links', title: (x) => String(x.platform ?? ''), sub: (x) => String(x.url ?? '') },
]
function yr(v: unknown) { return typeof v === 'string' ? v.slice(0, 4) : '' }

export function ImportReview({ importId, data }: { importId: string; data: ImportData }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [profile, setProfile] = useState(data.profile)
  const [fields, setFields] = useState<Set<string>>(new Set(PROFILE_FIELDS.map(([k]) => k).filter((k) => { const v = data.profile[k]; return Array.isArray(v) ? v.length > 0 : !!v })))
  const [lists, setLists] = useState(() => Object.fromEntries(LISTS.map((l) => [l.key, data[l.key] as Record<string, unknown>[]])) as Record<ListKey, Record<string, unknown>[]>)
  const [keep, setKeep] = useState(() => Object.fromEntries(LISTS.map((l) => [l.key, new Set((data[l.key] as unknown[]).map((_, i) => i))])) as Record<ListKey, Set<number>>)
  const [skills, setSkills] = useState(data.skills.join(', '))
  const [open, setOpen] = useState<string | null>(null)

  const toggle = (k: ListKey, i: number) => setKeep((s) => { const n = new Set(s[k]); if (n.has(i)) n.delete(i); else n.add(i); return { ...s, [k]: n } })
  const total = LISTS.reduce((n, l) => n + keep[l.key].size, 0) + fields.size + (skills.trim() ? 1 : 0)
  const nothing = !LISTS.some((l) => lists[l.key].length) && !data.skills.length && !Object.values(data.profile).some(Boolean)

  const save = () => {
    const payload = {
      importId,
      profileFields: [...fields] as never,
      data: {
        profile,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        ...Object.fromEntries(LISTS.map((l) => [l.key, lists[l.key].filter((_, i) => keep[l.key].has(i))])),
      } as ImportData,
    }
    run(() => applyImport(payload), { success: 'Saved to your profile', onSuccess: () => { router.push('/profile'); router.refresh() } })
  }

  if (nothing) {
    return (
      <div className="panel p-6 text-sm">
        <p className="font-medium">We couldn’t find profile details in that source.</p>
        <p className="mt-1 text-muted-foreground">Try a different file, or paste your CV as text.</p>
        <Button className="mt-4" variant="outline" size="lg" onClick={() => run(() => discardImport(importId), { onSuccess: () => router.push('/import') })}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="panel p-5" aria-labelledby="det-h">
        <h2 id="det-h" className="font-medium">Basic information</h2>
        <p className="text-xs text-muted-foreground">Ticked fields will replace what’s in your profile.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROFILE_FIELDS.map(([k, label]) => {
            const v = profile[k]
            if (Array.isArray(v) ? !v.length : !v) return null
            return (
              <label key={k} className="grid gap-1 text-sm">
                <span className="flex items-center gap-2"><input type="checkbox" checked={fields.has(k)} onChange={() => setFields((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })} />{label}</span>
                {k === 'bio_short' ? <Textarea rows={3} value={String(v)} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
                  : <Input value={Array.isArray(v) ? v.join(', ') : String(v)} onChange={(e) => setProfile({ ...profile, [k]: k === 'languages' ? e.target.value.split(',').map((x) => x.trim()) : e.target.value })} />}
              </label>
            )
          })}
        </div>
      </section>

      {data.skills.length ? (
        <section className="panel p-5"><h2 className="font-medium">Skills</h2><p className="text-xs text-muted-foreground">Comma separated. Duplicates of existing skills are skipped.</p><Textarea className="mt-3" rows={3} value={skills} onChange={(e) => setSkills(e.target.value)} /></section>
      ) : null}

      {LISTS.filter((l) => lists[l.key].length).map((l) => (
        <section key={l.key} className="panel p-5" aria-labelledby={`${l.key}-h`}>
          <h2 id={`${l.key}-h`} className="font-medium">{l.label} <span className="text-sm font-normal text-muted-foreground">({keep[l.key].size} of {lists[l.key].length} selected)</span></h2>
          <ul className="mt-3 grid gap-2">
            {lists[l.key].map((x, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" checked={keep[l.key].has(i)} onChange={() => toggle(l.key, i)} aria-label={`Keep ${l.title(x)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{l.title(x) || 'Untitled'}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.sub(x)}</p>
                  </div>
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(open === `${l.key}${i}` ? null : `${l.key}${i}`)}>{open === `${l.key}${i}` ? 'Done' : 'Edit'}</button>
                </div>
                {open === `${l.key}${i}` ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(x).filter(([k]) => k !== 'is_current').map(([k, v]) => (
                      <label key={k} className={k === 'description' ? 'grid gap-1 text-xs sm:col-span-2' : 'grid gap-1 text-xs'}>
                        <span className="text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                        {k === 'description'
                          ? <Textarea rows={3} value={String(v ?? '')} onChange={(e) => setLists((s) => ({ ...s, [l.key]: s[l.key].map((y, j) => (j === i ? { ...y, [k]: e.target.value } : y)) }))} />
                          : <Input value={String(v ?? '')} onChange={(e) => setLists((s) => ({ ...s, [l.key]: s[l.key].map((y, j) => (j === i ? { ...y, [k]: e.target.value || null } : y)) }))} />}
                      </label>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button variant="ghost" size="lg" disabled={pending} onClick={() => { if (confirm('Discard this import?')) run(() => discardImport(importId), { onSuccess: () => router.push('/import') }) }}>Discard</Button>
        <Button size="lg" disabled={pending || total === 0} onClick={save}>{pending ? 'Saving…' : `Save ${total} item${total === 1 ? '' : 's'} to profile`}</Button>
      </div>
    </div>
  )
}
