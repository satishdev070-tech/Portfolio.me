-- Accounts that existed before the provisioning trigger (or were created while it was absent) get the
-- same records a new signup gets: users row, personal workspace, owner membership. Idempotent.
do $$
declare
  u record;
  v_ws uuid;
  v_name text;
begin
  for u in select a.id, a.email, a.raw_user_meta_data from auth.users a
           where not exists (select 1 from public.users p where p.id = a.id) loop
    v_name := nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '');
    insert into public.users (id, email, full_name) values (u.id, coalesce(u.email, u.id::text || '@users.invalid'), left(v_name, 120));
    insert into public.workspaces (owner_user_id, name, kind) values (u.id, coalesce(left(v_name, 100), 'My') || '''s workspace', 'personal') returning id into v_ws;
    insert into public.workspace_members (workspace_id, user_id, role) values (v_ws, u.id, 'owner');
  end loop;
end $$;
