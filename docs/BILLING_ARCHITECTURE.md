# Billing architecture

```
UI (/billing) ──► startCheckout(planSlug)            [server action, owner/admin only]
                    └─ activeProvider(): BillingProvider   (BILLING_PROVIDER env)
                         ├─ dev       → billing_set_plan(...) immediately (refuses in production)
                         ├─ razorpay  → POST /v1/subscriptions → redirect to short_url
                         └─ none      → BILLING_UNAVAILABLE (plans shown for reference)

Provider ──webhook──► /api/billing/webhook/[provider]
                        parseWebhook(): verify signature → normalized BillingEvent
                        applyBillingEvent(): billing_record_event (idempotent) → set/update subscription
```

`src/lib/billing/types.ts` defines `BillingProvider { createCheckout, cancel, parseWebhook }` and the
normalized `BillingEvent` (`activated | renewed | past_due | cancelled | expired | ignored`). Business
logic (entitlements) only reads the `subscriptions` table, so adding Stripe means one new adapter file
plus `provider_plan_ids.stripe` on each plan.

## Razorpay adapter

* Plans are created in the Razorpay dashboard; their ids go in `subscription_plans.provider_plan_ids.razorpay`
  (editable at `/admin/plans`).
* Checkout creates a subscription with `notes.workspace_id` and `notes.plan_slug`; the
  `subscription.activated` webhook (not the redirect) grants the plan.
* Webhooks are verified with HMAC-SHA256 over the raw body (`X-Razorpay-Signature`), constant-time
  compared. Events: `activated`, `charged` (renewal), `pending`/`halted` (past_due), `cancelled`,
  `completed` (expired).
* Idempotency: `billing_events (provider, event_id)` is unique; retries are no-ops.

**Status:** the adapter is implemented against Razorpay's documented REST API and its signature check
is unit-tested, but it has **not** been exercised against a live Razorpay account (no keys in this
environment). Before launch: create plans, set `RAZORPAY_*` env vars, point the webhook to
`/api/billing/webhook/razorpay`, and run a test-mode purchase end to end.

## Subscription states

`trialing → active → (past_due ↔ active) → cancelled (until period end) → expired`. Grace and fallback
rules live in `private.current_subscription` (SUBSCRIPTION_SYSTEM.md).

## Not yet built

GST invoices, coupons, annual-plan toggle in the UI (supported by `billing_interval`), proration on
mid-cycle plan changes, dunning emails.
