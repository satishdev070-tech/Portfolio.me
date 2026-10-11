import type { MessageKey } from '@/i18n'

export const NAV: { href: string; key: MessageKey; icon: string; group: 'site' | 'grow' | 'account' }[] = [
  { href: '/dashboard', key: 'nav.overview', icon: 'layout-dashboard', group: 'site' },
  { href: '/editor', key: 'nav.website', icon: 'pen-square', group: 'site' },
  { href: '/profile', key: 'nav.profile', icon: 'user-round', group: 'site' },
  { href: '/templates', key: 'nav.templates', icon: 'layout-template', group: 'site' },
  { href: '/media', key: 'nav.media', icon: 'image', group: 'site' },
  { href: '/ai', key: 'nav.ai', icon: 'sparkles', group: 'grow' },
  { href: '/import', key: 'nav.import', icon: 'file-up', group: 'grow' },
  { href: '/seo', key: 'nav.seo', icon: 'search', group: 'grow' },
  { href: '/analytics', key: 'nav.analytics', icon: 'bar-chart-3', group: 'grow' },
  { href: '/domain', key: 'nav.domain', icon: 'globe', group: 'account' },
  { href: '/billing', key: 'nav.billing', icon: 'credit-card', group: 'account' },
  { href: '/settings', key: 'nav.settings', icon: 'settings', group: 'account' },
]
