'use client'

import { useState } from 'react'

export default function DownloadButton({ clipId }: { clipId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'preparing' | 'error'>('idle')

  async function handleDownload() {
    setStatus('loading')
    const res = await fetch(`/api/clips/${clipId}/download`, { redirect: 'follow' })

    if (res.redirected) {
      // Browser followed the redirect to the MP4 — trigger it
      window.location.href = res.url
      setStatus('idle')
      return
    }

    const data = await res.json().catch(() => ({}))

    if (res.status === 202) {
      setStatus('preparing')
      setTimeout(() => setStatus('idle'), 4000)
    } else {
      console.error(data.error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-white transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {status === 'loading' ? 'Requesting...' : 'Download'}
      </button>
      {status === 'preparing' && (
        <span className="text-xs text-yellow-400">Preparing — try again in a moment</span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-400">Download unavailable</span>
      )}
    </div>
  )
}
