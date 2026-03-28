'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

type Member = Pick<Profile, 'id' | 'username' | 'avatar_url'>

export default function MembersPresence({
  members,
  currentUserId,
}: {
  members: Member[]
  currentUserId: string
}) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    const me = members.find(m => m.id === currentUserId)
    const username = me?.username ?? ''

    const channel = supabase.channel('online-users')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>()
        const ids = new Set(Object.values(state).flat().map(e => e.user_id))
        setOnlineIds(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, username })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, members])

  const sorted = [...members]
    .filter(m => m.username != null)
    .sort((a, b) => {
      if (a.id === currentUserId) return -1
      if (b.id === currentUserId) return 1
      return (a.username ?? '').localeCompare(b.username ?? '')
    })

  const onlineCount = sorted.filter(m => onlineIds.has(m.id)).length

  return (
    <>
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 px-2">
        Members — {onlineCount} online
      </p>
      <ul className="space-y-0.5">
        {sorted.map(member => {
          const isOnline = onlineIds.has(member.id)
          const isCurrentUser = member.id === currentUserId
          const name = member.username!

          return (
            <li key={member.id}>
              <Link
                href={`/profile/${encodeURIComponent(name)}`}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--card-border)] shrink-0 overflow-hidden flex items-center justify-center">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-[var(--muted)]">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-[var(--foreground)] truncate flex-1">
                  {name}
                  {isCurrentUser && <span className="text-[var(--muted)] text-xs ml-1">(you)</span>}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-[var(--muted)]/30'}`}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
