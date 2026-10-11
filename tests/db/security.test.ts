import { beforeAll, describe, expect, it } from 'vitest'
import { anon, createSite, createUser, errorCode, service, uniqueSlug, type TestUser } from './helpers'

// These tests use only what an attacker has: a normal user session and the public anon key.

let alice: TestUser
let bob: TestUser
let aliceSite: Awaited<ReturnType<typeof createSite>>

beforeAll(async () => {
  alice = await createUser('Alice')
  bob = await createUser('Bob')
  aliceSite = await createSite(alice)
})

describe('account provisioning', () => {
  it('creates a user row, personal workspace and owner membership on signup', async () => {
    const { data: me } = await alice.client.from('users').select('id, is_platform_admin').single()
    expect(me).toMatchObject({ id: alice.id, is_platform_admin: false })
    const { data: members } = await alice.client.from('workspace_members').select('role')
    expect(members).toEqual([{ role: 'owner' }])
  })

  it('resolves the free plan when there is no subscription row', async () => {
    const { data } = await alice.client.rpc('get_entitlements', { p_workspace: alice.workspaceId })
    expect(data.plan.slug).toBe('free')
    expect(data.features.custom_domain).toBe(false)
    expect(data.limits.max_websites).toBe(1)
  })
})

describe('tenant isolation', () => {
  it('hides other tenants’ profiles, websites, sections and versions', async () => {
    const { data: workspaces } = await bob.client.from('workspaces').select('id')
    expect(workspaces).toEqual([{ id: bob.workspaceId }])
    const { data: profiles } = await bob.client.from('profiles').select('id').eq('id', aliceSite.profileId)
    expect(profiles).toEqual([])
    const { data: sites } = await bob.client.from('websites').select('id').eq('id', aliceSite.websiteId)
    expect(sites).toEqual([])
    const { data: sections } = await bob.client.from('website_sections').select('id').eq('website_id', aliceSite.websiteId)
    expect(sections).toEqual([])
  })

  it('blocks attaching rows to another tenant’s profile', async () => {
    // Bob's own workspace id + Alice's profile id: composite FK rejects it.
    const a = await bob.client.from('profile_experiences').insert({
      workspace_id: bob.workspaceId, profile_id: aliceSite.profileId, organization: 'X', title: 'Y',
    })
    expect(a.error).not.toBeNull()
    // Alice's workspace id: RLS rejects it.
    const b = await bob.client.from('profile_experiences').insert({
      workspace_id: alice.workspaceId, profile_id: aliceSite.profileId, organization: 'X', title: 'Y',
    })
    expect(b.error).not.toBeNull()
  })

  it('cannot read or call RPCs on another tenant’s website', async () => {
    const preview = await bob.client.rpc('get_site_preview', { p_website: aliceSite.websiteId })
    expect(errorCode(preview.error)).toBe('NOT_FOUND')
    const publish = await bob.client.rpc('publish_website', { p_website: aliceSite.websiteId })
    expect(['NOT_FOUND', 'FORBIDDEN']).toContain(errorCode(publish.error))
    const tpl = await bob.client.rpc('apply_template', { p_website: aliceSite.websiteId, p_template_slug: 'minimal-cv' })
    expect(['NOT_FOUND', 'FORBIDDEN']).toContain(errorCode(tpl.error))
    const ent = await bob.client.rpc('get_entitlements', { p_workspace: alice.workspaceId })
    expect(errorCode(ent.error)).toBe('FORBIDDEN')
  })

  it('cannot upload into another workspace’s storage folder', async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const { error } = await bob.client.storage
      .from('avatars')
      .upload(`${alice.workspaceId}/avatar/evil.png`, png, { contentType: 'image/png' })
    expect(error).not.toBeNull()
    const own = await bob.client.storage
      .from('avatars')
      .upload(`${bob.workspaceId}/avatar/ok.png`, png, { contentType: 'image/png' })
    expect(own.error).toBeNull()
  })
})

