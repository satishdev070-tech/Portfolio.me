'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changeSlug, deleteWebsite, updateWebsiteSettings } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EditorWebsite } from './editor'

export function SettingsPanel({ website, canManage, onChange }: { website: EditorWebsite; canManage: boolean; onChange: () => void }) {
  const router = useRouter()
  const { run, pending, fieldError } = useServerAction()
  const [name, setName] = useState(website.name)
  const [locale, setLocale] = useState(website.locale)
  const [slug, setSlug] = useState(website.slug)
  const host = new URL(website.url).host.replace(`${website.slug}.`, '')

  return (
    <div className="grid gap-6">
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); run(() => updateWebsiteSettings(website.id, { name, locale }), { success: 'Settings saved', onSuccess: onChange }) }}>
        <Field label="Site name" htmlFor="site-name" hint="Shown in your dashboard."><Input id="site-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></Field>
        <Field label="Website language" htmlFor="site-lang" hint="Section headings and labels on your site.">
          <select id="site-lang" value={locale} onChange={(e) => setLocale(e.target.value)} className="h-8 rounded-lg border bg-transparent px-2 text-sm">
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </Field>
        <Button type="submit" size="lg" disabled={pending} className="justify-self-start">Save</Button>
      </form>

      {canManage ? (
        <form className="grid gap-3 border-t pt-5" onSubmit={(e) => { e.preventDefault(); if (confirm(`Change your address to ${slug}.${host}? The old address will stop working.`)) run(() => changeSlug(website.id, slug), { success: 'Address changed', onSuccess: () => { onChange(); router.refresh() } }) }}>
          <Field label="Website address" htmlFor="site-slug" error={fieldError('_')} hint="Can be changed once every 30 days. The old address stops working.">
            <div className="flex h-8 items-center overflow-hidden rounded-lg border">
              <input id="site-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} maxLength={30} className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none" />
              <span className="pr-2.5 text-xs text-muted-foreground">.{host}</span>
            </div>
          </Field>
          <Button type="submit" variant="outline" size="lg" disabled={pending || slug === website.slug} className="justify-self-start">Change address</Button>
        </form>
      ) : null}

      {canManage ? (
        <div className="grid gap-2 border-t pt-5">
          <p className="text-sm font-medium text-destructive">Delete website</p>
          <p className="text-xs text-muted-foreground">Takes the site offline and removes it from your dashboard. Your profile is kept.</p>
          <Button variant="destructive" size="lg" className="justify-self-start" disabled={pending}
            onClick={() => { if (prompt(`Type ${website.slug} to delete this website`) === website.slug) run(() => deleteWebsite(website.id), { success: 'Website deleted', onSuccess: () => router.push('/dashboard') }) }}>
            Delete website
          </Button>
        </div>
      ) : null}
    </div>
  )
}
