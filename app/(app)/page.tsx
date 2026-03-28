import { createClient } from '@/lib/supabase/server'
import ClipCard from '@/components/ClipCard'
import SearchBar from '@/components/SearchBar'
import SortBar from '@/components/SortBar'
import { Suspense } from 'react'
import type { Clip } from '@/types/database'

type SortOption = 'newest' | 'views' | 'longest'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; game?: string }>
}) {
  const { q, sort, game } = await searchParams
  const sortOption = (sort ?? 'newest') as SortOption
  const supabase = await createClient()

  // Fetch clips + distinct games in parallel
  let clipsQuery = supabase
    .from('clips')
    .select('*, profiles(username, avatar_url)')

  if (q) {
    clipsQuery = clipsQuery.or(`title.ilike.%${q}%,game.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (game) {
    clipsQuery = clipsQuery.eq('game', game)
  }

  if (sortOption === 'views') {
    clipsQuery = clipsQuery.order('views', { ascending: false })
  } else if (sortOption === 'longest') {
    clipsQuery = clipsQuery.order('duration', { ascending: false, nullsFirst: false })
  } else {
    clipsQuery = clipsQuery.order('created_at', { ascending: false })
  }

  const [{ data: clips }, { data: gameRows }] = await Promise.all([
    clipsQuery,
    supabase.from('clips').select('game').not('game', 'is', null),
  ])

  const games = [...new Set((gameRows ?? []).map(r => r.game as string))].sort()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <Suspense>
          <SortBar games={games} />
        </Suspense>
        <div className="w-full sm:w-64 shrink-0">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {!clips || clips.length === 0 ? (
        <div className="text-center py-24 text-[var(--muted)]">
          {q ? (
            <p className="text-lg">No clips found for &quot;{q}&quot;</p>
          ) : game ? (
            <p className="text-lg">No clips for {game} yet.</p>
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
