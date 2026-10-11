'use client'
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, FileText, ImagePlus, Images, Loader2, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { addToProfileMedia, removeProfileMedia, updateAltText } from '@/app/actions/media'
import { uploadFile } from '@/components/app/image-upload'
import { useServerAction } from '@/components/app/use-server-action'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Asset = { id: string; public_url: string | null; mime_type: string; size_bytes: number; width: number | null; height: number | null; alt_text: string | null; purpose: string; original_name: string | null; created_at: string }
type Item = { id: string; kind: string; media_asset_id: string | null; external_url: string | null; title: string | null }

const mb = (b: number) => (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)

export function MediaLibrary({ assets, items, usedBytes, limitMb }: { assets: Asset[]; items: Item[]; usedBytes: number; limitMb: number }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [video, setVideo] = useState('')
  const { run, pending } = useServerAction()
  const inGallery = new Map(items.filter((i) => i.media_asset_id).map((i) => [i.media_asset_id!, i.id]))
  const pct = limitMb > 0 ? Math.min(100, (usedBytes / (limitMb * 1024 * 1024)) * 100) : 0

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    for (const f of Array.from(files).slice(0, 10)) {
      const r = await uploadFile(f, 'gallery')
      if (!r.success) { toast.error(`${f.name}: ${r.error.message}`); break }
    }
    setBusy(false)
    router.refresh()
  }
  const remove = async (a: Asset) => {
    if (!confirm('Delete this file? It will disappear from your website after you publish.')) return
    const res = await (await fetch(`/api/media/${a.id}`, { method: 'DELETE' })).json()
    if (res.success) { toast.success('Deleted'); router.refresh() } else toast.error(res.error.message)
  }

  return (
    <div className="grid gap-6">
      <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-56">
          <p className="text-sm font-medium">Storage</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{mb(usedBytes)} MB of {limitMb === -1 ? 'unlimited' : `${limitMb} MB`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => addToProfileMedia({ videoUrl: video }), { success: 'Video added', onSuccess: () => { setVideo(''); router.refresh() } }) }}>
            <Input type="url" placeholder="YouTube or Vimeo link" value={video} onChange={(e) => setVideo(e.target.value)} className="h-9 w-56" aria-label="Video link" />
            <Button type="submit" variant="outline" size="lg" disabled={pending || !video}><Video /> Add video</Button>
          </form>
          <Button size="lg" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload images</Button>
          <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
        </div>
      </div>

      {assets.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <li key={a.id} className="panel overflow-hidden">
              {a.mime_type.startsWith('image/') && a.public_url ? <img src={a.public_url} alt={a.alt_text ?? ''} className="aspect-square w-full object-cover" loading="lazy" /> : <div className="grid aspect-square place-items-center bg-muted"><FileText className="size-8 text-muted-foreground" /></div>}
              <div className="grid gap-2 p-2.5">
                <Input defaultValue={a.alt_text ?? ''} placeholder="Describe the image (alt text)" aria-label="Alt text" className="h-7 text-xs"
                  onBlur={(e) => { if (e.target.value !== (a.alt_text ?? '')) run(() => updateAltText(a.id, e.target.value), { success: 'Alt text saved' }) }} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.width ? `${a.width}×${a.height} · ` : ''}{mb(a.size_bytes)} MB</span>
                  <span className="flex gap-0.5">
                    {a.public_url ? <button type="button" className="rounded p-1 hover:bg-muted" aria-label="Copy link" title="Copy link" onClick={() => { navigator.clipboard.writeText(a.public_url!); toast.success('Link copied') }}><Copy className="size-3.5" /></button> : null}
                    {a.mime_type.startsWith('image/') ? (
                      inGallery.has(a.id)
                        ? <button type="button" className="rounded p-1 text-brand hover:bg-muted" title="Remove from gallery" aria-label="Remove from gallery" onClick={() => run(() => removeProfileMedia(inGallery.get(a.id)!), { success: 'Removed from gallery', onSuccess: () => router.refresh() })}><Images className="size-3.5" /></button>
                        : <button type="button" className="rounded p-1 hover:bg-muted" title="Add to gallery" aria-label="Add to gallery" onClick={() => run(() => addToProfileMedia({ assetId: a.id }), { success: 'Added to gallery', onSuccess: () => router.refresh() })}><Images className="size-3.5" /></button>
                    ) : null}
                    <button type="button" className="rounded p-1 hover:bg-muted hover:text-destructive" aria-label="Delete" title="Delete" onClick={() => remove(a)}><Trash2 className="size-3.5" /></button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ImagePlus} title="No media yet" body="Upload photos of your work, clinic, events or projects. They’ll appear in your Gallery section." actions={<Button size="lg" onClick={() => input.current?.click()}><ImagePlus /> Upload images</Button>} />
      )}

      {items.some((i) => i.kind === 'video') ? (
        <section>
          <h2 className="mb-2 text-sm font-medium">Videos</h2>
          <ul className="panel divide-y text-sm">
            {items.filter((i) => i.kind === 'video').map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">{i.title || i.external_url}</span>
                <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => run(() => removeProfileMedia(i.id), { success: 'Video removed', onSuccess: () => router.refresh() })}>Remove</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
