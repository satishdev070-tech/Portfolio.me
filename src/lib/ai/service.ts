import 'server-only'
import { createServiceSupabase } from '@/lib/supabase/admin'
import { serverEnv } from '@/lib/env.server'
import { AppError, fromDbError } from '@/lib/errors'
import { parseInput } from '@/lib/validation/schemas'
import { asJson } from '@/lib/supabase/json'
import { OpenAICompatibleProvider } from './providers/openai-compatible'
import { MockProvider } from './providers/mock'
import { extractJson, TASKS, type TaskInput, type TaskOutput } from './tasks'
import { ProviderError, type AIProvider, type AITask, type RouteTarget } from './types'

// AI orchestration: entitlement + credit reservation (in Postgres, atomic) → route → provider
// (with fallback) → JSON parse + schema validation → settle usage. Failures refund credits.

interface Reservation {
  generation_id: string
  credits: number
  max_output_tokens: number
  temperature: number
  primary: RouteTarget
  fallback: RouteTarget | null
}

function providerFor(target: RouteTarget): AIProvider | null {
  if (target.adapter === 'mock') return serverEnv.aiAllowMock() ? new MockProvider() : null
  const key = target.api_key_env ? serverEnv.secret(target.api_key_env) : undefined
  if (!key || !target.base_url) return null // Not configured: skip to the next candidate.
  return new OpenAICompatibleProvider(target.provider, target.base_url, key)
}

export interface AIRunResult<T extends AITask> {
  output: TaskOutput<T>
  generationId: string
  credits: number
  provider: string
  model: string
}

export async function runAITask<T extends AITask>(ctx: { workspaceId: string; userId: string }, task: T, rawInput: TaskInput<T>): Promise<AIRunResult<T>> {
  const spec = TASKS[task]
  const input = parseInput(spec.input, rawInput)
  const service = createServiceSupabase()

  const { data, error } = await service.rpc('ai_reserve', {
    p_workspace: ctx.workspaceId, p_user: ctx.userId, p_task: task, p_input: asJson(spec.logInput(input as never)),
  })
  if (error) throw fromDbError(error)
  const reservation = data as unknown as Reservation

  const candidates: { target: RouteTarget; provider: AIProvider }[] = []
  for (const target of [reservation.primary, reservation.fallback]) {
    if (!target) continue
    const provider = providerFor(target)
    if (provider) candidates.push({ target, provider })
  }
  if (!candidates.length && serverEnv.aiAllowMock()) {
    candidates.push({ target: { provider: 'mock', adapter: 'mock', base_url: null, api_key_env: null, model: 'mock-writer' }, provider: new MockProvider() })
  }

  const started = Date.now()
  let lastError = 'No AI provider is configured.'
  for (const { target, provider } of candidates) {
    // One retry on transient errors per candidate, with a short backoff.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await provider.complete({
          model: target.model,
          messages: spec.build(input as never),
          maxTokens: reservation.max_output_tokens,
          temperature: Number(reservation.temperature),
        })
        const parsed = spec.output.safeParse(extractJson(result.text))
        if (!parsed.success) throw new ProviderError('Output did not match the expected format', attempt === 0)
        const settled = await service.rpc('ai_settle', {
          p_generation: reservation.generation_id, p_status: 'completed', p_provider: target.provider, p_model: target.model,
          p_input_tokens: result.inputTokens as number, p_output_tokens: result.outputTokens as number, p_latency_ms: Date.now() - started,
          p_output: asJson(parsed.data), p_raw: asJson(result.raw),
        })
        if (settled.error) console.error(`[ai] settle failed for ${reservation.generation_id}: ${settled.error.message}`)
        return { output: parsed.data as TaskOutput<T>, generationId: reservation.generation_id, credits: reservation.credits, provider: target.provider, model: target.model }
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Provider error'
        const retryable = e instanceof ProviderError ? e.retryable : e instanceof SyntaxError
        if (!retryable) break
        if (attempt === 0) await new Promise((r) => setTimeout(r, 600))
      }
    }
  }

  // Refund. Every argument is passed explicitly: supabase-js drops undefined keys, which would
  // make the RPC signature mismatch and leave the credits reserved.
  const refund = await service.rpc('ai_settle', {
    p_generation: reservation.generation_id, p_status: 'failed', p_provider: (candidates[0]?.target.provider ?? null) as string, p_model: (candidates[0]?.target.model ?? null) as string,
    p_input_tokens: null as never, p_output_tokens: null as never, p_latency_ms: Date.now() - started, p_output: null as never, p_raw: null as never,
    p_error_code: 'AI_UNAVAILABLE', p_error_message: lastError,
  })
  if (refund.error) console.error(`[ai] refund failed for ${reservation.generation_id}: ${refund.error.message}`)
  console.error(`[ai] ${task} failed: ${lastError}`)
  throw new AppError('AI_UNAVAILABLE', candidates.length ? 'The AI service is busy right now. No credits were used. Please try again.' : 'AI writing isn’t configured on this server yet. No credits were used.')
}
