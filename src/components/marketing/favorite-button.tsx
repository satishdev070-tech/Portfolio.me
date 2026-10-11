'use client'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavorite } from '@/app/actions/website'
import { useServerAction } from '@/components/app/use-server-action'
import { cn } from '@/lib/utils'

export function FavoriteButton({ templateId, initial }: { templateId: string; initial: boolean }) {
  const [fav, setFav] = useState(initial)
  const { run, pending } = useServerAction()
  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      disabled={pending}
      onClick={() => {
        setFav(!fav)
        run(() => toggleFavorite(templateId), { onSuccess: (d) => setFav(d.favorite) }).then((r) => { if (!r.success) setFav(fav) })
      }}
      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Heart className={cn('size-4', fav && 'fill-rose-500 text-rose-500')} />
    </button>
  )
}
