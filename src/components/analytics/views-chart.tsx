'use client'
import { useState } from 'react'

type Day = { day: string; views: number; unique_visitors: number }

/** Single-series daily views bar chart. One hue (brand), hover tooltip, table alternative. */
export function ViewsChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...days.map((d) => d.views))
  const ticks = [0, Math.ceil(max / 2), max]
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const h = hover !== null ? days[hover] : null

  return (
    <figure className="m-0">
      <div className="relative h-56">
        <div className="absolute inset-y-0 left-0 flex w-8 flex-col justify-between pb-6 text-right text-[11px] tabular-nums text-muted-foreground" aria-hidden="true">
          {[...ticks].reverse().map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="absolute inset-y-0 left-10 right-0 pb-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" aria-hidden="true" />
          <div className="flex h-full items-end gap-[2px] border-b border-border" onMouseLeave={() => setHover(null)}>
            {days.map((d, i) => (
              <div key={d.day} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${fmt(d.day)}: ${d.views} views, ${d.unique_visitors} unique visitors`}>
                <div className="w-full rounded-t-[4px] bg-brand transition-opacity" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0, opacity: hover === null || hover === i ? 1 : 0.45 }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
            <span>{days[0] ? fmt(days[0].day) : ''}</span><span>{days.at(-1) ? fmt(days.at(-1)!.day) : ''}</span>
          </div>
          {h ? (
            <div role="status" className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-(--shadow-pop)" style={{ left: `${((hover! + 0.5) / days.length) * 100}%` }}>
              <p className="font-medium">{fmt(h.day)}</p>
              <p className="tabular-nums text-muted-foreground"><span className="text-foreground">{h.views}</span> views · <span className="text-foreground">{h.unique_visitors}</span> unique</p>
            </div>
          ) : null}
        </div>
      </div>
      <figcaption className="sr-only">Page views per day</figcaption>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">View as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead><tr className="text-muted-foreground"><th className="py-1 font-medium">Date</th><th className="font-medium">Views</th><th className="font-medium">Unique</th></tr></thead>
          <tbody>{days.map((d) => <tr key={d.day} className="border-t"><td className="py-1">{fmt(d.day)}</td><td>{d.views}</td><td>{d.unique_visitors}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  )
}
