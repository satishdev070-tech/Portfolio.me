import 'server-only'

// Where SSL certificates come from. The edge/hosting platform terminates TLS for customer domains;
// this adapter tells it about a verified domain. 'manual' = an operator adds it (e.g. Cloudflare for SaaS).
export interface HostingProvider {
  readonly slug: string
  addDomain(domain: string): Promise<'active' | 'provisioning' | 'pending'>
  removeDomain(domain: string): Promise<void>
}

class ManualHosting implements HostingProvider {
  readonly slug = 'manual'
  async addDomain() { return 'pending' as const }
  async removeDomain() {}
}

// Vercel Domains API (v10 project domains). Requires VERCEL_TOKEN and VERCEL_PROJECT_ID.
class VercelHosting implements HostingProvider {
  readonly slug = 'vercel'
  constructor(private token: string, private projectId: string, private teamId?: string) {}
  private url(path: string) { return `https://api.vercel.com${path}${this.teamId ? `?teamId=${this.teamId}` : ''}` }
  async addDomain(domain: string) {
    const res = await fetch(this.url(`/v10/projects/${this.projectId}/domains`), { method: 'POST', headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ name: domain }), signal: AbortSignal.timeout(15_000) })
    if (res.ok || res.status === 409) return 'provisioning' as const
    return 'pending' as const
  }
  async removeDomain(domain: string) {
    await fetch(this.url(`/v9/projects/${this.projectId}/domains/${domain}`), { method: 'DELETE', headers: { authorization: `Bearer ${this.token}` }, signal: AbortSignal.timeout(15_000) }).catch(() => {})
  }
}

export function hostingProvider(): HostingProvider {
  const token = process.env.VERCEL_TOKEN
  const project = process.env.VERCEL_PROJECT_ID
  return token && project ? new VercelHosting(token, project, process.env.VERCEL_TEAM_ID) : new ManualHosting()
}
