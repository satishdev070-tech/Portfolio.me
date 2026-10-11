'use client'
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Result } from '@/lib/errors'
import { cn } from '@/lib/utils'

export async function uploadFile(file: File, purpose: string): Promise<Result<{ id: string; public_url: string | null }>> {
  const body = new FormData()
  body.set('file', file)
  body.set('purpose', purpose)
  const res = await fetch('/api/media/upload', { method: 'POST', body })
  return res.json()
}

/** Upload an image and return its public URL. */
export function ImageUpload({ value, onChange, purpose, label, shape = 'square' }: { value: string | null; onChange: (url: string | null) => void; purpose: string; label: string; shape?: 'square' | 'circle' | 'wide' }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    const r = await uploadFile(file, purpose)
    setBusy(false)
    if (r.success && r.data.public_url) { onChange(r.data.public_url); toast.success('Image uploaded') }
    else if (!r.success) toast.error(r.error.message)
  }
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => input.current?.click()} disabled={busy} aria-label={label}
        className={cn('relative grid shrink-0 place-items-center overflow-hidden border bg-muted text-muted-foreground hover:border-foreground/40',
          shape === 'circle' ? 'size-20 rounded-full' : shape === 'wide' ? 'aspect-[3/1] w-48 rounded-lg' : 'size-20 rounded-lg')}>
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5" />}
        {busy ? <span className="absolute inset-0 grid place-items-center bg-background/70"><Loader2 className="size-5 animate-spin" /></span> : null}
      </button>
      <div className="text-sm">
        <button type="button" className="font-medium hover:underline" onClick={() => input.current?.click()} disabled={busy}>{value ? 'Replace' : 'Upload'} {label.toLowerCase()}</button>
        {value ? <button type="button" className="ml-3 text-muted-foreground hover:text-foreground" onClick={() => onChange(null)}>Remove</button> : null}
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Optimized automatically.</p>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
