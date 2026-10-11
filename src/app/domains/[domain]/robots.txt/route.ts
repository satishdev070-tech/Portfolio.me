import { getPublishedSiteByDomain } from '@/lib/sites'
import { siteRobots } from '@/lib/site-files'

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  return siteRobots(await getPublishedSiteByDomain(decodeURIComponent((await params).domain)))
}
