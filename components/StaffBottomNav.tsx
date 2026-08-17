'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ClipboardList, TrendingUp, Users, User, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/AuthContext'

export default function StaffBottomNav() {
  const rawPathname = usePathname()
  const pathname = rawPathname || ''
  const { profile } = useAuth()

  const tabs = [
    { id: 'home', href: '/dashboard/staff', label: 'หน้าแรก', icon: Home },
    { id: 'pos', href: '/dashboard/pos', label: 'POS', icon: MonitorSmartphone },
    { id: 'profile', href: '/dashboard/staff/profile', label: 'โปรไฟล์', icon: User },
  ]

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.href === '/dashboard/staff') {
      return pathname === '/dashboard/staff'
    }
    return pathname.startsWith(tab.href)
  }

  const springConfig = { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.8 }

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[100] px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto max-w-[500px] w-full bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.12)] p-1.5 flex items-center justify-around pointer-events-auto">
        {tabs.map((tab) => {
          const active = isActive(tab)
          const Icon = tab.icon

          return (
            <Link
              key={tab.id}
              href={tab.href}
              scroll={false}
              className={`relative flex items-center justify-center py-2.5 px-3 sm:px-4 rounded-full transition-all duration-300 flex-1 text-center outline-none ${
                active ? 'bg-[#1A1A18] text-white font-bold shadow-md shadow-[#1A1A18]/25 scale-102' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
              <span className={`text-[11px] font-bold ml-1.5 whitespace-nowrap ${active ? 'inline-block' : 'hidden sm:inline-block'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
