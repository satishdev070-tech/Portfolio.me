-- Catalog: professions, section types, templates (+ versions), favorites, reviews.
-- Everything here is admin-managed configuration: adding a profession or template is a data change,
-- not a code change (docs/TEMPLATE_SYSTEM.md).

create table public.profession_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  description text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profession_categories_touch before update on public.profession_categories
  for each row execute function private.touch_updated_at();

-- schema.org type used for structured data. Only types we can justify from the profession itself;
-- e.g. a "Doctor" profile is a Person with jobTitle, and Physician is used only when the profile
-- also has a practice location (see src/lib/seo/schema-org.ts).
create table public.professions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.profession_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  description text,
  synonyms text[] not null default '{}',
  schema_org_type text not null default 'Person'
    check (schema_org_type in ('Person', 'Physician', 'Dentist', 'Attorney', 'LegalService',
                               'EducationalOrganization', 'LocalBusiness', 'HomeAndConstructionBusiness',
                               'ProfessionalService', 'Organization')),
  recommended_sections text[] not null default '{}',
  profile_fields jsonb not null default '[]'::jsonb,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index professions_category_idx on public.professions (category_id, sort_order);
create trigger professions_touch before update on public.professions
  for each row execute function private.touch_updated_at();

create table public.section_types (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  description text,
  category text not null check (category in ('core', 'career', 'showcase', 'academic', 'business', 'social', 'conversion')),
  -- Which profile collection feeds this section (null = content lives in the section itself).
  data_source text,
  variants text[] not null default '{default}',
  is_advanced boolean not null default false,
  is_singleton boolean not null default true,
  default_content jsonb not null default '{}'::jsonb,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  style text not null check (style in ('classic', 'modern', 'minimal', 'editorial', 'bold', 'warm')),
  layout text not null check (layout in ('centered', 'sidebar', 'split', 'editorial')),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  color_family text,
  tags text[] not null default '{}',
  features text[] not null default '{}',
  preview_image_url text,
  thumbnail_url text,
  demo_profile_key text,
  current_version_id uuid,
  use_count int not null default 0,
  author text not null default 'HelloMe',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index templates_status_idx on public.templates (status, is_featured desc, use_count desc);
create trigger templates_touch before update on public.templates
  for each row execute function private.touch_updated_at();

-- A template's renderable configuration. Published versions are immutable; edits create a new
-- version, and published websites keep the version they were published with.
create table public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  version int not null check (version > 0),
  config jsonb not null,
  changelog text,
  status text not null default 'draft' check (status in ('draft', 'published', 'deprecated')),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (template_id, version),
  unique (id, template_id)
);
alter table public.templates
  add constraint templates_current_version_fk foreign key (current_version_id, id)
  references public.template_versions (id, template_id) deferrable initially deferred;

-- Freeze published template versions.
create or replace function private.freeze_published_template_version()
returns trigger language plpgsql as $$
begin
  if old.status = 'published' and (new.config is distinct from old.config or new.version <> old.version) then
    perform private.fail('IMMUTABLE', 'Published template versions cannot be edited; create a new version.');
  end if;
  return new;
end $$;
create trigger template_versions_freeze before update on public.template_versions
  for each row execute function private.freeze_published_template_version();

create table public.template_professions (
  template_id uuid not null references public.templates (id) on delete cascade,
  profession_id uuid not null references public.professions (id) on delete cascade,
  is_recommended boolean not null default false,
  primary key (template_id, profession_id)
);
create index template_professions_profession_idx on public.template_professions (profession_id);

create table public.template_categories (
  template_id uuid not null references public.templates (id) on delete cascade,
  category_id uuid not null references public.profession_categories (id) on delete cascade,
  primary key (template_id, category_id)
);
create index template_categories_category_idx on public.template_categories (category_id);

create table public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  template_id uuid not null references public.templates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

create table public.template_reviews (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (template_id, user_id)
);

-- RLS: public read of active/published rows; platform admins manage everything.
do $$
declare t text;
begin
  foreach t in array array['profession_categories', 'professions', 'section_types'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (is_active or private.is_platform_admin())', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin())', t || '_admin', t);
  end loop;
end $$;

alter table public.templates enable row level security;
create policy templates_read on public.templates for select using (status = 'published' or private.is_platform_admin());
create policy templates_admin on public.templates for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

alter table public.template_versions enable row level security;
create policy template_versions_read on public.template_versions for select
  using ((status = 'published' and exists (select 1 from public.templates t where t.id = template_id and t.status = 'published'))
         or private.is_platform_admin());
create policy template_versions_admin on public.template_versions for all to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

do $$
declare t text;
begin
  foreach t in array array['template_professions', 'template_categories'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin())', t || '_admin', t);
  end loop;
end $$;

alter table public.favorites enable row level security;
create policy favorites_own on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.favorites from anon;

alter table public.template_reviews enable row level security;
create policy template_reviews_read on public.template_reviews for select using (true);
create policy template_reviews_write on public.template_reviews for insert to authenticated
  with check (user_id = auth.uid());
create policy template_reviews_update on public.template_reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy template_reviews_delete on public.template_reviews for delete to authenticated
  using (user_id = auth.uid() or private.is_platform_admin());

-- Admin workflow: publish a template version (makes it the template's current version).
create or replace function public.admin_publish_template_version(p_version_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.template_versions;
begin
  if not private.is_platform_admin() then perform private.fail('FORBIDDEN', 'Admin only.'); end if;
  select * into v from public.template_versions where id = p_version_id for update;
  if v.id is null then perform private.fail('NOT_FOUND', 'Template version not found.'); end if;
  update public.template_versions set status = 'deprecated'
    where template_id = v.template_id and status = 'published' and id <> v.id;
  update public.template_versions set status = 'published', published_at = coalesce(published_at, now())
    where id = v.id;
  update public.templates set current_version_id = v.id, status = 'published',
    published_at = coalesce(published_at, now())
    where id = v.template_id;
  perform private.audit(null, 'template.version_published', 'template', v.template_id,
                        jsonb_build_object('version', v.version));
end $$;
revoke execute on function public.admin_publish_template_version(uuid) from public, anon;
grant execute on function public.admin_publish_template_version(uuid) to authenticated;
