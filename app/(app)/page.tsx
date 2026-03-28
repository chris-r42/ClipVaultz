import { createClient } from '@/lib/supabase/server'
import ClipCard from '@/components/ClipCard'
import SearchBar from '@/components/SearchBar'
import { Suspense } from 'react'
import type { Clip } from '@/types/database'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clips')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`title.ilike.%${q}%,game.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: clips } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white shrink-0">
          {q ? `Results for "${q}"` : 'Recent Clips'}
        </h1>
        <div className="w-full max-w-sm">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {!clips || clips.length === 0 ? (
        <div className="text-center py-24 text-[var(--muted)]">
          {q ? (
            <p className="text-lg">No clips found for &quot;{q}&quot;</p>
          ) : (
            <>
              <p className="text-lg">No clips yet.</p>
              <p className="text-sm mt-1">Be the first to upload one!</p>
            </>
          )}
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
