import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { Toaster } from 'sonner'
import { publicEnv } from '@/lib/env'
import './globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-app-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-app-mono', preload: false })
const display = Fraunces({ subsets: ['latin'], variable: '--font-app-display', preload: false, axes: ['opsz'] })

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: { default: `${publicEnv.appName}: your professional website in minutes`, template: `%s · ${publicEnv.appName}` },
  description:
    'Create your professional identity once. Publish it everywhere. Websites for doctors, lawyers, engineers, professors, creators, tradespeople and every professional.',
}

export const viewport: Viewport = { themeColor: '#fbfbf9' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
