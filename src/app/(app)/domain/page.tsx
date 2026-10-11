import type { Metadata } from 'next'
import { requireViewer, getCurrentWebsite } from '@/lib/auth'
import { getEntitlements, hasFeature, limitOf } from '@/lib/entitlements'
import { createServerSupabase } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env.server'
import { siteUrl } from '@/lib/env'
import { PageHeader } from '@/components/app/page-header'
import { UpgradeNotice } from '@/components/app/upgrade-notice'
import { DomainManager } from '@/components/domain/domain-manager'
import { TXT_PREFIX, txtValue, isApex } from '@/lib/domains/verify'

export const metadata: Metadata = { title: 'Domain' }

export default async function DomainPage() {
  const viewer = await requireViewer()
  const site = (await getCurrentWebsite())!
  const supabase = await createServerSupabase()
  const [ent, { data: domains }] = await Promise.all([
    getEntitlements(viewer.workspaceId),
    supabase.from('domains').select('id, domain, status, ssl_status, verification_token, verified_at, last_checked_at, last_error, is_primary').eq('website_id', site.id).neq('status', 'removed').order('created_at'),
  ])
  const allowed = hasFeature(ent, 'custom_domain')
  const target = serverEnv.customDomainTarget()
  const aRecord = process.env.CUSTOM_DOMAIN_A_RECORD ?? null
  return (
    <>
      <PageHeader title="Domain" description="Your free address works forever. Connect your own domain to use www.yourname.com." />
      <section className="panel mb-6 p-5">
        <p className="text-xs text-muted-foreground">Free address</p>
        <a href={siteUrl(site.slug)} target="_blank" rel="noopener" className="mt-1 inline-block font-medium hover:underline">{siteUrl(site.slug).replace(/^https?:\/\//, '')}</a>
        <p className="mt-1 text-xs text-muted-foreground">Change it in Editor → Settings.</p>
      </section>
      {!allowed ? <UpgradeNotice title="Use your own domain" body="Connect www.yourname.com on the Advanced plan. HTTPS is included." /> : (
        <DomainManager
          websiteId={site.id}
          limit={limitOf(ent, 'max_custom_domains')}
          canManage={viewer.role === 'owner' || viewer.role === 'admin'}
          domains={(domains ?? []).map((d) => ({
            ...d,
            records: [
              { type: 'TXT', host: `${TXT_PREFIX}.${d.domain}`, value: txtValue(d.verification_token) },
              isApex(d.domain)
                ? { type: 'A', host: d.domain, value: aRecord ?? 'Ask support for the IP address' }
                : { type: 'CNAME', host: d.domain, value: target },
            ],
          }))}
        />
      )}
    </>
  )
}
