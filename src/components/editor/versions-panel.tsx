'use client'
import { useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import { restoreVersion, saveCheckpoint } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface Version { id: string; version_number: number; kind: string; note: string | null; created_at: string }

export function VersionsPanel({ websiteId, versions, liveVersionId, onChange }: { websiteId: string; versions: Version[]; liveVersionId: string | null; onChange: () => void }) {
  const { run, pending } = useServerAction()
  const [note, setNote] = useState('')
  return (
    <div className="grid gap-5">
      <p className="text-xs text-muted-foreground">Every publish is saved as a version. Save a checkpoint before big changes. Restoring brings back the template, design, SEO and sections; your profile content isn’t changed.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => saveCheckpoint(websiteId, note || undefined), { success: 'Checkpoint saved', onSuccess: () => { setNote(''); onChange() } }) }}>
        <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} aria-label="Checkpoint note" />
        <Button type="submit" variant="outline" disabled={pending}>Save</Button>
      </form>
      {versions.length ? (
        <ol className="grid gap-1.5">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              <History className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  v{v.version_number}
                  {v.id === liveVersionId ? <Badge className="bg-success/15 text-success">Live</Badge> : <span className="text-xs font-normal text-muted-foreground">{v.kind === 'published' ? 'Published' : 'Checkpoint'}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}{v.note ? ` · ${v.note}` : ''}</p>
              </div>
              {v.id !== liveVersionId ? (
                <Button size="sm" variant="ghost" disabled={pending} title={v.kind === 'published' ? 'Make this version live again' : 'Restore this draft'}
                  onClick={() => { if (confirm(v.kind === 'published' ? `Roll back your live site to v${v.version_number}?` : `Restore draft from v${v.version_number}?`)) run(() => restoreVersion(websiteId, v.id, v.kind === 'published'), { success: 'Version restored', onSuccess: onChange }) }}>
                  <RotateCcw /> {v.kind === 'published' ? 'Roll back' : 'Restore'}
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
      ) : <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No versions yet. Publishing creates the first one.</p>}
    </div>
  )
}
