import SidebarLink from './SidebarLink'
import MembersPresence from './MembersPresence'
import SignOutButton from './SignOutButton'
import Link from 'next/link'
import type { Profile } from '@/types/database'

type Member = Pick<Profile, 'id' | 'username' | 'avatar_url'>

interface SidebarProps {
  isAdmin: boolean
  currentUserId: string
  members: Member[]
  className?: string
}

export default function Sidebar({ isAdmin, currentUserId, members, className = '' }: SidebarProps) {
  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/upload', label: 'Upload' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <aside className={`w-60 shrink-0 h-screen sticky top-0 flex-col border-r border-white/5 bg-[var(--sidebar-bg)] ${className}`}>
      {/* Logo */}
      <div className="px-5 h-14 flex items-center shrink-0">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          Clip<span className="text-[var(--accent)]">Vault</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="px-3 py-2 space-y-0.5 shrink-0">
        {navLinks.map(link => (
          <SidebarLink key={link.href} href={link.href} label={link.label} />
        ))}
      </nav>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 mt-2 border-t border-white/5">
        <MembersPresence members={members} currentUserId={currentUserId} />
      </div>

      {/* Sign out + version */}
      <div className="px-3 py-3 border-t border-white/5 shrink-0">
        <SignOutButton />
        <p className="text-[10px] text-[var(--muted)] mt-2 px-2 opacity-40">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>
    </aside>
  )
}
