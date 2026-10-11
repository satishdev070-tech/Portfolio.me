'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, Code2, FileText, Globe, Image as ImageIcon, Info, Loader2, Type } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Result } from '@/lib/errors'
import { cn } from '@/lib/utils'

type Source = { key: string; name: string; input_kind: string; guidance: string | null }
const ICON: Record<string, typeof FileText> = { resume_pdf: FileText, resume_docx: FileText, linkedin_pdf: BriefcaseBusiness, website_url: Globe, github_url: Code2, text: Type, image: ImageIcon }
const ACCEPT: Record<string, string> = { resume_pdf: 'application/pdf', linkedin_pdf: 'application/pdf', resume_docx: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', image: 'image/jpeg,image/png,image/webp' }

export function ImportForm({ sources }: { sources: Source[] }) {
  const router = useRouter()
  const [key, setKey] = useState(sources[0]?.key ?? 'resume_pdf')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const source = sources.find((s) => s.key === key)

  const submit = async () => {
    const body = new FormData()
    body.set('source', key)
    if (source?.input_kind === 'file') { if (!file) return toast.error('Choose a file first'); body.set('file', file) }
    if (source?.input_kind === 'url') body.set('url', url)
    if (source?.input_kind === 'text') body.set('text', text)
    setBusy(true)
    try {
      const res: Result<{ id: string }> = await (await fetch('/api/imports', { method: 'POST', body })).json()
      if (res.success) router.push(`/import/${res.data.id}`)
      else toast.error(res.error.message)
    } catch {
      toast.error('Import failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div role="radiogroup" aria-label="Import source" className="grid content-start gap-1.5">
        {sources.map((s) => {
          const Icon = ICON[s.key] ?? FileText
          return (
            <button key={s.key} type="button" role="radio" aria-checked={key === s.key} onClick={() => { setKey(s.key); setFile(null) }}
              className={cn('flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm hover:border-foreground/30', key === s.key && 'border-foreground ring-1 ring-foreground')}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />{s.name}
            </button>
          )
        })}
      </div>

      <form className="panel grid content-start gap-4 p-5" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <h2 className="font-medium">{source?.name}</h2>
        {source?.guidance ? <p className="flex gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />{source.guidance}</p> : null}
        {source?.input_kind === 'file' ? (
          <label className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center text-sm hover:border-foreground/30">
            <FileText className="size-6 text-muted-foreground" />
            {file ? <span className="font-medium">{file.name}</span> : <span><span className="font-medium">Choose a file</span> or drop it here</span>}
            <span className="text-xs text-muted-foreground">Up to 15 MB. Files are read once and not stored.</span>
            <input type="file" className="sr-only" accept={ACCEPT[key]} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        ) : null}
        {source?.input_kind === 'url' ? <Input type="url" required placeholder={key === 'github_url' ? 'https://github.com/yourname' : 'https://yourwebsite.com'} value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link" className="h-10" /> : null}
        {source?.input_kind === 'text' ? <Textarea rows={10} required value={text} onChange={(e) => setText(e.target.value)} maxLength={60000} aria-label="Text to import" placeholder="Paste your CV or describe your work…" /> : null}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs text-muted-foreground">Uses AI credits when AI extraction is available.</span>
          <Button type="submit" size="lg" disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Reading…</> : 'Import'}</Button>
        </div>
      </form>
    </div>
  )
}
