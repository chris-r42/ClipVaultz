import { createClient } from '@/lib/supabase/server'
import ClipCard from '@/components/ClipCard'
import type { Clip } from '@/types/database'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: clips } = await supabase
    .from('clips')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Recent Clips</h1>
      {!clips || clips.length === 0 ? (
        <div className="text-center py-24 text-[var(--muted)]">
          <p className="text-lg">No clips yet.</p>
          <p className="text-sm mt-1">Be the first to upload one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip: Clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  )
}
