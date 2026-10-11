'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyTemplate } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'

export function ApplyTemplateForm({ websiteId, templateSlug }: { websiteId: string; templateSlug: string }) {
  const router = useRouter()
  const [keepDesign, setKeepDesign] = useState(false)
  const { run, pending } = useServerAction()
  return (
    <div className="mt-6 grid gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={keepDesign} onChange={(e) => setKeepDesign(e.target.checked)} />
        Keep my colour and font changes
      </label>
      <div className="flex gap-2">
        <Button size="lg" disabled={pending} onClick={() => run(() => applyTemplate(websiteId, templateSlug, !keepDesign), { success: 'Template applied', onSuccess: () => router.push('/editor') })}>
          {pending ? 'Applying…' : 'Apply template'}
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  )
}
