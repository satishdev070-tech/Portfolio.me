import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, FileUp, Globe, History, Languages, LayoutTemplate, Lock, Printer, Search, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Features' }

const FEATURES = [
  { icon: LayoutTemplate, title: 'Templates for every profession', body: 'Designed for doctors, lawyers, academics, engineers, creators and trades, with the sections each one needs.' },
  { icon: FileUp, title: 'Import your CV', body: 'PDF, Word, LinkedIn export, GitHub or your old website. You review everything before it is saved.' },
  { icon: Sparkles, title: 'AI writing assistant', body: 'Bios, headlines, service descriptions, SEO text and rewrites in the tone you choose.' },
  { icon: History, title: 'Drafts, versions, rollback', body: 'Edit safely. Your live site only changes when you publish, and you can roll back any time.' },
  { icon: Search, title: 'SEO built in', body: 'Titles, descriptions, social cards, sitemaps and schema.org data matched to your profession.' },
  { icon: Languages, title: 'English and हिन्दी', body: 'Publish in Hindi with proper Devanagari typography. More languages coming.' },
  { icon: Printer, title: 'Print-ready CV', body: 'Every site prints as a clean one-column CV. Visitors can save it as PDF.' },
  { icon: BarChart3, title: 'Privacy-friendly analytics', body: 'Views, visitors and referrers, without cookies or storing IP addresses.' },
  { icon: Globe, title: 'Your own domain', body: 'Free yourname address, or connect www.yourname.com with verified DNS and automatic HTTPS.' },
  { icon: Lock, title: 'Private by default', body: 'Drafts are never public. Only what you publish is visible, and you own your data.' },
]

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-14 sm:px-6">
      <p className="eyebrow">Features</p>
      <h1 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">Everything a professional website needs. Nothing it doesn’t.</h1>
      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <f.icon className="size-5 text-brand" />
            <h2 className="mt-3 font-medium">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
      <Link href="/signup" className={`${buttonVariants({ size: 'lg' })} mt-12`}>Create your website</Link>
    </div>
  )
}
