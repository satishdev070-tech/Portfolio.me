import { createServerSupabase } from '@/lib/supabase/server'

export default async function AdminDomains() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('domains').select('id, domain, status, ssl_status, verified_at, last_checked_at, last_error, websites(slug)').neq('status', 'removed').order('created_at', { ascending: false }).limit(200)
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-3 font-medium">Domain</th><th className="font-medium">Site</th><th className="font-medium">Status</th><th className="font-medium">SSL</th><th className="font-medium">Last check</th></tr></thead>
        <tbody>{(data ?? []).map((d) => (
          <tr key={d.id} className="border-t"><td className="p-3 font-medium">{d.domain}</td><td>{(d.websites as { slug: string } | null)?.slug}</td><td>{d.status}</td><td>{d.ssl_status}</td><td className="text-xs text-muted-foreground" title={d.last_error ?? undefined}>{d.last_checked_at ? new Date(d.last_checked_at).toLocaleString('en-IN') : '—'}</td></tr>
        ))}{!data?.length ? <tr><td colSpan={5} className="p-3 text-muted-foreground">No custom domains.</td></tr> : null}</tbody>
      </table>
    </div>
  )
}
