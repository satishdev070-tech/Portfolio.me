import { ProviderError, type AIProvider, type CompletionRequest, type CompletionResult } from '../types'

// One adapter for every provider exposing POST {base}/chat/completions with Bearer auth:
// NVIDIA NIM (https://integrate.api.nvidia.com/v1) and xAI (https://api.x.ai/v1) both do.
// Base URL, model id and key come from the database route + server env; nothing is hard-coded here.
export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    readonly slug: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs = 45_000,
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    req.signal?.addEventListener('abort', () => controller.abort())
    let res: Response
    try {
      res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ model: req.model, messages: req.messages, max_tokens: req.maxTokens, temperature: req.temperature, stream: false }),
        signal: controller.signal,
      })
    } catch (e) {
      throw new ProviderError(controller.signal.aborted ? 'Provider timed out' : `Network error: ${(e as Error).message}`, true)
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) {
      // Never surface provider bodies to users; they can echo prompts. Status is enough to decide retry.
      const retryable = res.status === 429 || res.status >= 500
      throw new ProviderError(`Provider responded ${res.status}`, retryable, res.status)
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = json.choices?.[0]?.message?.content ?? ''
    if (!text) throw new ProviderError('Empty completion', true)
    return { text, inputTokens: json.usage?.prompt_tokens ?? null, outputTokens: json.usage?.completion_tokens ?? null, raw: { id: (json as { id?: string }).id, usage: json.usage } }
  }
}
