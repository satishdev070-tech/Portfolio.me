'use client'
import { useEffect } from 'react'

// Published-site runtime: privacy-friendly page-view + click beacons and the print link.
// No cookies or local storage; the server derives a daily visitor hash and discards IP/UA.
export function SiteRuntime({ slug, domain, track }: { slug: string; domain: string | null; track: boolean }) {
  useEffect(() => {
    const send = (event: string) => {
      if (!track || navigator.webdriver) return
      const body = JSON.stringify({ slug, domain, event, path: location.pathname, referrer: document.referrer || null })
      if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) {
        fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
      }
    }
    send('page_view')
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track],[data-print]')
      if (!el) return
      if (el.dataset.print) {
        e.preventDefault()
        window.print()
        return
      }
      if (el.dataset.track) send(el.dataset.track)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [slug, domain, track])
  return null
}
