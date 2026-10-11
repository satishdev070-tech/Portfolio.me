'use server'

import { revalidatePath } from 'next/cache'
import { assertViewer } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError } from '@/lib/errors'
import { activeProvider, getProvider } from '@/lib/billing'
import { getEntitlements } from '@/lib/entitlements'
import { publicEnv } from '@/lib/env'

export async function startCheckout(planSlug: string) {
  return action(async () => {
    const viewer = await assertViewer()
    if (viewer.role !== 'owner' && viewer.role !== 'admin') throw new AppError('FORBIDDEN', 'Only the workspace owner can change the plan.')
    const provider = activeProvider()
    if (!provider) throw new AppError('BILLING_UNAVAILABLE', 'Online payments aren’t set up yet. Please contact support to upgrade.')
    const supabase = await createServerSupabase()
    const { data: plan } = await supabase.from('subscription_plans').select('slug, name, price_minor, currency, billing_interval, provider_plan_ids, is_default').eq('slug', planSlug).eq('status', 'active').maybeSingle()
    if (!plan || plan.is_default) throw new AppError('NOT_FOUND', 'Plan not found.')
    const current = await getEntitlements(viewer.workspaceId)
    if (current.plan.slug === plan.slug && current.subscription?.status === 'active') throw new AppError('CONFLICT', 'You’re already on this plan.')
    const result = await provider.createCheckout({
      workspaceId: viewer.workspaceId, userId: viewer.userId, email: viewer.email,
      plan: { ...plan, provider_plan_ids: (plan.provider_plan_ids ?? {}) as Record<string, string> },
      returnUrl: `${publicEnv.appUrl}/billing?status=return`,
    })
    revalidatePath('/', 'layout')
    return result
  })
}

export async function cancelSubscription() {
  return action(async () => {
    const viewer = await assertViewer()
    if (viewer.role !== 'owner' && viewer.role !== 'admin') throw new AppError('FORBIDDEN', 'Only the workspace owner can cancel.')
    const ent = await getEntitlements(viewer.workspaceId)
    if (!ent.subscription) throw new AppError('NOT_FOUND', 'You don’t have a paid subscription.')
    const supabase = await createServerSupabase()
    const { data: sub } = await supabase.from('subscriptions').select('provider, provider_subscription_id').eq('id', ent.subscription.id).single()
    const provider = sub ? getProvider(sub.provider) : null
    if (!provider || !sub?.provider_subscription_id) throw new AppError('BILLING_UNAVAILABLE', 'Please contact support to cancel.')
    await provider.cancel(sub.provider_subscription_id, true)
    revalidatePath('/billing')
    return true
  })
}
