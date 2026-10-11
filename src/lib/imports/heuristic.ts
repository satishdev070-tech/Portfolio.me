import type { ImportData } from '@/lib/ai/tasks'

// Rule-based CV parsing. Used when no AI provider is configured (and as the development mock),
// so import still produces a useful, reviewable draft. AI extraction is better; this is honest
// best-effort: it finds contact details, links and lines under common section headings.

const HEADINGS: Record<string, RegExp> = {
  experience: /^(work\s+)?(experience|employment|professional experience|work history|career)\b/i,
  education: /^(education|academic (background|qualifications)|qualifications)\b/i,
  skills: /^(skills|technical skills|core competencies|expertise|key skills)\b/i,
  certifications: /^(certifications?|licen[cs]es?( (&|and) certifications?)?)\b/i,
  awards: /^(awards?|honou?rs?( (&|and) awards?)?|achievements)\b/i,
  publications: /^(publications?|papers|research papers)\b/i,
  projects: /^(projects?|selected projects|portfolio)\b/i,
  summary: /^(summary|profile|about( me)?|objective|professional summary)\b/i,
  languages: /^languages?\b/i,
}

const MONTHS: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12' }
const DATE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?((19|20)\d{2})/i
const RANGE = new RegExp(`${DATE.source}\\s*(?:-|–|—|to)\\s*(present|current|now|${DATE.source})`, 'i')

function toDate(m: RegExpMatchArray | null): string | null {
  if (!m) return null
  const year = m[3]
  const month = m[2] ? MONTHS[m[2].toLowerCase().slice(0, 4)] ?? MONTHS[m[2].toLowerCase().slice(0, 3)] ?? '01' : '01'
  return `${year}-${month}-01`
}

function parseRange(line: string) {
  const r = line.match(RANGE)
  if (!r) return null
  const start = toDate(r[0].match(DATE))
  const endText = r[0].split(/-|–|—|\bto\b/i).pop()!.trim()
  const current = /present|current|now/i.test(endText)
  return { start, end: current ? null : toDate(endText.match(DATE)), current, text: r[0] }
}

const SOCIAL: [RegExp, string][] = [
  [/linkedin\.com\/in\/[\w-]+/i, 'linkedin'], [/github\.com\/[\w-]+/i, 'github'], [/orcid\.org\/[\d-]{19}/i, 'orcid'],
  [/scholar\.google\.[a-z.]+\/citations\?[^\s]+/i, 'google_scholar'], [/(twitter|x)\.com\/\w+/i, 'x'],
  [/instagram\.com\/[\w.]+/i, 'instagram'], [/behance\.net\/[\w-]+/i, 'behance'], [/dribbble\.com\/[\w-]+/i, 'dribbble'],
]

