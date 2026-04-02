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

export default function ClipCard({ clip, className = '' }: { clip: Clip; className?: string }) {
  const thumbnailUrl = clip.thumbnail_url
    ?? `https://videodelivery.net/${clip.cloudflare_video_id}/thumbnails/thumbnail.jpg`

  return (
    <Link href={`/clips/${clip.id}`} className={`group block ${className}`}>
      <div className="relative aspect-video rounded-md overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={clip.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Duration badge */}
        {clip.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(clip.duration)}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Metadata overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-white text-sm font-semibold truncate leading-tight">{clip.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-white/60 text-xs">{clip.nova_username ?? clip.profiles?.username ?? 'Unknown'}</span>
            {clip.game && (
              <>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-[var(--accent)] text-xs">{clip.game}</span>
              </>
            )}
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/60 text-xs">{timeAgo(clip.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
