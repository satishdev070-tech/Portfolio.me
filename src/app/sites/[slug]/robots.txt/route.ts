import { getPublishedSiteBySlug } from '@/lib/sites'
import { siteRobots } from '@/lib/site-files'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return siteRobots(await getPublishedSiteBySlug((await params).slug))
}
