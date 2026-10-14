-- HelloMe seed: catalog and configuration. Idempotent (safe to re-run).
-- Everything here is editable by platform admins afterwards; no code depends on these exact rows
-- except the section-type keys, which map to renderer components (src/site/sections).

-- ---------------------------------------------------------------------------------------------
-- Profession categories
-- ---------------------------------------------------------------------------------------------
insert into public.profession_categories (slug, name, name_i18n, icon, sort_order) values
  ('medical', 'Medical', '{"hi":"चिकित्सा"}', 'stethoscope', 10),
  ('legal', 'Legal', '{"hi":"विधि"}', 'scale', 20),
  ('education', 'Education', '{"hi":"शिक्षा"}', 'graduation-cap', 30),
  ('technology', 'Technology', '{"hi":"प्रौद्योगिकी"}', 'code', 40),
  ('science', 'Science', '{"hi":"विज्ञान"}', 'flask-conical', 50),
  ('public-leadership', 'Public & Leadership', '{"hi":"सार्वजनिक जीवन"}', 'landmark', 60),
  ('creative', 'Creative', '{"hi":"रचनात्मक"}', 'palette', 70),
  ('skilled-professionals', 'Skilled Professionals', '{"hi":"कुशल कारीगर"}', 'wrench', 80),
  ('business', 'Business', '{"hi":"व्यवसाय"}', 'briefcase', 90),
  ('general', 'General', '{"hi":"सामान्य"}', 'user', 100)
on conflict (slug) do update set name = excluded.name, name_i18n = excluded.name_i18n,
  icon = excluded.icon, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------------------------
-- Section types (keys map to renderer components)
-- ---------------------------------------------------------------------------------------------
insert into public.section_types (key, name, name_i18n, category, data_source, variants, is_advanced, is_singleton, default_content, icon, sort_order) values
  ('hero', 'Hero', '{"hi":"परिचय"}', 'core', null, '{default,split,minimal,banner}', false, true, '{}', 'sparkles', 10),
  ('about', 'About', '{"hi":"मेरे बारे में"}', 'core', null, '{default,columns}', false, true, '{}', 'user', 20),
  ('specialization', 'Specialization', '{"hi":"विशेषज्ञता"}', 'career', null, '{default}', false, true,
     '{"items":[]}', 'target', 25),
  ('experience', 'Experience', '{"hi":"अनुभव"}', 'career', 'experiences', '{timeline,list}', false, true, '{}', 'briefcase', 30),
  ('education', 'Education', '{"hi":"शिक्षा"}', 'career', 'education', '{list,timeline}', false, true, '{}', 'graduation-cap', 40),
  ('skills', 'Skills', '{"hi":"कौशल"}', 'career', 'skills', '{chips,grouped,bars}', false, true, '{}', 'wrench', 50),
  ('services', 'Services', '{"hi":"सेवाएँ"}', 'business', 'services', '{cards,list}', false, true, '{}', 'hand-helping', 60),
  ('projects', 'Projects', '{"hi":"परियोजनाएँ"}', 'showcase', 'projects', '{grid,list}', false, true, '{}', 'folder-kanban', 70),
  ('portfolio', 'Portfolio', '{"hi":"पोर्टफोलियो"}', 'showcase', 'projects', '{grid}', false, true, '{}', 'images', 75),
  ('research', 'Research', '{"hi":"शोध"}', 'academic', null, '{default}', false, true, '{"items":[]}', 'microscope', 80),
  ('publications', 'Publications', '{"hi":"प्रकाशन"}', 'academic', 'publications', '{list}', false, true, '{}', 'book-open', 85),
  ('teaching', 'Teaching', '{"hi":"अध्यापन"}', 'academic', null, '{default}', false, true, '{"items":[]}', 'presentation', 90),
  ('speaking', 'Speaking', '{"hi":"वक्तव्य"}', 'academic', null, '{default}', false, true, '{"items":[]}', 'mic', 95),
  ('awards', 'Awards', '{"hi":"पुरस्कार"}', 'career', 'awards', '{list}', false, true, '{}', 'award', 100),
  ('certifications', 'Certifications', '{"hi":"प्रमाणपत्र"}', 'career', 'certifications', '{list,grid}', false, true, '{}', 'badge-check', 110),
  ('achievements', 'Achievements', '{"hi":"उपलब्धियाँ"}', 'career', 'achievements', '{stats,list}', false, true, '{}', 'trophy', 115),
  ('testimonials', 'Testimonials', '{"hi":"प्रशंसापत्र"}', 'social', 'testimonials', '{cards,quote}', false, true, '{}', 'quote', 120),
  ('gallery', 'Gallery', '{"hi":"गैलरी"}', 'showcase', 'media', '{grid}', false, true, '{}', 'image', 130),
  ('videos', 'Videos', '{"hi":"वीडियो"}', 'showcase', 'media', '{grid}', true, true, '{}', 'video', 135),
  ('service_areas', 'Service areas', '{"hi":"सेवा क्षेत्र"}', 'business', 'locations', '{default}', false, true, '{}', 'map-pin', 140),
  ('appointments', 'Appointments', '{"hi":"अपॉइंटमेंट"}', 'conversion', 'locations', '{default}', false, true,
     '{"booking_url":"","note":""}', 'calendar-clock', 145),
  ('timeline', 'Timeline', '{"hi":"समयरेखा"}', 'career', null, '{default}', true, true, '{"items":[]}', 'milestone', 150),
  ('press', 'Media & press', '{"hi":"मीडिया"}', 'social', null, '{default}', true, true, '{"items":[]}', 'newspaper', 155),
  ('news', 'News & updates', '{"hi":"समाचार"}', 'social', null, '{default}', true, true, '{"items":[]}', 'rss', 160),
  ('products', 'Products', '{"hi":"उत्पाद"}', 'business', null, '{default}', true, true, '{"items":[]}', 'package', 165),
  ('faq', 'FAQ', '{"hi":"सामान्य प्रश्न"}', 'business', null, '{default}', true, true, '{"items":[]}', 'circle-help', 170),
  ('social_links', 'Social links', '{"hi":"सोशल लिंक"}', 'social', 'social_links', '{default}', false, true, '{}', 'share-2', 180),
  ('cta', 'Call to action', '{"hi":"संपर्क आमंत्रण"}', 'conversion', null, '{default}', false, false,
     '{"heading":"","body":"","button_label":"","button_url":""}', 'mouse-pointer-click', 190),
  ('whatsapp', 'WhatsApp', '{"hi":"व्हाट्सऐप"}', 'conversion', null, '{default}', false, true, '{"message":""}', 'message-circle', 195),
  ('contact', 'Contact', '{"hi":"संपर्क"}', 'conversion', 'locations', '{default,split}', false, true, '{}', 'mail', 200)
