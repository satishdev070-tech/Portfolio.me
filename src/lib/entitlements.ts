import 'server-only'
import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { AppError, unwrap } from '@/lib/errors'

// The only place application code asks about plans. Never compare plan slugs in code:
// ask for a feature or a limit. The database enforces the same rules independently.

export type FeatureKey =
  | 'premium_templates' | 'advanced_sections' | 'remove_branding' | 'advanced_seo' | 'analytics_basic'
  | 'analytics_advanced' | 'ai_content_generation' | 'ai_import' | 'ai_advanced_models' | 'custom_domain'
  | 'multiple_websites' | 'custom_css'
export type LimitKey = 'max_websites' | 'ai_credits_monthly' | 'storage_mb' | 'max_custom_domains'

export interface Entitlements {
  plan: { id: string; slug: string; name: string; price_minor: number; currency: string; billing_interval: string }
  subscription: { id: string; status: string; provider: string; current_period_end: string | null; cancel_at_period_end: boolean } | null
  features: Record<FeatureKey, boolean>
  limits: Record<LimitKey, number>
  period_start: string
}

export const getEntitlements = cache(async (workspaceId: string): Promise<Entitlements> => {
  const supabase = await createServerSupabase()
  return unwrap(await supabase.rpc('get_entitlements', { p_workspace: workspaceId })) as unknown as Entitlements
})

export function hasFeature(e: Entitlements, key: FeatureKey) {
  return e.features[key] === true
}

/** -1 = unlimited. */
export function limitOf(e: Entitlements, key: LimitKey) {
  return e.limits[key] ?? 0
}

export function withinLimit(e: Entitlements, key: LimitKey, used: number) {
  const limit = limitOf(e, key)
  return limit === -1 || used < limit
}

export async function assertFeature(workspaceId: string, key: FeatureKey, message?: string) {
  const e = await getEntitlements(workspaceId)
  if (!hasFeature(e, key)) {
    throw new AppError('FEATURE_NOT_AVAILABLE', message ?? 'This feature is not included in your plan.', { feature: key })
  }
  return e
}
