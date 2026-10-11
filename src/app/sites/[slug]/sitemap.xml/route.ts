import { getPublishedSiteBySlug } from '@/lib/sites'
import { siteSitemap } from '@/lib/site-files'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return siteSitemap(await getPublishedSiteBySlug((await params).slug))
}
