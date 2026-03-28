'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function SignOutButton() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
    >
      {signingOut ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
