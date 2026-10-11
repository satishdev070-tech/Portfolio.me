import { createHmac, timingSafeEqual } from 'node:crypto'
import { AppError } from '@/lib/errors'
import type { BillingEvent, BillingProvider, CheckoutRequest, CheckoutResult } from '../types'

// Razorpay Subscriptions via REST (no SDK). Plans are created in the Razorpay dashboard and their ids
// stored in subscription_plans.provider_plan_ids.razorpay. Webhooks are verified with HMAC-SHA256 of
// the raw body using the webhook secret (X-Razorpay-Signature).

export function verifyRazorpaySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export class RazorpayProvider implements BillingProvider {
  readonly slug = 'razorpay'
  constructor(private readonly keyId?: string, private readonly keySecret?: string, private readonly webhookSecret?: string) {}

  isConfigured() {
    return !!(this.keyId && this.keySecret && this.webhookSecret)
  }

  private async api<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new AppError('BILLING_UNAVAILABLE', 'The payment provider is unavailable. Please try again.')
    return res.json() as Promise<T>
  }

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const planId = req.plan.provider_plan_ids.razorpay
    if (!planId) throw new AppError('BILLING_UNAVAILABLE', 'This plan isn’t available for online payment yet.')
    const sub = await this.api<{ id: string; short_url: string }>('/subscriptions', {
      plan_id: planId,
      total_count: req.plan.billing_interval === 'year' ? 10 : 120,
      customer_notify: 1,
      notes: { workspace_id: req.workspaceId, plan_slug: req.plan.slug, user_id: req.userId },
    })
    return { type: 'redirect', url: sub.short_url }
  }

  async cancel(providerSubscriptionId: string, atPeriodEnd: boolean) {
    await this.api(`/subscriptions/${encodeURIComponent(providerSubscriptionId)}/cancel`, { cancel_at_cycle_end: atPeriodEnd ? 1 : 0 })
  }

  async parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent | null> {
    if (!this.webhookSecret || !verifyRazorpaySignature(rawBody, headers.get('x-razorpay-signature'), this.webhookSecret)) return null
    const body = JSON.parse(rawBody) as { event: string; payload?: { subscription?: { entity?: { id: string; current_end?: number | null; notes?: Record<string, string> } } } }
    const id = headers.get('x-razorpay-event-id') ?? `${body.event}:${body.payload?.subscription?.entity?.id}:${body.payload?.subscription?.entity?.current_end ?? ''}`
    const sub = body.payload?.subscription?.entity
    if (!sub) return { id, type: 'ignored', raw: body.event }
    const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : null
    switch (body.event) {
      case 'subscription.activated':
        if (!sub.notes?.workspace_id || !sub.notes?.plan_slug) return { id, type: 'ignored', raw: body.event }
        return { id, type: 'activated', workspaceId: sub.notes.workspace_id, planSlug: sub.notes.plan_slug, providerSubscriptionId: sub.id, periodEnd }
      case 'subscription.charged': return { id, type: 'renewed', providerSubscriptionId: sub.id, periodEnd }
      case 'subscription.pending':
      case 'subscription.halted': return { id, type: 'past_due', providerSubscriptionId: sub.id }
      case 'subscription.cancelled': return { id, type: 'cancelled', providerSubscriptionId: sub.id, periodEnd }
      case 'subscription.completed': return { id, type: 'expired', providerSubscriptionId: sub.id }
      default: return { id, type: 'ignored', raw: body.event }
    }
  }
}
