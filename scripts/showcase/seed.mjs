#!/usr/bin/env node
// Seeds the showcase: fictional sample portfolios (scripts/showcase/data.mjs), published, marked as
// samples (visible notice + noindex). Idempotent: existing slugs are skipped.
// Usage: node scripts/showcase/seed.mjs [--env .env.local|.env.production]
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { SHOWCASE } from './data.mjs'

const envFile = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : '.env.local'
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts)

const ym = (s) => (s ? `${s}-01` : null)
const yr = (s) => (s ? `${s}-01-01` : null)
const must = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data }

const { data: existing } = await admin.from('websites').select('slug').in('slug', SHOWCASE.map((s) => s.slug))
const done = new Set((existing ?? []).map((w) => w.slug))
console.log(`Seeding ${SHOWCASE.length - done.size} of ${SHOWCASE.length} showcase sites into ${env.NEXT_PUBLIC_SUPABASE_URL}`)

let ok = 0
for (const s of SHOWCASE) {
  if (done.has(s.slug)) continue
  try {
    const email = `showcase.${s.slug}@example.com`
    const password = randomBytes(24).toString('base64url') // never stored; sample accounts are not for login
    must(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: s.name } }), 'create user')
    const user = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts)
    must(await user.auth.signInWithPassword({ email, password }), 'sign in')
    const ws = must(await user.from('workspaces').select('id').single(), 'workspace').id
    must(await admin.rpc('billing_set_plan', { p_workspace: ws, p_plan_slug: 'advanced', p_status: 'active', p_provider: 'showcase', p_provider_subscription_id: `showcase_${s.slug}`, p_period_end: '2099-12-31T00:00:00Z' }), 'plan')
    const profession = must(await user.from('professions').select('id').eq('slug', s.profession).single(), `profession ${s.profession}`).id

    const profile = must(await user.from('profiles').insert({
      workspace_id: ws, profession_id: profession, full_name: s.name, display_name: s.display ?? null, headline: s.headline,
      tagline: s.tagline ?? null, bio_short: s.bio_short, bio_long: s.bio_long, email_public: email, city: s.city, region: s.region,
      country_code: 'IN', years_experience: s.years ?? null, languages: [],
    }).select('id').single(), 'profile').id

    const base = { workspace_id: ws, profile_id: profile }
    const add = async (table, rows) => { if (rows?.length) must(await user.from(table).insert(rows.map((r, i) => ({ ...base, sort_order: (i + 1) * 10, ...r })), { defaultToNull: false }), table) }
    await add('profile_experiences', (s.exp ?? []).map(([title, organization, start, end, description]) => ({ title, organization, start_date: ym(start), end_date: ym(end), is_current: !end, description })))
    await add('profile_education', (s.edu ?? []).map(([degree, institution, start, end]) => ({ degree, institution, start_date: yr(start), end_date: yr(end) })))
    await add('profile_skills', (s.skills ?? []).map((name) => ({ name })))
    await add('profile_services', (s.services ?? []).map(([title, description, price_text, duration_text]) => ({ title, description, price_text: price_text ?? null, duration_text: duration_text ?? null })))
    await add('profile_certifications', (s.certs ?? []).map(([name, issuer, y]) => ({ name, issuer, issued_on: yr(y) })))
    await add('profile_awards', (s.awards ?? []).map(([title, issuer, y]) => ({ title, issuer, awarded_on: yr(y) })))
    await add('profile_testimonials', (s.testimonials ?? []).map(([author_name, author_title, quote]) => ({ author_name, author_title, quote })))
    await add('profile_achievements', (s.achievements ?? []).map(([metric, title]) => ({ metric, title })))
    await add('profile_publications', (s.publications ?? []).map(([title, venue, y, pub_type]) => ({ title, venue, published_on: yr(y), pub_type, authors: s.name })))
    await add('profile_projects', (s.projects ?? []).map(([title, description, tags]) => ({ title, description, tags: tags ?? [] })))
    await add('profile_locations', [
      ...(s.locations ?? []).map((l, i) => ({ label: l.label, city: l.city, region: s.region, country_code: 'IN', hours: l.hours ?? null, is_primary: i === 0, is_service_area: false })),
      ...(s.areas ?? []).map((label) => ({ label, city: s.city, country_code: 'IN', is_service_area: true, is_primary: false })),
    ])

    const websiteId = must(await user.rpc('create_website', { p_profile: profile, p_name: s.display ?? s.name, p_slug: s.slug, p_template_slug: s.template }), 'create website')

    // Section-level content (specialization, research, FAQ, CTA…): fill existing sections or add them.
    const { data: sections } = await user.from('website_sections').select('id, section_type').eq('website_id', websiteId)
    let pos = 1000
    for (const [type, value] of Object.entries(s.items ?? {})) {
      const content = Array.isArray(value)
        ? { items: value.map(([title, description, date]) => (type === 'faq' ? { title, description } : { title, ...(description ? { [['teaching', 'speaking', 'press', 'news'].includes(type) ? 'subtitle' : 'description']: description } : {}), ...(date ? { date } : {}) })) }
        : value
      const existing = sections?.find((x) => x.section_type === type)
      if (existing) must(await user.from('website_sections').update({ content, is_enabled: true }).eq('id', existing.id), `section ${type}`)
      else must(await user.from('website_sections').insert({ workspace_id: ws, website_id: websiteId, section_type: type, position: pos += 10, content }), `add section ${type}`)
    }

    must(await user.from('websites').update({
      settings: { sample: true },
      seo: { title: `${s.display ?? s.name} — ${s.headline}`.slice(0, 70), description: s.bio_short.slice(0, 165), noindex: true },
    }).eq('id', websiteId), 'settings')
    const pub = must(await user.rpc('publish_website', { p_website: websiteId, p_note: 'Showcase sample' }), 'publish')
    if (!pub.published) throw new Error(`publish blocked: ${JSON.stringify(pub.errors)}`)
    must(await user.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', (await user.auth.getUser()).data.user.id), 'onboarded')
    await user.auth.signOut()
    ok++
    console.log(`  ✓ ${s.slug} (${s.profession}, ${s.template})`)
  } catch (e) {
    console.error(`  ✗ ${s.slug}: ${e.message}`)
  }
}
console.log(`Done: ${ok} created, ${done.size} already existed.`)
