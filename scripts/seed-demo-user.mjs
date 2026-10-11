#!/usr/bin/env node
// Local development only: a regular (non-admin) user on the Free plan with a published
// electrician website, for testing the normal customer experience.
// Usage: node scripts/seed-demo-user.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const USER = { email: 'demo.user@example.test', password: 'local-user-Passw0rd!', name: 'Ramesh Patil', slug: 'ramesh-electricals' }

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
if (!/127\.0\.0\.1|localhost/.test(env.NEXT_PUBLIC_SUPABASE_URL)) { console.error('Refusing to seed demo data into a non-local Supabase project.'); process.exit(1) }
const opts = { auth: { persistSession: false } }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts)
const must = (r, what) => { if (r.error) { console.error(`${what}: ${r.error.message}`); process.exit(1) } return r.data }

if (must(await admin.auth.admin.listUsers(), 'list users').users.some((u) => u.email === USER.email)) {
  console.log(`Normal demo user already exists: ${USER.email}`)
  process.exit(0)
}
must(await admin.auth.admin.createUser({ email: USER.email, password: USER.password, email_confirm: true, user_metadata: { full_name: USER.name } }), 'create user')

const user = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts)
must(await user.auth.signInWithPassword({ email: USER.email, password: USER.password }), 'sign in')
const ws = must(await user.from('workspaces').select('id').single(), 'workspace').id
const profession = must(await user.from('professions').select('id').eq('slug', 'electrician').single(), 'profession').id

const profile = must(await user.from('profiles').insert({
  workspace_id: ws, profession_id: profession, full_name: USER.name, display_name: 'Ramesh Electricals',
  headline: 'Licensed electrician · Home & office wiring', tagline: 'Same-day repairs across Pune West. Safe, tidy, on time.',
  bio_short: 'Licensed electrician with 15 years of experience in home wiring, repairs and inverter installation.',
  phone_public: '+91 98220 12345', whatsapp_number: '+919822012345', city: 'Pune', region: 'Maharashtra', country_code: 'IN', years_experience: 15,
}).select('id').single(), 'profile').id

const base = { workspace_id: ws, profile_id: profile }
const add = async (table, rows) => must(await user.from(table).insert(rows.map((r, i) => ({ ...base, sort_order: (i + 1) * 10, ...r })), { defaultToNull: false }), table)
await add('profile_services', [
  { title: 'Wiring & rewiring', description: 'New wiring and full rewiring for flats and bungalows.' },
  { title: 'Repairs', description: 'Short circuits, tripping MCBs, fans, lights and switches.', price_text: 'Visit ₹300' },
  { title: 'Inverter & UPS', description: 'Installation and maintenance of inverters and batteries.' },
])
await add('profile_locations', ['Kothrud', 'Karve Nagar', 'Warje', 'Baner'].map((label) => ({ label, city: 'Pune', is_service_area: true })))
await add('profile_testimonials', [{ author_name: 'Priya S.', author_title: 'Kothrud', quote: 'Came within two hours and fixed it properly. Fair price.', rating: 5 }])

const websiteId = must(await user.rpc('create_website', { p_profile: profile, p_name: 'Ramesh Electricals', p_slug: USER.slug, p_template_slug: 'skilled-professional' }), 'create website')
const pub = must(await user.rpc('publish_website', { p_website: websiteId }), 'publish')
must(await user.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('email', USER.email), 'onboarded')

console.log(`Normal demo user ready: ${USER.email} (password in scripts/seed-demo-user.mjs). Free plan, not an admin.`)
console.log(`Published v${pub.version}: http://${USER.slug}.localhost:3000`)
