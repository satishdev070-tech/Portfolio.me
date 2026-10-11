import { requireAdmin } from '@/lib/auth'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Platform admin</p>
        <AdminNav />
      </div>
      {children}
    </div>
  )
}
