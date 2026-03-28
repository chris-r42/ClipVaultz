'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--muted)] hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )
}