on conflict (key) do update set name = excluded.name, name_i18n = excluded.name_i18n, category = excluded.category,
  data_source = excluded.data_source, variants = excluded.variants, is_advanced = excluded.is_advanced,
  is_singleton = excluded.is_singleton, default_content = excluded.default_content, icon = excluded.icon,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------------------------
-- Professions
-- ---------------------------------------------------------------------------------------------
with p (category, slug, name, hi, schema_type, sections, synonyms, sort) as (values
  ('medical', 'doctor', 'Doctor', 'डॉक्टर', 'Physician', '{hero,about,experience,specialization,services,education,certifications,awards,testimonials,appointments,contact}', '{physician,md,general practitioner}', 10),
  ('medical', 'dentist', 'Dentist', 'दंत चिकित्सक', 'Dentist', '{hero,about,services,experience,education,certifications,testimonials,appointments,contact}', '{dental surgeon,orthodontist}', 20),
  ('medical', 'surgeon', 'Surgeon', 'सर्जन', 'Physician', '{hero,about,specialization,experience,services,education,certifications,awards,testimonials,appointments,contact}', '{}', 30),
  ('medical', 'physiotherapist', 'Physiotherapist', 'फिजियोथेरेपिस्ट', 'Person', '{hero,about,services,experience,education,certifications,testimonials,appointments,contact}', '{physical therapist}', 40),
  ('medical', 'psychologist', 'Psychologist', 'मनोवैज्ञानिक', 'Person', '{hero,about,services,experience,education,certifications,testimonials,appointments,contact}', '{therapist,counsellor,counselor}', 50),
  ('medical', 'medical-practitioner', 'Medical Practitioner', 'चिकित्सक', 'Physician', '{hero,about,experience,services,education,certifications,appointments,contact}', '{}', 60),
  ('medical', 'healthcare-professional', 'Healthcare Professional', 'स्वास्थ्य पेशेवर', 'Person', '{hero,about,experience,services,education,certifications,contact}', '{nurse,pharmacist}', 70),
  ('legal', 'lawyer', 'Lawyer', 'वकील', 'Attorney', '{hero,about,specialization,services,experience,education,awards,testimonials,contact}', '{attorney,solicitor}', 10),
  ('legal', 'advocate', 'Advocate', 'अधिवक्ता', 'Attorney', '{hero,about,specialization,experience,services,education,awards,contact}', '{}', 20),
  ('legal', 'legal-consultant', 'Legal Consultant', 'विधि सलाहकार', 'Attorney', '{hero,about,services,experience,education,testimonials,contact}', '{}', 30),
  ('legal', 'legal-professional', 'Legal Professional', 'विधि पेशेवर', 'Person', '{hero,about,experience,education,skills,contact}', '{paralegal}', 40),
  ('education', 'teacher', 'Teacher', 'शिक्षक', 'Person', '{hero,about,teaching,experience,education,awards,testimonials,contact}', '{}', 10),
  ('education', 'professor', 'Professor', 'प्रोफेसर', 'Person', '{hero,about,research,publications,teaching,education,projects,awards,speaking,contact}', '{faculty}', 20),
  ('education', 'lecturer', 'Lecturer', 'व्याख्याता', 'Person', '{hero,about,teaching,research,publications,education,experience,contact}', '{assistant professor}', 30),
  ('education', 'principal', 'Principal', 'प्रधानाचार्य', 'Person', '{hero,about,experience,achievements,education,awards,contact}', '{headmaster,headmistress}', 40),
  ('education', 'academic', 'Academic', 'शिक्षाविद', 'Person', '{hero,about,research,publications,education,experience,awards,contact}', '{}', 50),
  ('education', 'tutor', 'Tutor', 'ट्यूटर', 'Person', '{hero,about,services,experience,education,testimonials,contact}', '{}', 60),
  ('education', 'coach', 'Coach', 'कोच', 'Person', '{hero,about,services,experience,achievements,testimonials,contact}', '{mentor,trainer}', 70),
  ('technology', 'software-engineer', 'Software Engineer', 'सॉफ्टवेयर इंजीनियर', 'Person', '{hero,about,experience,skills,projects,education,certifications,contact}', '{programmer,sde}', 10),
  ('technology', 'web-developer', 'Web Developer', 'वेब डेवलपर', 'Person', '{hero,about,skills,projects,experience,testimonials,contact}', '{frontend,full stack}', 20),
  ('technology', 'developer', 'Developer', 'डेवलपर', 'Person', '{hero,about,skills,projects,experience,contact}', '{}', 30),
  ('technology', 'it-consultant', 'IT Consultant', 'आईटी सलाहकार', 'Person', '{hero,about,services,experience,projects,certifications,testimonials,contact}', '{}', 40),
  ('technology', 'data-scientist', 'Data Scientist', 'डेटा वैज्ञानिक', 'Person', '{hero,about,skills,experience,projects,publications,education,contact}', '{ml engineer,analyst}', 50),
  ('technology', 'ai-engineer', 'AI Engineer', 'एआई इंजीनियर', 'Person', '{hero,about,skills,experience,projects,publications,education,contact}', '{machine learning}', 60),
  ('technology', 'cybersecurity-professional', 'Cybersecurity Professional', 'साइबर सुरक्षा विशेषज्ञ', 'Person', '{hero,about,skills,experience,certifications,projects,education,contact}', '{security engineer}', 70),
  ('science', 'scientist', 'Scientist', 'वैज्ञानिक', 'Person', '{hero,about,research,publications,experience,education,awards,contact}', '{}', 10),
  ('science', 'researcher', 'Researcher', 'शोधकर्ता', 'Person', '{hero,about,research,publications,projects,education,awards,contact}', '{}', 20),
  ('science', 'research-scholar', 'Research Scholar', 'शोधार्थी', 'Person', '{hero,about,research,publications,education,projects,awards,contact}', '{phd scholar,doctoral researcher}', 30),
  ('science', 'archaeologist', 'Archaeologist', 'पुरातत्वविद', 'Person', '{hero,about,research,projects,publications,education,awards,gallery,contact}', '{}', 40),
  ('science', 'historian', 'Historian', 'इतिहासकार', 'Person', '{hero,about,research,publications,teaching,education,speaking,contact}', '{}', 50),
  ('public-leadership', 'politician', 'Politician', 'राजनेता', 'Person', '{hero,about,achievements,experience,news,press,gallery,contact}', '{mla,mp,councillor}', 10),
  ('public-leadership', 'public-figure', 'Public Figure', 'सार्वजनिक व्यक्ति', 'Person', '{hero,about,achievements,press,gallery,social_links,contact}', '{}', 20),
  ('public-leadership', 'social-worker', 'Social Worker', 'सामाजिक कार्यकर्ता', 'Person', '{hero,about,projects,experience,achievements,gallery,testimonials,contact}', '{ngo}', 30),
  ('public-leadership', 'community-leader', 'Community Leader', 'सामुदायिक नेता', 'Person', '{hero,about,projects,achievements,gallery,testimonials,contact}', '{}', 40),
  ('creative', 'actor', 'Actor', 'अभिनेता', 'Person', '{hero,about,portfolio,experience,gallery,awards,press,contact}', '{actress}', 10),
  ('creative', 'celebrity', 'Celebrity', 'सेलिब्रिटी', 'Person', '{hero,about,portfolio,achievements,gallery,press,social_links,contact}', '{}', 20),
  ('creative', 'influencer', 'Influencer', 'इन्फ्लुएंसर', 'Person', '{hero,about,achievements,portfolio,testimonials,social_links,contact}', '{}', 30),
  ('creative', 'content-creator', 'Content Creator', 'कंटेंट क्रिएटर', 'Person', '{hero,about,portfolio,services,achievements,testimonials,social_links,contact}', '{youtuber,blogger}', 40),
  ('creative', 'photographer', 'Photographer', 'फ़ोटोग्राफ़र', 'Person', '{hero,about,gallery,services,testimonials,contact}', '{}', 50),
  ('creative', 'designer', 'Designer', 'डिज़ाइनर', 'Person', '{hero,about,portfolio,services,experience,skills,testimonials,contact}', '{ui designer,graphic designer}', 60),
  ('creative', 'writer', 'Writer', 'लेखक', 'Person', '{hero,about,publications,projects,awards,press,contact}', '{author,journalist}', 70),
  ('creative', 'artist', 'Artist', 'कलाकार', 'Person', '{hero,about,gallery,projects,awards,press,contact}', '{painter,sculptor}', 80),
  ('creative', 'musician', 'Musician', 'संगीतकार', 'Person', '{hero,about,portfolio,gallery,awards,press,contact}', '{singer,composer}', 90),
  ('skilled-professionals', 'carpenter', 'Carpenter', 'बढ़ई', 'HomeAndConstructionBusiness', '{hero,about,services,experience,projects,gallery,testimonials,service_areas,contact,whatsapp}', '{woodworker,furniture}', 10),
  ('skilled-professionals', 'electrician', 'Electrician', 'इलेक्ट्रीशियन', 'HomeAndConstructionBusiness', '{hero,about,services,experience,projects,gallery,testimonials,service_areas,contact,whatsapp}', '{wireman}', 20),
  ('skilled-professionals', 'plumber', 'Plumber', 'प्लंबर', 'HomeAndConstructionBusiness', '{hero,about,services,experience,gallery,testimonials,service_areas,contact,whatsapp}', '{}', 30),
  ('skilled-professionals', 'mechanic', 'Mechanic', 'मैकेनिक', 'LocalBusiness', '{hero,about,services,experience,gallery,testimonials,service_areas,contact,whatsapp}', '{auto repair}', 40),
  ('skilled-professionals', 'technician', 'Technician', 'तकनीशियन', 'LocalBusiness', '{hero,about,services,experience,certifications,testimonials,service_areas,contact,whatsapp}', '{ac repair,appliance repair}', 50),
  ('skilled-professionals', 'contractor', 'Contractor', 'ठेकेदार', 'HomeAndConstructionBusiness', '{hero,about,services,projects,gallery,testimonials,service_areas,contact,whatsapp}', '{}', 60),
  ('skilled-professionals', 'builder', 'Builder', 'बिल्डर', 'HomeAndConstructionBusiness', '{hero,about,services,projects,gallery,testimonials,service_areas,contact,whatsapp}', '{construction}', 70),
  ('business', 'entrepreneur', 'Entrepreneur', 'उद्यमी', 'Person', '{hero,about,achievements,experience,projects,press,speaking,contact}', '{}', 10),
  ('business', 'founder', 'Founder', 'संस्थापक', 'Person', '{hero,about,achievements,experience,projects,press,speaking,contact}', '{ceo,co-founder}', 20),
  ('business', 'consultant', 'Consultant', 'सलाहकार', 'ProfessionalService', '{hero,about,services,experience,achievements,testimonials,contact}', '{advisor}', 30),
  ('business', 'freelancer', 'Freelancer', 'फ्रीलांसर', 'Person', '{hero,about,services,projects,skills,testimonials,contact}', '{}', 40),
  ('business', 'real-estate-professional', 'Real Estate Professional', 'रियल एस्टेट पेशेवर', 'ProfessionalService', '{hero,about,services,achievements,gallery,testimonials,service_areas,contact,whatsapp}', '{realtor,property dealer}', 50),
  ('business', 'financial-consultant', 'Financial Consultant', 'वित्तीय सलाहकार', 'ProfessionalService', '{hero,about,services,experience,certifications,testimonials,contact}', '{financial advisor,ca,chartered accountant}', 60),
  ('general', 'student', 'Student', 'छात्र', 'Person', '{hero,about,education,skills,projects,achievements,contact}', '{}', 10),
  ('general', 'professional', 'Professional', 'पेशेवर', 'Person', '{hero,about,experience,education,skills,contact}', '{}', 20),
  ('general', 'personal-profile', 'Personal Profile', 'व्यक्तिगत प्रोफ़ाइल', 'Person', '{hero,about,social_links,contact}', '{}', 30)
)
insert into public.professions (category_id, slug, name, name_i18n, schema_org_type, recommended_sections, synonyms, sort_order)
select c.id, p.slug, p.name, jsonb_build_object('hi', p.hi), p.schema_type, p.sections::text[], p.synonyms::text[], p.sort
from p join public.profession_categories c on c.slug = p.category
on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, name_i18n = excluded.name_i18n,
  schema_org_type = excluded.schema_org_type, recommended_sections = excluded.recommended_sections,
  synonyms = excluded.synonyms, sort_order = excluded.sort_order;

