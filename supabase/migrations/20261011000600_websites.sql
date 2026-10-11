-- Websites, sections, versions (draft → publish → rollback), custom domains, public resolution.
-- docs/PUBLISHING_ARCHITECTURE.md describes the flow.

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  profile_id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  template_id uuid not null references public.templates (id) on delete restrict,
  template_version_id uuid not null,
  locale text not null default 'en' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  -- Design overrides on top of the template tokens: { colors, typography, spacing, components }.
  theme jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object'),
  -- { title, description, keywords[], og_image_url, og_description, noindex }
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  published_version_id uuid,
  published_at timestamptz,
  slug_changed_at timestamptz,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, workspace_id),
  foreign key (profile_id, workspace_id) references public.profiles (id, workspace_id) on delete cascade,
  foreign key (template_version_id, template_id) references public.template_versions (id, template_id)
);
create unique index websites_slug_live on public.websites (slug) where deleted_at is null;
create index websites_workspace_idx on public.websites (workspace_id) where deleted_at is null;
create trigger websites_touch before update on public.websites
  for each row execute function private.touch_updated_at();

alter table public.websites enable row level security;
create policy websites_select on public.websites for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
create policy websites_update on public.websites for update to authenticated
  using (private.can_edit(workspace_id) and deleted_at is null) with check (private.can_edit(workspace_id));
-- Creation, slug, status, template and publish state change only through the RPCs below.
revoke all on public.websites from anon;
revoke insert, update, delete on public.websites from authenticated;
grant update (name, locale, theme, seo, settings) on public.websites to authenticated;

create table public.website_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  website_id uuid not null,
  section_type text not null references public.section_types (key) on delete restrict,
  variant text not null default 'default',
  is_enabled boolean not null default true,
  position int not null default 0,
  -- Section-local content: heading overrides, CTA labels, FAQ items, etc.
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (website_id, workspace_id) references public.websites (id, workspace_id) on delete cascade
);
create index website_sections_website_idx on public.website_sections (website_id, position);
create trigger website_sections_touch before update on public.website_sections
  for each row execute function private.touch_updated_at();
select private.apply_tenant_rls('website_sections');

-- Immutable snapshots. kind=published: what went live; kind=checkpoint: a saved draft state.
create table public.website_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  website_id uuid not null,
  version_number int not null,
  kind text not null default 'published' check (kind in ('published', 'checkpoint')),
  snapshot jsonb not null,
  note text check (char_length(note) <= 200),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (website_id, version_number),
  foreign key (website_id, workspace_id) references public.websites (id, workspace_id) on delete cascade
);
create index website_versions_website_idx on public.website_versions (website_id, version_number desc);
alter table public.websites add constraint websites_published_version_fk
  foreign key (published_version_id) references public.website_versions (id) on delete set null;

alter table public.website_versions enable row level security;
create policy website_versions_select on public.website_versions for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
revoke all on public.website_versions from anon;
revoke insert, update, delete on public.website_versions from authenticated;

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  website_id uuid not null,
  domain text not null unique check (domain ~ '^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,63}$' and char_length(domain) <= 253),
  type text not null default 'custom' check (type in ('custom', 'subdomain')),
  status text not null default 'pending' check (status in ('pending', 'verifying', 'active', 'failed', 'removed')),
  verification_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  verified_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  ssl_status text not null default 'pending' check (ssl_status in ('pending', 'provisioning', 'active', 'failed')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (website_id, workspace_id) references public.websites (id, workspace_id) on delete cascade
);
create unique index domains_one_primary on public.domains (website_id) where is_primary and status = 'active';
create trigger domains_touch before update on public.domains
  for each row execute function private.touch_updated_at();
alter table public.domains enable row level security;
create policy domains_select on public.domains for select to authenticated
  using (private.is_member(workspace_id) or private.is_platform_admin());
-- Never writable by tenants: status/ssl/verified_at are set only after server-side DNS verification.
revoke all on public.domains from anon;
revoke insert, update, delete on public.domains from authenticated;

