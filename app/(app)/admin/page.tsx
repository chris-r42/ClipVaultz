import { createClient } from '@/lib/supabase/server'
import AdminUserRow from '@/components/AdminUserRow'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = profiles?.filter(p => !p.is_approved) ?? []
  const approved = profiles?.filter(p => p.is_approved) ?? []

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Admin — User Management</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
            Pending Approval ({pending.length})
          </h2>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl divide-y divide-[var(--card-border)]">
            {pending.map(profile => (
              <AdminUserRow key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
          Members ({approved.length})
        </h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl divide-y divide-[var(--card-border)]">
          {approved.map(profile => (
            <AdminUserRow key={profile.id} profile={profile} />
          ))}
        </div>
      </section>
    </div>
  )
}