-- Profession-specific profile fields (stored in profiles.extra).
update public.professions set profile_fields = '[{"key":"registration_number","label":"Medical registration no."},{"key":"clinic_name","label":"Clinic / hospital"}]'
  where slug in ('doctor', 'dentist', 'surgeon', 'medical-practitioner', 'physiotherapist');
update public.professions set profile_fields = '[{"key":"enrolment_number","label":"Bar enrolment no."},{"key":"courts","label":"Courts of practice"}]'
  where slug in ('lawyer', 'advocate');
update public.professions set profile_fields = '[{"key":"orcid","label":"ORCID iD"},{"key":"institution","label":"Institution"}]'
  where slug in ('professor', 'researcher', 'research-scholar', 'scientist', 'academic', 'archaeologist', 'historian', 'lecturer');
update public.professions set profile_fields = '[{"key":"license_number","label":"Licence no."},{"key":"emergency_service","label":"24×7 emergency service (yes/no)"}]'
  where slug in ('electrician', 'plumber', 'contractor', 'builder');

-- ---------------------------------------------------------------------------------------------
-- Features and plans (prices in paise; admins can change everything here)
-- ---------------------------------------------------------------------------------------------
insert into public.features (key, name, description, kind, unit, sort_order) values
  ('premium_templates', 'Premium templates', 'Publish with any premium template', 'boolean', null, 10),
  ('advanced_sections', 'Advanced sections', 'FAQ, timeline, press, news, products and video sections', 'boolean', null, 20),
  ('remove_branding', 'Remove platform branding', 'Hide the "Made with" footer on your site', 'boolean', null, 30),
  ('advanced_seo', 'Advanced SEO', 'Custom social image, keywords and canonical URL', 'boolean', null, 40),
  ('analytics_basic', 'Analytics', 'Page views and unique visitors', 'boolean', null, 50),
  ('analytics_advanced', 'Advanced analytics', 'Top pages, referrers, devices, countries and clicks', 'boolean', null, 60),
  ('ai_content_generation', 'AI writing assistant', 'Generate and rewrite content with AI', 'boolean', null, 70),
  ('ai_import', 'AI import', 'Import a CV, document or public page with AI', 'boolean', null, 80),
  ('ai_advanced_models', 'Advanced AI models', 'Higher-quality models for generation', 'boolean', null, 90),
  ('custom_domain', 'Custom domain', 'Connect your own domain', 'boolean', null, 100),
  ('multiple_websites', 'Multiple websites', 'Run more than one website', 'boolean', null, 110),
  ('custom_css', 'Custom CSS', 'Reserved; not yet available', 'boolean', null, 120),
  ('max_websites', 'Websites', 'Websites in the workspace', 'limit', 'websites', 200),
  ('ai_credits_monthly', 'AI credits', 'AI credits per billing period', 'limit', 'credits', 210),
  ('storage_mb', 'Storage', 'Media storage', 'limit', 'MB', 220),
  ('max_custom_domains', 'Custom domains', 'Connected custom domains', 'limit', 'domains', 230)
