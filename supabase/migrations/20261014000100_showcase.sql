-- Public gallery of sample ("showcase") sites: published websites whose settings.sample = true.
-- Returns only display fields from the published snapshot.
create or replace function public.list_showcase_sites()
returns table (slug text, name text, headline text, profession text, category text, template text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select w.slug,
         v.snapshot #>> '{profile,full_name}',
         v.snapshot #>> '{profile,headline}',
         v.snapshot #>> '{profile,profession,name}',
         v.snapshot #>> '{profile,profession,category}',
         v.snapshot #>> '{template,name}',
         v.snapshot #>> '{profile,avatar_url}'
  from public.websites w
  join public.website_versions v on v.id = w.published_version_id
  where w.status = 'published' and w.deleted_at is null and coalesce((w.settings ->> 'sample')::boolean, false)
  order by v.snapshot #>> '{profile,profession,category}', w.created_at
$$;
grant execute on function public.list_showcase_sites() to anon, authenticated;
