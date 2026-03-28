'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

export default function AdminUserRow({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleApproval() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ is_approved: !profile.is_approved })
      .eq('id', profile.id)
    router.refresh()
    setLoading(false)
  }

  async function toggleAdmin() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ is_admin: !profile.is_admin })
      .eq('id', profile.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username ?? ''}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
            {(profile.username ?? '?')[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-white">{profile.username ?? 'Unknown'}</p>
          <div className="flex items-center gap-2">
            {profile.is_admin && (
              <span className="text-xs text-[var(--accent)]">Admin</span>
            )}
            {!profile.is_approved && (
              <span className="text-xs text-yellow-400">Pending</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAdmin}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded-md border border-[var(--card-border)] text-[var(--muted)] hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
        >
          {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
        </button>
        <button
          onClick={toggleApproval}
          disabled={loading}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50 ${
            profile.is_approved
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
          }`}
        >
          {profile.is_approved ? 'Revoke' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
