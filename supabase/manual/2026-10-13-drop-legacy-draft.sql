-- ONE-TIME, run manually in the Supabase SQL Editor of project nqqqsemfaajpmzanplwe.
-- Removes the pre-HelloMe draft schema (applied by hand in September) so the real migrations can run.
-- It contained only seed catalog rows and old-style workspace rows: 0 profiles, 0 websites.
-- Login accounts (auth.users) are NOT touched. A full backup was taken on 2026-10-13 before this.
-- Supabase's built-in rls_auto_enable event trigger is intentionally kept.

drop function if exists public.handle_new_user() cascade;          -- also drops its trigger on auth.users
drop function if exists public.update_updated_at_column() cascade;
drop table if exists
  public.ai_generations, public.ai_models, public.ai_providers, public.analytics_events, public.audit_logs,
  public.domains, public.favorites, public.imports, public.media_assets, public.notifications, public.plan_features,
  public.profession_categories, public.professions, public.profile_awards, public.profile_certifications,
  public.profile_education, public.profile_experiences, public.profile_projects, public.profile_publications,
  public.profile_services, public.profile_skills, public.profile_social_links, public.profile_testimonials,
  public.profiles, public.reserved_slugs, public.section_types, public.subscription_plans, public.subscriptions,
  public.template_professions, public.templates, public.website_analytics, public.website_sections,
  public.website_versions, public.websites, public.workspaces
  cascade;
