import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { AppError } from '@/lib/errors'

export const WORKSPACE_COOKIE = 'hm_ws'
export const SITE_COOKIE = 'hm_site'

export interface Viewer {
  userId: string
  email: string
  fullName: string | null
  locale: string
  isPlatformAdmin: boolean
  onboarded: boolean
  workspaceId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

/**
 * The signed-in user and their active workspace. The workspace comes from a cookie but is only
 * honoured if the user is a member (RLS returns no row otherwise); it falls back to the first one.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const [{ data: me }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('id, email, full_name, locale, is_platform_admin, onboarding_completed_at').eq('id', auth.user.id).single(),
    supabase.from('workspace_members').select('workspace_id, role, created_at').eq('user_id', auth.user.id).order('created_at'),
  ])
  if (!me || !memberships?.length) return null

  const preferred = (await cookies()).get(WORKSPACE_COOKIE)?.value
  const membership = memberships.find((m) => m.workspace_id === preferred) ?? memberships[0]
  return {
    userId: me.id,
    email: me.email,
    fullName: me.full_name,
    locale: me.locale,
    isPlatformAdmin: me.is_platform_admin,
    onboarded: !!me.onboarding_completed_at,
    workspaceId: membership.workspace_id,
    role: membership.role as Viewer['role'],
  }
})

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (viewer) return viewer
  // Signed in but the account records can't be loaded (e.g. database problem): say so instead of
  // bouncing between /login and /dashboard forever.
  const { data } = await (await createServerSupabase()).auth.getUser()
  redirect(data.user ? '/login?error=account' : '/login')
}

/** For server actions / routes: throws instead of redirecting. */
export async function assertViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) throw new AppError('UNAUTHORIZED', 'Please sign in.')
  return viewer
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer()
  if (!viewer.isPlatformAdmin) redirect('/dashboard')
  return viewer
}

/** The website the dashboard is working on (cookie-selected, membership-checked by RLS). */
export const getCurrentWebsite = cache(async () => {
  const viewer = await getViewer()
  if (!viewer) return null
  const supabase = await createServerSupabase()
  const { data: sites } = await supabase
    .from('websites')
    .select('id, name, slug, status, profile_id, template_id, published_at, locale, updated_at')
    .eq('workspace_id', viewer.workspaceId)
    .is('deleted_at', null)
    .order('created_at')
  if (!sites?.length) return null
  const preferred = (await cookies()).get(SITE_COOKIE)?.value
  return sites.find((s) => s.id === preferred) ?? sites[0]
})

export async function listWebsites(workspaceId: string) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('websites')
    .select('id, name, slug, status')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at')
  return data ?? []
}