on conflict (key) do update set name = excluded.name, description = excluded.description, kind = excluded.kind,
  unit = excluded.unit, sort_order = excluded.sort_order;

insert into public.subscription_plans (slug, name, description, price_minor, currency, billing_interval, is_default, is_featured, sort_order, highlights) values
  ('free', 'Free', 'A complete professional website on a free address.', 0, 'INR', 'month', true, false, 10,
     '{"1 website with a free address","Free templates","Core sections","Basic SEO","25 AI credits / month","50 MB storage","Basic analytics"}'),
  ('basic', 'Basic', 'Premium design and deeper insight.', 19900, 'INR', 'month', false, true, 20,
     '{"Everything in Free","Premium templates","Advanced sections","Remove platform branding","Advanced SEO","Advanced analytics","200 AI credits / month","500 MB storage"}'),
  ('advanced', 'Advanced', 'Your own domain and the best AI.', 29900, 'INR', 'month', false, false, 30,
     '{"Everything in Basic","Custom domain","Advanced AI models","1,000 AI credits / month","Up to 3 websites","2 GB storage"}')
on conflict (slug) do update set name = excluded.name, description = excluded.description, highlights = excluded.highlights,
  sort_order = excluded.sort_order;

with grants (plan, feature, enabled, lim) as (values
  ('free', 'analytics_basic', true, null), ('free', 'ai_content_generation', true, null), ('free', 'ai_import', true, null),
  ('free', 'max_websites', true, 1), ('free', 'ai_credits_monthly', true, 25), ('free', 'storage_mb', true, 50),
  ('free', 'max_custom_domains', true, 0),
  ('basic', 'analytics_basic', true, null), ('basic', 'ai_content_generation', true, null), ('basic', 'ai_import', true, null),
  ('basic', 'premium_templates', true, null), ('basic', 'advanced_sections', true, null), ('basic', 'remove_branding', true, null),
  ('basic', 'advanced_seo', true, null), ('basic', 'analytics_advanced', true, null),
  ('basic', 'max_websites', true, 1), ('basic', 'ai_credits_monthly', true, 200), ('basic', 'storage_mb', true, 500),
  ('basic', 'max_custom_domains', true, 0),
  ('advanced', 'analytics_basic', true, null), ('advanced', 'ai_content_generation', true, null), ('advanced', 'ai_import', true, null),
  ('advanced', 'premium_templates', true, null), ('advanced', 'advanced_sections', true, null), ('advanced', 'remove_branding', true, null),
  ('advanced', 'advanced_seo', true, null), ('advanced', 'analytics_advanced', true, null), ('advanced', 'custom_domain', true, null),
  ('advanced', 'ai_advanced_models', true, null), ('advanced', 'multiple_websites', true, null),
  ('advanced', 'max_websites', true, 3), ('advanced', 'ai_credits_monthly', true, 1000), ('advanced', 'storage_mb', true, 2048),
  ('advanced', 'max_custom_domains', true, 3)
)
insert into public.plan_features (plan_id, feature_key, enabled, limit_value)
select sp.id, g.feature, g.enabled, g.lim from grants g join public.subscription_plans sp on sp.slug = g.plan
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled, limit_value = excluded.limit_value;

