-- AI providers / models / task routing, per-request usage + credits, and the import pipeline.
-- Provider secrets are NOT stored here: ai_providers.api_key_env names the server env var.

create table public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  adapter text not null check (adapter in ('openai_compatible', 'mock')),
  base_url text,
  api_key_env text check (api_key_env ~ '^[A-Z][A-Z0-9_]*$'),
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.ai_providers (id) on delete cascade,
  model_key text not null,
  display_name text not null,
  capabilities text[] not null default '{text}',
  context_window int,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique (provider_id, model_key)
);

-- Which model serves a task. tier=advanced is used when the workspace has ai_advanced_models.
create table public.ai_task_routes (
  id uuid primary key default gen_random_uuid(),
  task text not null check (task in ('profile_generation', 'bio_generation', 'headline_generation',
    'experience_generation', 'service_generation', 'project_generation', 'seo_generation', 'translation',
    'rewrite', 'summarization', 'document_extraction', 'url_extraction', 'ocr_processing')),
  tier text not null default 'standard' check (tier in ('standard', 'advanced')),
  model_id uuid not null references public.ai_models (id) on delete restrict,
  fallback_model_id uuid references public.ai_models (id) on delete set null,
  credits_cost int not null default 1 check (credits_cost >= 0),
  max_output_tokens int not null default 800 check (max_output_tokens between 16 and 16000),
  temperature numeric(3, 2) not null default 0.6 check (temperature between 0 and 2),
  is_active boolean not null default true,
  unique (task, tier)
);

do $$
declare t text;
begin
  foreach t in array array['ai_providers', 'ai_models', 'ai_task_routes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin())', t || '_admin', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- One row per AI request: the usage ledger. Credits are reserved before the provider call and
-- settled (or refunded) after it by the server with the service role.
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  task text not null,
  provider text,
  model text,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'failed', 'refunded')),
  input_tokens int,
  output_tokens int,
  credits_used int not null default 0 check (credits_used >= 0),
  latency_ms int,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  raw_response jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index ai_generations_ws_idx on public.ai_generations (workspace_id, created_at desc);
create index ai_generations_user_recent_idx on public.ai_generations (user_id, created_at desc);
alter table public.ai_generations enable row level security;
create policy ai_generations_select on public.ai_generations for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.ai_generations from anon;
revoke insert, update, delete on public.ai_generations from authenticated;

create or replace function private.ai_credits_used(p_workspace uuid)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(credits_used), 0)::int from public.ai_generations
  where workspace_id = p_workspace and status in ('reserved', 'completed')
    and created_at >= private.usage_period_start(p_workspace)
$$;

create or replace function public.get_ai_usage(p_workspace uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.is_member(p_workspace) or private.is_platform_admin()) then
    perform private.fail('FORBIDDEN', 'You do not have access to this workspace.');
  end if;
  return jsonb_build_object('used', private.ai_credits_used(p_workspace),
                            'limit', private.feature_limit(p_workspace, 'ai_credits_monthly'),
                            'period_start', private.usage_period_start(p_workspace));
end $$;
revoke execute on function public.get_ai_usage(uuid) from public, anon;
grant execute on function public.get_ai_usage(uuid) to authenticated;

