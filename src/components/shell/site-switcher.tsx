'use client'
import { useRouter } from 'next/navigation'
import { selectWebsite } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'

export function SiteSwitcher({ sites, currentId }: { sites: { id: string; name: string; slug: string }[]; currentId: string }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  if (sites.length < 2) return null
  return (
    <select
      aria-label="Current website"
      disabled={pending}
      value={currentId}
      onChange={(e) => run(() => selectWebsite(e.target.value), { onSuccess: () => router.refresh() })}
      className="h-8 max-w-48 truncate rounded-md border bg-card px-2 text-sm"
    >
      {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  )
}
