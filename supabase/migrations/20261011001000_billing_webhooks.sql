-- Provider-driven subscription updates (service role only), plus idempotent event recording.

create or replace function public.billing_record_event(p_provider text, p_event_id text, p_event_type text,
  p_workspace uuid, p_payload jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.billing_events (provider, event_id, event_type, workspace_id, payload)
  values (p_provider, p_event_id, p_event_type, p_workspace, p_payload);
  return true;
exception when unique_violation then
  return false; -- already processed: webhook retries are no-ops
end $$;

create or replace function public.billing_mark_event_processed(p_provider text, p_event_id text, p_error text default null)
returns void language sql security definer set search_path = '' as $$
  update public.billing_events set processed_at = now(), error = p_error where provider = p_provider and event_id = p_event_id
$$;

create or replace function public.billing_update_subscription(p_provider text, p_provider_subscription_id text,
  p_status text, p_period_end timestamptz default null, p_cancel_at_period_end boolean default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v public.subscriptions;
begin
  if p_status not in ('trialing', 'active', 'past_due', 'cancelled', 'expired') then
    perform private.fail('VALIDATION_ERROR', 'Bad status.');
  end if;
  update public.subscriptions set
    status = p_status,
    current_period_end = coalesce(p_period_end, current_period_end),
    current_period_start = case when p_period_end is not null and p_period_end <> current_period_end then now() else current_period_start end,
    cancel_at_period_end = coalesce(p_cancel_at_period_end, cancel_at_period_end),
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end
  where provider = p_provider and provider_subscription_id = p_provider_subscription_id
  returning * into v;
  if v.id is not null then
    insert into public.audit_logs (workspace_id, action, entity_type, entity_id, metadata)
    values (v.workspace_id, 'subscription.updated', 'subscription', v.id, jsonb_build_object('status', p_status, 'provider', p_provider));
  end if;
  return v.id;
end $$;

revoke execute on function public.billing_record_event(text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.billing_mark_event_processed(text, text, text) from public, anon, authenticated;
revoke execute on function public.billing_update_subscription(text, text, text, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.billing_record_event(text, text, text, uuid, jsonb) to service_role;
grant execute on function public.billing_mark_event_processed(text, text, text) to service_role;
grant execute on function public.billing_update_subscription(text, text, text, timestamptz, boolean) to service_role;
