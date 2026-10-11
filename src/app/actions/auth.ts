'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { action, AppError } from '@/lib/errors'
import { parseInput } from '@/lib/validation/schemas'
import { publicEnv } from '@/lib/env'

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
})

/** Only same-origin relative paths are allowed as post-login destinations (no open redirects). */
function safeNext(next: unknown) {
  return typeof next === 'string' && /^\/(?!\/)[\w\-/?=&.%]*$/.test(next) ? next : '/dashboard'
}

export async function signUp(input: { email: string; password: string; fullName: string }) {
  return action(async () => {
    const { email, password } = parseInput(credentials, input)
    const fullName = parseInput(z.string().trim().min(1, 'Your name is required').max(120), input.fullName)
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${publicEnv.appUrl}/auth/callback?next=/onboarding` },
    })
    if (error) throw new AppError(error.status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR', error.message)
    // When email confirmation is on, there is no session yet.
    return { needsConfirmation: !data.session }
  })
}

export async function signIn(input: { email: string; password: string; next?: string }) {
  const result = await action(async () => {
    const { email, password } = parseInput(credentials.extend({ password: z.string().min(1, 'Enter your password') }), input)
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new AppError(error.status === 429 ? 'RATE_LIMITED' : 'UNAUTHORIZED', 'Email or password is incorrect.')
    return true
  })
  if (result.success) redirect(safeNext(input.next))
  return result
}

export async function sendMagicLink(input: { email: string }) {
  return action(async () => {
    const { email } = parseInput(credentials.pick({ email: true }), input)
    const supabase = await createServerSupabase()
    const origin = (await headers()).get('origin') ?? publicEnv.appUrl
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } })
    if (error) throw new AppError(error.status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR', error.message)
    return true
  })
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/')
}
