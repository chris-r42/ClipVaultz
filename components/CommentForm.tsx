'use client'

import { useState } from 'react'
import { postComment } from '@/app/actions/comments'

export default function CommentForm({ clipId }: { clipId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await postComment(clipId, content)
    if (result.error) {
      setError(result.error)
    } else {
      setContent('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={2}
        maxLength={500}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)]"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
