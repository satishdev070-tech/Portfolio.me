import { createServerSupabase } from '@/lib/supabase/server'

export default async function AdminAudit() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('audit_logs').select('id, action, entity_type, metadata, created_at, actor_user_id, workspace_id').order('created_at', { ascending: false }).limit(200)
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[48rem] text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="p-3 font-medium">When</th><th className="font-medium">Action</th><th className="font-medium">Details</th></tr></thead>
        <tbody>{(data ?? []).map((a) => (
          <tr key={a.id} className="border-t align-top"><td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('en-IN')}</td><td className="py-3 font-mono text-xs">{a.action}</td><td className="py-3 font-mono text-xs text-muted-foreground">{JSON.stringify(a.metadata)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  )
}
