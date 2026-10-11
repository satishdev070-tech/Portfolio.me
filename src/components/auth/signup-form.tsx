'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignupForm({ next }: { next: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [confirm, setConfirm] = useState(false)
  const { run, pending, fieldError } = useServerAction()
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  if (confirm) {
    return <p role="status" className="mt-6 rounded-lg border bg-card p-4 text-sm">We sent a confirmation link to <strong>{form.email}</strong>. Open it to continue setting up your website.</p>
  }
  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => signUp(form), {
          onSuccess: (d) => (d.needsConfirmation ? setConfirm(true) : (router.push(next), router.refresh())),
        })
      }}
    >
      <Field label="Full name" htmlFor="fullName" error={fieldError('_')}>
        <Input id="fullName" autoComplete="name" required value={form.fullName} onChange={set('fullName')} className="h-10" />
      </Field>
      <Field label="Email" htmlFor="email" error={fieldError('email')}>
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} className="h-10" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters." error={fieldError('password')}>
        <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set('password')} className="h-10" />
      </Field>
      <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</Button>
    </form>
  )
}
