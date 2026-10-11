'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ExternalLink, Rocket, X } from 'lucide-react'
import { publishWebsite, unpublishWebsite, validateForPublish, type PublishCheck } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { DevicePreview } from '@/components/device-preview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SectionType } from '@/lib/catalog'
import type { ThemeOverrides, ThemeTokens } from '@/site/types'
import { SectionsPanel, type EditorSection } from './sections-panel'
import { DesignPanel } from './design-panel'
import { VersionsPanel, type Version } from './versions-panel'
import { SettingsPanel } from './settings-panel'

export interface EditorWebsite {
  id: string; name: string; slug: string; status: string; locale: string; url: string
  published_version_id: string | null; slug_changed_at: string | null; published_at: string | null; updated_at: string
}

const TABS = [['sections', 'Sections'], ['design', 'Design'], ['versions', 'Versions'], ['settings', 'Settings']] as const
type Tab = (typeof TABS)[number][0]

export function Editor(props: {
  initialTab: Tab; welcome: boolean; website: EditorWebsite; sections: EditorSection[]; sectionTypes: SectionType[]
  template: { slug: string; name: string; tier: string } | null; templateTokens: ThemeTokens; theme: ThemeOverrides; versions: Version[]
  canAdvancedSections: boolean; canPremium: boolean; canManage: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(props.initialTab)
  const [reloadKey, setReloadKey] = useState(0)
  const [check, setCheck] = useState<PublishCheck | null>(null)
  const { run, pending } = useServerAction()
  const changed = () => { setReloadKey((k) => k + 1); router.refresh() }
  const live = props.website.status === 'published'

  const startPublish = () => run(() => validateForPublish(props.website.id), { onSuccess: (c) => setCheck(c) })
  const publish = () =>
    run(() => publishWebsite(props.website.id), {
      onSuccess: (r) => {
        if (r.published) { setCheck(null); changed() }
        else setCheck(r)
      },
      success: undefined,
    }).then((r) => { if (r.success && r.data.published) toastLive(props.website.url) })

  return (
    <div className="-mx-4 -my-8 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-mx-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate font-semibold">{props.website.name}</h1>
          {live ? <Badge className="bg-success/15 text-success">Live</Badge> : <Badge variant="secondary">{props.website.status === 'unpublished' ? 'Offline' : 'Draft'}</Badge>}
          {props.template ? <span className="hidden text-sm text-muted-foreground md:inline">· {props.template.name} <Link href="/templates" className="underline-offset-4 hover:underline">Change</Link></span> : null}
        </div>
        <div className="flex items-center gap-2">
          {live ? <a href={props.website.url} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" /> View live</a> : null}
          {live && props.canManage ? <Button variant="ghost" size="lg" disabled={pending} onClick={() => { if (confirm('Take your website offline? Visitors will see “not found” until you publish again.')) run(() => unpublishWebsite(props.website.id), { success: 'Website is offline', onSuccess: changed }) }}>Unpublish</Button> : null}
          <Button size="lg" disabled={pending} onClick={startPublish}><Rocket /> {live ? 'Publish changes' : 'Publish'}</Button>
        </div>
      </div>

      {props.welcome ? (
        <div className="border-b bg-brand-soft px-4 py-2.5 text-sm sm:px-6">
          Your draft is ready. Add details in <Link href="/profile" className="font-medium underline">Profile</Link>, arrange sections here, then publish. Nothing is public until you do.
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[23rem_1fr]">
        <div className="min-h-0 overflow-y-auto border-b bg-card lg:border-b-0 lg:border-r">
          <div role="tablist" aria-label="Editor" className="sticky top-0 z-10 flex border-b bg-card px-2">
            {TABS.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={cn('-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground', tab === key && 'border-foreground font-medium text-foreground')}>
                {label}
              </button>
            ))}
          </div>
          <div className="p-4" role="tabpanel">
            {tab === 'sections' && <SectionsPanel websiteId={props.website.id} sections={props.sections} sectionTypes={props.sectionTypes} canAdvanced={props.canAdvancedSections} onChange={changed} />}
            {tab === 'design' && <DesignPanel websiteId={props.website.id} base={props.templateTokens} theme={props.theme} onChange={changed} />}
            {tab === 'versions' && <VersionsPanel websiteId={props.website.id} versions={props.versions} liveVersionId={props.website.published_version_id} onChange={changed} />}
            {tab === 'settings' && <SettingsPanel website={props.website} canManage={props.canManage} onChange={changed} />}
          </div>
        </div>
        <div className="min-h-[70vh] p-3 sm:p-4">
          <DevicePreview src={`/preview/site/${props.website.id}`} title="Website preview (draft)" reloadKey={reloadKey} className="h-full"
            toolbar={<span className="hidden text-xs text-muted-foreground sm:inline">Draft preview</span>} />
        </div>
      </div>

      {check ? <PublishDialog check={check} pending={pending} premium={props.template?.tier === 'premium' && !props.canPremium} onClose={() => setCheck(null)} onPublish={publish} /> : null}
    </div>
  )
}

function toastLive(url: string) {
  import('sonner').then(({ toast }) => toast.success('Your website is live', { action: { label: 'Open', onClick: () => window.open(url, '_blank', 'noopener') } }))
}

function PublishDialog({ check, pending, premium, onClose, onPublish }: { check: PublishCheck; pending: boolean; premium: boolean; onClose: () => void; onPublish: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-h">
      <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-(--shadow-pop)">
        <div className="flex items-start justify-between">
          <h2 id="publish-h" className="text-lg font-semibold">{check.ok ? 'Ready to publish' : 'A few things to fix first'}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <ul className="mt-4 grid gap-2 text-sm">
          {check.errors.map((e, i) => (
            <li key={`e${i}`} className="flex gap-2 rounded-lg bg-destructive/10 p-2.5 text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{e.message}{e.feature ? <> <Link href="/billing" className="font-medium underline">See plans</Link></> : null}{e.field === 'headline' ? <> <Link href="/profile" className="font-medium underline">Edit profile</Link></> : null}</span>
            </li>
          ))}
          {check.warnings.map((w, i) => <li key={`w${i}`} className="flex gap-2 rounded-lg bg-warning/15 p-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{w.message}</li>)}
          {check.ok && !check.warnings.length ? <li className="flex gap-2 rounded-lg bg-success/10 p-2.5"><CheckCircle2 className="size-4 text-success" />Everything looks good.</li> : null}
        </ul>
        {premium ? <p className="mt-3 text-xs text-muted-foreground">Tip: you can switch to a free template in the marketplace and publish right away.</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="lg" onClick={onClose}>Cancel</Button>
          {check.ok ? <Button size="lg" disabled={pending} onClick={onPublish}>{pending ? 'Publishing…' : 'Publish now'}</Button> : null}
        </div>
      </div>
    </div>
  )
}
