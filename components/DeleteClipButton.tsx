'use client'

import { useState } from 'react'
import { deleteClip } from '@/app/actions/clips'

export default function DeleteClipButton({ clipId }: { clipId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Delete this clip?</span>
        <button
          onClick={async () => {
            setDeleting(true)
            await deleteClip(clipId)
          }}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs text-[var(--muted)] hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-red-400 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
  )
}
