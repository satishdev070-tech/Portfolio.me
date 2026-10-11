'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Sparkles } from 'lucide-react'
import { updateSeo } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SeoConfig } from '@/site/types'

export function SeoForm({ websiteId, seo, url, defaults, advanced, schemaType }: { websiteId: string; seo: SeoConfig; url: string; defaults: { title: string; description: string; image: string | null }; advanced: boolean; schemaType: string }) {
  const router = useRouter()
  const { run, pending, fieldError } = useServerAction()
  const [v, setV] = useState({ title: seo.title ?? '', description: seo.description ?? '', keywords: (seo.keywords ?? []).join(', '), og_description: seo.og_description ?? '', og_image_url: seo.og_image_url ?? '', canonical_url: seo.canonical_url ?? '', noindex: !!seo.noindex })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })
  const title = v.title || defaults.title
  const desc = v.description || defaults.description
  const lock = advanced ? null : <span className="ml-1 inline-flex items-center gap-1 text-xs font-normal text-brand"><Lock className="size-3" /> Basic plan</span>

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form className="panel grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); run(() => updateSeo(websiteId, { ...v, ...(advanced ? {} : { og_image_url: '', canonical_url: '', keywords: '', og_description: '' }) }), { success: 'SEO saved. Publish to apply.', onSuccess: () => router.refresh() }) }}>
        <div className="flex items-center justify-between"><h2 className="font-medium">Search</h2><Link href="/ai?task=seo_generation" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"><Sparkles className="size-3.5" /> Write with AI</Link></div>
        <Field label="Title" htmlFor="seo-title" hint={`${title.length}/60 recommended · Default: ${defaults.title}`} error={fieldError('title')}><Input id="seo-title" value={v.title} onChange={set('title')} maxLength={70} placeholder={defaults.title} /></Field>
        <Field label="Description" htmlFor="seo-desc" hint={`${desc.length}/155 recommended`} error={fieldError('description')}><Textarea id="seo-desc" rows={3} value={v.description} onChange={set('description')} maxLength={170} placeholder={defaults.description} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.noindex} onChange={(e) => setV({ ...v, noindex: e.target.checked })} /> Hide my site from search engines (noindex)</label>

        <h2 className="mt-2 font-medium">Advanced {lock}</h2>
        <fieldset disabled={!advanced} className="grid gap-4 disabled:opacity-60">
          <Field label="Keywords" htmlFor="seo-kw" hint="Comma separated."><Input id="seo-kw" value={v.keywords} onChange={set('keywords')} /></Field>
          <Field label="Social sharing description" htmlFor="seo-og"><Textarea id="seo-og" rows={2} value={v.og_description} onChange={set('og_description')} maxLength={200} /></Field>
          <Field label="Social sharing image URL" htmlFor="seo-img" hint="1200×630 works best. Upload in Media and paste the link." error={fieldError('og_image_url')}><Input id="seo-img" type="url" value={v.og_image_url} onChange={set('og_image_url')} placeholder="https://" /></Field>
          <Field label="Canonical URL" htmlFor="seo-can" hint="Only if this content lives primarily elsewhere." error={fieldError('canonical_url')}><Input id="seo-can" type="url" value={v.canonical_url} onChange={set('canonical_url')} placeholder={url} /></Field>
        </fieldset>
        <div className="flex justify-end border-t pt-4"><Button type="submit" size="lg" disabled={pending}>{pending ? 'Saving…' : 'Save SEO'}</Button></div>
      </form>

      <aside className="grid content-start gap-4">
        <div className="panel p-4">
          <p className="eyebrow mb-3">Search preview</p>
          <p className="truncate text-xs text-muted-foreground">{url.replace(/^https?:\/\//, '')}</p>
          <p className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{desc}</p>
        </div>
        <div className="panel overflow-hidden">
          <p className="eyebrow p-4 pb-3">Social preview</p>
          {(advanced && v.og_image_url) || defaults.image ? <img src={(advanced && v.og_image_url) || defaults.image!} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <div className="aspect-[1.91/1] bg-muted" />}
          <div className="p-4"><p className="line-clamp-1 text-sm font-medium">{title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{(advanced && v.og_description) || desc}</p></div>
        </div>
        <div className="panel p-4 text-sm">
          <p className="eyebrow mb-2">Included automatically</p>
          <ul className="grid gap-1 text-muted-foreground">
            <li>Structured data: <span className="text-foreground">{schemaType === 'Person' ? 'Person' : `Person + ${schemaType} (when a practice location is listed)`}</span></li>
            <li>Canonical URL, Open Graph and X/Twitter cards</li>
            <li><a href={`${url}/sitemap.xml`} target="_blank" rel="noopener" className="underline">sitemap.xml</a> and <a href={`${url}/robots.txt`} target="_blank" rel="noopener" className="underline">robots.txt</a></li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
