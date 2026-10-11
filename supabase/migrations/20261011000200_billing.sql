-- Plans, features, subscriptions and the entitlement resolver. Prices are integer minor units
-- (paise for INR). Nothing about a specific plan or price is hard-coded in application code:
-- code asks "does this workspace have feature X / what is limit Y" (docs/SUBSCRIPTION_SYSTEM.md).

create table public.features (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  description text,
  kind text not null check (kind in ('boolean', 'limit')),
  unit text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  name text not null,
  description text,
  price_minor int not null default 0 check (price_minor >= 0),
  currency char(3) not null default 'INR',
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  trial_days int not null default 0 check (trial_days between 0 and 90),
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  is_default boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  highlights text[] not null default '{}',
  provider_plan_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Exactly one fallback plan (the free plan) used when a workspace has no live subscription.
create unique index subscription_plans_one_default on public.subscription_plans (is_default) where is_default;
create trigger subscription_plans_touch before update on public.subscription_plans
  for each row execute function private.touch_updated_at();

create table public.plan_features (
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  feature_key text not null references public.features (key) on delete cascade,
  enabled boolean not null default true,
  -- For limit features: the limit; -1 = unlimited. Ignored for boolean features.
  limit_value int check (limit_value is null or limit_value >= -1),
  primary key (plan_id, feature_key)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  provider text not null default 'none',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- At most one live subscription per workspace.
create unique index subscriptions_one_live on public.subscriptions (workspace_id)
  where status in ('trialing', 'active', 'past_due');
create unique index subscriptions_provider_ref on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function private.touch_updated_at();

-- Webhook / provider events, stored for idempotency and audit. Service role only.
create table public.billing_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_id text not null,
  event_type text not null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- Generic metering for future metrics (storage is computed from media_assets, AI from ai_generations).
create table public.usage_records (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  metric text not null,
  quantity bigint not null,
  ref_type text,
  ref_id uuid,
  occurred_at timestamptz not null default now()
);
create index usage_records_ws_metric_idx on public.usage_records (workspace_id, metric, occurred_at desc);

-- RLS ------------------------------------------------------------------------------------------
alter table public.features enable row level security;
create policy features_read on public.features for select using (is_active or private.is_platform_admin());
create policy features_admin on public.features for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

alter table public.subscription_plans enable row level security;
create policy plans_read on public.subscription_plans for select
  using (status = 'active' or private.is_platform_admin());
create policy plans_admin on public.subscription_plans for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

alter table public.plan_features enable row level security;
create policy plan_features_read on public.plan_features for select
  using (exists (select 1 from public.subscription_plans p where p.id = plan_id and p.status = 'active')
         or private.is_platform_admin());
create policy plan_features_admin on public.plan_features for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

-- Subscriptions are read-only for tenants. Only the billing service (service role) changes them.
alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;

alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon, authenticated;

alter table public.usage_records enable row level security;
create policy usage_records_select on public.usage_records for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.usage_records from anon;
revoke insert, update, delete on public.usage_records from authenticated;

-- Entitlements --------------------------------------------------------------------------------

-- The subscription that currently grants entitlements, if any. Grace rules:
--   trialing / active          → live
--   past_due                   → live for 7 days after period end (payment retry window)
--   cancelled                  → live until the paid period ends
--   expired / none             → fall back to the default plan
create or replace function private.current_subscription(p_workspace uuid)
returns public.subscriptions language sql stable security definer set search_path = '' as $$
  select s.* from public.subscriptions s
  where s.workspace_id = p_workspace
    and (
      s.status in ('trialing', 'active')
      or (s.status = 'past_due' and coalesce(s.current_period_end, now()) + interval '7 days' > now())
      or (s.status = 'cancelled' and s.current_period_end > now())
    )
  order by (s.status in ('trialing', 'active')) desc, s.created_at desc
  limit 1
$$;

create or replace function private.effective_plan_id(p_workspace uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.plan_id from private.current_subscription(p_workspace) s where s.id is not null),
    (select p.id from public.subscription_plans p where p.is_default limit 1)
  )
$$;

create or replace function private.has_feature(p_workspace uuid, p_feature text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select pf.enabled from public.plan_features pf
    join public.features f on f.key = pf.feature_key and f.is_active
    where pf.plan_id = private.effective_plan_id(p_workspace) and pf.feature_key = p_feature
  ), false)
$$;

-- Limit for a limit feature; 0 when not granted, -1 when unlimited.
create or replace function private.feature_limit(p_workspace uuid, p_feature text)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case when pf.enabled then coalesce(pf.limit_value, 0) else 0 end
    from public.plan_features pf
    where pf.plan_id = private.effective_plan_id(p_workspace) and pf.feature_key = p_feature
  ), 0)
