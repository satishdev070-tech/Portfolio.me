import { AppError } from '@/lib/errors'

/**
 * CSRF defence for cookie-authenticated route handlers (server actions already check Origin).
 * Browsers always send Origin on POST/DELETE; a mismatch means a cross-site request.
 * Requests without Origin come from non-browser clients, which can't carry a victim's cookies.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  let originHost: string
  try { originHost = new URL(origin).host } catch { throw new AppError('FORBIDDEN', 'Cross-site request blocked.') }
  if (!host || originHost !== host) throw new AppError('FORBIDDEN', 'Cross-site request blocked.')
}
