'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'longest', label: 'Longest' },
]

export default function SortBar({ games }: { games: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? 'newest'
  const currentGame = searchParams.get('game') ?? ''

  function update(key: 'sort' | 'game', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to 'newest' default — don't clutter URL with default value
    if (params.get('sort') === 'newest') params.delete('sort')
    router.push(params.size > 0 ? `/?${params}` : '/')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort dropdown */}
      <select
        value={currentSort}
        onChange={e => update('sort', e.target.value)}
        className="bg-[var(--card)] border border-[var(--card-border)] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Game filter pills */}
      {games.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => update('game', '')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !currentGame
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white/5 text-[var(--muted)] hover:text-white hover:bg-white/10'
            }`}
          >
            All
          </button>
          {games.map(game => (
            <button
              key={game}
              onClick={() => update('game', currentGame === game ? '' : game)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentGame === game
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-[var(--muted)] hover:text-white hover:bg-white/10'
              }`}
            >
              {game}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
