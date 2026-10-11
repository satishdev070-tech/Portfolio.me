'use client'
import { useRouter } from 'next/navigation'
import { cancelSubscription, startCheckout } from '@/app/actions/billing'
import { useServerAction } from '@/components/app/use-server-action'
import { Button } from '@/components/ui/button'

export function PlanButton({ slug, label, disabled }: { slug: string; label: string; disabled?: boolean }) {
  const router = useRouter()
  const { run, pending } = useServerAction()
  return (
    <Button size="lg" className="mt-5" disabled={pending || disabled}
      onClick={() => run(() => startCheckout(slug), { onSuccess: (r) => { if (r.type === 'redirect') window.location.href = r.url; else { router.refresh() } }, success: undefined })
        .then((r) => { if (r.success && r.data.type === 'activated') import('sonner').then(({ toast }) => toast.success('Plan upgraded')) })}>
      {pending ? 'Please wait…' : label}
    </Button>
  )
}

export function CancelButton() {
  const router = useRouter()
  const { run, pending } = useServerAction()
  return (
    <Button variant="ghost" size="sm" className="mt-3 px-0 text-muted-foreground" disabled={pending}
      onClick={() => { if (confirm('Cancel at the end of the current period? Paid features stay active until then.')) run(() => cancelSubscription(), { success: 'Subscription will end at period end', onSuccess: () => router.refresh() }) }}>
      Cancel subscription
    </Button>
  )
}
