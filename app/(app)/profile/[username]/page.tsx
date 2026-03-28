import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClipCard from '@/components/ClipCard'
import type { Clip } from '@/types/database'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_approved, created_at')
    .eq('username', decoded)
    .single()

  if (!profile || !profile.is_approved) notFound()

  const { data: clips } = await supabase
    .from('clips')
    .select('*, profiles(username, avatar_url)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const displayName = profile.username ?? 'Unknown'
  const clipCount = clips?.length ?? 0
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-white/5 overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-white/10">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-[var(--muted)]">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {clipCount} clip{clipCount !== 1 ? 's' : ''} · Joined {joinDate}
          </p>
        </div>
      </div>

      {/* Clips grid */}
      {clipCount === 0 ? (
        <div className="text-center py-24 text-[var(--muted)]">
          <p className="text-lg">No clips yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips!.map((clip: Clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  )
}
