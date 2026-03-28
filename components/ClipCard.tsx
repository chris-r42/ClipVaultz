import Link from 'next/link'
import type { Clip } from '@/types/database'

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function ClipCard({ clip }: { clip: Clip }) {
  const thumbnailUrl = clip.thumbnail_url
    ?? `https://videodelivery.net/${clip.cloudflare_video_id}/thumbnails/thumbnail.jpg`

  return (
    <Link href={`/clips/${clip.id}`} className="group block">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-colors">
        <div className="relative aspect-video bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
          {clip.duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(clip.duration)}
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm truncate">{clip.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[var(--muted)]">
              {clip.profiles?.username ?? 'Unknown'}
            </span>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              {clip.game && <span>{clip.game}</span>}
              <span>{timeAgo(clip.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
