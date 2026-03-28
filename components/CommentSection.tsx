import { createClient } from '@/lib/supabase/server'
import { deleteComment } from '@/app/actions/comments'
import CommentForm from './CommentForm'
import type { Comment } from '@/types/database'

export default async function CommentSection({ clipId }: { clipId: string }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: comments }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user?.id ?? '').single(),
    supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('clip_id', clipId)
      .order('created_at', { ascending: true }),
  ])

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mt-4">
      <h2 className="text-white font-semibold mb-4">
        Comments {comments && comments.length > 0 && <span className="text-[var(--muted)] font-normal text-sm">({comments.length})</span>}
      </h2>

      <div className="space-y-4 mb-4">
        {!comments || comments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment: Comment) => {
            const canDelete = user && (user.id === comment.user_id || profile?.is_admin)
            return (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white">
                      {comment.profiles?.username ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground)] mt-0.5 break-words">{comment.content}</p>
                </div>
                {canDelete && (
                  <form action={deleteComment.bind(null, comment.id, clipId)}>
                    <button
                      type="submit"
                      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
            )
          })
        )}
      </div>

      <CommentForm clipId={clipId} />
    </div>
  )
}