-- ---------------------------------------------------------------------------------------------
-- AI providers, models and task routes. Model ids must be confirmed against each provider's
-- /v1/models before going live (docs/AI_ARCHITECTURE.md); admins change them here, not in code.
-- ---------------------------------------------------------------------------------------------
insert into public.ai_providers (slug, name, adapter, base_url, api_key_env) values
  ('nvidia', 'NVIDIA NIM (build.nvidia.com)', 'openai_compatible', 'https://integrate.api.nvidia.com/v1', 'NVIDIA_API_KEY'),
  ('xai', 'xAI Grok', 'openai_compatible', 'https://api.x.ai/v1', 'XAI_API_KEY'),
  ('mock', 'Mock (development only)', 'mock', null, null)
on conflict (slug) do update set name = excluded.name, adapter = excluded.adapter, base_url = excluded.base_url,
  api_key_env = excluded.api_key_env;

insert into public.ai_models (provider_id, model_key, display_name, capabilities, context_window)
select pr.id, m.model_key, m.display_name, m.caps::text[], m.ctx from (values
  ('nvidia', 'meta/llama-3.1-8b-instruct', 'Llama 3.1 8B Instruct', '{text,json}', 128000),
  ('nvidia', 'meta/llama-3.3-70b-instruct', 'Llama 3.3 70B Instruct', '{text,json}', 128000),
  ('nvidia', 'meta/llama-3.2-11b-vision-instruct', 'Llama 3.2 11B Vision', '{text,vision}', 128000),
  ('xai', 'grok-3-mini', 'Grok 3 Mini', '{text,json}', 131072),
  ('mock', 'mock-writer', 'Mock writer', '{text,json,vision}', 8000)
) as m (provider, model_key, display_name, caps, ctx)
join public.ai_providers pr on pr.slug = m.provider
on conflict (provider_id, model_key) do update set display_name = excluded.display_name, capabilities = excluded.capabilities;

