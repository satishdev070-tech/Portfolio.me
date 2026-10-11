import { AppError } from '@/lib/errors'

// Fixed-window in-memory limiter: per instance. Production should back this with a shared store
// (Redis/Upstash); DB-level limits (AI, publishing) already hold across instances.
const buckets = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k)
    return
  }
  b.count += 1
  if (b.count > limit) throw new AppError('RATE_LIMITED', 'Too many requests. Please slow down.')
}

export function tryRateLimit(key: string, limit: number, windowMs: number) {
  try { checkRateLimit(key, limit, windowMs); return true } catch { return false }
}
