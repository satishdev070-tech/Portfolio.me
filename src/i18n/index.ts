import { en, type MessageKey, type Messages } from './en'
import { hi } from './hi'

// Adding a language: add a dictionary here and to SUPPORTED_LOCALES. Nothing else changes.
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]['code']

const dictionaries: Record<Locale, Messages> = { en, hi }

export function normalizeLocale(locale: string | null | undefined): Locale {
  const base = (locale ?? 'en').split('-')[0]
  return (base in dictionaries ? base : 'en') as Locale
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

export function getTranslator(locale: string | null | undefined): Translate {
  const dict = dictionaries[normalizeLocale(locale)]
  return (key, vars) => {
    let s = dict[key] ?? en[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }
}

export function localeDir(locale: string) {
  return SUPPORTED_LOCALES.find((l) => l.code === normalizeLocale(locale))?.dir ?? 'ltr'
}

export type { MessageKey }
