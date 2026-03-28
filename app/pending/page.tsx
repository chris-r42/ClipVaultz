'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-white mb-2">Awaiting Approval</h1>
        <p className="text-[var(--muted)] text-sm mb-6">
          Your account is pending approval. An admin needs to approve you before you can access Clip Vault.
        </p>
        <button
          onClick={handleSignOut}
          className="text-sm text-[var(--muted)] hover:text-white transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  )
}
