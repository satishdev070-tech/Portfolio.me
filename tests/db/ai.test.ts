import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createUser, service } from './helpers'

// AI orchestration against the real database: reservation → provider → validation → settlement.
beforeAll(() => {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
})

describe('runAITask', () => {
  it('generates with the mock provider and records usage', async () => {
    process.env.AI_ALLOW_MOCK = 'true'
    const { runAITask } = await import('@/lib/ai/service')
    const user = await createUser()
    const res = await runAITask({ workspaceId: user.workspaceId, userId: user.id }, 'bio_generation', { profession: 'Doctor', name: 'Asha', skills: 'Cardiology' })
    expect(res.output.short_bio).toContain('doctor')
    const { data } = await service().from('ai_generations').select('status, credits_used, provider, input').eq('id', res.generationId).single()
    expect(data).toMatchObject({ status: 'completed', credits_used: 2, provider: 'mock' })
    // Only a sanitized summary of the input is logged.
    expect(data!.input).toEqual({ profession: 'Doctor', tone: 'professional', language: 'en' })
  })

  it('refunds credits when no provider is available', async () => {
    process.env.AI_ALLOW_MOCK = 'false'
    const { runAITask } = await import('@/lib/ai/service')
    const user = await createUser()
    await expect(runAITask({ workspaceId: user.workspaceId, userId: user.id }, 'rewrite', { text: 'Hello there' })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    const { data } = await service().from('ai_generations').select('status, credits_used').eq('workspace_id', user.workspaceId)
    expect(data).toEqual([{ status: 'refunded', credits_used: 0 }])
    process.env.AI_ALLOW_MOCK = 'true'
  })

  it('rejects invalid input before reserving credits', async () => {
    const { runAITask } = await import('@/lib/ai/service')
    const user = await createUser()
    await expect(runAITask({ workspaceId: user.workspaceId, userId: user.id }, 'rewrite', { text: '' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    const { count } = await service().from('ai_generations').select('id', { count: 'exact', head: true }).eq('workspace_id', user.workspaceId)
    expect(count).toBe(0)
  })
})
