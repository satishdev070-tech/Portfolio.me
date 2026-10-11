import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to edit and publish your website.</p>
      {sp.error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">That sign-in link didn’t work or has expired. Please try again.</p> : null}
      <LoginForm next={sp.next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">Create a free account</Link></p>
    </>
  )
}
