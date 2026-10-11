-- One-call usage summary for the dashboard (members only).
create or replace function public.get_workspace_usage(p_workspace uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.is_member(p_workspace) or private.is_platform_admin()) then
    perform private.fail('FORBIDDEN', 'You do not have access to this workspace.');
  end if;
  return jsonb_build_object(
    'storage_bytes', private.storage_used_bytes(p_workspace),
    'storage_limit_mb', private.feature_limit(p_workspace, 'storage_mb'),
    'ai_credits_used', private.ai_credits_used(p_workspace),
    'ai_credits_limit', private.feature_limit(p_workspace, 'ai_credits_monthly'),
    'websites', (select count(*) from public.websites where workspace_id = p_workspace and deleted_at is null),
    'websites_limit', private.feature_limit(p_workspace, 'max_websites'),
    'media_files', (select count(*) from public.media_assets where workspace_id = p_workspace and deleted_at is null),
    'period_start', private.usage_period_start(p_workspace));
end $$;
revoke execute on function public.get_workspace_usage(uuid) from public, anon;
grant execute on function public.get_workspace_usage(uuid) to authenticated;
