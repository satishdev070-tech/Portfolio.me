-- Foundation: helper schema, accounts, workspaces (tenant boundary), platform settings, audit.
-- See docs/DATABASE_ARCHITECTURE.md and docs/SECURITY.md.

create extension if not exists citext with schema extensions;

-- `private` holds helpers used by RLS policies and SECURITY DEFINER functions. It is not in the
-- PostgREST exposed schemas, so nothing here is callable over the API.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Raise a structured application error. The API layer maps SQLSTATE P0001 + "CODE: message" to
-- { success:false, error:{ code, message } }.
create or replace function private.fail(p_code text, p_message text)
returns void language plpgsql as $$
begin
  raise exception using errcode = 'P0001', message = p_code || ': ' || p_message;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text,
  locale text not null default 'en' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  is_platform_admin boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_touch before update on public.users
  for each row execute function private.touch_updated_at();

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select u.is_platform_admin from public.users u where u.id = auth.uid()), false)
$$;

alter table public.users enable row level security;
create policy users_select_self on public.users for select to authenticated
  using (id = auth.uid() or private.is_platform_admin());
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Only harmless columns are writable by the user; is_platform_admin / email are not.
revoke insert, update, delete on public.users from anon, authenticated;
grant update (full_name, avatar_url, locale, onboarding_completed_at) on public.users to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Organizations (future agencies / teams) and workspaces (the tenant boundary)
-- ---------------------------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_user_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_touch before update on public.organizations
  for each row execute function private.touch_updated_at();

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  kind text not null default 'personal' check (kind in ('personal', 'team', 'agency')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workspaces_owner_idx on public.workspaces (owner_user_id);
create index workspaces_org_idx on public.workspaces (organization_id) where organization_id is not null;
create trigger workspaces_touch before update on public.workspaces
  for each row execute function private.touch_updated_at();

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- Membership helpers. SECURITY DEFINER so policies on workspace_members don't recurse.
create or replace function private.is_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id and w.deleted_at is null
    where m.workspace_id = p_workspace and m.user_id = auth.uid()
  )
$$;

create or replace function private.can_edit(p_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id and w.deleted_at is null
    where m.workspace_id = p_workspace and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  )
$$;

create or replace function private.can_manage(p_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  )
$$;

create or replace function private.require_editor(p_workspace uuid)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then perform private.fail('UNAUTHORIZED', 'Sign in required.'); end if;
  if not private.can_edit(p_workspace) then
    perform private.fail('FORBIDDEN', 'You do not have access to this workspace.');
  end if;
end $$;

alter table public.organizations enable row level security;
create policy organizations_select on public.organizations for select to authenticated
  using (owner_user_id = auth.uid() or private.is_platform_admin());

alter table public.workspaces enable row level security;
create policy workspaces_select on public.workspaces for select to authenticated
  using (private.is_member(id) or private.is_platform_admin());
create policy workspaces_update on public.workspaces for update to authenticated
  using (private.can_manage(id)) with check (private.can_manage(id));
revoke insert, update, delete on public.workspaces from anon, authenticated;
grant update (name, settings) on public.workspaces to authenticated;

alter table public.workspace_members enable row level security;
create policy workspace_members_select on public.workspace_members for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke insert, update, delete on public.workspace_members from anon, authenticated;

-- Standard policy set for a tenant-owned table: members read, editors write, admins read all.
-- Used by later migrations so every tenant table gets RLS in the migration that creates it.
create or replace function private.apply_tenant_rls(p_table text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format(
    'create policy %I on public.%I for select to authenticated using (private.is_member(workspace_id) or private.is_platform_admin())',
    p_table || '_select', p_table);
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (private.can_edit(workspace_id))',
    p_table || '_insert', p_table);
  execute format(
    'create policy %I on public.%I for update to authenticated using (private.can_edit(workspace_id)) with check (private.can_edit(workspace_id))',
    p_table || '_update', p_table);
  execute format(
    'create policy %I on public.%I for delete to authenticated using (private.can_edit(workspace_id))',
    p_table || '_delete', p_table);
  execute format('revoke all on public.%I from anon', p_table);
