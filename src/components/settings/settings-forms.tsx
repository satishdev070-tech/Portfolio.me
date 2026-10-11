'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword, updateAccount } from '@/app/actions/account'
import { createAdditionalWebsite } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slugify } from '@/lib/validation/schemas'

export function AccountForm({ fullName, locale, workspaceName, canRename, email }: { fullName: string; locale: string; workspaceName: string; canRename: boolean; email: string }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  const [v, setV] = useState({ full_name: fullName, locale, workspace_name: workspaceName })
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => updateAccount(canRename ? v : { full_name: v.full_name, locale: v.locale }), { success: 'Saved', onSuccess: () => router.refresh() }) }}>
      <Field label="Name" htmlFor="acc-name"><Input id="acc-name" value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></Field>
      <Field label="Email" htmlFor="acc-email" hint="Contact support to change your sign-in email."><Input id="acc-email" value={email} disabled /></Field>
      <Field label="Dashboard language" htmlFor="acc-lang"><select id="acc-lang" value={v.locale} onChange={(e) => setV({ ...v, locale: e.target.value })} className="h-8 rounded-lg border bg-transparent px-2 text-sm"><option value="en">English</option><option value="hi">हिन्दी</option></select></Field>
      {canRename ? <Field label="Workspace name" htmlFor="acc-ws"><Input id="acc-ws" value={v.workspace_name} onChange={(e) => setV({ ...v, workspace_name: e.target.value })} /></Field> : null}
      <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={pending}>Save</Button></div>
    </form>
  )
}

export function PasswordForm() {
  const [pw, setPw] = useState('')
  const { run, pending, fieldError } = useServerAction()
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); run(() => changePassword(pw), { success: 'Password changed', onSuccess: () => setPw('') }) }}>
      <Field label="New password" htmlFor="pw" error={fieldError('_')} className="flex-1"><Input id="pw" type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Button type="submit" size="lg" disabled={pending || pw.length < 8}>Change password</Button>
    </form>
  )
}

export function NewWebsiteForm({ templates }: { templates: { slug: string; name: string }[] }) {
  const router = useRouter()
  const [v, setV] = useState({ name: '', slug: '', templateSlug: templates[0]?.slug ?? '' })
  const { run, pending, fieldError } = useServerAction()
  return (
    <form className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(() => createAdditionalWebsite(v), { success: 'Website created', onSuccess: () => router.push('/editor') }) }}>
      <Field label="Name" htmlFor="nw-name"><Input id="nw-name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value, slug: v.slug || slugify(e.target.value) })} /></Field>
      <Field label="Address" htmlFor="nw-slug" error={fieldError('_')}><Input id="nw-slug" required value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value.toLowerCase() })} /></Field>
      <Field label="Template" htmlFor="nw-tpl"><select id="nw-tpl" value={v.templateSlug} onChange={(e) => setV({ ...v, templateSlug: e.target.value })} className="h-8 rounded-lg border bg-transparent px-2 text-sm">{templates.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></Field>
      <div className="sm:col-span-3"><Button type="submit" variant="outline" size="lg" disabled={pending}>Add website</Button></div>
    </form>
  )
}
