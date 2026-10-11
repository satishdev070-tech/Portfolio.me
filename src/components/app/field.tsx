import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Field({ label, htmlFor, hint, error, children, className, optional }: {
  label: string; htmlFor?: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string; optional?: boolean
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}
