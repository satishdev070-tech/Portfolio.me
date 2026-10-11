'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { addGeneratedItems, applySeo, applyToProfile, generate } from '@/app/actions/ai'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Ctx = { name: string; profession: string; headline: string; location: string; experience_years?: number; skills: string; bio_short: string }
type Output = Record<string, unknown>

const TASKS = [
  { key: 'bio_generation', label: 'Bio', hint: 'Headline, short bio and long bio from your profile.' },
  { key: 'headline_generation', label: 'Headlines', hint: 'Five headline options to choose from.' },
  { key: 'experience_generation', label: 'Experience', hint: 'Turn rough notes about a role into a polished entry.' },
  { key: 'service_generation', label: 'Services', hint: 'Clear descriptions for what you offer.' },
  { key: 'project_generation', label: 'Project', hint: 'A portfolio entry from your notes.' },
  { key: 'seo_generation', label: 'SEO', hint: 'Title, description and keywords for search and sharing.' },
  { key: 'rewrite', label: 'Rewrite', hint: 'Change the tone or length of any text.' },
  { key: 'translation', label: 'Translate', hint: 'English ↔ Hindi.' },
] as const
type TaskKey = (typeof TASKS)[number]['key']

const TONES = [['professional', 'Professional'], ['friendly', 'Friendly'], ['executive', 'Executive'], ['academic', 'Academic'], ['simple', 'Simple'], ['short', 'Short'], ['detailed', 'Detailed']] as const

