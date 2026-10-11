import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Integration tests run against the local stack from `supabase start` (see docs/TESTING in README).
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2]
    }
  } catch {
    /* fall back to process.env */
  }
  return { ...env, ...(process.env as Record<string, string>) }
}

const env = loadEnv()
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const opts = { auth: { persistSession: false, autoRefreshToken: false } }

export const anon = () => createClient(SUPABASE_URL, ANON_KEY, opts)
export const service = () => createClient(SUPABASE_URL, SERVICE_KEY, opts)

export interface TestUser {
  id: string
  email: string
  client: SupabaseClient
  workspaceId: string
}

let counter = 0
export async function createUser(name = 'Test User'): Promise<TestUser> {
  const email = `t${Date.now()}${counter++}${Math.random().toString(36).slice(2, 6)}@example.test`
  const client = anon()
  const { data, error } = await client.auth.signUp({
    email,
    password: 'correct-horse-battery-staple',
    options: { data: { full_name: name } },
  })
  if (error || !data.user) throw error ?? new Error('signup failed')
  const { data: ws, error: wsErr } = await client.from('workspaces').select('id').single()
  if (wsErr) throw wsErr
  return { id: data.user.id, email, client, workspaceId: ws.id }
}

export function uniqueSlug(prefix = 'site') {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Profile + website for a user. */
export async function createSite(user: TestUser, opts: { template?: string; headline?: string | null } = {}) {
  const { data: profession } = await user.client.from('professions').select('id').eq('slug', 'doctor').single()
  const { data: profile, error } = await user.client
    .from('profiles')
    .insert({
      workspace_id: user.workspaceId,
      full_name: 'Dr. Asha Rao',
      headline: opts.headline === undefined ? 'Consultant Cardiologist' : opts.headline,
      bio_short: 'Cardiologist in Pune.',
      profession_id: profession!.id,
    })
    .select('id')
    .single()
  if (error) throw error
  const slug = uniqueSlug()
  const { data: websiteId, error: wErr } = await user.client.rpc('create_website', {
    p_profile: profile.id,
    p_name: 'My site',
    p_slug: slug,
    p_template_slug: opts.template ?? 'medical-pro',
  })
  if (wErr) throw wErr
  return { profileId: profile.id as string, websiteId: websiteId as string, slug }
}

export function errorCode(err: { message?: string } | null | undefined) {
  return err?.message?.split(':')[0]
}
