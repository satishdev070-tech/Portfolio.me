import { createServiceSupabase } from '@/lib/supabase/admin'
import { AppError, fromDbError } from '@/lib/errors'
import type { BillingProvider, CheckoutRequest, CheckoutResult } from '../types'

// Development provider: activates the plan immediately, no payment. Refuses to run in production.
export class DevBillingProvider implements BillingProvider {
  readonly slug = 'dev'
  isConfigured() { return process.env.NODE_ENV !== 'production' }

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.isConfigured()) throw new AppError('BILLING_UNAVAILABLE', 'Payments are not available.')
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (req.plan.billing_interval === 'year' ? 12 : 1))
    const { error } = await createServiceSupabase().rpc('billing_set_plan', {
      p_workspace: req.workspaceId, p_plan_slug: req.plan.slug, p_status: 'active', p_provider: 'dev',
      p_provider_subscription_id: `dev_${crypto.randomUUID()}`, p_period_end: periodEnd.toISOString(),
    })
    if (error) throw fromDbError(error)
    return { type: 'activated' }
  }

  async cancel(providerSubscriptionId: string, atPeriodEnd: boolean) {
    await createServiceSupabase().rpc('billing_update_subscription', {
      p_provider: 'dev', p_provider_subscription_id: providerSubscriptionId, p_status: atPeriodEnd ? 'active' : 'cancelled', p_cancel_at_period_end: atPeriodEnd,
    })
  }

  async parseWebhook() { return null }
}
