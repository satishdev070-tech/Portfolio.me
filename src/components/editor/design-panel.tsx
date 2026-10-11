'use client'
import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { updateTheme } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'
import { contrastRatio, FONT_LABELS, resolveTheme } from '@/site/theme'
import { FONT_KEYS, type ColorTokens, type ThemeOverrides, type ThemeTokens } from '@/site/types'
import { cn } from '@/lib/utils'

const COLOR_FIELDS: [keyof ColorTokens, string][] = [
  ['background', 'Background'], ['surface', 'Cards / surfaces'], ['text', 'Text'], ['muted', 'Secondary text'],
  ['primary', 'Buttons'], ['primaryContrast', 'Button text'], ['accent', 'Accent'], ['border', 'Lines'],
]

// Curated palettes: quick, safe starting points (all pass AA for body text).
const PALETTES: { name: string; colors: Partial<ColorTokens> }[] = [
  { name: 'Ink', colors: { background: '#ffffff', surface: '#fafafa', text: '#18181b', muted: '#52525b', primary: '#18181b', primaryContrast: '#ffffff', accent: '#2563eb', border: '#e4e4e7' } },
  { name: 'Clinic', colors: { background: '#f7fafb', surface: '#ffffff', text: '#0f2433', muted: '#4b6475', primary: '#0f4c5c', primaryContrast: '#ffffff', accent: '#0e8a7e', border: '#d8e3e8' } },
  { name: 'Parchment', colors: { background: '#fbfbfa', surface: '#ffffff', text: '#18181b', muted: '#57534e', primary: '#18181b', primaryContrast: '#fbfbfa', accent: '#9a3412', border: '#e7e5e4' } },
  { name: 'Forest', colors: { background: '#f4f6f3', surface: '#ffffff', text: '#1a241e', muted: '#4d5c52', primary: '#1f4d3a', primaryContrast: '#ffffff', accent: '#2d6a4f', border: '#dbe3dc' } },
  { name: 'Obsidian', colors: { background: '#0e1013', surface: '#16191e', text: '#e7e9ec', muted: '#9aa3ad', primary: '#e7e9ec', primaryContrast: '#0e1013', accent: '#7cc4f4', border: '#262a31' } },
  { name: 'Terracotta', colors: { background: '#f6f2ea', surface: '#ffffff', text: '#1f1b16', muted: '#5c544a', primary: '#1f2937', primaryContrast: '#ffffff', accent: '#c2410c', border: '#e4dccd' } },
  { name: 'Royal', colors: { background: '#ffffff', surface: '#f6f8fb', text: '#111827', muted: '#4b5563', primary: '#1e3a8a', primaryContrast: '#ffffff', accent: '#b45309', border: '#e5e7eb' } },
  { name: 'Burgundy', colors: { background: '#fbfaf7', surface: '#ffffff', text: '#1c1917', muted: '#57534e', primary: '#3f1d1d', primaryContrast: '#fbfaf7', accent: '#8b2c2c', border: '#e7e1d8' } },
]

