import type { Metadata } from 'next'
import { publicEnv } from '@/lib/env'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-(--container-prose) px-4 py-14 sm:px-6">
      <p className="eyebrow">About</p>
      <h1 className="display mt-3 text-4xl">A proper website shouldn’t require a developer.</h1>
      <div className="mt-8 grid gap-4 text-muted-foreground">
        <p>Most professionals are found online before they are met in person: a patient checking a doctor, a client checking an advocate, a student checking a professor, a family checking an electrician.</p>
        <p>{publicEnv.appName} gives every professional a fast, trustworthy, well-designed site built from structured information you enter once, then publishes it as a website, a printable CV and, soon, a digital business card.</p>
        <p>We keep the free plan genuinely useful, keep your data private by default, and never sell it.</p>
      </div>
    </div>
  )
}