-- ---------------------------------------------------------------------------------------------
-- Site document: the single JSON the renderer consumes, for both live preview and publishing.
-- Only public profile fields are included (no internal ids beyond row ids, no private fields).
-- ---------------------------------------------------------------------------------------------
create or replace function private.collection_json(p_table text, p_profile uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  execute format(
    'select coalesce(jsonb_agg(to_jsonb(t) - array[''workspace_id'',''profile_id'',''created_at'',''updated_at'',''is_visible'',''sort_order''] order by t.sort_order, t.created_at), ''[]''::jsonb)
       from public.%I t where t.profile_id = $1 and t.is_visible', p_table)
    into v using p_profile;
  return v;
end $$;

create or replace function private.build_site_document(p_website uuid, p_template_version uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  w public.websites;
  p public.profiles;
  tv public.template_versions;
  t public.templates;
  pr public.professions;
  pc public.profession_categories;
  v_domain text;
  v_media jsonb;
begin
  select * into w from public.websites where id = p_website and deleted_at is null;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  select * into p from public.profiles where id = w.profile_id;
  select * into tv from public.template_versions where id = coalesce(p_template_version, w.template_version_id);
  select * into t from public.templates where id = tv.template_id;
  select * into pr from public.professions where id = p.profession_id;
  select * into pc from public.profession_categories where id = pr.category_id;
  select d.domain into v_domain from public.domains d
    where d.website_id = w.id and d.status = 'active' and d.is_primary limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', mi.id, 'kind', mi.kind, 'title', mi.title, 'caption', mi.caption,
      'url', coalesce(ma.public_url, mi.external_url), 'mime_type', ma.mime_type,
      'width', ma.width, 'height', ma.height, 'alt', coalesce(ma.alt_text, mi.title))
      order by mi.sort_order, mi.created_at), '[]'::jsonb)
    into v_media
  from public.profile_media_items mi
  left join public.media_assets ma on ma.id = mi.media_asset_id and ma.deleted_at is null
  where mi.profile_id = p.id and mi.is_visible
    and (mi.external_url is not null or ma.public_url is not null);

  return jsonb_build_object(
    'schema', 1,
    'generated_at', now(),
    'website', jsonb_build_object(
      'id', w.id, 'slug', w.slug, 'name', w.name, 'locale', w.locale,
      'custom_domain', v_domain,
      'show_branding', not private.has_feature(w.workspace_id, 'remove_branding'),
      'settings', w.settings),
    'template', jsonb_build_object(
      'id', t.id, 'slug', t.slug, 'name', t.name, 'layout', t.layout, 'tier', t.tier,
      'version', tv.version, 'version_id', tv.id, 'config', tv.config),
    'theme', w.theme,
    -- Advanced SEO fields only take effect on plans that include them.
    'seo', case when private.has_feature(w.workspace_id, 'advanced_seo') then w.seo
                else w.seo - array['og_image_url', 'og_description', 'keywords', 'canonical_url'] end,
    'profile', jsonb_build_object(
      'full_name', p.full_name, 'display_name', p.display_name, 'headline', p.headline,
      'tagline', p.tagline, 'bio_short', p.bio_short, 'bio_long', p.bio_long,
      'avatar_url', p.avatar_url, 'cover_url', p.cover_url,
      'email', p.email_public, 'phone', p.phone_public, 'whatsapp', p.whatsapp_number,
      'website_url', p.website_url, 'city', p.city, 'region', p.region, 'country_code', p.country_code,
      'languages', to_jsonb(p.languages), 'years_experience', p.years_experience,
      'availability', p.availability, 'pronouns', p.pronouns, 'extra', p.extra,
      'profession', case when pr.id is null then null else jsonb_build_object(
          'slug', pr.slug, 'name', pr.name, 'name_i18n', pr.name_i18n,
          'schema_org_type', pr.schema_org_type, 'category', pc.slug) end),
    'collections', jsonb_build_object(
      'experiences', private.collection_json('profile_experiences', p.id),
      'education', private.collection_json('profile_education', p.id),
      'skills', private.collection_json('profile_skills', p.id),
      'services', private.collection_json('profile_services', p.id),
      'projects', private.collection_json('profile_projects', p.id),
      'publications', private.collection_json('profile_publications', p.id),
      'awards', private.collection_json('profile_awards', p.id),
      'certifications', private.collection_json('profile_certifications', p.id),
      'testimonials', private.collection_json('profile_testimonials', p.id),
      'social_links', private.collection_json('profile_social_links', p.id),
      'locations', private.collection_json('profile_locations', p.id),
      'achievements', private.collection_json('profile_achievements', p.id),
      'media', v_media),
    'sections', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'id', s.id, 'type', s.section_type, 'variant', s.variant,
          'content', s.content, 'settings', s.settings) order by s.position, s.created_at), '[]'::jsonb)
      from public.website_sections s
      join public.section_types st on st.key = s.section_type and st.is_active
      where s.website_id = w.id and s.is_enabled)
  );
