import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

type Member = Pick<Profile, 'id' | 'username' | 'avatar_url'>

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('is_approved', true)
      .order('username', { ascending: true }),
  ])

  const isAdmin = profile?.is_admin ?? false

  return (
    <div className="flex min-h-screen">
      {/* Mobile top nav */}
      <div className="lg:hidden w-full fixed top-0 z-50">
        <Navbar isAdmin={isAdmin} />
      </div>

      {/* Desktop sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        currentUserId={user.id}
        members={(members ?? []) as Member[]}
        className="hidden lg:flex"
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 py-8 lg:px-8 mt-14 lg:mt-0">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
