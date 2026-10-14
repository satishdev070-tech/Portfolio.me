import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { AppError } from '@/lib/errors'
import { publicEnv } from '@/lib/env'

// Fetching user-supplied URLs safely: public http(s) only, private/reserved addresses blocked
// (checked after DNS resolution and again on every redirect), robots.txt respected, size/time capped.

const UA = `ProfileImporter/1.0 (+${publicEnv.appUrl}; profile import on user request)`
const MAX_BYTES = 2 * 1024 * 1024

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v = ip.toLowerCase()
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7))
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('ff')
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try { url = new URL(raw) } catch { throw new AppError('VALIDATION_ERROR', 'Enter a full link starting with https://') }
  if (!['http:', 'https:'].includes(url.protocol)) throw new AppError('SOURCE_NOT_ALLOWED', 'Only web links (http/https) can be imported.')
  if (url.username || url.password) throw new AppError('SOURCE_NOT_ALLOWED', 'Links with credentials aren’t allowed.')
  if (url.port && !['80', '443'].includes(url.port)) throw new AppError('SOURCE_NOT_ALLOWED', 'That link uses an unsupported port.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) throw new AppError('SOURCE_NOT_ALLOWED', 'That address can’t be imported.')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => { throw new AppError('IMPORT_FAILED', 'That website couldn’t be found.') })
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new AppError('SOURCE_NOT_ALLOWED', 'That address can’t be imported.')
  return url
}

/** Minimal robots.txt check for our user agent (and *): honours Disallow prefixes. */
export async function robotsAllows(url: URL): Promise<boolean> {
  try {
    const res = await fetch(`${url.origin}/robots.txt`, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(5000) })
    if (!res.ok) return true
    const body = (await res.text()).slice(0, 100_000)
    let applies = false
    const disallow: string[] = []
    for (const raw of body.split('\n')) {
      const line = raw.split('#')[0].trim()
      const [k, ...rest] = line.split(':')
      const v = rest.join(':').trim()
      if (/^user-agent$/i.test(k)) applies = v === '*' || /profileimporter/i.test(v)
      else if (applies && /^disallow$/i.test(k) && v) disallow.push(v)
    }
    return !disallow.some((p) => url.pathname.startsWith(p))
  } catch {
    return true
  }
}

export async function fetchPublicPage(raw: string): Promise<{ url: string; html: string }> {
  let url = await assertPublicUrl(raw)
  if (!(await robotsAllows(url))) throw new AppError('SOURCE_NOT_ALLOWED', 'This website asks automated tools not to read that page, so we can’t import it. Try uploading your CV instead.')
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, redirect: 'manual', signal: AbortSignal.timeout(10_000) })
      .catch(() => { throw new AppError('IMPORT_FAILED', 'That website didn’t respond.') })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = await assertPublicUrl(new URL(res.headers.get('location')!, url).toString())
      continue
    }
    if (res.status === 401 || res.status === 403) throw new AppError('SOURCE_NOT_ALLOWED', 'That page requires signing in, so it can’t be imported.')
    if (!res.ok) throw new AppError('IMPORT_FAILED', `That page returned an error (${res.status}).`)
    if (!/text\/html|application\/xhtml/i.test(res.headers.get('content-type') ?? '')) throw new AppError('IMPORT_FAILED', 'That link isn’t a web page.')
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) { await reader.cancel(); break }
      chunks.push(value)
    }
    return { url: url.toString(), html: new TextDecoder().decode(Buffer.concat(chunks)) }
  }
  throw new AppError('IMPORT_FAILED', 'Too many redirects.')
}
