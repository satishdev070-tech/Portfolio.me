'use server'

import { revalidatePath } from 'next/cache'
import { assertViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/admin'
import { action, AppError, fromDbError } from '@/lib/errors'
import { serverEnv } from '@/lib/env.server'
import { checkDomain } from '@/lib/domains/verify'
import { hostingProvider } from '@/lib/domains/hosting'
import { invalidateSite } from '@/lib/sites'
import { checkRateLimit } from '@/lib/rate-limit'

/** Check DNS for a domain the viewer manages; activate it only when ownership is proven. */
export async function verifyDomain(domainId: string) {
  return action(async () => {
    const viewer = await assertViewer()
    checkRateLimit(`domain-verify:${viewer.userId}`, 20, 10 * 60_000)
    const supabase = await createServerSupabase()
    const { data: d } = await supabase.from('domains').select('id, domain, verification_token, website_id, workspace_id, status, websites(slug)').eq('id', domainId).maybeSingle()
    if (!d || d.workspace_id !== viewer.workspaceId || d.status === 'removed') throw new AppError('NOT_FOUND', 'Domain not found.')
    if (viewer.role !== 'owner' && viewer.role !== 'admin') throw new AppError('FORBIDDEN', 'Only owners can manage domains.')

    const result = await checkDomain(d.domain, d.verification_token, serverEnv.customDomainTarget(), process.env.CUSTOM_DOMAIN_A_RECORD ?? null)
    const verified = result.ownership && result.routing
    const ssl = verified ? await hostingProvider().addDomain(d.domain) : undefined
    const { error } = await createServiceSupabase().rpc('record_domain_check', {
      p_domain_id: d.id, p_verified: verified, p_error: verified ? undefined : result.details.join(' '), p_ssl_status: ssl,
    })
    if (error) throw fromDbError(error)
    if (verified) invalidateSite((d.websites as { slug: string } | null)?.slug ?? '', [d.domain])
    revalidatePath('/domain')
    return { verified, ...result }
  })
}
