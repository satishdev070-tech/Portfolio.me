// Provider-agnostic AI contracts. Application code depends on these, never on a vendor SDK.

export const AI_TASKS = [
  'profile_generation', 'bio_generation', 'headline_generation', 'experience_generation', 'service_generation',
  'project_generation', 'seo_generation', 'translation', 'rewrite', 'summarization', 'document_extraction',
  'url_extraction', 'ocr_processing',
] as const
export type AITask = (typeof AI_TASKS)[number]

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[]
}

export interface CompletionRequest {
  model: string
  messages: ChatMessage[]
  maxTokens: number
  temperature: number
  signal?: AbortSignal
}

export interface CompletionResult {
  text: string
  inputTokens: number | null
  outputTokens: number | null
  raw: unknown
}

export interface AIProvider {
  readonly slug: string
  complete(req: CompletionRequest): Promise<CompletionResult>
}

/** A provider/model pair chosen by the router (from ai_task_routes). */
export interface RouteTarget {
  provider: string
  adapter: 'openai_compatible' | 'mock'
  base_url: string | null
  api_key_env: string | null
  model: string
}

export class ProviderError extends Error {
  constructor(message: string, public readonly retryable: boolean, public readonly status?: number) {
    super(message)
    this.name = 'ProviderError'
  }
}
