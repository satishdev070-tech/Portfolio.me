-- Privacy-friendly analytics: no IP addresses, no cookies, no cross-day identifiers.
-- The server derives visitor_hash = HMAC(secret, day | site | ip | user-agent) and discards inputs.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  website_id uuid not null references public.websites (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event_type text not null default 'page_view' check (event_type in ('page_view', 'contact_click', 'cta_click', 'outbound_click')),
  path text not null default '/' check (char_length(path) <= 300),
  referrer_host text check (char_length(referrer_host) <= 255),
  device text check (device in ('desktop', 'mobile', 'tablet')),
  country char(2),
  visitor_hash text not null check (char_length(visitor_hash) <= 64),
  occurred_at timestamptz not null default now()
);
create index analytics_events_site_time_idx on public.analytics_events (website_id, occurred_at desc);

create table public.website_analytics_daily (
  website_id uuid not null references public.websites (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  day date not null,
  views int not null default 0,
  unique_visitors int not null default 0,
  primary key (website_id, day)
);

alter table public.analytics_events enable row level security;
create policy analytics_events_select on public.analytics_events for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.analytics_events from anon;
revoke insert, update, delete on public.analytics_events from authenticated;

alter table public.website_analytics_daily enable row level security;
create policy website_analytics_daily_select on public.website_analytics_daily for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.website_analytics_daily from anon;
revoke insert, update, delete on public.website_analytics_daily from authenticated;

-- Called by /api/track with the service role after bot filtering and rate limiting.
create or replace function public.record_site_event(p_slug text, p_domain text, p_event text, p_path text,
  p_referrer_host text, p_device text, p_country text, p_visitor_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  w record;
  v_new_visitor boolean;
  v_day date := (now() at time zone 'utc')::date;
begin
  if p_domain is not null then
    select ws.id, ws.workspace_id into w from public.domains d join public.websites ws on ws.id = d.website_id
    where d.domain = lower(p_domain) and d.status = 'active' and ws.status = 'published' and ws.deleted_at is null;
  else
    select ws.id, ws.workspace_id into w from public.websites ws
    where ws.slug = lower(p_slug) and ws.status = 'published' and ws.deleted_at is null;
  end if;
  if w.id is null then return false; end if;

  v_new_visitor := not exists (select 1 from public.analytics_events e where e.website_id = w.id
    and e.visitor_hash = p_visitor_hash and e.occurred_at >= v_day::timestamptz);

  insert into public.analytics_events (website_id, workspace_id, event_type, path, referrer_host, device, country, visitor_hash)
  values (w.id, w.workspace_id, p_event, left(coalesce(p_path, '/'), 300), left(p_referrer_host, 255),
          case when p_device in ('desktop', 'mobile', 'tablet') then p_device end,
          case when p_country ~ '^[A-Z]{2}$' then p_country end, p_visitor_hash);

  if p_event = 'page_view' then
    insert into public.website_analytics_daily (website_id, workspace_id, day, views, unique_visitors)
    values (w.id, w.workspace_id, v_day, 1, case when v_new_visitor then 1 else 0 end)
    on conflict (website_id, day) do update set views = website_analytics_daily.views + 1,
      unique_visitors = website_analytics_daily.unique_visitors + case when v_new_visitor then 1 else 0 end;
  end if;
  return true;
end $$;
revoke execute on function public.record_site_event(text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_site_event(text, text, text, text, text, text, text, text) to service_role;

-- Dashboard summary. Breakdowns (referrers, devices, countries, pages) need analytics_advanced.
create or replace function public.get_site_analytics(p_website uuid, p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ws uuid;
  v_from date := (now() at time zone 'utc')::date - (least(greatest(p_days, 1), 365) - 1);
  v_advanced boolean;
  v_result jsonb;
begin
  select workspace_id into v_ws from public.websites where id = p_website;
  if v_ws is null or not (private.is_member(v_ws) or private.is_platform_admin()) then
    perform private.fail('NOT_FOUND', 'Website not found.');
  end if;
  if not private.has_feature(v_ws, 'analytics_basic') then
    perform private.fail('FEATURE_NOT_AVAILABLE', 'Analytics are not included in your plan.');
  end if;
  v_advanced := private.has_feature(v_ws, 'analytics_advanced');

  select jsonb_build_object(
    'from', v_from,
    'advanced', v_advanced,
    'totals', jsonb_build_object(
      'views', coalesce(sum(views), 0), 'unique_visitors', coalesce(sum(unique_visitors), 0)),
    'daily', coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views, 'unique_visitors', unique_visitors) order by day), '[]'::jsonb))
  into v_result
  from public.website_analytics_daily where website_id = p_website and day >= v_from;

  if v_advanced then
    v_result := v_result || jsonb_build_object(
      'top_pages', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select path as key, count(*) as count from public.analytics_events
         where website_id = p_website and event_type = 'page_view' and occurred_at >= v_from group by 1 order by 2 desc limit 10) x),
      'referrers', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(referrer_host, 'direct') as key, count(*) as count from public.analytics_events
         where website_id = p_website and event_type = 'page_view' and occurred_at >= v_from group by 1 order by 2 desc limit 10) x),
      'devices', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(device, 'unknown') as key, count(*) as count from public.analytics_events
         where website_id = p_website and event_type = 'page_view' and occurred_at >= v_from group by 1 order by 2 desc) x),
      'countries', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(country, '??') as key, count(*) as count from public.analytics_events
         where website_id = p_website and event_type = 'page_view' and occurred_at >= v_from group by 1 order by 2 desc limit 10) x),
      'events', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select event_type as key, count(*) as count from public.analytics_events
         where website_id = p_website and event_type <> 'page_view' and occurred_at >= v_from group by 1 order by 2 desc) x));
  end if;
  return v_result;
end $$;
revoke execute on function public.get_site_analytics(uuid, int) from public, anon;
grant execute on function public.get_site_analytics(uuid, int) to authenticated;

-- Default-deny hardening: anon may only read the public catalog and call the public RPCs.
revoke all on all tables in schema public from anon;
grant select on public.profession_categories, public.professions, public.section_types, public.templates,
  public.template_versions, public.template_professions, public.template_categories, public.template_reviews,
  public.features, public.subscription_plans, public.plan_features, public.reserved_slugs,
  public.platform_settings, public.import_sources to anon;
