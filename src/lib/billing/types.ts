// Payment-provider abstraction. Business logic (plans, entitlements) never imports a provider.

export interface CheckoutRequest {
  workspaceId: string
  userId: string
  email: string
  plan: { slug: string; name: string; price_minor: number; currency: string; billing_interval: string; provider_plan_ids: Record<string, string> }
  returnUrl: string
}

export type CheckoutResult = { type: 'redirect'; url: string } | { type: 'activated' }

/** Normalized provider event → what the subscription service should do. */
export type BillingEvent =
  | { id: string; type: 'activated'; workspaceId: string; planSlug: string; providerSubscriptionId: string; periodEnd: Date | null }
  | { id: string; type: 'renewed'; providerSubscriptionId: string; periodEnd: Date | null }
  | { id: string; type: 'past_due'; providerSubscriptionId: string }
  | { id: string; type: 'cancelled'; providerSubscriptionId: string; periodEnd: Date | null }
  | { id: string; type: 'expired'; providerSubscriptionId: string }
  | { id: string; type: 'ignored'; raw: string }

export interface BillingProvider {
  readonly slug: string
  isConfigured(): boolean
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>
  cancel(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>
  /** Verify the signature and normalize the payload. Returns null if the signature is invalid. */
  parseWebhook(rawBody: string, headers: Headers): Promise<BillingEvent | null>
}
