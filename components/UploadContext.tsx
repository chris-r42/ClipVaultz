'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

export type UploadEntry = {
  id: string
  title: string
  state: 'pending' | 'uploading' | 'processing' | 'saving' | 'done' | 'error'
  progress: number
  error: string | null
}

type SharedMeta = { game: string; description: string }

type UploadContextType = {
  entries: UploadEntry[]
  startUploads: (files: { file: File; title: string }[], meta: SharedMeta) => void
  clearDone: () => void
}

const UploadContext = createContext<UploadContextType | null>(null)

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider')
  return ctx
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const workerInfoRef = useRef<{ token: string; url: string } | null>(null)

  function updateEntry(id: string, patch: Partial<UploadEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  async function getWorkerInfo() {
    if (workerInfoRef.current) return workerInfoRef.current
    const res = await fetch('/api/upload/token')
    if (!res.ok) throw new Error('Failed to get upload token')
    const data = await res.json()
    workerInfoRef.current = { token: data.token, url: data.url }
    // Clear cache after 4 minutes (token may expire)
    setTimeout(() => { workerInfoRef.current = null }, 4 * 60 * 1000)
    return workerInfoRef.current!
  }

  async function uploadOne(
    entry: UploadEntry,
    file: File,
    meta: SharedMeta
  ) {
    updateEntry(entry.id, { state: 'uploading' })
    try {
      const { token, url: workerUrl } = await getWorkerInfo()

      const videoId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            updateEntry(entry.id, { progress: Math.round((e.loaded / e.total) * 100) })
        }
        xhr.onload = () => {
          if (xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText).videoId) }
            catch { reject(new Error('Invalid response from worker')) }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error ?? 'Upload failed')) }
            catch { reject(new Error('Upload failed')) }
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `${workerUrl}/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        const fd = new FormData()
        fd.append('file', file)
        xhr.send(fd)
      })

      updateEntry(entry.id, { state: 'saving', progress: 100 })

      const saveRes = await fetch('/api/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title: entry.title,
          description: meta.description || null,
          game: meta.game || null,
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

  const startUploads = useCallback((
    files: { file: File; title: string }[],
    meta: SharedMeta
  ) => {
    const newEntries: UploadEntry[] = files.map(f => ({
      id: crypto.randomUUID(),
      title: f.title,
      state: 'pending',
      progress: 0,
      error: null,
    }))
    setEntries(prev => [...prev, ...newEntries])

    // Start all uploads in parallel
    newEntries.forEach((entry, i) => {
      uploadOne(entry, files[i].file, meta)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearDone = useCallback(() => {
    setEntries(prev => prev.filter(e => e.state !== 'done' && e.state !== 'error'))
  }, [])

  return (
    <UploadContext.Provider value={{ entries, startUploads, clearDone }}>
      {children}
    </UploadContext.Provider>
  )
}
