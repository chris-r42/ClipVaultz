'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type UploadState = 'idle' | 'uploading' | 'processing' | 'saving' | 'done' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', game: '' })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    setFile(f)
    setError(null)
    if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !form.title.trim()) return

    setState('uploading')
    setError(null)

    try {
      // 1. Get a direct upload URL from our API
      const res = await fetch('/api/upload/init', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to initialize upload')
      const { uploadUrl, videoId } = await res.json()

      // 2. Upload directly to Cloudflare Stream
      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', uploadUrl)
        const formData = new FormData()
        formData.append('file', file)
        xhr.send(formData)
      })

      // 3. Save clip metadata to Supabase
      setState('saving')
      const saveRes = await fetch('/api/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          game: form.game.trim() || null,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save clip')
      const { clipId } = await saveRes.json()

      setState('done')
      router.push(`/clips/${clipId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const isLoading = state === 'uploading' || state === 'saving'

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Upload a Clip</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file
              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
              : 'border-[var(--card-border)] hover:border-[var(--accent)]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-[var(--muted)] text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 mx-auto text-[var(--muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.876V15.5a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              <p className="text-white font-medium">Click to select a video</p>
              <p className="text-[var(--muted)] text-sm mt-1">MP4, MOV, WebM supported</p>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="What's this clip called?"
            required
            className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Game</label>
          <input
            type="text"
            value={form.game}
            onChange={e => setForm(p => ({ ...p, game: e.target.value }))}
            placeholder="e.g. Valorant, Warzone..."
            className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Optional — describe what happened..."
            rows={3}
            className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {state === 'uploading' && (
          <div>
            <div className="flex justify-between text-sm text-[var(--muted)] mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {state === 'saving' && (
          <p className="text-sm text-[var(--muted)]">Saving clip...</p>
        )}

        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {isLoading ? 'Uploading...' : 'Upload Clip'}
        </button>
      </form>
    </div>
  )
}
