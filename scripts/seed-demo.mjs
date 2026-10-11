#!/usr/bin/env node
// Local development only: creates a demo account with a complete, published doctor website and
// platform-admin rights, so the product can be explored right after `npm run db:reset`.
// Usage: node scripts/seed-demo.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DEMO = { email: 'demo.doctor@example.test', password: 'local-demo-Passw0rd!', name: 'Dr. Asha Rao', slug: 'dr-asha-rao' }

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
if (!/127\.0\.0\.1|localhost/.test(env.NEXT_PUBLIC_SUPABASE_URL)) { console.error('Refusing to seed demo data into a non-local Supabase project.'); process.exit(1) }
const opts = { auth: { persistSession: false } }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts)
const must = (r, what) => { if (r.error) { console.error(`${what}: ${r.error.message}`); process.exit(1) } return r.data }

const existing = must(await admin.auth.admin.listUsers(), 'list users').users.find((u) => u.email === DEMO.email)
if (existing) { console.log(`Demo account already exists: ${DEMO.email}`); process.exit(0) }
must(await admin.auth.admin.createUser({ email: DEMO.email, password: DEMO.password, email_confirm: true, user_metadata: { full_name: DEMO.name } }), 'create user')

const user = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts)
must(await user.auth.signInWithPassword({ email: DEMO.email, password: DEMO.password }), 'sign in')
const ws = must(await user.from('workspaces').select('id').single(), 'workspace').id
const doctor = must(await user.from('professions').select('id').eq('slug', 'doctor').single(), 'profession').id

const profile = must(await user.from('profiles').insert({
  workspace_id: ws, profession_id: doctor, full_name: DEMO.name, headline: 'Consultant Interventional Cardiologist · Pune',
  tagline: 'Evidence-based heart care, explained clearly.',
  bio_short: 'Cardiologist with 14 years of experience in angioplasty, heart-failure care and preventive cardiology.',
  bio_long: 'I am a consultant interventional cardiologist in Pune with 14 years of experience, focusing on angioplasty, heart-failure management and preventive cardiology.\n\nI believe patients deserve clear explanations and a plan they understand, not just a prescription.',
  email_public: 'clinic@example.test', phone_public: '+91 98765 43210', whatsapp_number: '+919876543210', city: 'Pune', region: 'Maharashtra',
  country_code: 'IN', languages: ['English', 'Hindi', 'Marathi'], years_experience: 14, extra: { registration_number: 'MMC 2009/01/0001', clinic_name: 'Sahyadri Heart Clinic' },
}).select('id').single(), 'profile').id

const base = { workspace_id: ws, profile_id: profile }
const add = async (table, rows) => must(await user.from(table).insert(rows.map((r, i) => ({ ...base, sort_order: (i + 1) * 10, ...r })), { defaultToNull: false }), table)
await add('profile_experiences', [
  { title: 'Consultant Cardiologist', organization: 'Sahyadri Heart Institute', start_date: '2016-01-01', is_current: true, description: 'Interventional cardiology, cath lab and heart-failure clinic.', highlights: ['Led 1,200+ angioplasties', 'Set up the heart-failure clinic'] },
  { title: 'Senior Resident, Cardiology', organization: 'KEM Hospital, Mumbai', start_date: '2012-08-01', end_date: '2015-12-01', description: 'DM residency with a focus on interventions.' },
])
await add('profile_education', [
  { institution: 'Seth GS Medical College & KEM Hospital', degree: 'DM Cardiology', start_date: '2012-08-01', end_date: '2015-07-01' },
  { institution: 'BJ Medical College, Pune', degree: 'MD Medicine', start_date: '2009-06-01', end_date: '2012-05-01' },
])
await add('profile_services', [
  { title: 'Cardiac consultation', description: 'Assessment of chest pain, breathlessness, palpitations and blood pressure.', price_text: '₹1,000', duration_text: '30 min' },
  { title: 'Angioplasty', description: 'Coronary angioplasty and stenting with a clear plan before and after.' },
  { title: 'Preventive heart check-up', description: 'ECG, echo and lipid review with a personalised risk plan.', price_text: '₹2,500' },
])
await add('profile_certifications', [{ name: 'Fellow, Cardiological Society of India', issuer: 'CSI', issued_on: '2018-01-01' }])
await add('profile_awards', [{ title: 'Young Investigator Award', issuer: 'Cardiological Society of India', awarded_on: '2017-11-01' }])
await add('profile_testimonials', [
  { author_name: 'Suresh K.', author_title: 'Patient', quote: 'Dr. Rao explained everything patiently. I knew exactly what to expect.', rating: 5 },
  { author_name: 'Meera P.', author_title: 'Patient’s daughter', quote: 'Calm, thorough and kind. We felt in safe hands.', rating: 5 },
])
await add('profile_locations', [{ label: 'Sahyadri Heart Clinic', address_line: 'Karve Road, Erandwane', city: 'Pune', region: 'Maharashtra', country_code: 'IN', postal_code: '411004', phone: '+91 20 1234 5678', hours: 'Mon–Sat, 10am–2pm', is_primary: true }])
await add('profile_social_links', [{ platform: 'linkedin', url: 'https://www.linkedin.com/in/example' }])

const websiteId = must(await user.rpc('create_website', { p_profile: profile, p_name: DEMO.name, p_slug: DEMO.slug, p_template_slug: 'medical-pro' }), 'create website')
const sections = must(await user.from('website_sections').select('id, section_type').eq('website_id', websiteId), 'sections')
const spec = sections.find((s) => s.section_type === 'specialization')
if (spec) must(await user.from('website_sections').update({ content: { items: [{ title: 'Interventional cardiology', description: 'Angioplasty and stenting for blocked arteries.' }, { title: 'Heart failure', description: 'Long-term management and medication optimisation.' }] } }).eq('id', spec.id), 'specialization')
must(await user.from('websites').update({ seo: { title: 'Dr. Asha Rao, Cardiologist in Pune', description: 'Consultant interventional cardiologist in Pune: angioplasty, heart-failure care and preventive cardiology.' } }).eq('id', websiteId), 'seo')
const pub = must(await user.rpc('publish_website', { p_website: websiteId }), 'publish')
must(await user.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('email', DEMO.email), 'onboarded')
must(await admin.from('users').update({ is_platform_admin: true }).eq('email', DEMO.email), 'admin')

console.log(`Demo ready. Sign in as ${DEMO.email} (password in scripts/seed-demo.mjs).`)
console.log(`Published v${pub.version}: http://${DEMO.slug}.localhost:3000  ·  http://localhost:3000/u/${DEMO.slug}`)
