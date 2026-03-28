'use client'

import { useState } from 'react'
import { updateClip } from '@/app/actions/clips'

interface Props {
  clipId: string
  initial: { title: string; game: string; description: string }
}

export default function EditClipButton({ clipId, initial }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initial.title)
  const [game, setGame] = useState(initial.game)
  const [description, setDescription] = useState(initial.description)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await updateClip(clipId, { title, game, description })
    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
    )
  }

  return (
    <form onSubmit={handleSave} className="mt-4 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-white">Edit clip</span>
        <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full bg-white/5 border border-white/10 text-white placeholder-[var(--muted)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />
        <input
          type="text"
          value={game}
          onChange={e => setGame(e.target.value)}
          placeholder="Game (optional)"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-[var(--muted)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-[var(--muted)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none"
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--muted)] hover:text-white transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
