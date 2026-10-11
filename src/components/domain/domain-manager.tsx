'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Globe, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addDomain, removeDomain } from '@/app/actions/website'
import { verifyDomain } from '@/app/actions/domains'
import { useServerAction } from '@/components/app/use-server-action'
import { EmptyState } from '@/components/app/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type D = { id: string; domain: string; status: string; ssl_status: string; verified_at: string | null; last_checked_at: string | null; last_error: string | null; is_primary: boolean; records: { type: string; host: string; value: string }[] }

const STATUS: Record<string, [string, string]> = { pending: ['Waiting for DNS', 'bg-muted text-muted-foreground'], verifying: ['Checking', 'bg-muted'], active: ['Connected', 'bg-success/15 text-success'], failed: ['Not verified yet', 'bg-warning/15 text-foreground'] }

export function DomainManager({ websiteId, domains, limit, canManage }: { websiteId: string; domains: D[]; limit: number; canManage: boolean }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const { run, pending } = useServerAction()
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success('Copied') }
  const atLimit = limit !== -1 && domains.length >= limit

  return (
    <div className="grid gap-6">
      {canManage && !atLimit ? (
        <form className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); run(() => addDomain(websiteId, value), { success: 'Domain added. Now update your DNS.', onSuccess: () => { setValue(''); router.refresh() } }) }}>
          <label className="grid flex-1 gap-1.5"><span className="field-label">Your domain</span>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="www.yourname.com" required className="h-10" /></label>
          <Button type="submit" size="lg" className="h-10" disabled={pending}>Connect domain</Button>
        </form>
      ) : null}

      {domains.length ? domains.map((d) => {
        const [label, cls] = STATUS[d.status] ?? [d.status, 'bg-muted']
        return (
          <section key={d.id} className="panel p-5" aria-label={d.domain}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" /><span className="font-medium">{d.domain}</span><Badge className={cls}>{label}</Badge>
                {d.status === 'active' ? <Badge variant="outline">HTTPS {d.ssl_status === 'active' ? 'on' : 'provisioning'}</Badge> : null}</div>
              {canManage ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" disabled={pending} onClick={() => run(() => verifyDomain(d.id), { onSuccess: (r) => { if (r.verified) toast.success('Domain verified and connected'); else toast.error(r.details[0] ?? 'Not verified yet'); router.refresh() } })}><RefreshCw /> {d.status === 'active' ? 'Re-check' : 'Verify DNS'}</Button>
                  <Button variant="ghost" size="lg" disabled={pending} aria-label="Remove domain" onClick={() => { if (confirm(`Disconnect ${d.domain}?`)) run(() => removeDomain(websiteId, d.id), { success: 'Domain removed', onSuccess: () => router.refresh() }) }}><Trash2 /></Button>
                </div>
              ) : null}
            </div>
            {d.status !== 'active' ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">Add these records at your domain provider (GoDaddy, Namecheap, Cloudflare, BigRock…), then click Verify. DNS changes can take up to an hour.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 font-medium">Type</th><th className="font-medium">Name / host</th><th className="font-medium">Value</th></tr></thead>
                    <tbody>{d.records.map((r) => (
                      <tr key={r.type} className="border-t">
                        <td className="py-2 font-mono text-xs">{r.type}</td>
                        <td className="font-mono text-xs"><button type="button" onClick={() => copy(r.host)} className="inline-flex items-center gap-1 hover:underline">{r.host}<Copy className="size-3" /></button></td>
                        <td className="font-mono text-xs"><button type="button" onClick={() => copy(r.value)} className="inline-flex items-center gap-1 break-all text-left hover:underline">{r.value}<Copy className="size-3 shrink-0" /></button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {d.last_error ? <p className="mt-3 text-sm text-muted-foreground">Last check: {d.last_error}</p> : null}
              </>
            ) : <p className="mt-3 text-sm text-muted-foreground">Verified {d.verified_at ? new Date(d.verified_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}. Your site is served at https://{d.domain}{d.is_primary ? ' (primary)' : ''}.</p>}
          </section>
        )
      }) : <EmptyState icon={Globe} title="No custom domain yet" body="Buy a domain from any registrar, then connect it here. We’ll show you exactly which DNS records to add." />}
    </div>
  )
}
