import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CommentSection from '@/components/CommentSection'

export default async function ClipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: clip } = await supabase
    .from('clips')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single()

  if (!clip) notFound()

  // Increment view count (fire and forget)
  supabase.from('clips').update({ views: clip.views + 1 }).eq('id', id)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Video player */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
        <iframe
          src={`https://iframe.videodelivery.net/${clip.cloudflare_video_id}`}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Clip info */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <h1 className="text-xl font-bold text-white">{clip.title}</h1>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span>{clip.profiles?.username ?? 'Unknown'}</span>
            {clip.game && (
              <span className="bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full text-xs font-medium">
                {clip.game}
              </span>
            )}
            <span>{clip.views} views</span>
            <span>{new Date(clip.created_at).toLocaleDateString()}</span>
          </div>
          <a
            href={`/api/clips/${id}/download`}
            className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>

        {clip.description && (
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            {clip.description}
          </p>
        )}
      </div>

      <CommentSection clipId={id} />
    </div>
  )
}
