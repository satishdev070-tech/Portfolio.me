import { FONT_KEYS, type FontKey, type TemplateConfig, type ThemeOverrides, type ThemeTokens } from './types'

// Theme resolution: template tokens ⊕ user overrides → validated tokens → CSS custom properties.
// Overrides are user-writable JSON, so every value is checked against an allowlist; anything
// unexpected falls back to the template value (no CSS injection through theme JSON).

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
const color = (value: unknown, fallback: string) => (typeof value === 'string' && HEX.test(value) ? value : fallback)

export const DEFAULT_TOKENS: ThemeTokens = {
  colors: {
    background: '#ffffff', surface: '#fafafa', text: '#18181b', muted: '#52525b', primary: '#18181b',
    primaryContrast: '#ffffff', accent: '#2563eb', border: '#e4e4e7',
  },
  typography: { heading: 'inter', body: 'inter', scale: 'default', headingWeight: 650 },
  spacing: { section: 'default', width: 'default' },
  components: { radius: 'sm', button: 'solid', card: 'flat' },
}

export function resolveTheme(config: Partial<TemplateConfig> | null | undefined, overrides: ThemeOverrides | null | undefined): ThemeTokens {
  const base = mergeTokens(DEFAULT_TOKENS, config?.tokens)
  return mergeTokens(base, overrides ?? undefined)
}

function mergeTokens(base: ThemeTokens, o: Partial<ThemeOverrides> | Partial<ThemeTokens> | undefined): ThemeTokens {
  if (!o || typeof o !== 'object') return base
  const c = (o.colors ?? {}) as Record<string, unknown>
  const t = (o.typography ?? {}) as Record<string, unknown>
  const s = (o.spacing ?? {}) as Record<string, unknown>
  const k = (o.components ?? {}) as Record<string, unknown>
  const weight = Number(t.headingWeight)
  return {
    colors: {
      background: color(c.background, base.colors.background),
      surface: color(c.surface, base.colors.surface),
      text: color(c.text, base.colors.text),
      muted: color(c.muted, base.colors.muted),
      primary: color(c.primary, base.colors.primary),
      primaryContrast: color(c.primaryContrast, base.colors.primaryContrast),
      accent: color(c.accent, base.colors.accent),
      border: color(c.border, base.colors.border),
    },
    typography: {
      heading: pick<FontKey>(t.heading, FONT_KEYS, base.typography.heading),
      body: pick<FontKey>(t.body, FONT_KEYS, base.typography.body),
      mono: t.mono === undefined ? base.typography.mono : pick<FontKey>(t.mono, FONT_KEYS, base.typography.mono ?? 'jetbrains-mono'),
      scale: pick(t.scale, ['compact', 'default', 'large'] as const, base.typography.scale),
      headingWeight: Number.isFinite(weight) && weight >= 300 && weight <= 900 ? Math.round(weight / 50) * 50 : base.typography.headingWeight,
    },
    spacing: {
      section: pick(s.section, ['compact', 'default', 'airy'] as const, base.spacing.section),
      width: pick(s.width, ['narrow', 'default', 'wide'] as const, base.spacing.width),
    },
    components: {
      radius: pick(k.radius, ['none', 'sm', 'md', 'lg'] as const, base.components.radius),
      button: pick(k.button, ['solid', 'outline', 'pill'] as const, base.components.button),
      card: pick(k.card, ['flat', 'bordered', 'elevated'] as const, base.components.card),
    },
  }
}

const FONT_STACK: Record<FontKey, string> = {
  inter: 'var(--font-inter), var(--font-devanagari-sans), system-ui, sans-serif',
  'dm-sans': 'var(--font-dm-sans), var(--font-devanagari-sans), system-ui, sans-serif',
  'ibm-plex-sans': 'var(--font-ibm-plex-sans), var(--font-devanagari-sans), system-ui, sans-serif',
  'space-grotesk': 'var(--font-space-grotesk), var(--font-devanagari-sans), system-ui, sans-serif',
  'source-serif': 'var(--font-source-serif), var(--font-devanagari-serif), Georgia, serif',
  lora: 'var(--font-lora), var(--font-devanagari-serif), Georgia, serif',
  fraunces: 'var(--font-fraunces), var(--font-devanagari-serif), Georgia, serif',
  playfair: 'var(--font-playfair), var(--font-devanagari-serif), Georgia, serif',
  'jetbrains-mono': 'var(--font-jetbrains-mono), ui-monospace, monospace',
}

export const FONT_LABELS: Record<FontKey, string> = {
  inter: 'Inter', 'dm-sans': 'DM Sans', 'ibm-plex-sans': 'IBM Plex Sans', 'space-grotesk': 'Space Grotesk',
  'source-serif': 'Source Serif', lora: 'Lora', fraunces: 'Fraunces', playfair: 'Playfair Display',
  'jetbrains-mono': 'JetBrains Mono',
}

const RADIUS = { none: '0px', sm: '4px', md: '8px', lg: '14px' }
const SECTION_PAD = { compact: '2.75rem', default: '4rem', airy: '5.5rem' }
const WIDTH = { narrow: '44rem', default: '60rem', wide: '72rem' }
const SCALE = { compact: '0.94', default: '1', large: '1.08' }

/** CSS custom properties consumed by src/site/site.css. */
export function themeToCssVars(t: ThemeTokens): Record<string, string> {
  return {
    '--hm-bg': t.colors.background,
    '--hm-surface': t.colors.surface,
    '--hm-text': t.colors.text,
    '--hm-muted': t.colors.muted,
    '--hm-primary': t.colors.primary,
    '--hm-primary-contrast': t.colors.primaryContrast,
    '--hm-accent': t.colors.accent,
    '--hm-border': t.colors.border,
    '--hm-font-heading': FONT_STACK[t.typography.heading],
    '--hm-font-body': FONT_STACK[t.typography.body],
    '--hm-font-mono': FONT_STACK[t.typography.mono ?? 'jetbrains-mono'],
    '--hm-heading-weight': String(t.typography.headingWeight),
    '--hm-scale': SCALE[t.typography.scale],
    '--hm-radius': RADIUS[t.components.radius],
    '--hm-section-pad': SECTION_PAD[t.spacing.section],
    '--hm-width': WIDTH[t.spacing.width],
  }
}

/** Relative luminance contrast ratio, used by the design editor to warn about unreadable pairs. */
export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const v = parseInt(full.slice(i, i + 2), 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
