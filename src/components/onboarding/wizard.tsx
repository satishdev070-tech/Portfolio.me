'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileUp, PenLine, Search } from 'lucide-react'
import { completeOnboarding, checkSlug } from '@/app/actions/onboarding'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { TemplatePreview } from '@/components/marketing/template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { slugify } from '@/lib/validation/schemas'
import { cn } from '@/lib/utils'

type Category = { id: string; slug: string; name: string }
type Profession = { id: string; slug: string; name: string; category_id: string; synonyms: string[] }
type Template = { id: string; slug: string; name: string; tier: string; professions: string[]; categories: string[]; demo_profile_key: string | null; description: string | null }

const STEPS = ['What you do', 'About you', 'Template', 'Address']

export function OnboardingWizard(props: {
  appName: string; addressParts: { prefix: string; suffix: string }; defaultName: string; categories: Category[]; professions: Profession[]; templates: Template[]
  initialTemplate?: string; initialProfession?: string
}) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [professionId, setProfessionId] = useState(props.professions.find((p) => p.slug === props.initialProfession)?.id ?? '')
  const [fullName, setFullName] = useState(props.defaultName)
  const [headline, setHeadline] = useState('')
  const [start, setStart] = useState<'import' | 'manual'>('import')
  const [templateSlug, setTemplateSlug] = useState(props.initialTemplate ?? '')
  const [slug, setSlug] = useState(slugify(props.defaultName))
  const [locale, setLocale] = useState<'en' | 'hi'>('en')
  // Result of the last availability check; "checking" is derived (result is for an older slug).
  const [checked, setChecked] = useState<{ slug: string; available: boolean; reason?: string } | null>(null)

  const profession = props.professions.find((p) => p.id === professionId)
  const category = props.categories.find((c) => c.id === profession?.category_id)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return props.professions
    return props.professions.filter((p) => [p.name, ...p.synonyms].some((s) => s.toLowerCase().includes(q)))
  }, [query, props.professions])

  const ranked = useMemo(() => {
    const score = (t: Template) => (profession && t.professions.includes(profession.slug) ? 4 : 0) + (category && t.categories.includes(category.slug) ? 2 : 0) + (t.tier === 'free' ? 1 : 0)
    return [...props.templates].sort((a, b) => score(b) - score(a))
  }, [props.templates, profession, category])

  // Default to the best-ranked template until the user picks one.
  const chosenTemplate = templateSlug || ranked[0]?.slug || ''

  useEffect(() => {
    if (step !== 3 || slug.length < 3) return
    const t = setTimeout(async () => {
      const r = await checkSlug(slug)
      if (r.success) setChecked({ slug, available: r.data.available, reason: r.data.reason?.split(': ').slice(1).join(': ') })
    }, 350)
    return () => clearTimeout(t)
  }, [slug, step])
  const slugState = slug.length < 3
    ? { checking: false, available: false, reason: 'At least 3 characters' }
    : checked?.slug === slug ? { checking: false, available: checked.available, reason: checked.reason } : { checking: true, available: undefined, reason: undefined }

  const canNext = [!!professionId, fullName.trim().length > 0 && headline.trim().length > 1, !!chosenTemplate, slugState.available === true][step]

  const submit = () =>
    run(() => completeOnboarding({ professionId, fullName, headline, slug, templateSlug: chosenTemplate, locale }), {
      success: 'Your website is ready to edit',
      onSuccess: () => { router.push(start === 'import' ? '/import?welcome=1' : '/editor?welcome=1'); router.refresh() },
    })

  return (
    <div>
      <ol className="mb-10 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-2', i === step ? 'font-medium text-foreground' : 'text-muted-foreground')} aria-current={i === step ? 'step' : undefined}>
            <span className={cn('grid size-6 place-items-center rounded-full border text-xs tabular-nums', i < step && 'border-success bg-success text-white', i === step && 'border-foreground')}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section aria-labelledby="s0">
          <p className="eyebrow">Welcome to {props.appName}</p>
          <h1 id="s0" className="mt-2 text-3xl font-semibold tracking-tight">What do you do?</h1>
          <p className="mt-1 text-muted-foreground">We use this to suggest sections and templates. You can change it later.</p>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus placeholder="Search: doctor, advocate, plumber, researcher…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-9 text-base" aria-label="Search professions" />
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {props.categories.map((c) => {
              const list = filtered.filter((p) => p.category_id === c.id)
              if (!list.length) return null
              return (
                <fieldset key={c.id}>
                  <legend className="eyebrow mb-2">{c.name}</legend>
                  <div className="flex flex-wrap gap-2">
                    {list.map((p) => (
                      <button key={p.id} type="button" onClick={() => setProfessionId(p.id)} aria-pressed={p.id === professionId}
                        className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-foreground/40', p.id === professionId && 'border-foreground bg-foreground text-background')}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )
            })}
            {!filtered.length ? <p className="text-sm text-muted-foreground">No match. Choose <button type="button" className="underline" onClick={() => { setQuery(''); setProfessionId(props.professions.find((p) => p.slug === 'professional')?.id ?? '') }}>Professional</button> and describe yourself in your headline.</p> : null}
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="s1" className="max-w-xl">
          <h1 id="s1" className="text-3xl font-semibold tracking-tight">About you</h1>
          <p className="mt-1 text-muted-foreground">This is the first thing visitors see. You can refine it with AI later.</p>
          <div className="mt-6 grid gap-5">
            <Field label="Full name" htmlFor="name"><Input id="name" value={fullName} onChange={(e) => { setFullName(e.target.value); if (!slug || slug === slugify(fullName)) setSlug(slugify(e.target.value)) }} className="h-10" autoComplete="name" /></Field>
            <Field label="Headline" htmlFor="headline" hint={`For example: “Consultant ${profession?.name ?? 'Cardiologist'} · Pune”`}>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-10" maxLength={160} placeholder={profession ? `${profession.name}` : ''} />
            </Field>
            <fieldset>
              <legend className="field-label mb-2">How would you like to add your details?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([['import', FileUp, 'Import my CV', 'PDF, Word, LinkedIn PDF, GitHub or a website. You review everything.'], ['manual', PenLine, 'Start manually', 'Fill in your profile section by section.']] as const).map(([key, Icon, title, body]) => (
                  <button key={key} type="button" onClick={() => setStart(key)} aria-pressed={start === key}
                    className={cn('rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/40', start === key && 'border-foreground ring-1 ring-foreground')}>
                    <Icon className="size-4 text-brand" />
                    <p className="mt-2 font-medium">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="s2">
          <h1 id="s2" className="text-3xl font-semibold tracking-tight">Choose a template</h1>
          <p className="mt-1 text-muted-foreground">Recommended for {profession?.name.toLowerCase() ?? 'you'} first. You can switch any time; your content stays.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Templates">
            {ranked.slice(0, 6).map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={chosenTemplate === t.slug} onClick={() => setTemplateSlug(t.slug)}
                className={cn('overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-(--shadow-pop)', chosenTemplate === t.slug && 'ring-2 ring-foreground')}>
                <TemplatePreview slug={t.slug} as={t.demo_profile_key} title={t.name} className="border-b" />
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">{t.name}</span>
                  {t.tier === 'premium' ? <Badge className="bg-brand-soft text-brand">Premium</Badge> : <Badge variant="secondary">Free</Badge>}
                </div>
              </button>
            ))}
          </div>
          {props.templates.find((t) => t.slug === chosenTemplate)?.tier === 'premium' ? (
            <p className="mt-4 text-sm text-muted-foreground">Premium templates are free to try. Publishing one needs the Basic plan, or switch to a free template before publishing.</p>
          ) : null}
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="s3" className="max-w-xl">
          <h1 id="s3" className="text-3xl font-semibold tracking-tight">Choose your address</h1>
          <p className="mt-1 text-muted-foreground">Your free website address. You can connect your own domain later.</p>
          <div className="mt-6 grid gap-5">
            <Field label="Website address" htmlFor="slug" error={slugState.available === false ? slugState.reason || 'Not available' : undefined}
              hint={slugState.checking ? 'Checking…' : slugState.available ? 'Available' : 'Lowercase letters, numbers and hyphens.'}>
              <div className="flex h-11 items-center overflow-hidden rounded-lg border bg-card focus-within:ring-3 focus-within:ring-ring/50">
                <span className="shrink-0 pl-3 text-sm text-muted-foreground">{props.addressParts.prefix}</span>
                <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} maxLength={30}
                  className="h-full min-w-0 flex-1 bg-transparent px-1 text-base outline-none" />
                {props.addressParts.suffix ? <span id="slug-suffix" className="pr-3 text-sm text-muted-foreground">{props.addressParts.suffix}</span> : null}
              </div>
            </Field>
            <Field label="Website language" htmlFor="lang">
              <select id="lang" value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'hi')} className="h-10 rounded-lg border bg-card px-3 text-sm">
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </Field>
          </div>
        </section>
      )}

      <div className="mt-10 flex items-center justify-between border-t pt-6">
        <Button variant="ghost" size="lg" disabled={step === 0 || pending} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 3 ? (
          <Button size="lg" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button size="lg" disabled={!canNext || pending} onClick={submit}>{pending ? 'Creating…' : 'Create my website'}</Button>
        )}
      </div>
    </div>
  )
}