export function DesignPanel({ websiteId, base, theme, onChange }: { websiteId: string; base: ThemeTokens; theme: ThemeOverrides; onChange: () => void }) {
  const { run, pending } = useServerAction()
  const [o, setO] = useState<ThemeOverrides>(theme)
  const effective = useMemo(() => resolveTheme({ tokens: base } as never, o), [base, o])
  const dirty = JSON.stringify(o) !== JSON.stringify(theme)

  const setGroup = <K extends keyof ThemeOverrides>(group: K, patch: NonNullable<ThemeOverrides[K]>) => setO((p) => ({ ...p, [group]: { ...(p[group] ?? {}), ...patch } }))
  const textContrast = contrastRatio(effective.colors.text, effective.colors.background)
  const buttonContrast = contrastRatio(effective.colors.primaryContrast, effective.colors.primary)

  return (
    <div className="grid gap-6">
      <section>
        <h3 className="mb-2 text-sm font-medium">Palette</h3>
        <div className="grid grid-cols-4 gap-2">
          {PALETTES.map((p) => (
            <button key={p.name} type="button" onClick={() => setO((s) => ({ ...s, colors: p.colors }))} className="rounded-lg border p-1.5 text-left hover:border-foreground/40" title={p.name}>
              <span className="flex h-6 overflow-hidden rounded" aria-hidden="true">
                {[p.colors.background, p.colors.primary, p.colors.accent].map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Colours</h3>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-md border p-1.5 text-xs">
              <input type="color" value={effective.colors[key]} onChange={(e) => setGroup('colors', { [key]: e.target.value })} className="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />
              <span className="min-w-0"><span className="block truncate">{label}</span><span className="font-mono text-muted-foreground">{effective.colors[key]}</span></span>
            </label>
          ))}
        </div>
        {textContrast < 4.5 || buttonContrast < 4.5 ? (
          <p className="mt-2 flex gap-1.5 text-xs text-warning" role="status"><AlertTriangle className="size-3.5 shrink-0" />
            {textContrast < 4.5 ? `Text contrast is ${textContrast.toFixed(1)}:1; aim for at least 4.5:1 so everyone can read it.` : `Button text contrast is ${buttonContrast.toFixed(1)}:1; aim for 4.5:1.`}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Typography</h3>
        <Select label="Headings" value={effective.typography.heading} options={FONT_KEYS.map((f) => [f, FONT_LABELS[f]])} onChange={(v) => setGroup('typography', { heading: v as ThemeTokens['typography']['heading'] })} />
        <Select label="Body text" value={effective.typography.body} options={FONT_KEYS.filter((f) => f !== 'jetbrains-mono').map((f) => [f, FONT_LABELS[f]])} onChange={(v) => setGroup('typography', { body: v as ThemeTokens['typography']['body'] })} />
        <Segmented label="Text size" value={effective.typography.scale} options={[['compact', 'Small'], ['default', 'Default'], ['large', 'Large']]} onChange={(v) => setGroup('typography', { scale: v as ThemeTokens['typography']['scale'] })} />
        <Segmented label="Heading weight" value={String(effective.typography.headingWeight)} options={[['500', 'Light'], ['600', 'Medium'], ['700', 'Bold'], ['800', 'Heavy']]} onChange={(v) => setGroup('typography', { headingWeight: Number(v) })} />
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Layout & components</h3>
        <Segmented label="Page width" value={effective.spacing.width} options={[['narrow', 'Narrow'], ['default', 'Default'], ['wide', 'Wide']]} onChange={(v) => setGroup('spacing', { width: v as ThemeTokens['spacing']['width'] })} />
        <Segmented label="Section spacing" value={effective.spacing.section} options={[['compact', 'Compact'], ['default', 'Default'], ['airy', 'Airy']]} onChange={(v) => setGroup('spacing', { section: v as ThemeTokens['spacing']['section'] })} />
        <Segmented label="Corners" value={effective.components.radius} options={[['none', 'Square'], ['sm', 'Subtle'], ['md', 'Rounded'], ['lg', 'Soft']]} onChange={(v) => setGroup('components', { radius: v as ThemeTokens['components']['radius'] })} />
        <Segmented label="Buttons" value={effective.components.button} options={[['solid', 'Solid'], ['outline', 'Outline'], ['pill', 'Pill']]} onChange={(v) => setGroup('components', { button: v as ThemeTokens['components']['button'] })} />
        <Segmented label="Cards" value={effective.components.card} options={[['flat', 'Flat'], ['bordered', 'Bordered'], ['elevated', 'Shadow']]} onChange={(v) => setGroup('components', { card: v as ThemeTokens['components']['card'] })} />
      </section>

      <div className="sticky bottom-0 -mx-4 flex justify-between gap-2 border-t bg-card px-4 py-3">
        <Button variant="ghost" size="lg" disabled={pending || !Object.keys(o).length} onClick={() => { setO({}); run(() => updateTheme(websiteId, {}), { success: 'Reset to template design', onSuccess: onChange }) }}>Reset to template</Button>
        <Button size="lg" disabled={pending || !dirty} onClick={() => run(() => updateTheme(websiteId, o), { success: 'Design saved', onSuccess: onChange })}>{pending ? 'Saving…' : 'Apply design'}</Button>
      </div>
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: (readonly [string, string])[]; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg border bg-transparent px-2 text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1 text-xs">
      <span className="text-muted-foreground" id={`seg-${label}`}>{label}</span>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="grid rounded-lg border p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={cn('rounded-md px-1 py-1 text-xs text-muted-foreground', value === v && 'bg-muted font-medium text-foreground')}>{l}</button>
        ))}
      </div>
    </div>
  )
}
