'use client'

import { useState } from 'react'
import { useUpload, type UploadEntry } from './UploadContext'

function statusLabel(entry: UploadEntry): string {
  switch (entry.state) {
    case 'pending': return 'Waiting...'
    case 'uploading': return entry.progress === 100 ? 'Processing...' : `Uploading ${entry.progress}%`
    case 'saving': return 'Saving...'
    case 'done': return 'Done'
    case 'error': return entry.error ?? 'Failed'
    default: return ''
  }
}

function statusColor(state: UploadEntry['state']): string {
  if (state === 'done') return 'text-green-400'
  if (state === 'error') return 'text-red-400'
  return 'text-[var(--muted)]'
}

export default function UploadTray() {
  const { entries, clearDone } = useUpload()
  const [minimized, setMinimized] = useState(false)

  if (entries.length === 0) return null

  const activeCount = entries.filter(e => e.state !== 'done' && e.state !== 'error').length
  const doneCount = entries.filter(e => e.state === 'done' || e.state === 'error').length

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#222] border-b border-white/5">
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          )}
          <span className="text-sm font-medium text-white">
            {activeCount > 0 ? `Uploading ${activeCount} clip${activeCount !== 1 ? 's' : ''}...` : 'Uploads complete'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <button onClick={clearDone} className="text-xs text-[var(--muted)] hover:text-white transition-colors">
              Clear
            </button>
          )}
          <button onClick={() => setMinimized(m => !m)} className="text-[var(--muted)] hover:text-white transition-colors">
            <svg className={`w-4 h-4 transition-transform ${minimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Entries */}
      {!minimized && (
        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
          {entries.map(entry => (
            <div key={entry.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white truncate max-w-[180px]">{entry.title}</span>
                <span className={`text-xs shrink-0 ml-2 ${statusColor(entry.state)}`}>
                  {statusLabel(entry)}
                </span>
              </div>
              {(entry.state === 'uploading' || entry.state === 'saving') && (
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${entry.state === 'saving' ? 100 : entry.progress}%` }}
                  />
                </div>
              )}
              {entry.state === 'done' && (
                <div className="h-0.5 bg-green-400/40 rounded-full">
                  <div className="h-full w-full bg-green-400 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
