import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = { title: 'Create your account' }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ template?: string; profession?: string; plan?: string }> }) {
  const sp = await searchParams
  const params = new URLSearchParams()
  for (const k of ['template', 'profession', 'plan'] as const) if (sp[k] && /^[a-z0-9-]+$/.test(sp[k]!)) params.set(k, sp[k]!)
  const next = `/onboarding${params.size ? `?${params}` : ''}`
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your website</h1>
      <p className="mt-1 text-sm text-muted-foreground">Free forever on your own HelloMe address. No card needed.</p>
      <SignupForm next={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link></p>
      <p className="mt-4 text-center text-xs text-muted-foreground">By continuing you agree to the Terms and Privacy Policy.</p>
    </>
  )
}