end $$;

-- Live preview for editors (draft state, current template version).
create or replace function public.get_site_preview(p_website uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.websites where id = p_website and deleted_at is null;
  if v_ws is null or not (private.is_member(v_ws) or private.is_platform_admin()) then
    perform private.fail('NOT_FOUND', 'Website not found.');
  end if;
  return private.build_site_document(p_website);
end $$;

-- Template demo preview: render any published template against a sample/own document.
create or replace function public.get_template_config(p_template_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'layout', t.layout, 'tier', t.tier,
                            'version', tv.version, 'version_id', tv.id, 'config', tv.config,
                            'demo_profile_key', t.demo_profile_key)
  from public.templates t join public.template_versions tv on tv.id = t.current_version_id
  where t.slug = p_template_slug and (t.status = 'published' or private.is_platform_admin())
$$;

-- ---------------------------------------------------------------------------------------------
-- Slug availability and website lifecycle
-- ---------------------------------------------------------------------------------------------
create or replace function public.check_slug_availability(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  begin
    perform private.validate_slug(p_slug);
  exception when sqlstate 'P0001' then
    return jsonb_build_object('available', false, 'reason', sqlerrm);
  end;
  if exists (select 1 from public.websites where slug = p_slug and deleted_at is null) then
    return jsonb_build_object('available', false, 'reason', 'SLUG_TAKEN: This address is already taken.');
  end if;
  return jsonb_build_object('available', true);
end $$;

-- Sections for a new website: the profession's recommended order, using the template's variant
-- for each type; falls back to the template's own section list.
create or replace function private.seed_sections(p_website uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_cfg jsonb;
  v_types text[];
  v_type text;
  v_pos int := 0;
begin
  select * into w from public.websites where id = p_website;
  select config into v_cfg from public.template_versions where id = w.template_version_id;
  select pr.recommended_sections into v_types
    from public.profiles p join public.professions pr on pr.id = p.profession_id where p.id = w.profile_id;
  if v_types is null or cardinality(v_types) = 0 then
    select array_agg(s ->> 'type' order by ord) into v_types
    from jsonb_array_elements(coalesce(v_cfg -> 'sections', '[]'::jsonb)) with ordinality as x(s, ord);
  end if;
  if v_types is null or not ('hero' = any (v_types)) then v_types := array['hero'] || coalesce(v_types, '{}'); end if;

  foreach v_type in array v_types loop
    if exists (select 1 from public.section_types st where st.key = v_type and st.is_active)
       and not exists (select 1 from public.website_sections s where s.website_id = w.id and s.section_type = v_type) then
      -- Advanced sections the plan doesn't include are added switched off, so the site can publish.
      insert into public.website_sections (workspace_id, website_id, section_type, variant, is_enabled, position, content)
      select w.workspace_id, w.id, v_type,
             coalesce((select s ->> 'variant' from jsonb_array_elements(coalesce(v_cfg -> 'sections', '[]'::jsonb)) s
                       where s ->> 'type' = v_type limit 1), 'default'),
             not st.is_advanced or private.has_feature(w.workspace_id, 'advanced_sections'),
             v_pos, st.default_content
      from public.section_types st where st.key = v_type;
      v_pos := v_pos + 10;
    end if;
  end loop;
end $$;

create or replace function public.create_website(p_profile uuid, p_name text, p_slug text, p_template_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_ws uuid;
  v_tpl public.templates;
  v_id uuid;
  v_limit int;
begin
  select workspace_id into v_ws from public.profiles where id = p_profile and deleted_at is null;
  if v_ws is null then perform private.fail('NOT_FOUND', 'Profile not found.'); end if;
  perform private.require_editor(v_ws);
  -- Serialize website creation per workspace so the limit check can't race.
  perform pg_advisory_xact_lock(hashtext('websites:' || v_ws::text));

  v_limit := private.feature_limit(v_ws, 'max_websites');
  if v_limit <> -1 and (select count(*) from public.websites where workspace_id = v_ws and deleted_at is null) >= v_limit then
    perform private.fail('PLAN_LIMIT_REACHED', format('Your plan includes %s website(s). Upgrade to add more.', v_limit));
  end if;

  perform private.validate_slug(p_slug);
  if exists (select 1 from public.websites where slug = p_slug and deleted_at is null) then
    perform private.fail('SLUG_TAKEN', 'This address is already taken.');
  end if;

  select * into v_tpl from public.templates where slug = p_template_slug and status = 'published';
  if v_tpl.id is null or v_tpl.current_version_id is null then
    perform private.fail('TEMPLATE_UNAVAILABLE', 'Template not available.');
  end if;

  insert into public.websites (workspace_id, profile_id, name, slug, template_id, template_version_id, created_by)
  values (v_ws, p_profile, coalesce(nullif(trim(p_name), ''), p_slug), p_slug, v_tpl.id, v_tpl.current_version_id, auth.uid())
  returning id into v_id;

  perform private.seed_sections(v_id);
  update public.templates set use_count = use_count + 1 where id = v_tpl.id;
  perform private.audit(v_ws, 'website.created', 'website', v_id, jsonb_build_object('slug', p_slug, 'template', p_template_slug));
  return v_id;
exception when unique_violation then
  perform private.fail('SLUG_TAKEN', 'This address is already taken.');
end $$;

create or replace function public.delete_website(p_website uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.websites where id = p_website and deleted_at is null;
  if v_ws is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  if not private.can_manage(v_ws) then perform private.fail('FORBIDDEN', 'Only owners can delete websites.'); end if;
  update public.websites set deleted_at = now(), status = 'unpublished' where id = p_website;
  update public.domains set status = 'removed', is_primary = false where website_id = p_website;
  perform private.audit(v_ws, 'website.deleted', 'website', p_website, '{}'::jsonb);
end $$;

-- Switch template. Content lives in the profile, so this is non-destructive; section variants are
-- reset to the new template's choices and (optionally) design overrides are cleared.
create or replace function public.apply_template(p_website uuid, p_template_slug text, p_reset_theme boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_tpl public.templates;
  v_cfg jsonb;
begin
  select * into w from public.websites where id = p_website and deleted_at is null;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(w.workspace_id);
  select * into v_tpl from public.templates where slug = p_template_slug and status = 'published';
  if v_tpl.id is null then perform private.fail('TEMPLATE_UNAVAILABLE', 'Template not available.'); end if;
  select config into v_cfg from public.template_versions where id = v_tpl.current_version_id;

  update public.websites set template_id = v_tpl.id, template_version_id = v_tpl.current_version_id,
    theme = case when p_reset_theme then '{}'::jsonb else theme end
  where id = w.id;

  update public.website_sections s set variant = coalesce(
      (select x ->> 'variant' from jsonb_array_elements(coalesce(v_cfg -> 'sections', '[]'::jsonb)) x
       where x ->> 'type' = s.section_type limit 1), 'default')
  where s.website_id = w.id;

  if v_tpl.id <> w.template_id then
    update public.templates set use_count = use_count + 1 where id = v_tpl.id;
  end if;
  perform private.audit(w.workspace_id, 'website.template_changed', 'website', w.id,
                        jsonb_build_object('template', p_template_slug));
end $$;

create or replace function public.reorder_sections(p_website uuid, p_section_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.websites where id = p_website and deleted_at is null;
  if v_ws is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(v_ws);
  update public.website_sections s set position = x.ord * 10
  from unnest(p_section_ids) with ordinality as x(id, ord)
  where s.id = x.id and s.website_id = p_website;
end $$;

create or replace function public.change_website_slug(p_website uuid, p_slug text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_cooldown int := private.setting_int('slug.change_cooldown_days', 30);
begin
  select * into w from public.websites where id = p_website and deleted_at is null for update;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  if not private.can_manage(w.workspace_id) then perform private.fail('FORBIDDEN', 'Only owners can change the address.'); end if;
  if w.slug = p_slug then return; end if;
  if w.slug_changed_at is not null and w.slug_changed_at > now() - make_interval(days => v_cooldown) then
    perform private.fail('SLUG_CHANGE_COOLDOWN', format('The address can be changed once every %s days.', v_cooldown));
  end if;
  perform private.validate_slug(p_slug);
  update public.websites set slug = p_slug, slug_changed_at = now() where id = w.id;
  perform private.audit(w.workspace_id, 'website.slug_changed', 'website', w.id,
                        jsonb_build_object('from', w.slug, 'to', p_slug));
exception when unique_violation then
  perform private.fail('SLUG_TAKEN', 'This address is already taken.');
end $$;

-- ---------------------------------------------------------------------------------------------
-- Publishing
-- ---------------------------------------------------------------------------------------------

-- Pre-publish checks. Returns { ok, errors:[{code,message}], warnings:[...] }.
create or replace function public.validate_website_for_publish(p_website uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  w public.websites;
  p public.profiles;
  t public.templates;
  tv public.template_versions;
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_limit int;
  v_live int;
  v_adv text[];
begin
  select * into w from public.websites where id = p_website and deleted_at is null;
  if w.id is null or not (private.is_member(w.workspace_id) or private.is_platform_admin()) then
    perform private.fail('NOT_FOUND', 'Website not found.');
  end if;
  select * into p from public.profiles where id = w.profile_id;
  select * into t from public.templates where id = w.template_id;
  select * into tv from public.template_versions where id = w.template_version_id;

  if p.full_name is null or p.headline is null or char_length(trim(p.headline)) = 0 then
    v_errors := v_errors || jsonb_build_object('code', 'PROFILE_INCOMPLETE', 'field', 'headline',
      'message', 'Add your name and a professional headline.');
  end if;
  if coalesce(p.bio_short, p.bio_long) is null then
    v_warnings := v_warnings || jsonb_build_object('code', 'NO_BIO', 'message', 'Add a short bio so visitors know what you do.');
  end if;
  if not exists (select 1 from public.website_sections where website_id = w.id and is_enabled and section_type = 'hero') then
    v_errors := v_errors || jsonb_build_object('code', 'SECTION_REQUIRED', 'field', 'sections',
      'message', 'Your site needs a Hero section.');
  end if;
  if t.status <> 'published' or tv.status not in ('published', 'deprecated') then
    v_errors := v_errors || jsonb_build_object('code', 'TEMPLATE_UNAVAILABLE', 'message', 'This template is no longer available. Choose another.');
  end if;
  if t.tier = 'premium' and not private.has_feature(w.workspace_id, 'premium_templates') then
    v_errors := v_errors || jsonb_build_object('code', 'FEATURE_NOT_AVAILABLE', 'feature', 'premium_templates',
      'message', format('"%s" is a premium template. Upgrade to publish it, or switch to a free template.', t.name));
  end if;
  select array_agg(st.name) into v_adv from public.website_sections s
    join public.section_types st on st.key = s.section_type
    where s.website_id = w.id and s.is_enabled and st.is_advanced;
  if v_adv is not null and not private.has_feature(w.workspace_id, 'advanced_sections') then
    v_errors := v_errors || jsonb_build_object('code', 'FEATURE_NOT_AVAILABLE', 'feature', 'advanced_sections',
      'message', format('Advanced sections need an upgrade: %s. Disable them or upgrade.', array_to_string(v_adv, ', ')));
  end if;
  if w.status <> 'published' then
    v_limit := private.feature_limit(w.workspace_id, 'max_websites');
    select count(*) into v_live from public.websites
      where workspace_id = w.workspace_id and status = 'published' and deleted_at is null and id <> w.id;
    if v_limit <> -1 and v_live >= v_limit then
      v_errors := v_errors || jsonb_build_object('code', 'PLAN_LIMIT_REACHED',
        'message', format('Your plan allows %s published website(s).', v_limit));
    end if;
  end if;
  if p.avatar_url is not null and p.avatar_url !~* '^https?://' then
    v_errors := v_errors || jsonb_build_object('code', 'ASSET_INVALID', 'message', 'Profile photo URL is invalid.');
  end if;
  if coalesce(w.seo ->> 'title', '') = '' then
    v_warnings := v_warnings || jsonb_build_object('code', 'SEO_DEFAULTS', 'message', 'No SEO title set; your name and headline will be used.');
  end if;

  return jsonb_build_object('ok', jsonb_array_length(v_errors) = 0, 'errors', v_errors, 'warnings', v_warnings);
end $$;

create or replace function public.publish_website(p_website uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_check jsonb;
  v_version int;
  v_version_id uuid;
begin
  select * into w from public.websites where id = p_website and deleted_at is null for update;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(w.workspace_id);
  perform pg_advisory_xact_lock(hashtext('websites:' || w.workspace_id::text));

  v_check := public.validate_website_for_publish(p_website);
  if not (v_check ->> 'ok')::boolean then
    return jsonb_build_object('published', false) || v_check;
  end if;

  select coalesce(max(version_number), 0) + 1 into v_version from public.website_versions where website_id = w.id;
  insert into public.website_versions (workspace_id, website_id, version_number, kind, snapshot, note, created_by)
  values (w.workspace_id, w.id, v_version, 'published', private.build_site_document(w.id), left(p_note, 200), auth.uid())
  returning id into v_version_id;

  update public.websites set status = 'published', published_version_id = v_version_id, published_at = now()
  where id = w.id;
  perform private.audit(w.workspace_id, 'website.published', 'website', w.id, jsonb_build_object('version', v_version));
  return jsonb_build_object('published', true, 'version', v_version, 'version_id', v_version_id,
                            'slug', w.slug, 'warnings', v_check -> 'warnings');
end $$;

create or replace function public.unpublish_website(p_website uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare w public.websites;
begin
  select * into w from public.websites where id = p_website and deleted_at is null for update;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(w.workspace_id);
  update public.websites set status = 'unpublished' where id = w.id;
  perform private.audit(w.workspace_id, 'website.unpublished', 'website', w.id, '{}'::jsonb);
end $$;

-- Save the current draft as a checkpoint (manual "save version").
create or replace function public.create_checkpoint(p_website uuid, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_version int;
begin
  select * into w from public.websites where id = p_website and deleted_at is null for update;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(w.workspace_id);
  select coalesce(max(version_number), 0) + 1 into v_version from public.website_versions where website_id = w.id;
  insert into public.website_versions (workspace_id, website_id, version_number, kind, snapshot, note, created_by)
  values (w.workspace_id, w.id, v_version, 'checkpoint', private.build_site_document(w.id), left(p_note, 200), auth.uid());
  return v_version;
end $$;

-- Roll back: the chosen version goes live again (if published) and the draft's template, design,
-- SEO and sections are restored from it. Profile collections are not overwritten.
create or replace function public.restore_website_version(p_website uuid, p_version_id uuid, p_make_live boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v public.website_versions;
  s jsonb;
  v_tpl uuid;
  v_tv uuid;
  v_pos int := 0;
begin
  select * into w from public.websites where id = p_website and deleted_at is null for update;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  perform private.require_editor(w.workspace_id);
  select * into v from public.website_versions where id = p_version_id and website_id = w.id;
  if v.id is null then perform private.fail('NOT_FOUND', 'Version not found.'); end if;

  v_tpl := (v.snapshot #>> '{template,id}')::uuid;
  v_tv := (v.snapshot #>> '{template,version_id}')::uuid;
  if not exists (select 1 from public.template_versions where id = v_tv and template_id = v_tpl) then
    v_tpl := w.template_id; v_tv := w.template_version_id;
  end if;

  update public.websites set template_id = v_tpl, template_version_id = v_tv,
    theme = coalesce(v.snapshot -> 'theme', '{}'::jsonb), seo = coalesce(v.snapshot -> 'seo', '{}'::jsonb)
  where id = w.id;

  update public.website_sections set is_enabled = false where website_id = w.id;
  for s in select * from jsonb_array_elements(v.snapshot -> 'sections') loop
    if exists (select 1 from public.section_types where key = s ->> 'type') then
      insert into public.website_sections (id, workspace_id, website_id, section_type, variant, is_enabled, position, content, settings)
      values (coalesce((s ->> 'id')::uuid, gen_random_uuid()), w.workspace_id, w.id, s ->> 'type',
              coalesce(s ->> 'variant', 'default'), true, v_pos,
              coalesce(s -> 'content', '{}'::jsonb), coalesce(s -> 'settings', '{}'::jsonb))
      on conflict (id) do update set variant = excluded.variant, is_enabled = true, position = excluded.position,
        content = excluded.content, settings = excluded.settings;
      v_pos := v_pos + 10;
    end if;
  end loop;

  if p_make_live and v.kind = 'published' then
    update public.websites set status = 'published', published_version_id = v.id, published_at = now() where id = w.id;
  end if;
  perform private.audit(w.workspace_id, 'website.version_restored', 'website', w.id,
                        jsonb_build_object('version', v.version_number, 'live', p_make_live and v.kind = 'published'));
end $$;

-- ---------------------------------------------------------------------------------------------
-- Public resolution (anon). Returns only the published snapshot.
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_published_site(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select v.snapshot || jsonb_build_object('published_at', w.published_at, 'version', v.version_number)
  from public.websites w join public.website_versions v on v.id = w.published_version_id
  where w.slug = lower(p_slug) and w.status = 'published' and w.deleted_at is null
$$;

create or replace function public.get_published_site_by_domain(p_domain text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select v.snapshot || jsonb_build_object('published_at', w.published_at, 'version', v.version_number)
  from public.domains d
  join public.websites w on w.id = d.website_id
  join public.website_versions v on v.id = w.published_version_id
  where d.domain = lower(p_domain) and d.status = 'active' and w.status = 'published' and w.deleted_at is null
$$;

-- Sitemap feed: published slugs with last-modified, paged.
create or replace function public.list_published_sites(p_after text default '', p_limit int default 1000)
returns table (slug text, published_at timestamptz, custom_domain text)
language sql stable security definer set search_path = '' as $$
  select w.slug, w.published_at,
         (select d.domain from public.domains d where d.website_id = w.id and d.status = 'active' and d.is_primary limit 1)
  from public.websites w
  where w.status = 'published' and w.deleted_at is null and w.slug > coalesce(p_after, '')
    and coalesce((w.seo ->> 'noindex')::boolean, false) = false
  order by w.slug limit least(greatest(p_limit, 1), 5000)
$$;

-- ---------------------------------------------------------------------------------------------
-- Custom domains
-- ---------------------------------------------------------------------------------------------
create or replace function public.add_custom_domain(p_website uuid, p_domain text, p_platform_domain text)
returns public.domains language plpgsql security definer set search_path = '' as $$
declare
  w public.websites;
  v_domain text := lower(trim(both '.' from trim(p_domain)));
  v_row public.domains;
  v_limit int;
begin
  select * into w from public.websites where id = p_website and deleted_at is null;
  if w.id is null then perform private.fail('NOT_FOUND', 'Website not found.'); end if;
  if not private.can_manage(w.workspace_id) then perform private.fail('FORBIDDEN', 'Only owners can manage domains.'); end if;
  if not private.has_feature(w.workspace_id, 'custom_domain') then
    perform private.fail('FEATURE_NOT_AVAILABLE', 'Custom domains are available on a higher plan.');
  end if;
  v_domain := regexp_replace(v_domain, '^https?://', '');
  v_domain := split_part(v_domain, '/', 1);
  if v_domain !~ '^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,63}$' then
    perform private.fail('INVALID_DOMAIN', 'Enter a domain like www.example.com.');
  end if;
  if p_platform_domain is not null and (v_domain = lower(p_platform_domain) or v_domain like '%.' || lower(p_platform_domain)) then
    perform private.fail('INVALID_DOMAIN', 'Use your own domain, not a platform address.');
  end if;
  v_limit := private.feature_limit(w.workspace_id, 'max_custom_domains');
  if v_limit <> -1 and (select count(*) from public.domains where workspace_id = w.workspace_id and status <> 'removed') >= v_limit then
    perform private.fail('PLAN_LIMIT_REACHED', format('Your plan allows %s custom domain(s).', v_limit));
  end if;
  if exists (select 1 from public.domains where domain = v_domain and status <> 'removed') then
    perform private.fail('DOMAIN_TAKEN', 'This domain is already connected to a site.');
  end if;
  delete from public.domains where domain = v_domain and status = 'removed';

  insert into public.domains (workspace_id, website_id, domain, type, status)
  values (w.workspace_id, w.id, v_domain, 'custom', 'pending') returning * into v_row;
  perform private.audit(w.workspace_id, 'domain.added', 'domain', v_row.id, jsonb_build_object('domain', v_domain));
  return v_row;
end $$;

create or replace function public.remove_custom_domain(p_domain_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare d public.domains;
begin
  select * into d from public.domains where id = p_domain_id;
  if d.id is null or not private.can_manage(d.workspace_id) then perform private.fail('NOT_FOUND', 'Domain not found.'); end if;
  update public.domains set status = 'removed', is_primary = false where id = d.id;
  perform private.audit(d.workspace_id, 'domain.removed', 'domain', d.id, jsonb_build_object('domain', d.domain));
end $$;

-- Called by the server after it has checked DNS itself (service role only).
create or replace function public.record_domain_check(p_domain_id uuid, p_verified boolean, p_error text default null,
                                                     p_ssl_status text default null)
returns public.domains language plpgsql security definer set search_path = '' as $$
declare d public.domains;
begin
  update public.domains set
    last_checked_at = now(),
    last_error = case when p_verified then null else left(p_error, 500) end,
    status = case when p_verified then 'active' when status = 'active' then 'active' else 'failed' end,
    verified_at = case when p_verified then coalesce(verified_at, now()) else verified_at end,
    ssl_status = coalesce(p_ssl_status, ssl_status),
    is_primary = case when p_verified then
      not exists (select 1 from public.domains o where o.website_id = domains.website_id and o.id <> domains.id
                  and o.is_primary and o.status = 'active') or is_primary
      else is_primary end
  where id = p_domain_id and status <> 'removed'
  returning * into d;
  if d.id is null then perform private.fail('NOT_FOUND', 'Domain not found.'); end if;
  insert into public.audit_logs (workspace_id, action, entity_type, entity_id, metadata)
  values (d.workspace_id, case when p_verified then 'domain.verified' else 'domain.check_failed' end, 'domain', d.id,
          jsonb_build_object('domain', d.domain, 'error', p_error));
  return d;
end $$;

-- Execute grants -----------------------------------------------------------------------------
revoke execute on function public.get_site_preview(uuid) from public, anon;
revoke execute on function public.create_website(uuid, text, text, text) from public, anon;
revoke execute on function public.delete_website(uuid) from public, anon;
revoke execute on function public.apply_template(uuid, text, boolean) from public, anon;
revoke execute on function public.reorder_sections(uuid, uuid[]) from public, anon;
revoke execute on function public.change_website_slug(uuid, text) from public, anon;
revoke execute on function public.validate_website_for_publish(uuid) from public, anon;
revoke execute on function public.publish_website(uuid, text) from public, anon;
revoke execute on function public.unpublish_website(uuid) from public, anon;
revoke execute on function public.create_checkpoint(uuid, text) from public, anon;
revoke execute on function public.restore_website_version(uuid, uuid, boolean) from public, anon;
revoke execute on function public.add_custom_domain(uuid, text, text) from public, anon;
revoke execute on function public.remove_custom_domain(uuid) from public, anon;
revoke execute on function public.record_domain_check(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.record_domain_check(uuid, boolean, text, text) to service_role;
revoke execute on function public.check_slug_availability(text) from public;
grant execute on function public.check_slug_availability(text) to anon, authenticated;
grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_site_by_domain(text) to anon, authenticated;
grant execute on function public.list_published_sites(text, int) to anon, authenticated;
grant execute on function public.get_template_config(text) to anon, authenticated;