end $$;

-- ---------------------------------------------------------------------------------------------
-- Platform settings and reserved slugs
-- ---------------------------------------------------------------------------------------------

create table public.platform_settings (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);
create trigger platform_settings_touch before update on public.platform_settings
  for each row execute function private.touch_updated_at();
alter table public.platform_settings enable row level security;
create policy platform_settings_read on public.platform_settings for select
  using (is_public or private.is_platform_admin());
create policy platform_settings_admin on public.platform_settings for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

create or replace function private.setting_int(p_key text, p_default int)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::int from public.platform_settings where key = p_key), p_default)
$$;

insert into public.platform_settings (key, value, is_public, description) values
  ('slug.min_length', '3', true, 'Minimum subdomain length'),
  ('slug.max_length', '30', true, 'Maximum subdomain length'),
  ('slug.change_cooldown_days', '30', true, 'Days between subdomain changes for a website'),
  ('ai.rate_limit_per_minute', '10', false, 'AI requests per user per minute'),
  ('analytics.retention_days', '400', false, 'Raw analytics event retention');

create table public.reserved_slugs (
  slug citext primary key,
  reason text not null default 'system',
  created_at timestamptz not null default now()
);
alter table public.reserved_slugs enable row level security;
create policy reserved_slugs_read on public.reserved_slugs for select using (true);
create policy reserved_slugs_admin on public.reserved_slugs for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

insert into public.reserved_slugs (slug) values
  ('admin'), ('api'), ('app'), ('www'), ('support'), ('help'), ('login'), ('logout'), ('signup'),
  ('register'), ('dashboard'), ('billing'), ('static'), ('assets'), ('media'), ('cdn'), ('docs'),
  ('blog'), ('about'), ('pricing'), ('templates'), ('features'), ('contact'), ('terms'),
  ('privacy'), ('settings'), ('profile'), ('u'), ('user'), ('users'), ('mail'), ('email'),
  ('status'), ('auth'), ('account'), ('accounts'), ('editor'), ('preview'), ('root'), ('system'),
  ('hellome'), ('security'), ('legal'), ('careers'), ('jobs'), ('store'), ('shop'), ('test'),
  ('staging'), ('dev'), ('ftp'), ('smtp'), ('ns1'), ('ns2'), ('webmail'), ('official'),
  ('verify'), ('domains'), ('sites'), ('s');

-- Validate a subdomain slug. Format: lowercase letters, digits, single hyphens, not at the ends.
create or replace function private.validate_slug(p_slug text)
returns void language plpgsql stable security definer set search_path = '' as $$
declare
  v_min int := private.setting_int('slug.min_length', 3);
  v_max int := private.setting_int('slug.max_length', 30);
begin
  if p_slug is null or p_slug !~ '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$' then
    perform private.fail('INVALID_SLUG', 'Use lowercase letters, numbers and single hyphens; start and end with a letter or number.');
  end if;
  if char_length(p_slug) < v_min or char_length(p_slug) > v_max then
    perform private.fail('INVALID_SLUG', format('Use between %s and %s characters.', v_min, v_max));
  end if;
  if exists (select 1 from public.reserved_slugs r where r.slug = p_slug::extensions.citext) then
    perform private.fail('SLUG_RESERVED', 'This address is reserved.');
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Audit log (append-only) and notifications
-- ---------------------------------------------------------------------------------------------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_workspace_idx on public.audit_logs (workspace_id, created_at desc);
alter table public.audit_logs enable row level security;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using ((workspace_id is not null and private.can_manage(workspace_id)) or private.is_platform_admin());
revoke all on public.audit_logs from anon;
revoke insert, update, delete on public.audit_logs from authenticated;

create or replace function private.audit(p_workspace uuid, p_action text, p_entity_type text,
  p_entity_id uuid, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (workspace_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (p_workspace, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
$$;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.notifications from anon;
revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
