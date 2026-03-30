'use client'

import { useState, useRef, useEffect } from 'react'
import { useUpload } from '@/components/UploadContext'
import { createClient } from '@/lib/supabase/client'

type FileEntry = {
  id: string
  file: File
  title: string
}

export default function UploadPage() {
  const { startUploads } = useUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [game, setGame] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Game autocomplete
  const [allGames, setAllGames] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const gameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clips')
      .select('game')
      .not('game', 'is', null)
      .then(({ data }) => {
        const games = [...new Set((data ?? []).map(r => r.game as string))].sort()
        setAllGames(games)
      })
  }, [])

  const suggestions = game.trim()
    ? allGames.filter(g => g.toLowerCase().includes(game.toLowerCase()))
    : allGames

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('video/'))
    if (!files.length) return
    const slots = 10 - entries.length
    if (slots <= 0) return
    const newEntries: FileEntry[] = files.slice(0, slots).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      title: f.name.replace(/\.[^.]+$/, ''),
    }))
    setEntries(prev => [...prev, ...newEntries])
    e.target.value = ''
    setSubmitted(false)
  }

  function updateTitle(id: string, title: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, title } : e))
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!entries.length) return
    startUploads(
      entries.map(e => ({ file: e.file, title: e.title.trim() || e.file.name })),
      { game: game.trim(), description: description.trim() }
    )
    setEntries([])
    setGame('')
    setDescription('')
    setSubmitted(true)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Clips</h1>

      {submitted && (
        <div className="mb-4 text-sm text-green-400 bg-green-400/10 rounded-lg px-4 py-3">
          Uploads started — you can track progress in the tray at the bottom right.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            {entries.length >= 10
              ? 'Remove a clip to add another'
              : 'MP4, MOV, WebM — up to 10 at once. Large files are compressed automatically.'}
          </p>
        </div>

        {/* File list */}
        {entries.length > 0 && (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={entry.title}
                  onChange={e => updateTitle(entry.id, e.target.value)}
                  placeholder="Title"
                  className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <span className="text-xs text-[var(--muted)] shrink-0">
                  {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                  {entry.file.size / 1024 / 1024 > 150 && (
                    <span className="text-yellow-500 ml-1">· compressed</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-[var(--muted)] hover:text-red-400 transition-colors text-xs shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Shared fields */}
        {entries.length > 0 && (
          <>
            {/* Game with autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Game</label>
              <input
                ref={gameInputRef}
                type="text"
                value={game}
                onChange={e => { setGame(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="e.g. Valorant, Warzone..."
                className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-[#222] border border-[var(--card-border)] rounded-lg overflow-hidden shadow-xl">
                  {suggestions.slice(0, 8).map(g => (
                    <li key={g}>
                      <button
                        type="button"
                        onMouseDown={() => { setGame(g); setShowSuggestions(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        {g}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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

        <button
          type="submit"
          disabled={entries.length === 0}
          className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-opacity"
        >
          {entries.length === 0 ? 'Upload Clips' : `Upload ${entries.length} Clip${entries.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  )
}