export function heuristicExtract(text: string): ImportData {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const out: ImportData = { profile: {}, experiences: [], education: [], skills: [], certifications: [], awards: [], publications: [], projects: [], social_links: [] }

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  if (email) out.profile.email = email[0]
  const phone = text.match(/(\+?\d[\d\s()-]{8,16}\d)/)
  if (phone) out.profile.phone = phone[0].replace(/\s{2,}/g, ' ').slice(0, 32)
  for (const [re, platform] of SOCIAL) {
    const m = text.match(re)
    if (m) out.social_links.push({ platform, url: `https://${m[0].replace(/^https?:\/\//, '')}` })
  }
  const site = text.match(/https?:\/\/(?!(www\.)?(linkedin|github|orcid|twitter|x|instagram|behance|dribbble)\.)[\w.-]+\.[a-z]{2,}[^\s)]*/i)
  if (site) out.profile.website_url = site[0]

  // Name: first short line that looks like a name (2–5 capitalised words, no digits/@).
  const nameLine = lines.slice(0, 6).find((l) => /^[\p{Lu}][\p{L}.'-]+(\s+[\p{Lu}][\p{L}.'-]+){1,4}$/u.test(l) && !/@|\d/.test(l) && l.length < 60)
  if (nameLine) out.profile.full_name = nameLine
  const idx = nameLine ? lines.indexOf(nameLine) : -1
  const next = idx >= 0 ? lines[idx + 1] : undefined
  if (next && next.length < 120 && !/@|\d{5,}/.test(next) && !Object.values(HEADINGS).some((h) => h.test(next))) out.profile.headline = next

  // Split into sections by heading lines.
  const sections: Record<string, string[]> = {}
  let current: string | null = null
  for (const line of lines) {
    const key = line.length < 50 ? Object.entries(HEADINGS).find(([, re]) => re.test(line.replace(/[:|]+$/, '')))?.[0] : undefined
    if (key) { current = key; sections[key] = []; continue }
    if (current) sections[current].push(line)
  }

  if (sections.summary?.length) out.profile.bio_short = sections.summary.join(' ').slice(0, 600)
  if (sections.skills) {
    out.skills = [...new Set(sections.skills.flatMap((l) => l.split(/[,•·|;]/)).map((s) => s.replace(/^[-–*\s]+/, '').trim()).filter((s) => s.length > 1 && s.length <= 60))].slice(0, 60)
  }
  if (sections.languages) out.profile.languages = sections.languages.flatMap((l) => l.split(/[,•·|;]/)).map((s) => s.replace(/\(.*?\)/g, '').trim()).filter(Boolean).slice(0, 10)

  // Experience / education: a line with a date range starts an entry; the line(s) around it name it.
  const entries = (key: 'experience' | 'education') => {
    const block = sections[key] ?? []
    const res: { head: string; sub: string; range: ReturnType<typeof parseRange>; body: string[] }[] = []
    block.forEach((line, i) => {
      const range = parseRange(line)
      if (!range) { if (res.length) res[res.length - 1].body.push(line.replace(/^[-–•*]\s*/, '')); return }
      const inline = line.replace(range.text, '').replace(/[|,–-]\s*$/, '').trim()
      const head = inline || block[i - 1] || ''
      const sub = inline ? (block[i - 1] && !parseRange(block[i - 1]) ? block[i - 1] : '') : block[i - 2] ?? ''
      if (!inline && res.length && res[res.length - 1].body.at(-1) === head) res[res.length - 1].body.pop()
      res.push({ head, sub, range, body: [] })
    })
    return res
  }
  for (const e of entries('experience').slice(0, 30)) {
    const [title, org] = splitRole(e.head, e.sub)
    if (!title) continue
    out.experiences.push({ title, organization: org || 'Not specified', start_date: e.range?.start ?? null, end_date: e.range?.end ?? null, is_current: e.range?.current ?? false, description: e.body.join(' ').slice(0, 4000) || null })
  }
  for (const e of entries('education').slice(0, 15)) {
    const [degree, inst] = splitRole(e.head, e.sub)
    out.education.push({ institution: inst || degree || 'Not specified', degree: inst ? degree : null, start_date: e.range?.start ?? null, end_date: e.range?.end ?? null })
  }
  for (const l of sections.certifications ?? []) out.certifications.push({ name: l.replace(/^[-–•*]\s*/, '').slice(0, 200), issued_on: toDate(l.match(DATE)) })
  for (const l of sections.awards ?? []) out.awards.push({ title: l.replace(/^[-–•*]\s*/, '').slice(0, 200), awarded_on: toDate(l.match(DATE)) })
  for (const l of sections.publications ?? []) if (l.length > 15) out.publications.push({ title: l.replace(/^[-–•*\d.]+\s*/, '').slice(0, 400), published_on: toDate(l.match(DATE)) })
  for (const l of sections.projects ?? []) if (l.length > 3 && l.length < 120) out.projects.push({ title: l.replace(/^[-–•*]\s*/, '').slice(0, 200) })
  out.certifications = out.certifications.slice(0, 30)
  out.awards = out.awards.slice(0, 30)
  out.publications = out.publications.slice(0, 60)
  out.projects = out.projects.slice(0, 20)
  return out
}

/** "Senior Engineer at Acme" / "Senior Engineer, Acme" / two lines → [title, organization]. */
function splitRole(head: string, sub: string): [string, string] {
  const at = head.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i)
  if (at) return [at[1].trim(), at[2].trim()]
  const parts = head.split(/\s+[|,–-]\s+|,\s+/)
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(', ').trim()]
  return [head.trim(), sub.trim()]
}
