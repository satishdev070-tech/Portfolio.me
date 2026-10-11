import 'server-only'
import { serverEnv } from '@/lib/env.server'
import { createServiceSupabase } from '@/lib/supabase/admin'
import { AppError } from '@/lib/errors'
import { asJson } from '@/lib/supabase/json'
import { DevBillingProvider } from './providers/dev'
import { RazorpayProvider } from './providers/razorpay'
import type { BillingEvent, BillingProvider } from './types'

// SubscriptionService: provider selection, checkout, cancellation and webhook application.
// Entitlements are derived from the subscriptions table (src/lib/entitlements.ts); nothing here
// grants features directly.

export function getProvider(slug?: string): BillingProvider | null {
  const which = slug ?? serverEnv.billingProvider()
  if (which === 'dev') return new DevBillingProvider()
  if (which === 'razorpay') return new RazorpayProvider(serverEnv.secret('RAZORPAY_KEY_ID'), serverEnv.secret('RAZORPAY_KEY_SECRET'), serverEnv.secret('RAZORPAY_WEBHOOK_SECRET'))
  return null
}

export function activeProvider(): BillingProvider | null {
  const p = getProvider()
  return p?.isConfigured() ? p : null
}

/** Apply a verified provider event exactly once. */
export async function applyBillingEvent(provider: string, event: BillingEvent, payload: unknown) {
  const service = createServiceSupabase()
  const workspace = event.type === 'activated' ? event.workspaceId : null
  const { data: fresh } = await service.rpc('billing_record_event', { p_provider: provider, p_event_id: event.id, p_event_type: event.type, p_workspace: workspace as string, p_payload: asJson(payload) })
  if (!fresh) return 'duplicate'
  try {
    switch (event.type) {
      case 'activated': {
        const r = await service.rpc('billing_set_plan', { p_workspace: event.workspaceId, p_plan_slug: event.planSlug, p_status: 'active', p_provider: provider, p_provider_subscription_id: event.providerSubscriptionId, p_period_end: event.periodEnd?.toISOString() as string })
        if (r.error) throw r.error
        break
      }
      case 'renewed': await service.rpc('billing_update_subscription', { p_provider: provider, p_provider_subscription_id: event.providerSubscriptionId, p_status: 'active', p_period_end: event.periodEnd?.toISOString() as string }); break
      case 'past_due': await service.rpc('billing_update_subscription', { p_provider: provider, p_provider_subscription_id: event.providerSubscriptionId, p_status: 'past_due' }); break
      case 'cancelled': await service.rpc('billing_update_subscription', { p_provider: provider, p_provider_subscription_id: event.providerSubscriptionId, p_status: 'cancelled', p_period_end: event.periodEnd?.toISOString() as string }); break
      case 'expired': await service.rpc('billing_update_subscription', { p_provider: provider, p_provider_subscription_id: event.providerSubscriptionId, p_status: 'expired' }); break
      case 'ignored': break
    }
    await service.rpc('billing_mark_event_processed', { p_provider: provider, p_event_id: event.id })
    return 'applied'
  } catch (e) {
    await service.rpc('billing_mark_event_processed', { p_provider: provider, p_event_id: event.id, p_error: (e as Error).message?.slice(0, 500) ?? 'error' })
    throw new AppError('INTERNAL_ERROR', 'Webhook processing failed.')
  }
}
