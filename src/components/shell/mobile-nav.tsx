'use client'
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarNav, type NavItem } from './sidebar'

export function MobileNav({ items, groups, header }: { items: NavItem[]; groups: Record<string, string>; header: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="grid size-9 place-items-center rounded-md hover:bg-muted lg:hidden" aria-label="Open menu"><Menu className="size-5" /></SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-4">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="mb-6">{header}</div>
        <SidebarNav items={items} groups={groups} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
