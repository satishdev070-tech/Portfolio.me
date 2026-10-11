import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="hidden border-l bg-card lg:flex lg:flex-col lg:justify-end lg:p-12">
        <div className="max-w-md">
          <p className="display text-3xl">Your profession, your words, your website: live on your own address in minutes.</p>
          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <li>Templates designed for doctors, lawyers, academics, engineers, creators and trades</li>
            <li>Import your CV and let AI draft the rest. You approve every line.</li>
            <li>Free plan with a complete website, not a trial</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
