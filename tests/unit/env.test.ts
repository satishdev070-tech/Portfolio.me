import { afterEach, describe, expect, it, vi } from 'vitest'

// publicEnv is read at import time, so each case imports a fresh module.
async function load(env: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return import('@/lib/env')
}
afterEach(() => vi.unstubAllEnvs())

describe('site addresses', () => {
  it('uses /u/<slug> paths when subdomains are unavailable', async () => {
    const e = await load({ NEXT_PUBLIC_APP_URL: 'https://parichaypage.in', NEXT_PUBLIC_ROOT_DOMAIN: 'parichaypage.in', NEXT_PUBLIC_SITE_URLS: 'path' })
    expect(e.siteUrl('asha')).toBe('https://parichaypage.in/u/asha')
    expect(e.siteUrl('asha', '/sitemap.xml')).toBe('https://parichaypage.in/u/asha/sitemap.xml')
    expect(e.siteAddress('asha')).toBe('parichaypage.in/u/asha')
    expect(e.siteAddressParts()).toEqual({ prefix: 'parichaypage.in/u/', suffix: '' })
  })
  it('uses <slug>.<root> subdomains by default', async () => {
    const e = await load({ NEXT_PUBLIC_APP_URL: 'https://hellome.in', NEXT_PUBLIC_ROOT_DOMAIN: 'hellome.in', NEXT_PUBLIC_SITE_URLS: '' })
    expect(e.siteUrl('asha')).toBe('https://asha.hellome.in')
    expect(e.siteAddressParts()).toEqual({ prefix: 'https://', suffix: '.hellome.in' })
  })
})
