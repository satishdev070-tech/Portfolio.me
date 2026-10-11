'use client'
import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { ApiError, Result } from '@/lib/errors'

/** Run a server action, toast structured errors, and expose pending state + field errors. */
export function useServerAction() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<ApiError | null>(null)

  const run = useCallback(
    <T,>(fn: () => Promise<Result<T>>, opts: { success?: string; silent?: boolean; onSuccess?: (data: T) => void } = {}) =>
      new Promise<Result<T>>((resolve) => {
        startTransition(async () => {
          const res = await fn()
          if (res.success) {
            setError(null)
            if (opts.success) toast.success(opts.success)
            opts.onSuccess?.(res.data)
          } else {
            setError(res.error)
            if (!opts.silent) toast.error(res.error.message)
          }
          resolve(res)
        })
      }),
    [],
  )

  const fieldError = (name: string) => (error?.details as { fields?: Record<string, string> } | undefined)?.fields?.[name]
  return { run, pending, error, fieldError }
}
