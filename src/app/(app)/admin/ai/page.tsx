import { createServerSupabase } from '@/lib/supabase/server'
import { ModelForm, ProviderToggle, RouteRow } from '@/components/admin/forms'

export default async function AdminAI() {
  const supabase = await createServerSupabase()
  const [{ data: providers }, { data: models }, { data: routes }] = await Promise.all([
    supabase.from('ai_providers').select('id, slug, name, adapter, base_url, api_key_env, is_active').order('slug'),
    supabase.from('ai_models').select('id, model_key, display_name, capabilities, is_active, ai_providers(slug)').order('model_key'),
    supabase.from('ai_task_routes').select('id, task, tier, model_id, fallback_model_id, credits_cost, is_active').order('task').order('tier'),
  ])
  const m = (models ?? []).map((x) => ({ id: x.id, model_key: x.model_key, display_name: x.display_name, provider: (x.ai_providers as { slug: string } | null)?.slug ?? '' }))
  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <h2 className="mb-1 font-medium">Providers</h2>
        <p className="mb-3 text-xs text-muted-foreground">API keys live in server environment variables (named below), never in the database or the browser. A provider whose key is missing is skipped by the router.</p>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Provider</th><th className="font-medium">Endpoint</th><th className="font-medium">Key env</th><th className="font-medium">Key set</th><th className="font-medium">Active</th></tr></thead>
          <tbody>{(providers ?? []).map((p) => <tr key={p.id} className="border-t"><td className="py-2">{p.name}</td><td className="font-mono text-xs">{p.base_url ?? '—'}</td><td className="font-mono text-xs">{p.api_key_env ?? '—'}</td><td className="text-xs">{p.api_key_env ? (process.env[p.api_key_env] ? 'Yes' : 'No') : '—'}</td><td><ProviderToggle id={p.id} active={p.is_active} /></td></tr>)}</tbody></table>
      </section>
      <section className="panel p-5"><h2 className="mb-3 font-medium">Models</h2><ul className="mb-4 grid gap-1 font-mono text-xs">{m.map((x) => <li key={x.id}>{x.provider} · {x.model_key}</li>)}</ul><ModelForm providers={(providers ?? []).map((p) => ({ id: p.id, name: p.name }))} /></section>
      <section className="panel overflow-x-auto p-5">
        <h2 className="mb-3 font-medium">Task routing</h2>
        <table className="w-full min-w-[52rem] text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Task</th><th className="font-medium">Tier</th><th className="font-medium">Model</th><th className="font-medium">Fallback</th><th className="font-medium">Credits</th><th className="font-medium">On</th></tr></thead>
          <tbody>{(routes ?? []).map((r) => <RouteRow key={r.id} r={r} models={m} />)}</tbody></table>
      </section>
    </div>
  )
}
