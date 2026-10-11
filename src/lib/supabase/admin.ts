import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import type { Database } from './database.types'

/**
 * Service-role client. Bypasses RLS: use only for the narrow operations that are granted to
 * service_role (AI reserve/settle, domain verification results, billing, analytics ingestion),
 * always after the caller has been authenticated and authorized in the route.
 */
export function createServiceSupabase() {
  return createClient<Database>(publicEnv.supabaseUrl, serverEnv.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Anonymous client for public reads (published sites, catalog). Cacheable: no cookies. */
export function createPublicSupabase() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
