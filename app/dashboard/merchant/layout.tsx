'use client';
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ProtectedRoute from '@/lib/ProtectedRoute'
import { useAuth } from '@/lib/AuthContext'
import { LayoutDashboard, Utensils, Users, Settings, Play, LogOut, Store, Menu, X } from 'lucide-react'

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'แดชบอร์ดสรุปผล', href: '/dashboard/merchant', icon: LayoutDashboard },
    { name: 'จัดการเมนูอาหาร', href: '/dashboard/merchant/menu', icon: Utensils },
    { name: 'จัดการพนักงาน', href: '/dashboard/merchant/staff', icon: Users },
    { name: 'ตั้งค่าร้านค้า', href: '/dashboard/merchant/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Authorization check inside layout (double safeguard)
  useEffect(() => {
    if (profile) {
      const isOwner = profile.staff_level === 'owner' || profile.staff_level === 'superadmin' || profile.role === 'admin'
      if (!isOwner) {
        router.push('/dashboard/pos')
      }
    }
  }, [profile, router])

  return (
    <ProtectedRoute allowedRoles={['staff', 'admin']}>
      <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans antialiased">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Pridi:wght@300;400;500;600&display=swap");
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
        `}</style>

        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-zinc-950 text-zinc-300 border-r border-zinc-800 shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">Merchant Portal</span>
              <span className="text-[10px] text-zinc-500 font-medium block">Store Manager</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between py-6 px-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/10'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="space-y-4">
              <a
                href="/dashboard/pos"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
              >
                <Play size={14} className="fill-white" />
                <span>เปิดระบบรับออเดอร์ (POS)</span>
              </a>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-3 px-2 mb-4 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold uppercase shrink-0">
                    {profile?.display_name?.charAt(0) || 'M'}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{profile?.display_name || 'Store Owner'}</span>
                    <span className="block text-[10px] text-zinc-500 truncate">{profile?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-all"
                >
                  <LogOut size={16} />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-zinc-950 text-white rounded-xl shadow-lg border border-zinc-800"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-y-0 left-0 w-64 bg-zinc-950 text-zinc-300 border-r border-zinc-800 z-50 flex flex-col p-6 md:hidden"
              >
                <div className="h-16 flex items-center gap-3 border-b border-zinc-800 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-black text-sm">
                    M
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight text-white block">Merchant Portal</span>
                    <span className="text-[10px] text-zinc-500 font-medium block">Store Manager</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <nav className="space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-green-600 text-white shadow-lg shadow-green-500/10'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </nav>

                  <div className="space-y-4">
                    <a
                      href="/dashboard/pos"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                    >
                      <Play size={14} className="fill-white" />
                      <span>เปิดระบบรับออเดอร์ (POS)</span>
                    </a>

                    <div className="border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-3 px-2 mb-4 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold uppercase shrink-0">
                          {profile?.display_name?.charAt(0) || 'M'}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-white truncate">{profile?.display_name || 'Store Owner'}</span>
                          <span className="block text-[10px] text-zinc-500 truncate">{profile?.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-all"
                      >
                        <LogOut size={16} />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pt-16 md:pt-0">
          <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
