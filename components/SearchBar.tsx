'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  // Debounce: push URL update 300ms after user stops typing
  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) {
        params.set('q', q)
      } else {
        params.delete('q')
      }
      router.push(params.size > 0 ? `/?${params}` : '/')
    },
    [router, searchParams]
  )

  useEffect(() => {
    const timer = setTimeout(() => push(value), 300)
    return () => clearTimeout(timer)
  }, [value, push])

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search clips, games..."
        className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
      />
      {value && (
        <button
          onClick={() => { setValue(''); push('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