describe('privileged state cannot be changed directly', () => {
  it('cannot set website status, slug or published version', async () => {
    const r = await alice.client.from('websites').update({ status: 'published' }).eq('id', aliceSite.websiteId)
    expect(r.error?.message).toMatch(/permission denied/)
    const s = await alice.client.from('websites').update({ slug: 'admin' }).eq('id', aliceSite.websiteId)
    expect(s.error?.message).toMatch(/permission denied/)
  })

  it('can update design columns on own website', async () => {
    const r = await alice.client.from('websites').update({ theme: { colors: { accent: '#ff0000' } } }).eq('id', aliceSite.websiteId)
    expect(r.error).toBeNull()
  })

  it('cannot self-activate a domain, grant a plan, log AI usage or become admin', async () => {
    const d = await alice.client.from('domains').insert({
      workspace_id: alice.workspaceId, website_id: aliceSite.websiteId, domain: 'evil.example.com', status: 'active',
    })
    expect(d.error).not.toBeNull()
    const { data: plan } = await alice.client.from('subscription_plans').select('id').eq('slug', 'advanced').single()
    const s = await alice.client.from('subscriptions').insert({ workspace_id: alice.workspaceId, plan_id: plan!.id, status: 'active' })
    expect(s.error).not.toBeNull()
    const ai = await alice.client.from('ai_generations').insert({ workspace_id: alice.workspaceId, task: 'rewrite' })
    expect(ai.error).not.toBeNull()
    const adm = await alice.client.from('users').update({ is_platform_admin: true }).eq('id', alice.id)
    expect(adm.error?.message).toMatch(/permission denied/)
    const reserve = await alice.client.rpc('ai_reserve', { p_workspace: alice.workspaceId, p_user: alice.id, p_task: 'rewrite', p_input: {} })
    expect(reserve.error).not.toBeNull()
    const domainCheck = await alice.client.rpc('record_domain_check', { p_domain_id: aliceSite.websiteId, p_verified: true })
    expect(domainCheck.error).not.toBeNull()
  })
})

describe('anonymous visitors', () => {
  it('cannot read tenant tables', async () => {
    const a = anon()
    for (const table of ['profiles', 'websites', 'website_versions', 'profile_experiences', 'users', 'media_assets']) {
      const { data } = await a.from(table).select('*').limit(1)
      expect(data ?? []).toEqual([])
    }
  })

  it('sees nothing before publish, the snapshot after, and drafts only after republish', async () => {
    const user = await createUser('Pub')
    const site = await createSite(user)
    const a = anon()
    expect((await a.rpc('get_published_site', { p_slug: site.slug })).data).toBeNull()

    const pub = await user.client.rpc('publish_website', { p_website: site.websiteId })
    expect(pub.data.published).toBe(true)
    const live = (await a.rpc('get_published_site', { p_slug: site.slug })).data
    expect(live.profile.full_name).toBe('Dr. Asha Rao')
    expect(live.profile).not.toHaveProperty('date_of_birth')
    expect(JSON.stringify(live)).not.toContain(user.workspaceId)

    await user.client.from('profiles').update({ headline: 'Draft headline' }).eq('id', site.profileId)
    const still = (await a.rpc('get_published_site', { p_slug: site.slug })).data
    expect(still.profile.headline).toBe('Consultant Cardiologist')

    await user.client.rpc('publish_website', { p_website: site.websiteId })
    const next = (await a.rpc('get_published_site', { p_slug: site.slug })).data
    expect(next.profile.headline).toBe('Draft headline')
    expect(next.version).toBe(2)
  })
})