export function AIStudio({ initialTask, context, usage, enabled }: { initialTask?: string; context: Ctx; usage: { used: number; limit: number }; enabled: boolean }) {
  const router = useRouter()
  const [task, setTask] = useState<TaskKey>((TASKS.find((t) => t.key === initialTask)?.key ?? 'bio_generation') as TaskKey)
  const [tone, setTone] = useState('professional')
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const [ctx, setCtx] = useState(context)
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')
  const [text, setText] = useState(context.bio_short)
  const [output, setOutput] = useState<Output | null>(null)
  const { run, pending } = useServerAction()
  const apply = useServerAction()
  const limitText = usage.limit === -1 ? 'Unlimited' : `${usage.used} of ${usage.limit} credits used`

  const input = (): Record<string, unknown> => {
    const profile = { name: ctx.name, profession: ctx.profession, headline: ctx.headline, location: ctx.location, experience_years: ctx.experience_years, skills: ctx.skills, notes }
    switch (task) {
      case 'bio_generation': case 'headline_generation': return { ...profile, tone, language }
      case 'seo_generation': return { ...profile, language }
      case 'experience_generation': return { title, organization: org, notes, tone, language }
      case 'service_generation': return { profession: ctx.profession, services: notes, tone, language }
      case 'project_generation': return { title, notes, tone, language }
      case 'rewrite': return { text, tone, language }
      case 'translation': return { text, language }
    }
  }

  const done = (msg: string) => () => { toast.success(msg); router.refresh() }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="panel p-5">
        <div role="tablist" aria-label="AI tasks" className="flex flex-wrap gap-1.5">
          {TASKS.map((t) => (
            <button key={t.key} role="tab" aria-selected={task === t.key} onClick={() => { setTask(t.key); setOutput(null) }}
              className={cn('rounded-full border px-3 py-1 text-sm hover:border-foreground/40', task === t.key && 'border-foreground bg-foreground text-background')}>{t.label}</button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{TASKS.find((t) => t.key === task)?.hint}</p>

        <form className="mt-5 grid gap-4" onSubmit={(e) => { e.preventDefault(); setOutput(null); run(() => generate(task, input()), { onSuccess: (d) => { setOutput(d.output); router.refresh() } }) }}>
          {(task === 'bio_generation' || task === 'headline_generation' || task === 'seo_generation') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Profession" htmlFor="ai-prof"><Input id="ai-prof" value={ctx.profession} onChange={(e) => setCtx({ ...ctx, profession: e.target.value })} /></Field>
              <Field label="Location" htmlFor="ai-loc" optional><Input id="ai-loc" value={ctx.location} onChange={(e) => setCtx({ ...ctx, location: e.target.value })} /></Field>
              <Field label="Years of experience" htmlFor="ai-yrs" optional><Input id="ai-yrs" type="number" min={0} max={80} value={ctx.experience_years ?? ''} onChange={(e) => setCtx({ ...ctx, experience_years: e.target.value ? Number(e.target.value) : undefined })} /></Field>
              <Field label="Skills / specialties" htmlFor="ai-skills" optional><Input id="ai-skills" value={ctx.skills} onChange={(e) => setCtx({ ...ctx, skills: e.target.value })} /></Field>
              <Field label="Anything else to include" htmlFor="ai-notes" optional className="sm:col-span-2"><Textarea id="ai-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={6000} placeholder="Achievements, focus areas, who you help…" /></Field>
            </div>
          )}
          {(task === 'experience_generation' || task === 'project_generation') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={task === 'project_generation' ? 'Project title' : 'Role'} htmlFor="ai-title" optional><Input id="ai-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              {task === 'experience_generation' ? <Field label="Organization" htmlFor="ai-org" optional><Input id="ai-org" value={org} onChange={(e) => setOrg(e.target.value)} /></Field> : <span />}
              <Field label="Your notes" htmlFor="ai-notes2" className="sm:col-span-2" hint="Rough notes are fine. Include numbers only if they’re real."><Textarea id="ai-notes2" rows={5} required value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} /></Field>
            </div>
          )}
          {task === 'service_generation' && (
            <Field label="Your services" htmlFor="ai-svc" hint="One per line, e.g. “Root canal treatment”."><Textarea id="ai-svc" rows={5} required value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={3000} /></Field>
          )}
          {(task === 'rewrite' || task === 'translation') && (
            <Field label="Text" htmlFor="ai-text"><Textarea id="ai-text" rows={6} required value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} /></Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {task !== 'translation' && task !== 'seo_generation' ? (
              <Field label="Tone" htmlFor="ai-tone"><select id="ai-tone" value={tone} onChange={(e) => setTone(e.target.value)} className="h-8 rounded-lg border bg-transparent px-2 text-sm">{TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            ) : null}
            <Field label={task === 'translation' ? 'Translate into' : 'Language'} htmlFor="ai-lang"><select id="ai-lang" value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')} className="h-8 rounded-lg border bg-transparent px-2 text-sm"><option value="en">English</option><option value="hi">हिन्दी</option></select></Field>
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-xs text-muted-foreground">{limitText}</span>
            <Button type="submit" size="lg" disabled={pending || !enabled}><Sparkles /> {pending ? 'Writing…' : 'Generate'}</Button>
          </div>
        </form>
      </div>

      <div className="panel min-h-64 p-5" aria-live="polite">
        <h2 className="text-sm font-medium">Result</h2>
        {!output && !pending ? <p className="mt-6 text-sm text-muted-foreground">Your draft appears here. Review it, edit if needed, then use it.</p> : null}
        {pending ? <div className="mt-6 grid gap-2" aria-label="Generating">{[90, 75, 82, 60].map((w, i) => <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />)}</div> : null}
        {output ? <Result task={task} output={output} onApply={apply} done={done} /> : null}
      </div>
    </div>
  )
}

function Result({ task, output, onApply, done }: { task: TaskKey; output: Output; onApply: ReturnType<typeof useServerAction>; done: (m: string) => () => void }) {
  const [o, setO] = useState(output)
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '')
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success('Copied') }
  const block = (label: string, key: string, rows: number, applyField?: 'headline' | 'bio_short' | 'bio_long') => (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="flex gap-1">
          <button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Copy ${label}`} onClick={() => copy(s(key))}><Copy className="size-3.5" /></button>
          {applyField ? <Button size="xs" variant="outline" disabled={onApply.pending} onClick={() => onApply.run(() => applyToProfile({ [applyField]: s(key) }), { onSuccess: done(`${label} saved to your profile`) })}>Use this</Button> : null}
        </span>
      </div>
      <Textarea rows={rows} value={s(key)} onChange={(e) => setO({ ...o, [key]: e.target.value })} />
    </div>
  )

  if (task === 'bio_generation') return <div className="mt-4 grid gap-4">{block('Headline', 'headline', 1, 'headline')}{block('Short bio', 'short_bio', 3, 'bio_short')}{block('Long bio', 'long_bio', 8, 'bio_long')}</div>
  if (task === 'headline_generation') {
    return (
      <ul className="mt-4 grid gap-2">
        {((o.headlines as string[]) ?? []).map((h) => (
          <li key={h} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">{h}
            <Button size="xs" variant="outline" disabled={onApply.pending} onClick={() => onApply.run(() => applyToProfile({ headline: h }), { onSuccess: done('Headline updated') })}>Use</Button>
          </li>
        ))}
      </ul>
    )
  }
  if (task === 'experience_generation') {
    return (
      <div className="mt-4 grid gap-3 text-sm">
        <p className="font-medium">{s('title')} · {s('organization')}</p>
        {block('Description', 'description', 4)}
        <ul className="list-disc pl-5">{((o.highlights as string[]) ?? []).map((h) => <li key={h}>{h}</li>)}</ul>
        <Button size="lg" disabled={onApply.pending} onClick={() => onApply.run(() => addGeneratedItems('experience', o), { onSuccess: done('Added to Experience') })}>Add to my experience</Button>
      </div>
    )
  }
  if (task === 'service_generation') {
    const services = (o.services as { title: string; description: string }[]) ?? []
    return (
      <div className="mt-4 grid gap-3">
        {services.map((sv, i) => <div key={i} className="rounded-lg border p-3 text-sm"><p className="font-medium">{sv.title}</p><p className="mt-1 text-muted-foreground">{sv.description}</p></div>)}
        <Button size="lg" disabled={onApply.pending} onClick={() => onApply.run(() => addGeneratedItems('services', services), { onSuccess: done(`${services.length} services added`) })}>Add {services.length} service{services.length === 1 ? '' : 's'}</Button>
      </div>
    )
  }
  if (task === 'project_generation') {
    return (
      <div className="mt-4 grid gap-3 text-sm">
        <Input value={s('title')} onChange={(e) => setO({ ...o, title: e.target.value })} aria-label="Project title" />
        {block('Description', 'description', 5)}
        <Button size="lg" disabled={onApply.pending} onClick={() => onApply.run(() => addGeneratedItems('project', o), { onSuccess: done('Added to Projects') })}>Add to my projects</Button>
      </div>
    )
  }
  if (task === 'seo_generation') {
    return (
      <div className="mt-4 grid gap-3">
        {block('SEO title', 'title', 1)}{block('Meta description', 'description', 3)}{block('Social description', 'og_description', 2)}
        <p className="text-xs text-muted-foreground">Keywords: {((o.keywords as string[]) ?? []).join(', ')}</p>
        <Button size="lg" disabled={onApply.pending} onClick={() => onApply.run(() => applySeo({ title: s('title'), description: s('description'), og_description: s('og_description'), keywords: o.keywords as string[] }), { onSuccess: done('SEO settings updated') })}>Use for my website</Button>
      </div>
    )
  }
  return <div className="mt-4">{block('Text', task === 'rewrite' || task === 'translation' ? 'text' : 'summary', 8)}</div>
}
