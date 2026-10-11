import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/editor', '/profile', '/media', '/ai', '/import', '/seo', '/domain', '/analytics', '/billing', '/settings', '/admin', '/preview', '/onboarding', '/api/', '/demo/'] }],
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  }
}