$$;

-- Start of the current usage period: the subscription period, else the calendar month (UTC).
create or replace function private.usage_period_start(p_workspace uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select case when s.current_period_end is not null then s.current_period_start end
       from private.current_subscription(p_workspace) s where s.id is not null),
    date_trunc('month', now())
  )
$$;

-- Public RPC: the full entitlement document for a workspace the caller belongs to.
create or replace function public.get_entitlements(p_workspace uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_plan public.subscription_plans;
  v_sub public.subscriptions;
  v_features jsonb;
  v_limits jsonb;
begin
  if not (private.is_member(p_workspace) or private.is_platform_admin()) then
    perform private.fail('FORBIDDEN', 'You do not have access to this workspace.');
  end if;
  select * into v_plan from public.subscription_plans where id = private.effective_plan_id(p_workspace);
  select * into v_sub from private.current_subscription(p_workspace);

  select coalesce(jsonb_object_agg(f.key, coalesce(pf.enabled, false)), '{}'::jsonb) into v_features
  from public.features f
  left join public.plan_features pf on pf.feature_key = f.key and pf.plan_id = v_plan.id
  where f.kind = 'boolean' and f.is_active;

  select coalesce(jsonb_object_agg(f.key,
           case when coalesce(pf.enabled, false) then coalesce(pf.limit_value, 0) else 0 end), '{}'::jsonb)
    into v_limits
  from public.features f
  left join public.plan_features pf on pf.feature_key = f.key and pf.plan_id = v_plan.id
  where f.kind = 'limit' and f.is_active;

  return jsonb_build_object(
    'plan', jsonb_build_object('id', v_plan.id, 'slug', v_plan.slug, 'name', v_plan.name,
                               'price_minor', v_plan.price_minor, 'currency', v_plan.currency,
                               'billing_interval', v_plan.billing_interval),
    'subscription', case when v_sub.id is null then null else jsonb_build_object(
        'id', v_sub.id, 'status', v_sub.status, 'provider', v_sub.provider,
        'current_period_end', v_sub.current_period_end,
        'cancel_at_period_end', v_sub.cancel_at_period_end) end,
    'features', v_features,
    'limits', v_limits,
    'period_start', private.usage_period_start(p_workspace)
  );
end $$;
revoke execute on function public.get_entitlements(uuid) from public, anon;
grant execute on function public.get_entitlements(uuid) to authenticated;

-- Billing service writes (service role only): activate / change a plan for a workspace.
create or replace function public.billing_set_plan(
  p_workspace uuid, p_plan_slug text, p_status text, p_provider text,
  p_provider_subscription_id text default null, p_period_end timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_plan_id uuid;
  v_id uuid;
begin
  select id into v_plan_id from public.subscription_plans where slug = p_plan_slug and status <> 'archived';
  if v_plan_id is null then perform private.fail('NOT_FOUND', 'Plan not found.'); end if;

  update public.subscriptions set status = 'expired', updated_at = now()
  where workspace_id = p_workspace and status in ('trialing', 'active', 'past_due');

  insert into public.subscriptions (workspace_id, plan_id, status, provider, provider_subscription_id,
                                    current_period_start, current_period_end)
  values (p_workspace, v_plan_id, p_status, p_provider, p_provider_subscription_id, now(), p_period_end)
  returning id into v_id;

  insert into public.audit_logs (workspace_id, action, entity_type, entity_id, metadata)
  values (p_workspace, 'subscription.changed', 'subscription', v_id,
          jsonb_build_object('plan', p_plan_slug, 'status', p_status, 'provider', p_provider));
  return v_id;
end $$;
revoke execute on function public.billing_set_plan(uuid, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.billing_set_plan(uuid, text, text, text, text, timestamptz) to service_role;

-- ---------------------------------------------------------------------------------------------
-- New account provisioning: user row, personal workspace, owner membership.
-- The default (free) plan applies automatically through effective_plan_id; no row needed.
-- ---------------------------------------------------------------------------------------------
create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ws uuid;
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
begin
  insert into public.users (id, email, full_name)
  values (new.id, coalesce(new.email, new.id::text || '@users.invalid'), left(v_name, 120));

  insert into public.workspaces (owner_user_id, name, kind)
  values (new.id, coalesce(left(v_name, 100), 'My') || '''s workspace', 'personal')
  returning id into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role) values (v_ws, new.id, 'owner');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_auth_user();
