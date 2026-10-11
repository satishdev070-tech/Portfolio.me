'use client'
import { useState, type ReactNode } from 'react'
import { Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: Tablet, width: '820px' },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '390px' },
] as const

/** Iframe preview with device widths. `reloadKey` forces a refresh after edits. */
export function DevicePreview({ src, title, reloadKey, toolbar, className }: { src: string; title: string; reloadKey?: string | number; toolbar?: ReactNode; className?: string }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]['key']>('desktop')
  const width = DEVICES.find((d) => d.key === device)!.width
  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40', className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <div role="radiogroup" aria-label="Preview size" className="flex gap-1">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              type="button"
              role="radio"
              aria-checked={device === d.key}
              aria-label={d.label}
              title={d.label}
              onClick={() => setDevice(d.key)}
              className={cn('grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted', device === d.key && 'bg-muted text-foreground')}
            >
              <d.icon className="size-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          <a href={src} target="_blank" rel="noopener" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted" title="Open in new tab" aria-label="Open preview in new tab">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-3">
        <iframe key={`${device}-${reloadKey ?? ''}`} src={src} title={title} className="h-full min-h-[70vh] rounded-lg border bg-white shadow-(--shadow-card) transition-[width]" style={{ width }} />
      </div>
    </div>
  )
}
