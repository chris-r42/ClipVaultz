import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CommentSection from '@/components/CommentSection'
import DownloadButton from '@/components/DownloadButton'

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
          <DownloadButton clipId={id} />
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