-- Reserve credits for a task (service role; the server passes the authenticated user id).
-- Enforces: membership, feature, monthly credits, per-user rate limit. Returns the route to use.
create or replace function public.ai_reserve(p_workspace uuid, p_user uuid, p_task text, p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_feature text := case when p_task in ('document_extraction', 'url_extraction', 'ocr_processing') then 'ai_import'
                         else 'ai_content_generation' end;
  v_tier text := case when private.has_feature(p_workspace, 'ai_advanced_models') then 'advanced' else 'standard' end;
  v_route record;
  v_limit int;
  v_rate int := private.setting_int('ai.rate_limit_per_minute', 10);
  v_id uuid;
begin
  if not exists (select 1 from public.workspace_members m where m.workspace_id = p_workspace and m.user_id = p_user
                 and m.role in ('owner', 'admin', 'editor')) then
    perform private.fail('FORBIDDEN', 'You do not have access to this workspace.');
  end if;
  if not private.has_feature(p_workspace, v_feature) then
    perform private.fail('FEATURE_NOT_AVAILABLE', 'AI features are not included in your plan.');
  end if;
  perform pg_advisory_xact_lock(hashtext('ai:' || p_workspace::text));
  if (select count(*) from public.ai_generations where user_id = p_user and created_at > now() - interval '1 minute') >= v_rate then
    perform private.fail('RATE_LIMITED', 'Too many AI requests. Try again in a minute.');
  end if;

  select r.*, m.model_key, p.slug as provider_slug, p.adapter, p.base_url, p.api_key_env,
         fm.model_key as fallback_model_key, fp.slug as fallback_provider_slug, fp.adapter as fallback_adapter,
         fp.base_url as fallback_base_url, fp.api_key_env as fallback_api_key_env
    into v_route
  from public.ai_task_routes r
  join public.ai_models m on m.id = r.model_id and m.is_active
  join public.ai_providers p on p.id = m.provider_id and p.is_active
  left join public.ai_models fm on fm.id = r.fallback_model_id and fm.is_active
  left join public.ai_providers fp on fp.id = fm.provider_id and fp.is_active
  where r.task = p_task and r.is_active and r.tier in (v_tier, 'standard')
  order by (r.tier = v_tier) desc limit 1;
  if v_route.id is null then perform private.fail('AI_UNAVAILABLE', 'This AI task is not configured.'); end if;

  v_limit := private.feature_limit(p_workspace, 'ai_credits_monthly');
  if v_limit <> -1 and private.ai_credits_used(p_workspace) + v_route.credits_cost > v_limit then
    perform private.fail('AI_CREDITS_EXHAUSTED', format('You have used all %s AI credits for this period.', v_limit));
  end if;

  insert into public.ai_generations (workspace_id, user_id, task, provider, model, status, credits_used, input)
  values (p_workspace, p_user, p_task, v_route.provider_slug, v_route.model_key, 'reserved', v_route.credits_cost,
          coalesce(p_input, '{}'::jsonb))
  returning id into v_id;

  return jsonb_build_object(
    'generation_id', v_id, 'credits', v_route.credits_cost,
    'max_output_tokens', v_route.max_output_tokens, 'temperature', v_route.temperature,
    'primary', jsonb_build_object('provider', v_route.provider_slug, 'adapter', v_route.adapter,
      'base_url', v_route.base_url, 'api_key_env', v_route.api_key_env, 'model', v_route.model_key),
    'fallback', case when v_route.fallback_model_key is null then null else jsonb_build_object(
      'provider', v_route.fallback_provider_slug, 'adapter', v_route.fallback_adapter,
      'base_url', v_route.fallback_base_url, 'api_key_env', v_route.fallback_api_key_env,
      'model', v_route.fallback_model_key) end);
end $$;

create or replace function public.ai_settle(p_generation uuid, p_status text, p_provider text, p_model text,
  p_input_tokens int, p_output_tokens int, p_latency_ms int, p_output jsonb, p_raw jsonb,
  p_error_code text default null, p_error_message text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('completed', 'failed') then perform private.fail('VALIDATION_ERROR', 'Bad status.'); end if;
  update public.ai_generations set
    status = case when p_status = 'failed' then 'refunded' else 'completed' end,
    credits_used = case when p_status = 'failed' then 0 else credits_used end,
    provider = coalesce(p_provider, provider), model = coalesce(p_model, model),
    input_tokens = p_input_tokens, output_tokens = p_output_tokens, latency_ms = p_latency_ms,
    output = p_output, raw_response = p_raw, error_code = p_error_code, error_message = left(p_error_message, 1000),
    completed_at = now()
  where id = p_generation and status = 'reserved';
end $$;

revoke execute on function public.ai_reserve(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.ai_settle(uuid, text, text, text, int, int, int, jsonb, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.ai_reserve(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.ai_settle(uuid, text, text, text, int, int, int, jsonb, jsonb, text, text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Imports
-- ---------------------------------------------------------------------------------------------
create table public.import_sources (
  key text primary key,
  name text not null,
  input_kind text not null check (input_kind in ('file', 'url', 'text')),
  accepted_mime_types text[] not null default '{}',
  url_pattern text,
  is_enabled boolean not null default true,
  guidance text,
  sort_order int not null default 0
);
alter table public.import_sources enable row level security;
create policy import_sources_read on public.import_sources for select using (is_enabled or private.is_platform_admin());
create policy import_sources_admin on public.import_sources for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  profile_id uuid,
  created_by uuid references public.users (id) on delete set null,
  source_key text not null references public.import_sources (key),
  source_url text,
  storage_path text,
  status text not null default 'queued'
    check (status in ('queued', 'extracting', 'structuring', 'review', 'applied', 'failed', 'discarded')),
  extracted_text text,
  structured jsonb,
  raw_metadata jsonb not null default '{}'::jsonb,
  applied_summary jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (profile_id, workspace_id) references public.profiles (id, workspace_id) on delete cascade
);
create index imports_ws_idx on public.imports (workspace_id, created_at desc);
create trigger imports_touch before update on public.imports
  for each row execute function private.touch_updated_at();
select private.apply_tenant_rls('imports');
