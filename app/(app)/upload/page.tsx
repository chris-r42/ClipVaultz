'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type FileEntry = {
  id: string
  file: File
  title: string
  state: 'idle' | 'uploading' | 'saving' | 'done' | 'error'
  progress: number
  error: string | null
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [game, setGame] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('video/'))
    if (!files.length) return
    const slots = 10 - entries.length
    if (slots <= 0) return
    const newEntries: FileEntry[] = files.slice(0, slots).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      title: f.name.replace(/\.[^.]+$/, ''),
      state: 'idle',
      progress: 0,
      error: null,
    }))
    setEntries(prev => [...prev, ...newEntries])
    e.target.value = ''
  }

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function uploadOne(entry: FileEntry) {
    updateEntry(entry.id, { state: 'uploading', error: null })

    try {
      // Get worker URL + auth token from server
      const tokenRes = await fetch('/api/upload/token')
      if (!tokenRes.ok) throw new Error('Failed to get upload token')
      const { token, url: workerUrl } = await tokenRes.json()

      // Upload to Railway worker with progress tracking
      const videoId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            updateEntry(entry.id, { progress: Math.round((e.loaded / e.total) * 100) })
        }
        xhr.onload = () => {
          if (xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data.videoId)
            } catch {
              reject(new Error('Invalid response from worker'))
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error ?? 'Upload failed'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `${workerUrl}/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        const fd = new FormData()
        fd.append('file', entry.file)
        xhr.send(fd)
      })

      updateEntry(entry.id, { state: 'saving', progress: 100 })

      const saveRes = await fetch('/api/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title: entry.title.trim() || entry.file.name,
          description: description.trim() || null,
          game: game.trim() || null,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save clip')

      updateEntry(entry.id, { state: 'done' })
    } catch (err) {
      updateEntry(entry.id, {
        state: 'error',
        error: err instanceof Error ? err.message : 'Something went wrong',
      })
    }
  }

  async function handleUploadAll(e: React.FormEvent) {
    e.preventDefault()
    const pending = entries.filter(e => e.state === 'idle' || e.state === 'error')
    if (!pending.length) return
    setIsUploading(true)
    await Promise.all(pending.map(uploadOne))
    setIsUploading(false)
  }

  const allDone = entries.length > 0 && entries.every(e => e.state === 'done')
  const hasPending = entries.some(e => e.state === 'idle' || e.state === 'error')
  const activeCount = entries.filter(e => e.state === 'uploading' || e.state === 'saving').length
  const pendingCount = entries.filter(e => e.state === 'idle' || e.state === 'error').length

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Clips</h1>

      <form onSubmit={handleUploadAll} className="space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent)]/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <svg className="w-10 h-10 mx-auto text-[var(--muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.876V15.5a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-white font-medium">
            {entries.length >= 10 ? 'Limit reached (10 clips max)' : 'Click to select videos'}
          </p>
          <p className="text-[var(--muted)] text-sm mt-1">
            {entries.length >= 10 ? 'Remove a clip to add another' : 'MP4, MOV, WebM — up to 10 at once. Large files are compressed automatically.'}
          </p>
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={entry.title}
                    onChange={e => updateEntry(entry.id, { title: e.target.value })}
                    disabled={entry.state !== 'idle' && entry.state !== 'error'}
                    placeholder="Title"
                    className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 transition-colors"
                  />
                  {entry.state === 'idle' && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="text-[var(--muted)] hover:text-red-400 transition-colors text-xs shrink-0"
                    >
                      Remove
                    </button>
                  )}
                  {entry.state === 'done' && (
                    <span className="text-green-400 text-xs shrink-0">Done</span>
                  )}
                  {entry.state === 'error' && (
                    <span className="text-red-400 text-xs shrink-0">Failed</span>
                  )}
                </div>

                <p className="text-xs text-[var(--muted)] mb-2">
                  {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                  {entry.file.size / 1024 / 1024 > 150 && (
                    <span className="text-yellow-500 ml-2">· will be compressed</span>
                  )}
                </p>

                {(entry.state === 'uploading' || entry.state === 'saving') && (
                  <div>
                    <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                      <span>
                        {entry.state === 'saving'
                          ? 'Saving...'
                          : entry.progress === 100
                          ? 'Processing...'
                          : 'Uploading...'}
                      </span>
                      <span>{entry.progress}%</span>
                    </div>
                    <div className="h-1 bg-[var(--card-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {entry.error && (
                  <p className="text-red-400 text-xs mt-1">{entry.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Shared fields */}
        {entries.length > 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Game</label>
              <input
                type="text"
                value={game}
                onChange={e => setGame(e.target.value)}
                placeholder="e.g. Valorant, Warzone..."
                className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional — applies to all clips"
                rows={2}
                className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>
          </>
        )}

        {allDone ? (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            View Feed
          </button>
        ) : (
          <button
            type="submit"
            disabled={!hasPending || isUploading}
            className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-opacity"
          >
            {isUploading
              ? `Uploading ${activeCount} clip${activeCount !== 1 ? 's' : ''}...`
              : entries.length === 0
                ? 'Upload Clips'
                : `Upload ${pendingCount} Clip${pendingCount !== 1 ? 's' : ''}`}
          </button>
        )}
      </form>
    </div>
  )
}
