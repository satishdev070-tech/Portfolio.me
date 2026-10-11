import { heuristicExtract } from '@/lib/imports/heuristic'
import type { AIProvider, CompletionRequest, CompletionResult } from '../types'

// Development-only provider (AI_ALLOW_MOCK=true, never in production). Produces deterministic,
// clearly-templated output from the request so the full pipeline (credits, review, save) can be
// exercised without provider keys. Extraction uses the rule-based CV parser.
export class MockProvider implements AIProvider {
  readonly slug = 'mock'

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const user = req.messages.find((m) => m.role === 'user')
    const prompt = typeof user?.content === 'string' ? user.content : ''
    const json = (o: unknown) => ({ text: JSON.stringify(o), inputTokens: Math.ceil(prompt.length / 4), outputTokens: 120, raw: { mock: true } })
    const profile = safeJson(prompt.split('PROFILE:\n')[1])
    const name = String(profile?.name ?? 'This professional')
    const prof = String(profile?.profession ?? 'professional').toLowerCase()
    const where = profile?.location ? ` based in ${profile.location}` : ''
    const skills = String(profile?.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean)

    if (prompt.includes('SOURCE TEXT')) {
      const source = prompt.split('"""\n')[1]?.split('\n"""')[0] ?? ''
      return json(heuristicExtract(source))
    }
    if (prompt.includes('"headlines"')) return json({ headlines: [`${cap(prof)}${where}`, `${cap(prof)} focused on outcomes that matter`, `Trusted ${prof} with practical experience`, `${cap(prof)} · ${skills.slice(0, 2).join(' & ') || 'clear, careful work'}`, `Helping people as a ${prof}`] })
    if (prompt.includes('"short_bio"')) {
      const short = `${name} is a ${prof}${where}${skills.length ? ` working across ${skills.slice(0, 3).join(', ')}` : ''}.`
      const long = `I am a ${prof}${where}.${profile?.experience_years ? ` I have ${profile.experience_years} years of experience.` : ''}\n\n${skills.length ? `My work focuses on ${skills.slice(0, 4).join(', ')}. ` : ''}I believe in clear communication and careful, well-explained work.\n\n[Draft generated in development mode. Configure an AI provider for real writing.]`
      return json({ headline: `${cap(prof)}${where}`, short_bio: short, long_bio: long, skills: skills.slice(0, 12), services: [] })
    }
    if (prompt.includes('"highlights"')) {
      const notes = prompt.split('NOTES:\n')[1] ?? ''
      const role = prompt.match(/ROLE: (.*) at (.*)/)
      return json({ title: role?.[1]?.trim() || 'Role', organization: role?.[2]?.trim() || 'Organization', description: firstSentence(notes), highlights: notes.split(/[\n.;]/).map((s) => s.trim()).filter((s) => s.length > 8).slice(0, 4).map(cap) })
    }
    if (prompt.includes('"services"')) {
      const list = (prompt.split('SERVICES:\n')[1] ?? '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
      return json({ services: list.map((s) => ({ title: cap(s), description: `${cap(s)}, explained clearly and delivered with care.` })) })
    }
    if (prompt.includes('"tags"')) {
      const notes = prompt.split('NOTES:\n')[1] ?? ''
      return json({ title: (prompt.match(/TITLE: (.*)/)?.[1] || 'Project').trim() || 'Project', description: firstSentence(notes), tags: [] })
    }
    if (prompt.includes('"og_description"')) return json({ title: `${name} · ${cap(prof)}`.slice(0, 60), description: `${name}, ${prof}${where}. Experience, services and contact details.`.slice(0, 155), keywords: [prof, `${prof}${where ? ` ${String(profile?.location)}` : ''}`, name, ...skills.slice(0, 4)], og_description: `${name}: ${prof}${where}.` })
    if (prompt.includes('"summary"')) return json({ summary: firstSentence(prompt.split('TEXT:\n')[1] ?? '') })
    if (prompt.includes('Translate')) return json({ text: `[translation unavailable in development mode] ${prompt.split('TEXT:\n')[1] ?? ''}` })
    if (prompt.includes('Rewrite')) return json({ text: (prompt.split('TEXT:\n')[1] ?? '').trim() })
    if (Array.isArray(user?.content)) return json({ text: '[OCR is not available in development mode]' })
    return json({ text: '' })
  }
}

function safeJson(s: string | undefined): Record<string, unknown> | null {
  try { return s ? JSON.parse(s) : null } catch { return null }
}
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const firstSentence = (s: string) => (s.trim().split(/(?<=\.)\s/)[0] ?? '').slice(0, 600)
