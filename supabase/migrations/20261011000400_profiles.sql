-- Structured profile data. One profile row + normalized collections. A workspace may hold several
-- profiles (agencies) and a profile may back several websites.

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  profession_id uuid references public.professions (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  display_name text check (char_length(display_name) <= 120),
  headline text check (char_length(headline) <= 160),
  tagline text check (char_length(tagline) <= 200),
  bio_short text check (char_length(bio_short) <= 600),
  bio_long text check (char_length(bio_long) <= 8000),
  avatar_url text,
  cover_url text,
  email_public text check (email_public is null or email_public ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone_public text check (char_length(phone_public) <= 32),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+?[0-9]{8,15}$'),
  website_url text,
  city text,
  region text,
  country_code char(2),
  languages text[] not null default '{}',
  years_experience smallint check (years_experience between 0 and 80),
  availability text check (char_length(availability) <= 200),
  pronouns text check (char_length(pronouns) <= 40),
  -- Profession-specific structured fields (e.g. medical registration no., bar enrolment no.).
  -- Shape is declared by professions.profile_fields; validated in the app layer.
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, workspace_id)
);
create index profiles_workspace_idx on public.profiles (workspace_id) where deleted_at is null;
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
select private.apply_tenant_rls('profiles');

-- Collections. Every row carries workspace_id and references (profile_id, workspace_id) so a row
-- can never point at another tenant's profile even if a client sends a foreign profile id.
create table public.profile_experiences (
  organization text not null check (char_length(organization) <= 160),
  title text not null check (char_length(title) <= 160),
  employment_type text check (employment_type in ('full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'volunteer', 'other')),
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text check (char_length(description) <= 4000),
  highlights text[] not null default '{}',
  check (end_date is null or start_date is null or end_date >= start_date)
);
create table public.profile_education (
  institution text not null check (char_length(institution) <= 200),
  degree text check (char_length(degree) <= 200),
  field_of_study text,
  start_date date,
  end_date date,
  grade text,
  description text check (char_length(description) <= 2000)
);
create table public.profile_skills (
  name text not null check (char_length(name) between 1 and 80),
  category text,
  level smallint check (level between 1 and 5)
);
create table public.profile_services (
  title text not null check (char_length(title) <= 160),
  description text check (char_length(description) <= 2000),
  price_text text check (char_length(price_text) <= 80),
  duration_text text check (char_length(duration_text) <= 80),
  icon text,
  cta_label text,
  cta_url text
);
create table public.profile_projects (
  title text not null check (char_length(title) <= 200),
  role text,
  description text check (char_length(description) <= 4000),
  url text,
  image_url text,
  tags text[] not null default '{}',
  start_date date,
  end_date date,
  is_featured boolean not null default false
);
create table public.profile_publications (
  title text not null check (char_length(title) <= 400),
  authors text,
  venue text,
  published_on date,
  pub_type text not null default 'article'
    check (pub_type in ('article', 'journal', 'conference', 'book', 'chapter', 'thesis', 'report', 'patent', 'other')),
  url text,
  doi text check (doi is null or doi ~* '^10\.\d{4,9}/\S+$'),
  abstract text check (char_length(abstract) <= 4000)
);
create table public.profile_awards (
  title text not null check (char_length(title) <= 200),
  issuer text,
  awarded_on date,
  description text check (char_length(description) <= 2000),
  url text
);
create table public.profile_certifications (
  name text not null check (char_length(name) <= 200),
  issuer text,
  issued_on date,
  expires_on date,
  credential_id text,
  credential_url text
);
create table public.profile_testimonials (
  author_name text not null check (char_length(author_name) <= 120),
  author_title text,
  author_org text,
  quote text not null check (char_length(quote) between 1 and 1500),
  rating smallint check (rating between 1 and 5),
  avatar_url text
);
create table public.profile_social_links (
  platform text not null check (platform in ('linkedin', 'github', 'x', 'instagram', 'facebook', 'youtube',
    'tiktok', 'medium', 'behance', 'dribbble', 'orcid', 'google_scholar', 'researchgate', 'stackoverflow',
    'telegram', 'whatsapp', 'threads', 'website', 'other')),
  url text not null check (url ~* '^https?://'),
  label text
);
create table public.profile_locations (
  label text not null check (char_length(label) <= 120),
  address_line text,
  city text,
  region text,
  country_code char(2),
  postal_code text,
  phone text,
  hours text check (char_length(hours) <= 500),
  map_url text,
  is_service_area boolean not null default false,
  is_primary boolean not null default false
);
create table public.profile_achievements (
  title text not null check (char_length(title) <= 200),
  description text check (char_length(description) <= 2000),
  metric text check (char_length(metric) <= 60),
  achieved_on date
);
-- Gallery images, videos and documents.
create table public.profile_media_items (
  kind text not null check (kind in ('image', 'video', 'document')),
  media_asset_id uuid,
  external_url text check (external_url is null or external_url ~* '^https://'),
  title text check (char_length(title) <= 200),
  caption text check (char_length(caption) <= 1000),
  check (media_asset_id is not null or external_url is not null)
);

do $$
declare t text;
begin
  foreach t in array array['profile_experiences', 'profile_education', 'profile_skills', 'profile_services',
    'profile_projects', 'profile_publications', 'profile_awards', 'profile_certifications',
    'profile_testimonials', 'profile_social_links', 'profile_locations', 'profile_achievements',
    'profile_media_items'] loop
    execute format('alter table public.%I add column id uuid primary key default gen_random_uuid()', t);
    execute format('alter table public.%I add column workspace_id uuid not null references public.workspaces (id) on delete cascade', t);
    execute format('alter table public.%I add column profile_id uuid not null', t);
    execute format('alter table public.%I add column sort_order int not null default 0', t);
    execute format('alter table public.%I add column is_visible boolean not null default true', t);
    execute format('alter table public.%I add column created_at timestamptz not null default now()', t);
    execute format('alter table public.%I add column updated_at timestamptz not null default now()', t);
    execute format('alter table public.%I add constraint %I foreign key (profile_id, workspace_id) references public.profiles (id, workspace_id) on delete cascade',
                   t, t || '_profile_fk');
    execute format('create index %I on public.%I (profile_id, sort_order)', t || '_profile_idx', t);
    execute format('create index %I on public.%I (workspace_id)', t || '_workspace_idx', t);
    execute format('create trigger %I before update on public.%I for each row execute function private.touch_updated_at()', t || '_touch', t);
    perform private.apply_tenant_rls(t);
  end loop;
end $$;

-- Profile completion checklist, weighted by what the profession actually needs.
create or replace function public.get_profile_completion(p_profile uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  p public.profiles;
  v_recommended text[];
  v_items jsonb := '[]'::jsonb;
  v_done int := 0;
  v_total int := 0;
  procedure_item record;
begin
  select * into p from public.profiles where id = p_profile and deleted_at is null;
  if p.id is null then perform private.fail('NOT_FOUND', 'Profile not found.'); end if;
  if not (private.is_member(p.workspace_id) or private.is_platform_admin()) then
    perform private.fail('FORBIDDEN', 'You do not have access to this profile.');
  end if;
  select coalesce(pr.recommended_sections, '{}') into v_recommended from public.professions pr where pr.id = p.profession_id;
  v_recommended := coalesce(v_recommended, '{}');

  for procedure_item in
    select * from (values
      ('basic_info', 'Basic info', true, p.full_name is not null and p.headline is not null),
      ('photo', 'Profile photo', true, p.avatar_url is not null),
      ('about', 'About', true, coalesce(p.bio_short, p.bio_long) is not null),
      ('contact', 'Contact details', true, coalesce(p.email_public, p.phone_public, p.whatsapp_number) is not null),
      ('experience', 'Experience', 'experience' = any (v_recommended),
        exists (select 1 from public.profile_experiences x where x.profile_id = p.id)),
      ('education', 'Education', 'education' = any (v_recommended),
        exists (select 1 from public.profile_education x where x.profile_id = p.id)),
      ('skills', 'Skills', 'skills' = any (v_recommended),
        exists (select 1 from public.profile_skills x where x.profile_id = p.id)),
      ('services', 'Services', 'services' = any (v_recommended),
        exists (select 1 from public.profile_services x where x.profile_id = p.id)),
      ('projects', 'Projects', 'projects' = any (v_recommended) or 'portfolio' = any (v_recommended),
        exists (select 1 from public.profile_projects x where x.profile_id = p.id)),
      ('publications', 'Publications', 'publications' = any (v_recommended),
        exists (select 1 from public.profile_publications x where x.profile_id = p.id)),
      ('testimonials', 'Testimonials', 'testimonials' = any (v_recommended),
        exists (select 1 from public.profile_testimonials x where x.profile_id = p.id)),
      ('social_links', 'Social links', true,
        exists (select 1 from public.profile_social_links x where x.profile_id = p.id))
    ) as t(key, label, applies, done)
  loop
    if procedure_item.applies then
      v_total := v_total + 1;
      if procedure_item.done then v_done := v_done + 1; end if;
      v_items := v_items || jsonb_build_object('key', procedure_item.key, 'label', procedure_item.label,
                                               'done', procedure_item.done);
    end if;
  end loop;

  return jsonb_build_object('percent', case when v_total = 0 then 0 else round(100.0 * v_done / v_total) end,
                            'items', v_items);
end $$;
revoke execute on function public.get_profile_completion(uuid) from public, anon;
grant execute on function public.get_profile_completion(uuid) to authenticated;
