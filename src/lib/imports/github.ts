import 'server-only'
import { AppError } from '@/lib/errors'
import type { ImportData } from '@/lib/ai/tasks'

// GitHub's public REST API (no scraping): profile + up to 20 recently updated public repositories.
export async function importGitHub(url: string): Promise<{ data: ImportData; text: string }> {
  const user = url.match(/^https:\/\/github\.com\/([A-Za-z0-9-]{1,39})\/?$/)?.[1]
  if (!user) throw new AppError('VALIDATION_ERROR', 'Enter a GitHub profile link like https://github.com/yourname')
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'HelloMeImporter' }
  const [p, r] = await Promise.all([
    fetch(`https://api.github.com/users/${user}`, { headers, signal: AbortSignal.timeout(10_000) }),
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=20&type=owner`, { headers, signal: AbortSignal.timeout(10_000) }),
  ]).catch(() => { throw new AppError('IMPORT_FAILED', 'GitHub didn’t respond. Try again shortly.') })
  if (p.status === 404) throw new AppError('IMPORT_FAILED', 'That GitHub profile doesn’t exist.')
  if (!p.ok) throw new AppError('IMPORT_FAILED', 'GitHub is rate-limiting requests. Try again in a while.')
  const profile = (await p.json()) as { name: string | null; bio: string | null; location: string | null; blog: string | null; email: string | null; html_url: string; company: string | null }
  const repos = r.ok ? ((await r.json()) as { name: string; description: string | null; html_url: string; fork: boolean; language: string | null; stargazers_count: number }[]) : []
  const own = repos.filter((x) => !x.fork)
  const languages = [...new Set(own.map((x) => x.language).filter(Boolean))] as string[]
  const data: ImportData = {
    profile: { full_name: profile.name, headline: profile.company ? `Engineer at ${profile.company.replace(/^@/, '')}` : null, bio_short: profile.bio, city: profile.location, website_url: profile.blog ? (profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`) : null, email: profile.email },
    experiences: [], education: [], certifications: [], awards: [], publications: [],
    skills: languages.slice(0, 15),
    projects: own.slice(0, 12).map((x) => ({ title: x.name, description: x.description, url: x.html_url })),
    social_links: [{ platform: 'github', url: profile.html_url }],
  }
  return { data, text: `GitHub profile ${profile.html_url}\n${profile.bio ?? ''}\nRepositories: ${own.map((x) => x.name).join(', ')}` }
}