with r (task, tier, model, fallback, credits, max_tokens, temperature) as (values
  ('profile_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 3, 1200, 0.6),
  ('bio_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 2, 900, 0.7),
  ('headline_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 1, 300, 0.8),
  ('experience_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 2, 900, 0.5),
  ('service_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 2, 900, 0.6),
  ('project_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 2, 900, 0.6),
  ('seo_generation', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 1, 500, 0.4),
  ('translation', 'standard', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 2, 1500, 0.2),
  ('rewrite', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 1, 900, 0.6),
  ('summarization', 'standard', 'meta/llama-3.1-8b-instruct', 'grok-3-mini', 1, 600, 0.3),
  ('document_extraction', 'standard', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 5, 4000, 0.1),
  ('url_extraction', 'standard', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 5, 4000, 0.1),
  ('ocr_processing', 'standard', 'meta/llama-3.2-11b-vision-instruct', null, 5, 3000, 0.0),
  ('bio_generation', 'advanced', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 2, 900, 0.7),
  ('experience_generation', 'advanced', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 2, 900, 0.5),
  ('service_generation', 'advanced', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 2, 900, 0.6),
  ('rewrite', 'advanced', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 1, 900, 0.6),
  ('profile_generation', 'advanced', 'meta/llama-3.3-70b-instruct', 'grok-3-mini', 3, 1200, 0.6)
)
insert into public.ai_task_routes (task, tier, model_id, fallback_model_id, credits_cost, max_output_tokens, temperature)
select r.task, r.tier, m.id, fm.id, r.credits, r.max_tokens, r.temperature
from r join public.ai_models m on m.model_key = r.model
left join public.ai_models fm on fm.model_key = r.fallback
on conflict (task, tier) do update set model_id = excluded.model_id, fallback_model_id = excluded.fallback_model_id,
  credits_cost = excluded.credits_cost, max_output_tokens = excluded.max_output_tokens, temperature = excluded.temperature;

-- ---------------------------------------------------------------------------------------------
-- Import sources
-- ---------------------------------------------------------------------------------------------
insert into public.import_sources (key, name, input_kind, accepted_mime_types, url_pattern, is_enabled, guidance, sort_order) values
  ('resume_pdf', 'CV / résumé (PDF)', 'file', '{application/pdf}', null, true, 'Text-based PDFs work best. Scanned PDFs are read with OCR when available.', 10),
  ('resume_docx', 'CV / résumé (Word)', 'file', '{application/vnd.openxmlformats-officedocument.wordprocessingml.document}', null, true, null, 20),
  ('linkedin_pdf', 'LinkedIn profile (PDF export)', 'file', '{application/pdf}', null, true,
     'On LinkedIn open your profile → More → Save to PDF, then upload the file here. LinkedIn does not allow automated collection of profile pages.', 30),
  ('linkedin_url', 'LinkedIn URL', 'url', '{}', '^https://([a-z]+\.)?linkedin\.com/in/', false,
     'LinkedIn profile pages require sign-in and their terms prohibit scraping. Use the PDF export instead.', 35),
  ('website_url', 'Personal website / portfolio URL', 'url', '{}', '^https?://', true, 'We read the public page once, respecting robots.txt.', 40),
  ('github_url', 'GitHub profile', 'url', '{}', '^https://github\.com/[A-Za-z0-9-]+/?$', true, 'Uses the public GitHub API: profile and public repositories.', 50),
  ('text', 'Paste text', 'text', '{}', null, true, 'Paste your CV or a few notes about your work.', 60),
  ('image', 'Image (CV photo, certificate, business card)', 'file', '{image/jpeg,image/png,image/webp}', null, true, 'Needs an OCR-capable AI model.', 70)
on conflict (key) do update set name = excluded.name, input_kind = excluded.input_kind, accepted_mime_types = excluded.accepted_mime_types,
  url_pattern = excluded.url_pattern, is_enabled = excluded.is_enabled, guidance = excluded.guidance, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------------------------
-- Templates. config = { tokens:{colors,typography,spacing,components}, layout:{shell,heroAlign},
-- sections:[{type,variant}], features:[...] } (src/site/types.ts TemplateConfig).
-- ---------------------------------------------------------------------------------------------
with t (slug, name, description, style, layout, tier, featured, color_family, tags, features, demo, config, professions, categories) as (values
  ('minimal-cv', 'Minimal CV', 'A quiet, print-ready one-page CV that lets your experience speak.', 'minimal', 'centered', 'free', true, 'neutral',
   '{cv,resume,simple,print}', '{print,mobile-first}', 'professional',
   '{"tokens":{"colors":{"background":"#ffffff","surface":"#fafafa","text":"#18181b","muted":"#52525b","primary":"#18181b","primaryContrast":"#ffffff","accent":"#2563eb","border":"#e4e4e7"},"typography":{"heading":"inter","body":"inter","scale":"default","headingWeight":650},"spacing":{"section":"compact","width":"narrow"},"components":{"radius":"sm","button":"solid","card":"flat"}},"layout":{"shell":"centered","heroAlign":"left"},"sections":[{"type":"hero","variant":"minimal"},{"type":"experience","variant":"list"},{"type":"education","variant":"list"},{"type":"skills","variant":"chips"},{"type":"projects","variant":"list"},{"type":"testimonials","variant":"quote"},{"type":"contact","variant":"default"}]}',
   '{}', '{general,technology,business,legal,education}'),
  ('medical-pro', 'Medical Pro', 'Calm, trustworthy and clear: specialities, clinic timings and appointments up front.', 'classic', 'split', 'free', true, 'teal',
   '{doctor,clinic,healthcare,appointments}', '{appointments,locations,schema}', 'doctor',
   '{"tokens":{"colors":{"background":"#f7fafb","surface":"#ffffff","text":"#0f2433","muted":"#4b6475","primary":"#0f4c5c","primaryContrast":"#ffffff","accent":"#0e8a7e","border":"#d8e3e8"},"typography":{"heading":"source-serif","body":"ibm-plex-sans","scale":"default","headingWeight":600},"spacing":{"section":"default","width":"default"},"components":{"radius":"md","button":"solid","card":"bordered"}},"layout":{"shell":"split","heroAlign":"left"},"sections":[{"type":"hero","variant":"split"},{"type":"services","variant":"cards"},{"type":"experience","variant":"timeline"},{"type":"education","variant":"list"},{"type":"testimonials","variant":"cards"},{"type":"contact","variant":"split"}]}',
   '{doctor,dentist,surgeon,physiotherapist,psychologist,medical-practitioner,healthcare-professional}', '{medical}'),
  ('legal-executive', 'Legal Executive', 'Restrained, authoritative typography for advocates and legal counsel.', 'editorial', 'editorial', 'premium', true, 'burgundy',
   '{lawyer,advocate,counsel,formal}', '{schema,print}', 'lawyer',
   '{"tokens":{"colors":{"background":"#fbfaf7","surface":"#ffffff","text":"#1c1917","muted":"#57534e","primary":"#3f1d1d","primaryContrast":"#fbfaf7","accent":"#8b2c2c","border":"#e7e1d8"},"typography":{"heading":"playfair","body":"source-serif","scale":"large","headingWeight":600},"spacing":{"section":"airy","width":"default"},"components":{"radius":"none","button":"outline","card":"flat"}},"layout":{"shell":"editorial","heroAlign":"left"},"sections":[{"type":"hero","variant":"minimal"},{"type":"specialization","variant":"default"},{"type":"services","variant":"list"},{"type":"experience","variant":"list"},{"type":"education","variant":"list"},{"type":"awards","variant":"list"},{"type":"contact","variant":"default"}]}',
   '{lawyer,advocate,legal-consultant,legal-professional}', '{legal}'),
  ('academic-scholar', 'Academic Scholar', 'An editorial, parchment-toned layout for publications, research and teaching.', 'editorial', 'editorial', 'free', true, 'terracotta',
   '{academic,research,publications,bilingual}', '{print,publications,bilingual}', 'professor',
   '{"tokens":{"colors":{"background":"#fbfbfa","surface":"#ffffff","text":"#18181b","muted":"#57534e","primary":"#18181b","primaryContrast":"#fbfbfa","accent":"#9a3412","border":"#e7e5e4"},"typography":{"heading":"fraunces","body":"source-serif","scale":"default","headingWeight":600},"spacing":{"section":"default","width":"narrow"},"components":{"radius":"sm","button":"outline","card":"flat"}},"layout":{"shell":"editorial","heroAlign":"left"},"sections":[{"type":"hero","variant":"minimal"},{"type":"research","variant":"default"},{"type":"publications","variant":"list"},{"type":"teaching","variant":"default"},{"type":"education","variant":"timeline"},{"type":"awards","variant":"list"},{"type":"contact","variant":"default"}]}',
   '{professor,lecturer,academic,research-scholar,historian,archaeologist,teacher}', '{education,science}'),
  ('modern-engineer', 'Modern Engineer', 'A dark, focused layout with a sticky profile column for engineers and builders.', 'modern', 'sidebar', 'free', true, 'dark',
   '{developer,engineer,dark,projects}', '{projects,skills,dark}', 'software-engineer',
   '{"tokens":{"colors":{"background":"#0e1013","surface":"#16191e","text":"#e7e9ec","muted":"#9aa3ad","primary":"#e7e9ec","primaryContrast":"#0e1013","accent":"#7cc4f4","border":"#262a31"},"typography":{"heading":"space-grotesk","body":"inter","mono":"jetbrains-mono","scale":"default","headingWeight":600},"spacing":{"section":"default","width":"wide"},"components":{"radius":"md","button":"solid","card":"bordered"}},"layout":{"shell":"sidebar","heroAlign":"left"},"sections":[{"type":"hero","variant":"minimal"},{"type":"experience","variant":"timeline"},{"type":"projects","variant":"grid"},{"type":"skills","variant":"grouped"},{"type":"education","variant":"list"},{"type":"contact","variant":"default"}]}',
   '{software-engineer,web-developer,developer,ai-engineer,data-scientist,cybersecurity-professional,it-consultant}', '{technology}'),
  ('researcher', 'Researcher', 'A two-column reading layout for long publication lists and projects.', 'classic', 'sidebar', 'premium', false, 'green',
   '{research,science,publications,orcid}', '{publications,print}', 'researcher',
   '{"tokens":{"colors":{"background":"#f4f6f3","surface":"#ffffff","text":"#1a241e","muted":"#4d5c52","primary":"#1f4d3a","primaryContrast":"#ffffff","accent":"#2d6a4f","border":"#dbe3dc"},"typography":{"heading":"lora","body":"inter","scale":"default","headingWeight":600},"spacing":{"section":"default","width":"wide"},"components":{"radius":"sm","button":"solid","card":"bordered"}},"layout":{"shell":"sidebar","heroAlign":"left"},"sections":[{"type":"hero","variant":"minimal"},{"type":"research","variant":"default"},{"type":"publications","variant":"list"},{"type":"projects","variant":"list"},{"type":"education","variant":"list"},{"type":"awards","variant":"list"},{"type":"contact","variant":"default"}]}',
   '{researcher,scientist,research-scholar,data-scientist,academic}', '{science,education}'),
  ('creative-portfolio', 'Creative Portfolio', 'Large imagery and confident type for designers, artists and photographers.', 'bold', 'split', 'premium', true, 'warm',
   '{portfolio,design,gallery,visual}', '{gallery,portfolio}', 'designer',
   '{"tokens":{"colors":{"background":"#f5f1ea","surface":"#fffdf9","text":"#1d1b18","muted":"#5f5a52","primary":"#1d1b18","primaryContrast":"#f5f1ea","accent":"#d2492a","border":"#e3dccf"},"typography":{"heading":"space-grotesk","body":"dm-sans","scale":"large","headingWeight":700},"spacing":{"section":"airy","width":"wide"},"components":{"radius":"none","button":"solid","card":"flat"}},"layout":{"shell":"split","heroAlign":"left"},"sections":[{"type":"hero","variant":"banner"},{"type":"portfolio","variant":"grid"},{"type":"gallery","variant":"grid"},{"type":"services","variant":"list"},{"type":"testimonials","variant":"quote"},{"type":"contact","variant":"split"}]}',
   '{designer,photographer,artist,actor,musician,writer}', '{creative}'),
  ('public-profile', 'Public Profile', 'A clear, accessible profile for public life: work, achievements and updates.', 'classic', 'centered', 'free', false, 'blue',
   '{public,leader,community,news}', '{achievements,gallery}', 'politician',
   '{"tokens":{"colors":{"background":"#ffffff","surface":"#f6f8fb","text":"#111827","muted":"#4b5563","primary":"#1e3a8a","primaryContrast":"#ffffff","accent":"#b45309","border":"#e5e7eb"},"typography":{"heading":"dm-sans","body":"dm-sans","scale":"large","headingWeight":700},"spacing":{"section":"default","width":"default"},"components":{"radius":"md","button":"solid","card":"elevated"}},"layout":{"shell":"centered","heroAlign":"center"},"sections":[{"type":"hero","variant":"default"},{"type":"achievements","variant":"stats"},{"type":"projects","variant":"grid"},{"type":"gallery","variant":"grid"},{"type":"testimonials","variant":"cards"},{"type":"contact","variant":"default"}]}',
   '{politician,public-figure,social-worker,community-leader}', '{public-leadership}'),
  ('executive-profile', 'Executive Profile', 'Understated and senior: leadership, outcomes and board-level credibility.', 'classic', 'split', 'premium', false, 'gold',
   '{executive,leadership,founder,board}', '{achievements,print}', 'founder',
   '{"tokens":{"colors":{"background":"#fafaf9","surface":"#ffffff","text":"#111827","muted":"#4b5563","primary":"#111827","primaryContrast":"#fafaf9","accent":"#a16207","border":"#e7e5e4"},"typography":{"heading":"playfair","body":"inter","scale":"default","headingWeight":600},"spacing":{"section":"airy","width":"default"},"components":{"radius":"sm","button":"solid","card":"flat"}},"layout":{"shell":"split","heroAlign":"left"},"sections":[{"type":"hero","variant":"split"},{"type":"achievements","variant":"stats"},{"type":"experience","variant":"timeline"},{"type":"speaking","variant":"default"},{"type":"education","variant":"list"},{"type":"contact","variant":"default"}]}',
   '{founder,entrepreneur,consultant,financial-consultant,principal}', '{business}'),
  ('creator-portfolio', 'Creator Portfolio', 'Built around your channels, collaborations and audience numbers.', 'modern', 'centered', 'premium', false, 'violet',
   '{creator,influencer,social,brand}', '{social,achievements}', 'content-creator',
   '{"tokens":{"colors":{"background":"#fcfbff","surface":"#ffffff","text":"#1b1530","muted":"#5b5470","primary":"#3b1f7a","primaryContrast":"#ffffff","accent":"#c2410c","border":"#ebe7f5"},"typography":{"heading":"dm-sans","body":"dm-sans","scale":"large","headingWeight":700},"spacing":{"section":"default","width":"default"},"components":{"radius":"lg","button":"pill","card":"elevated"}},"layout":{"shell":"centered","heroAlign":"center"},"sections":[{"type":"hero","variant":"default"},{"type":"social_links","variant":"default"},{"type":"achievements","variant":"stats"},{"type":"portfolio","variant":"grid"},{"type":"services","variant":"cards"},{"type":"testimonials","variant":"cards"},{"type":"contact","variant":"default"}]}',
   '{content-creator,influencer,celebrity,musician,actor}', '{creative}'),
  ('skilled-professional', 'Skilled Professional', 'Services, service areas and one-tap call/WhatsApp, made for trades.', 'warm', 'centered', 'free', true, 'orange',
   '{trades,local,services,whatsapp}', '{whatsapp,service-areas,schema}', 'electrician',
   '{"tokens":{"colors":{"background":"#f6f2ea","surface":"#ffffff","text":"#1f1b16","muted":"#5c544a","primary":"#1f2937","primaryContrast":"#ffffff","accent":"#c2410c","border":"#e4dccd"},"typography":{"heading":"dm-sans","body":"dm-sans","scale":"large","headingWeight":800},"spacing":{"section":"default","width":"default"},"components":{"radius":"md","button":"solid","card":"bordered"}},"layout":{"shell":"centered","heroAlign":"left"},"sections":[{"type":"hero","variant":"split"},{"type":"services","variant":"cards"},{"type":"service_areas","variant":"default"},{"type":"gallery","variant":"grid"},{"type":"testimonials","variant":"cards"},{"type":"contact","variant":"split"},{"type":"whatsapp","variant":"default"}]}',
   '{carpenter,electrician,plumber,mechanic,technician,contractor,builder}', '{skilled-professionals}'),
  ('business-consultant', 'Business Consultant', 'Offer-led layout: services, outcomes and testimonials that convert.', 'modern', 'split', 'premium', false, 'teal',
   '{consulting,services,b2b,leads}', '{services,testimonials}', 'consultant',
   '{"tokens":{"colors":{"background":"#ffffff","surface":"#f6f9f9","text":"#0f172a","muted":"#475569","primary":"#0f172a","primaryContrast":"#ffffff","accent":"#0f766e","border":"#e2e8f0"},"typography":{"heading":"inter","body":"inter","scale":"default","headingWeight":700},"spacing":{"section":"default","width":"default"},"components":{"radius":"md","button":"solid","card":"bordered"}},"layout":{"shell":"split","heroAlign":"left"},"sections":[{"type":"hero","variant":"split"},{"type":"services","variant":"cards"},{"type":"achievements","variant":"stats"},{"type":"experience","variant":"list"},{"type":"testimonials","variant":"cards"},{"type":"cta","variant":"default"},{"type":"contact","variant":"default"}]}',
   '{consultant,freelancer,financial-consultant,it-consultant,real-estate-professional}', '{business}')
),
ins as (
  insert into public.templates (slug, name, description, style, layout, tier, status, is_featured, color_family, tags, features, demo_profile_key, published_at)
  select slug, name, description, style, layout, tier, 'published', featured, color_family, tags::text[], features::text[], demo, now() from t
  on conflict (slug) do update set name = excluded.name, description = excluded.description, style = excluded.style,
    layout = excluded.layout, tier = excluded.tier, is_featured = excluded.is_featured, color_family = excluded.color_family,
    tags = excluded.tags, features = excluded.features, demo_profile_key = excluded.demo_profile_key
  returning id, slug
)
insert into public.template_versions (template_id, version, config, status, changelog, published_at)
select ins.id, 1, t.config::jsonb, 'published', 'Initial release', now() from ins join t on t.slug = ins.slug
on conflict (template_id, version) do nothing;

update public.templates tp set current_version_id = tv.id
from public.template_versions tv where tv.template_id = tp.id and tv.version = 1 and tp.current_version_id is null;

-- Compatibility mappings.
with m (template, profession) as (values
  ('medical-pro', 'doctor'), ('medical-pro', 'dentist'), ('medical-pro', 'surgeon'), ('medical-pro', 'physiotherapist'),
  ('medical-pro', 'psychologist'), ('medical-pro', 'medical-practitioner'), ('medical-pro', 'healthcare-professional'),
  ('legal-executive', 'lawyer'), ('legal-executive', 'advocate'), ('legal-executive', 'legal-consultant'), ('legal-executive', 'legal-professional'),
  ('academic-scholar', 'professor'), ('academic-scholar', 'lecturer'), ('academic-scholar', 'academic'), ('academic-scholar', 'research-scholar'),
  ('academic-scholar', 'historian'), ('academic-scholar', 'archaeologist'), ('academic-scholar', 'teacher'),
  ('modern-engineer', 'software-engineer'), ('modern-engineer', 'web-developer'), ('modern-engineer', 'developer'),
  ('modern-engineer', 'ai-engineer'), ('modern-engineer', 'data-scientist'), ('modern-engineer', 'cybersecurity-professional'),
  ('researcher', 'researcher'), ('researcher', 'scientist'), ('researcher', 'research-scholar'), ('researcher', 'data-scientist'),
  ('creative-portfolio', 'designer'), ('creative-portfolio', 'photographer'), ('creative-portfolio', 'artist'), ('creative-portfolio', 'actor'),
  ('public-profile', 'politician'), ('public-profile', 'public-figure'), ('public-profile', 'social-worker'), ('public-profile', 'community-leader'),
  ('executive-profile', 'founder'), ('executive-profile', 'entrepreneur'), ('executive-profile', 'consultant'), ('executive-profile', 'principal'),
  ('creator-portfolio', 'content-creator'), ('creator-portfolio', 'influencer'), ('creator-portfolio', 'celebrity'), ('creator-portfolio', 'musician'),
  ('skilled-professional', 'carpenter'), ('skilled-professional', 'electrician'), ('skilled-professional', 'plumber'),
  ('skilled-professional', 'mechanic'), ('skilled-professional', 'technician'), ('skilled-professional', 'contractor'), ('skilled-professional', 'builder'),
  ('business-consultant', 'consultant'), ('business-consultant', 'freelancer'), ('business-consultant', 'financial-consultant'),
  ('business-consultant', 'real-estate-professional'), ('business-consultant', 'it-consultant'),
  ('minimal-cv', 'student'), ('minimal-cv', 'professional'), ('minimal-cv', 'personal-profile'), ('minimal-cv', 'freelancer')
)
insert into public.template_professions (template_id, profession_id, is_recommended)
select tp.id, pr.id, true from m join public.templates tp on tp.slug = m.template join public.professions pr on pr.slug = m.profession
on conflict do nothing;

with m (template, category) as (values
  ('minimal-cv', 'general'), ('minimal-cv', 'technology'), ('minimal-cv', 'business'), ('minimal-cv', 'legal'), ('minimal-cv', 'education'),
  ('minimal-cv', 'science'), ('minimal-cv', 'medical'),
  ('medical-pro', 'medical'), ('legal-executive', 'legal'), ('academic-scholar', 'education'), ('academic-scholar', 'science'),
  ('modern-engineer', 'technology'), ('researcher', 'science'), ('researcher', 'education'), ('creative-portfolio', 'creative'),
  ('public-profile', 'public-leadership'), ('executive-profile', 'business'), ('creator-portfolio', 'creative'),
  ('skilled-professional', 'skilled-professionals'), ('business-consultant', 'business'), ('business-consultant', 'technology')
)
insert into public.template_categories (template_id, category_id)
select tp.id, c.id from m join public.templates tp on tp.slug = m.template join public.profession_categories c on c.slug = m.category
on conflict do nothing;
