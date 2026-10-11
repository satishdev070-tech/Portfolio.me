// Rendering helpers. All user content is rendered as text (React escapes it); links pass safeUrl.

/** Only http(s), mailto and tel links are rendered; anything else (javascript:, data:) is dropped. */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const u = url.trim()
  if (/^https?:\/\//i.test(u) || /^mailto:[^\s]+$/i.test(u) || /^tel:\+?[0-9 ()-]+$/i.test(u)) return u
  return undefined
}

/** YouTube / Vimeo URLs → privacy-enhanced embed URLs; anything else is not embedded. */
export function videoEmbedUrl(url: string): string | undefined {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,15})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d{5,12})/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`
  return undefined
}

export function formatMonthYear(date: string | null | undefined, locale: string) {
  if (!date) return ''
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
}

export function formatYear(date: string | null | undefined) {
  return date ? date.slice(0, 4) : ''
}

export function dateRange(start: string | null, end: string | null, current: boolean, locale: string, presentLabel: string, yearOnly = false) {
  const f = (d: string | null) => (yearOnly ? formatYear(d) : formatMonthYear(d, locale))
  const s = f(start)
  const e = current ? presentLabel : f(end)
  if (!s && !e) return ''
  if (!s) return e
  if (!e || s === e) return s
  return `${s} – ${e}`
}

export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return []
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export function initials(name: string) {
  return name.split(/\s+/).filter((w) => /^[\p{L}]/u.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function displayName(p: { full_name: string; display_name: string | null }) {
  return p.display_name?.trim() || p.full_name
}

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/[^0-9]/g, '')
  const q = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${q}`
}

export function locationLine(p: { city: string | null; region: string | null; country_code?: string | null }) {
  return [p.city, p.region].filter(Boolean).join(', ')
}

export const SOCIAL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', github: 'GitHub', x: 'X', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube',
  tiktok: 'TikTok', medium: 'Medium', behance: 'Behance', dribbble: 'Dribbble', orcid: 'ORCID',
  google_scholar: 'Google Scholar', researchgate: 'ResearchGate', stackoverflow: 'Stack Overflow', telegram: 'Telegram',
  whatsapp: 'WhatsApp', threads: 'Threads', website: 'Website', other: 'Link',
}

/** Section-local list items (research, teaching, FAQ, press…). Untrusted JSON → typed, bounded. */
export interface ContentItem {
  title: string
  subtitle?: string
  description?: string
  date?: string
  url?: string
  price?: string
}
export function contentItems(content: Record<string, unknown>): ContentItem[] {
  const items = Array.isArray(content.items) ? content.items : []
  return items
    .slice(0, 50)
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object' && typeof (i as Record<string, unknown>).title === 'string')
    .map((i) => ({
      title: String(i.title).slice(0, 300),
      subtitle: typeof i.subtitle === 'string' ? i.subtitle.slice(0, 300) : undefined,
      description: typeof i.description === 'string' ? i.description.slice(0, 3000) : undefined,
      date: typeof i.date === 'string' ? i.date.slice(0, 40) : undefined,
      url: typeof i.url === 'string' ? i.url : undefined,
      price: typeof i.price === 'string' ? i.price.slice(0, 60) : undefined,
    }))
}

export function contentString(content: Record<string, unknown>, key: string, max = 500): string | undefined {
  const v = content[key]
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined
}
