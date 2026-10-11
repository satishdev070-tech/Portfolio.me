import { getProvider, applyBillingEvent } from '@/lib/billing'

export const runtime = 'nodejs'

// Payment provider webhooks. Signature-verified; idempotent via billing_events.
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: slug } = await params
  const provider = getProvider(slug)
  if (!provider || slug === 'dev' || !provider.isConfigured()) return new Response('Not found', { status: 404 })
  const raw = await request.text()
  if (raw.length > 1_000_000) return new Response('Too large', { status: 413 })
  const event = await provider.parseWebhook(raw, request.headers)
  if (!event) return new Response('Invalid signature', { status: 401 })
  try {
    await applyBillingEvent(slug, event, JSON.parse(raw))
    return Response.json({ ok: true })
  } catch {
    return new Response('Retry later', { status: 500 })
  }
}
