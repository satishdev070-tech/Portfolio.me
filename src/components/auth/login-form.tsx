'use client'
import { useState } from 'react'
import { signIn, sendMagicLink } from '@/app/actions/auth'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const { run, pending, fieldError } = useServerAction()

  if (linkSent) {
    return <p role="status" className="mt-6 rounded-lg border bg-card p-4 text-sm">Check <strong>{email}</strong> for a sign-in link.</p>
  }
  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(e) => { e.preventDefault(); run(() => signIn({ email, password, next })) }}
    >
      <Field label="Email" htmlFor="email" error={fieldError('email')}>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
      </Field>
      <Field label="Password" htmlFor="password" error={fieldError('password')}>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
      </Field>
      <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
      <Button
        type="button" variant="outline" size="lg" className="h-10" disabled={pending || !email}
        onClick={() => run(() => sendMagicLink({ email }), { onSuccess: () => setLinkSent(true) })}
      >
        Email me a sign-in link
      </Button>
    </form>
  )
}
