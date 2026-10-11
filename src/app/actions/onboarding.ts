'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { assertViewer, SITE_COOKIE } from '@/lib/auth'
import { action, AppError, unwrap } from '@/lib/errors'
import { parseInput, slugSchema } from '@/lib/validation/schemas'

const onboardingSchema = z.object({
  professionId: z.string().uuid('Choose what you do'),
  fullName: z.string().trim().min(1, 'Your name is required').max(120),
  headline: z.string().trim().min(2, 'Add a short headline').max(160),
  slug: slugSchema,
  templateSlug: z.string().regex(/^[a-z0-9-]+$/),
  locale: z.enum(['en', 'hi']).default('en'),
})

/**
 * Signup → workspace (created by the DB trigger) → profile → website (sections seeded from the
 * profession + template) → onboarding complete. The site starts as a draft; publishing is explicit.
 */
export async function completeOnboarding(input: z.input<typeof onboardingSchema>) {
  return action(async () => {
    const viewer = await assertViewer()
    const data = parseInput(onboardingSchema, input)
    const supabase = await createServerSupabase()

    const availability = unwrap(await supabase.rpc('check_slug_availability', { p_slug: data.slug })) as { available: boolean; reason?: string }
    if (!availability.available) {
      const [code, message] = (availability.reason ?? 'SLUG_TAKEN: This address is taken.').split(': ')
      throw new AppError(code === 'SLUG_RESERVED' || code === 'INVALID_SLUG' ? code : 'SLUG_TAKEN', message ?? 'This address is taken.')
    }

    // Re-use an existing profile if onboarding is retried.
    const existing = await supabase.from('profiles').select('id').eq('workspace_id', viewer.workspaceId).is('deleted_at', null).limit(1).maybeSingle()
    let profileId = existing.data?.id
    if (profileId) {
      unwrap(await supabase.from('profiles').update({ full_name: data.fullName, headline: data.headline, profession_id: data.professionId }).eq('id', profileId))
    } else {
      const created = unwrap(
        await supabase.from('profiles').insert({
          workspace_id: viewer.workspaceId, full_name: data.fullName, headline: data.headline, profession_id: data.professionId,
          email_public: viewer.email,
        }).select('id').single(),
      )
      profileId = created.id
    }

    const websiteId = unwrap(
      await supabase.rpc('create_website', { p_profile: profileId, p_name: data.fullName, p_slug: data.slug, p_template_slug: data.templateSlug }),
    ) as string
    if (data.locale !== 'en') unwrap(await supabase.from('websites').update({ locale: data.locale }).eq('id', websiteId))

    unwrap(await supabase.from('users').update({ onboarding_completed_at: new Date().toISOString(), full_name: data.fullName, locale: data.locale }).eq('id', viewer.userId))
    ;(await cookies()).set(SITE_COOKIE, websiteId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    return { websiteId }
  })
}

export async function checkSlug(slug: string) {
  return action(async () => {
    const supabase = await createServerSupabase()
    return unwrap(await supabase.rpc('check_slug_availability', { p_slug: slug.toLowerCase() })) as { available: boolean; reason?: string }
  })
}
