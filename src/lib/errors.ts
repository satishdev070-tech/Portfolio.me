// Centralized error model. Every API route and server action returns
//   { success: true, data } | { success: false, error: { code, message, details? } }
// Database functions raise "CODE: message" with SQLSTATE P0001 (private.fail), which maps 1:1.

export const ErrorCodes = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'PLAN_LIMIT_REACHED',
  'FEATURE_NOT_AVAILABLE',
  'AI_CREDITS_EXHAUSTED',
  'AI_UNAVAILABLE',
  'RATE_LIMITED',
  'STORAGE_LIMIT_REACHED',
  'SLUG_TAKEN',
  'SLUG_RESERVED',
  'SLUG_CHANGE_COOLDOWN',
  'INVALID_SLUG',
  'INVALID_DOMAIN',
  'DOMAIN_TAKEN',
  'DOMAIN_NOT_VERIFIED',
  'TEMPLATE_UNAVAILABLE',
  'PROFILE_INCOMPLETE',
  'UNSUPPORTED_FILE',
  'FILE_TOO_LARGE',
  'IMPORT_FAILED',
  'SOURCE_NOT_ALLOWED',
  'BILLING_UNAVAILABLE',
  'CONFLICT',
  'INTERNAL_ERROR',
] as const
export type ErrorCode = (typeof ErrorCodes)[number]

export interface ApiError {
  code: ErrorCode
  message: string
  details?: unknown
}
export type Result<T> = { success: true; data: T } | { success: false; error: ApiError }

const STATUS: Partial<Record<ErrorCode, number>> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  PLAN_LIMIT_REACHED: 402,
  FEATURE_NOT_AVAILABLE: 402,
  AI_CREDITS_EXHAUSTED: 402,
  STORAGE_LIMIT_REACHED: 402,
  SLUG_TAKEN: 409,
  DOMAIN_TAKEN: 409,
  CONFLICT: 409,
  UNSUPPORTED_FILE: 415,
  FILE_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
  AI_UNAVAILABLE: 503,
  BILLING_UNAVAILABLE: 503,
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
  get status() {
    return STATUS[this.code] ?? 400
  }
  toJSON(): ApiError {
    return { code: this.code, message: this.message, ...(this.details === undefined ? {} : { details: this.details }) }
  }
}

const isErrorCode = (v: string): v is ErrorCode => (ErrorCodes as readonly string[]).includes(v)

/** Map a PostgREST / Postgres error to an AppError. Unknown DB errors become INTERNAL_ERROR. */
export function fromDbError(err: { message?: string; code?: string; details?: string | null } | null | undefined): AppError {
  if (!err) return new AppError('INTERNAL_ERROR', 'Something went wrong.')
  const msg = err.message ?? ''
  const m = msg.match(/^([A-Z_]+): (.*)$/s)
  if (m && isErrorCode(m[1])) return new AppError(m[1], m[2])
  if (err.code === '42501' || /permission denied|row-level security/i.test(msg)) {
    return new AppError('FORBIDDEN', 'You do not have permission to do that.')
  }
  if (err.code === '23505') return new AppError('CONFLICT', 'That already exists.')
  if (err.code === '23514' || err.code === '22P02' || err.code === '23502') {
    return new AppError('VALIDATION_ERROR', 'Some values are not valid.')
  }
  if (err.code === 'PGRST116') return new AppError('NOT_FOUND', 'Not found.')
  return new AppError('INTERNAL_ERROR', 'Something went wrong.')
}

/** Normalize anything thrown into an ApiError; logs unexpected errors server-side only. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof AppError) return err.toJSON()
  if (err && typeof err === 'object' && 'message' in err && ('code' in err || 'details' in err)) {
    return fromDbError(err as { message: string; code?: string }).toJSON()
  }
  console.error('[unexpected]', err)
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' }
}

export const ok = <T>(data: T): Result<T> => ({ success: true, data })
export const fail = (err: unknown): Result<never> => ({ success: false, error: toApiError(err) })

/** Wrap a server action body so it always returns a Result. */
export async function action<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn())
  } catch (e) {
    if (isNextControlFlow(e)) throw e
    return fail(e)
  }
}

/** JSON response for route handlers. */
export function json<T>(result: Result<T>, init?: ResponseInit) {
  const status = result.success ? 200 : (STATUS[result.error.code] ?? 400)
  return Response.json(result, { status, ...init })
}

export async function route<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    return json(ok(await fn()))
  } catch (e) {
    return json(fail(e))
  }
}

// redirect()/notFound() throw special errors that must propagate.
function isNextControlFlow(e: unknown) {
  const digest = (e as { digest?: string } | null)?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
}

/** Throw the DB error as an AppError if present; otherwise return data (non-null for selects). */
export function unwrap<T>(res: { data: T; error: { message: string; code?: string } | null }): NonNullable<T> {
  if (res.error) throw fromDbError(res.error)
  return res.data as NonNullable<T>
}
