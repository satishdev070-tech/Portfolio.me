import { createServerSupabase } from '@/lib/supabase/server'
import { PlanForm } from '@/components/admin/forms'

export default async function AdminPlans() {
  const supabase = await createServerSupabase()
  const [{ data: plans }, { data: features }] = await Promise.all([
    supabase.from('subscription_plans').select('*, features:plan_features(feature_key, enabled, limit_value)').order('sort_order'),
    supabase.from('features').select('key, name, kind, unit').order('sort_order'),
  ])
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">Prices, cycles, features and limits are read from here everywhere in the app. Entitlement changes apply to existing subscribers immediately.</p>
      {(plans ?? []).map((p) => (
        <section key={p.id} className="panel p-5"><h2 className="mb-4 font-medium">{p.name} <span className="text-xs font-normal text-muted-foreground">({p.slug}{p.is_default ? ', default' : ''})</span></h2>
          <PlanForm plan={{ ...p, provider_plan_ids: (p.provider_plan_ids ?? {}) as Record<string, string>, features: p.features as never }} features={features ?? []} />
        </section>
      ))}
    </div>
  )
}
