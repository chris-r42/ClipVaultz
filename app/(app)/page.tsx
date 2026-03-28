import { createClient } from '@/lib/supabase/server'
import ClipCard from '@/components/ClipCard'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'
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
  const allClips: Clip[] = clips ?? []

  // Search results — plain grid
  if (q) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-xl font-bold text-white shrink-0">Results for &ldquo;{q}&rdquo;</h1>
          <div className="w-full max-w-sm">
            <Suspense><SearchBar /></Suspense>
          </div>
        </div>
        {allClips.length === 0 ? (
          <div className="text-center py-24 text-[var(--muted)]">
            <p className="text-lg">No clips found for &ldquo;{q}&rdquo;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allClips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (allClips.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-6">
          <div className="w-full max-w-sm">
            <Suspense><SearchBar /></Suspense>
          </div>
        </div>
        <div className="text-center py-24 text-[var(--muted)]">
          <p className="text-lg">No clips yet.</p>
          <p className="text-sm mt-1">Be the first to upload one!</p>
        </div>
      </div>
    )
  }

  const hero = allClips[0]
  const heroThumbnail = hero.thumbnail_url
    ?? `https://videodelivery.net/${hero.cloudflare_video_id}/thumbnails/thumbnail.jpg`

  // Group clips by game for horizontal rows (games with ≥2 clips)
  const byGame = new Map<string, Clip[]>()
  for (const clip of allClips) {
    if (!clip.game) continue
    const arr = byGame.get(clip.game) ?? []
    arr.push(clip)
    byGame.set(clip.game, arr)
  }
  const gameRows = [...byGame.entries()]
    .filter(([, clips]) => clips.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="-mx-4 lg:-mx-8">
      {/* Search bar */}
      <div className="px-4 lg:px-8 mb-6 flex justify-end">
        <div className="w-full max-w-sm">
          <Suspense><SearchBar /></Suspense>
        </div>
      </div>

      {/* Hero billboard */}
      <Link href={`/clips/${hero.id}`} className="group block relative w-full aspect-[21/9] overflow-hidden mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroThumbnail}
          alt={hero.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 px-8 pb-10 max-w-lg">
          {hero.game && (
            <span className="inline-block text-xs font-semibold tracking-wider uppercase text-[var(--accent)] mb-2">
              {hero.game}
            </span>
          )}
          <h1 className="text-3xl font-bold text-white leading-tight mb-2">{hero.title}</h1>
          {hero.description && (
            <p className="text-sm text-white/70 line-clamp-2 mb-4">{hero.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-5 py-2 rounded-full">
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </span>
            <span className="text-white/60 text-sm">by {hero.profiles?.username ?? 'Unknown'}</span>
          </div>
        </div>
      </Link>

      {/* Recently Added row */}
      <ClipRow title="Recently Added" clips={allClips} />

      {/* Per-game rows */}
      {gameRows.map(([game, gameClips]) => (
        <ClipRow key={game} title={game} clips={gameClips} />
      ))}
    </div>
  )
}

function ClipRow({ title, clips }: { title: string; clips: Clip[] }) {
  return (
    <div className="mb-8 px-4 lg:px-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} className="w-56 shrink-0" />
        ))}
      </div>
    </div>
  )
}