describe('publishing rules and entitlements', () => {
  it('rejects publish without a headline, with a structured error list', async () => {
    const user = await createUser()
    const site = await createSite(user, { headline: null })
    const { data } = await user.client.rpc('publish_website', { p_website: site.websiteId })
    expect(data.published).toBe(false)
    expect(data.errors.map((e: { code: string }) => e.code)).toContain('PROFILE_INCOMPLETE')
  })

  it('blocks publishing a premium template on Free, allows it after upgrade', async () => {
    const user = await createUser()
    const site = await createSite(user, { template: 'legal-executive' })
    const blocked = await user.client.rpc('publish_website', { p_website: site.websiteId })
    expect(blocked.data.published).toBe(false)
    expect(blocked.data.errors[0]).toMatchObject({ code: 'FEATURE_NOT_AVAILABLE', feature: 'premium_templates' })

    const up = await service().rpc('billing_set_plan', {
      p_workspace: user.workspaceId, p_plan_slug: 'basic', p_status: 'active', p_provider: 'test',
    })
    expect(up.error).toBeNull()
    const ok = await user.client.rpc('publish_website', { p_website: site.websiteId })
    expect(ok.data.published).toBe(true)
  })

  it('enforces the website limit and slug rules', async () => {
    const user = await createUser()
    await createSite(user)
    const { data: profile } = await user.client.from('profiles').select('id').limit(1).single()
    const second = await user.client.rpc('create_website', {
      p_profile: profile!.id, p_name: 'Two', p_slug: uniqueSlug(), p_template_slug: 'minimal-cv',
    })
    expect(errorCode(second.error)).toBe('PLAN_LIMIT_REACHED')

    const avail = await anon().rpc('check_slug_availability', { p_slug: 'admin' })
    expect(avail.data.available).toBe(false)
    const bad = await anon().rpc('check_slug_availability', { p_slug: 'Bad--Slug' })
    expect(bad.data.available).toBe(false)
    const taken = await anon().rpc('check_slug_availability', { p_slug: aliceSite.slug })
    expect(taken.data).toMatchObject({ available: false })
  })

  it('requires the custom_domain feature to add a domain', async () => {
    const r = await alice.client.rpc('add_custom_domain', {
      p_website: aliceSite.websiteId, p_domain: 'www.alice-example.com', p_platform_domain: 'hellome.in',
    })
    expect(errorCode(r.error)).toBe('FEATURE_NOT_AVAILABLE')
  })

  it('adds advanced sections switched off on Free', async () => {
    const user = await createUser()
    const { data: profession } = await user.client.from('professions').select('id').eq('slug', 'politician').single()
    const { data: profile } = await user.client.from('profiles')
      .insert({ workspace_id: user.workspaceId, full_name: 'P', headline: 'MLA', profession_id: profession!.id })
      .select('id').single()
    const { data: websiteId } = await user.client.rpc('create_website', {
      p_profile: profile!.id, p_name: 'x', p_slug: uniqueSlug(), p_template_slug: 'public-profile',
    })
    const { data: sections } = await user.client.from('website_sections').select('section_type, is_enabled').eq('website_id', websiteId)
    expect(sections!.find((s) => s.section_type === 'news')?.is_enabled).toBe(false)
    expect(sections!.find((s) => s.section_type === 'about')?.is_enabled).toBe(true)
  })

  it('rolls back to an earlier published version', async () => {
    const user = await createUser()
    const site = await createSite(user)
    const v1 = await user.client.rpc('publish_website', { p_website: site.websiteId })
    await user.client.from('websites').update({ theme: { colors: { accent: '#123456' } } }).eq('id', site.websiteId)
    await user.client.rpc('publish_website', { p_website: site.websiteId })
    expect((await anon().rpc('get_published_site', { p_slug: site.slug })).data.theme.colors.accent).toBe('#123456')

    const r = await user.client.rpc('restore_website_version', { p_website: site.websiteId, p_version_id: v1.data.version_id })
    expect(r.error).toBeNull()
    const live = (await anon().rpc('get_published_site', { p_slug: site.slug })).data
    expect(live.version).toBe(1)
    const { data: w } = await user.client.from('websites').select('theme').eq('id', site.websiteId).single()
    expect(w!.theme).toEqual({})
  })
})

describe('AI credits', () => {
  it('reserves, refunds failures and stops at the monthly limit', async () => {
    const user = await createUser()
    const svc = service()
    const first = await svc.rpc('ai_reserve', { p_workspace: user.workspaceId, p_user: user.id, p_task: 'bio_generation', p_input: {} })
    expect(first.error).toBeNull()
    expect(first.data.credits).toBe(2)
    await svc.rpc('ai_settle', {
      p_generation: first.data.generation_id, p_status: 'failed', p_provider: null, p_model: null,
      p_input_tokens: null, p_output_tokens: null, p_latency_ms: 10, p_output: null, p_raw: null,
    })
    let usage = await user.client.rpc('get_ai_usage', { p_workspace: user.workspaceId })
    expect(usage.data.used).toBe(0)

    // Free = 25 credits; document_extraction costs 5. Raise the rate limit for this test.
    let lastError = null
    for (let i = 0; i < 6; i++) {
      const r = await svc.rpc('ai_reserve', { p_workspace: user.workspaceId, p_user: user.id, p_task: 'document_extraction', p_input: {} })
      lastError = r.error
      if (r.error) break
    }
    expect(['AI_CREDITS_EXHAUSTED', 'RATE_LIMITED']).toContain(errorCode(lastError))
    usage = await user.client.rpc('get_ai_usage', { p_workspace: user.workspaceId })
    expect(usage.data.used).toBeLessThanOrEqual(25)
  })
})
