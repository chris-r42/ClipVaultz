import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CommentSection from '@/components/CommentSection'
import DownloadButton from '@/components/DownloadButton'
import DeleteClipButton from '@/components/DeleteClipButton'
import EditClipButton from '@/components/EditClipButton'

export default async function ClipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: clip }, { data: { user } }] = await Promise.all([
    supabase
      .from('clips')
      .select('*, profiles(username, avatar_url)')
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!clip) notFound()

  // Increment view count (fire and forget)
  supabase.from('clips').update({ views: clip.views + 1 }).eq('id', id)

  let isAdmin = false
  let isOwner = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
    isOwner = clip.user_id === user.id
  }

  const canEdit = isOwner || isAdmin

  return (
    <div className="max-w-4xl mx-auto">
      {/* Video player */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-5">
        <iframe
          src={`https://iframe.videodelivery.net/${clip.cloudflare_video_id}`}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Clip info */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-3">{clip.title}</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="text-white/80">{clip.nova_username ?? clip.profiles?.username ?? 'Unknown'}</span>
            {clip.game && (
              <span className="bg-[var(--accent)]/15 text-[var(--accent)] px-2.5 py-0.5 rounded-full text-xs font-medium">
                {clip.game}
              </span>
            )}
            <span>{clip.views} views</span>
            <span>{new Date(clip.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <DownloadButton clipId={id} />
            {canEdit && (
              <EditClipButton
                clipId={id}
                initial={{
                  title: clip.title,
                  game: clip.game ?? '',
                  description: clip.description ?? '',
                }}
              />
            )}
            {isAdmin && <DeleteClipButton clipId={id} />}
          </div>
        </div>

        {clip.description && (
          <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed border-t border-white/5 pt-4">
            {clip.description}
          </p>
        )}
      </div>

      <CommentSection clipId={id} />
    </div>
  )
}
