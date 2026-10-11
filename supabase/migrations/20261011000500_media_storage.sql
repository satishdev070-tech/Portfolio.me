-- Media library + Supabase Storage buckets and policies.
-- Object paths are always "<workspace_id>/<purpose>/<uuid>.<ext>"; storage policies check that the
-- caller can edit the workspace in the first path segment.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid references public.users (id) on delete set null,
  bucket text not null,
  path text not null,
  public_url text,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width int,
  height int,
  alt_text text check (char_length(alt_text) <= 300),
  purpose text not null default 'general'
    check (purpose in ('avatar', 'cover', 'gallery', 'project', 'document', 'website', 'import', 'general')),
  original_name text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket, path),
  check (split_part(path, '/', 1) = workspace_id::text)
);
create index media_assets_workspace_idx on public.media_assets (workspace_id, created_at desc) where deleted_at is null;
select private.apply_tenant_rls('media_assets');
-- Rows are created by the upload route after validation; only alt_text / soft-delete are editable.
revoke update on public.media_assets from authenticated;
grant update (alt_text, deleted_at) on public.media_assets to authenticated;

alter table public.profile_media_items
  add constraint profile_media_items_asset_fk foreign key (media_asset_id)
  references public.media_assets (id) on delete cascade;

create or replace function private.storage_used_bytes(p_workspace uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(size_bytes), 0)::bigint from public.media_assets
  where workspace_id = p_workspace and deleted_at is null
$$;

-- Storage quota is enforced in the database, so a client talking to PostgREST directly can't skip it.
create or replace function private.enforce_storage_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_limit_mb int := private.feature_limit(new.workspace_id, 'storage_mb');
begin
  if v_limit_mb <> -1 and private.storage_used_bytes(new.workspace_id) + new.size_bytes > v_limit_mb::bigint * 1024 * 1024 then
    perform private.fail('STORAGE_LIMIT_REACHED', format('Your plan includes %s MB of storage.', v_limit_mb));
  end if;
  return new;
end $$;
create trigger media_assets_quota before insert on public.media_assets
  for each row execute function private.enforce_storage_quota();

-- Buckets ---------------------------------------------------------------------------------------
-- Image buckets are public (published sites must load them) but only accept raster images; SVG is
-- excluded because it can carry script. Documents and import sources are private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-media', 'profile-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('website-assets', 'website-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('template-assets', 'template-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 10485760,
     array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('imports', 'imports', false, 15728640,
     array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'image/jpeg', 'image/png', 'image/webp', 'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.storage_workspace(p_name text)
returns uuid language plpgsql immutable as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end $$;

create policy "tenant upload" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'profile-media', 'portfolio', 'website-assets', 'documents', 'imports')
    and private.can_edit(private.storage_workspace(name))
    and (private.feature_limit(private.storage_workspace(name), 'storage_mb') = -1
         or private.storage_used_bytes(private.storage_workspace(name))
            < private.feature_limit(private.storage_workspace(name), 'storage_mb')::bigint * 1024 * 1024)
  );
create policy "tenant read private" on storage.objects for select to authenticated
  using (bucket_id in ('documents', 'imports') and private.is_member(private.storage_workspace(name)));
create policy "tenant manage own objects" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'profile-media', 'portfolio', 'website-assets', 'documents', 'imports')
         and private.can_edit(private.storage_workspace(name)));
create policy "admin template assets" on storage.objects for all to authenticated
  using (bucket_id = 'template-assets' and private.is_platform_admin())
  with check (bucket_id = 'template-assets' and private.is_platform_admin());
