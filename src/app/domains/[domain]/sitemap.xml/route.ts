import { getPublishedSiteByDomain } from '@/lib/sites'
import { siteSitemap } from '@/lib/site-files'

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  return siteSitemap(await getPublishedSiteByDomain(decodeURIComponent((await params).domain)))
}
