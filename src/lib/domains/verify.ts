import 'server-only'
import { resolveCname, resolve4, resolveTxt } from 'node:dns/promises'

// Ownership: TXT record  _hellome-verify.<domain>  =  hellome-verify=<token>
// Routing:   www/sub-domains CNAME → CUSTOM_DOMAIN_CNAME_TARGET; apex A → CUSTOM_DOMAIN_A_RECORD.
// A domain is never activated just because someone typed it.

export const TXT_PREFIX = '_hellome-verify'
export const txtValue = (token: string) => `hellome-verify=${token}`
export const isApex = (domain: string) => domain.split('.').length === 2

export interface DomainCheck { ownership: boolean; routing: boolean; details: string[] }

export async function checkDomain(domain: string, token: string, cnameTarget: string, aRecord: string | null): Promise<DomainCheck> {
  const details: string[] = []
  let ownership = false
  try {
    const records = (await resolveTxt(`${TXT_PREFIX}.${domain}`)).map((r) => r.join(''))
    ownership = records.includes(txtValue(token))
    if (!ownership) details.push(records.length ? 'The verification TXT record has a different value.' : 'Verification TXT record not found yet.')
  } catch {
    details.push('Verification TXT record not found yet. DNS changes can take up to an hour.')
  }

  let routing = false
  if (isApex(domain)) {
    try {
      const ips = await resolve4(domain)
      routing = !!aRecord && ips.includes(aRecord)
      if (!routing) details.push(aRecord ? `The A record should point to ${aRecord}.` : 'Apex domains need an A record; use www instead if unsure.')
    } catch { details.push('No A record found for the domain.') }
  } else {
    try {
      const cnames = (await resolveCname(domain)).map((c) => c.toLowerCase().replace(/\.$/, ''))
      routing = cnames.includes(cnameTarget.toLowerCase())
      if (!routing) details.push(`The CNAME should point to ${cnameTarget}.`)
    } catch { details.push(`CNAME record to ${cnameTarget} not found yet.`) }
  }
  return { ownership, routing, details }
}
