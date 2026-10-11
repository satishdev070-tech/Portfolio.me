-- A reservation that was never settled (crashed request, lost connection) must not hold credits
-- forever: reservations older than 10 minutes no longer count, and are marked abandoned.
alter table public.ai_generations drop constraint ai_generations_status_check;
alter table public.ai_generations add constraint ai_generations_status_check
  check (status in ('reserved', 'completed', 'failed', 'refunded', 'abandoned'));

create or replace function private.ai_credits_used(p_workspace uuid)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(credits_used), 0)::int from public.ai_generations
  where workspace_id = p_workspace
    and (status = 'completed' or (status = 'reserved' and created_at > now() - interval '10 minutes'))
    and created_at >= private.usage_period_start(p_workspace)
$$;

-- Housekeeping (call from a scheduled job, e.g. pg_cron every 15 minutes).
create or replace function public.ai_release_stale_reservations()
returns int language sql security definer set search_path = '' as $$
  with released as (
    update public.ai_generations set status = 'abandoned', credits_used = 0, completed_at = now()
    where status = 'reserved' and created_at < now() - interval '10 minutes'
    returning 1
  )
  select count(*)::int from released
$$;
revoke execute on function public.ai_release_stale_reservations() from public, anon, authenticated;
grant execute on function public.ai_release_stale_reservations() to service_role;
