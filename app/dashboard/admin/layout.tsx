'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '../../../lib/ProtectedRoute'
import TopNavBar from '../../../components/TopNavBar'
import Sidebar from '../../../components/Sidebar'
import { SidebarContext } from '../_shared/sidebar-context'
import { supabase } from '../../../lib/supabaseClient'
import { useAdminMerchant } from '../../../lib/adminMerchantHelper'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon, BuildingStorefrontIcon, KeyIcon, XMarkIcon } from '@heroicons/react/24/outline'
import RUSHUPLoader from '../../../components/loaders/RUSHUPLoader'

const SIDEBAR_LOCK_KEY = 'rushup.admin.sidebarLocked'
const SIDEBAR_OPEN_KEY = 'rushup.admin.sidebarOpen'

const StyleTag = () => (
  <style>{`
    @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Pridi:wght@300;400;500;600&display=swap");
    * { border-radius: 0 !important; }
    body {
       font-family: 'Plus Jakarta Sans', sans-serif;
       -webkit-font-smoothing: antialiased;
    }
    .font-serif-thai { font-family: 'Pridi', serif; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarLocked, setSidebarLocked] = useState(false)
  const isDocumentBuilderPage = pathname?.startsWith('/dashboard/admin/documents/create-manual') || pathname?.startsWith('/dashboard/admin/house-plans')

  const { selectedMerchantId, selectedMerchantName, isLoaded, changeMerchant } = useAdminMerchant()
  const [merchants, setMerchants] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMerchants, setLoadingMerchants] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  useEffect(() => {
    try {
      const savedLocked = window.localStorage.getItem(SIDEBAR_LOCK_KEY)
      const savedOpen = window.localStorage.getItem(SIDEBAR_OPEN_KEY)
      const locked = savedLocked === '1'
      const open = savedOpen === '1'

      setSidebarLocked(locked)
      setSidebarOpen(locked ? true : open)
    } catch {
      setSidebarLocked(false)
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_LOCK_KEY, sidebarLocked ? '1' : '0')
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, sidebarOpen ? '1' : '0')
  }, [sidebarLocked, sidebarOpen])

  useEffect(() => {
    if (isSelectorOpen) {
      const loadMerchants = async () => {
        setLoadingMerchants(true)
        setErrorText('')
        try {
          const { data, error } = await supabase
            .from('pos_merchants')
            .select('*')
            .order('name', { ascending: true })

          if (error) throw error
          setMerchants(data || [])
        } catch (e: any) {
          console.error('Failed to load merchants:', e)
          setErrorText('ไม่สามารถดึงข้อมูลบัญชีร้านค้าได้')
        } finally {
          setLoadingMerchants(false)
        }
      }
      loadMerchants()
    }
  }, [isSelectorOpen])

  // Notion-style auto show
  const handleAutoShow = () => {
    if (!sidebarLocked) {
      setSidebarOpen(true)
    }
  }

  // Notion-style auto hide
  const handleAutoHide = () => {
    if (!sidebarLocked) {
      setSidebarOpen(false)
    }
  }

  // Toggle lock state
  const handleLockToggle = () => {
    const newLockState = !sidebarLocked
    setSidebarLocked(newLockState)
    if (newLockState && !sidebarOpen) {
      setSidebarOpen(true)
    }
  }

  const filteredMerchants = merchants.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isQueryUuid = searchQuery.trim().length === 36 && 
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchQuery.trim())

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <SidebarContext.Provider value={{ sidebarLocked, sidebarOpen }}>
        <div className="rushup-shell rushup-page flex min-h-screen w-full flex-col overflow-x-hidden">
          <StyleTag />
          
          {!isDocumentBuilderPage && (
            <>
              <TopNavBar 
                onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
                isLocked={sidebarLocked}
                onLockToggle={handleLockToggle}
                sidebarOpen={sidebarOpen}
              />
              <Sidebar 
                isOpen={sidebarOpen} 
                onMenuClick={() => setSidebarOpen(false)}
                isLocked={sidebarLocked}
                onLockToggle={handleLockToggle}
                onAutoShow={handleAutoShow}
                onAutoHide={handleAutoHide}
              />
            </>
          )}

          {/* Main content adjusts left margin when locked */}
          <main 
            className={`flex-1 w-full overflow-x-hidden transition-all duration-300 ease-in-out flex flex-col min-h-0 ${
              !isDocumentBuilderPage && sidebarLocked 
                  ? 'pt-[calc(4rem+env(safe-area-inset-top))] md:ml-[280px] md:w-[calc(100%-280px)] ml-0'
                  : isDocumentBuilderPage ? 'pt-0 ml-0' : 'pt-[calc(4rem+env(safe-area-inset-top))] ml-0'
            }`}
          >
            {/* Active Merchant Banner */}
            {!isDocumentBuilderPage && isLoaded && (
              selectedMerchantId ? (
                <div className="bg-[#E7F3FF] border-b border-blue-100/60 px-6 py-2 flex items-center justify-between text-xs text-[#1877F2] font-semibold shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] animate-pulse"></span>
                    <span>กำลังตรวจสอบระบบร้านค้า: <strong className="font-bold text-[#0f5fc2]">{selectedMerchantName || selectedMerchantId}</strong></span>
                  </div>
                  <button
                    onClick={() => changeMerchant(null)}
                    className="text-rose-600 hover:text-rose-700 bg-white/80 hover:bg-white border border-rose-200 hover:border-rose-300 px-3 py-1 rounded-lg transition-colors active:scale-95 text-[11px] font-bold"
                  >
                    เปลี่ยนร้านค้า
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-100 border-b border-zinc-200/60 px-6 py-2 flex items-center justify-between text-xs text-zinc-600 font-semibold shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                    <span>ยังไม่ได้เลือกบัญชีร้านค้าเพื่อเข้าตรวจสอบ (ระบบจะกรองข้อมูลเปล่าจนกว่าจะเลือก)</span>
                  </div>
                  <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="text-zinc-800 hover:text-black bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 px-3 py-1 rounded-lg transition-colors active:scale-95 text-[11px] font-bold"
                  >
                    เลือกบัญชีร้านค้า
                  </button>
                </div>
              )
            )}

            <div className="flex-1 min-h-0 w-full flex flex-col">
              <div className={isDocumentBuilderPage ? (pathname?.startsWith('/dashboard/admin/documents/create-manual') ? 'w-full p-0 min-h-screen' : 'w-full p-0 h-screen overflow-hidden') : 'rushup-page-inner'}>
                <div className={isDocumentBuilderPage ? 'w-full max-w-none min-h-full' : 'rushup-page-container'}>
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Merchant Selector Modal */}
        <AnimatePresence>
          {isSelectorOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-bold">
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="max-w-md w-full bg-white border border-neutral-200/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[2.5rem] flex flex-col space-y-6 relative"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsSelectorOpen(false)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Header Icon & Text */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-zinc-950 text-white rounded-full flex items-center justify-center shadow-lg shadow-black/10">
                    <KeyIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight">RUSH UP Admin Control</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ระบบตรวจสอบและจัดการหลังบ้าน</p>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาร้านค้าด้วยชื่อ หรือ ID..."
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 hover:bg-zinc-100/50 focus:bg-white border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 text-sm font-semibold rounded-2xl outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>

                {/* Merchants List */}
                <div className="flex flex-col min-h-0">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 px-1">บัญชีร้านค้าทั้งหมดในระบบ</span>
                  
                  <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-1 pr-1">
                    {loadingMerchants ? (
                      <div className="py-12 flex justify-center"><RUSHUPLoader /></div>
                    ) : errorText ? (
                      <div className="py-12 text-center text-rose-500 text-xs font-semibold">{errorText}</div>
                    ) : filteredMerchants.length > 0 ? (
                      filteredMerchants.map((merchant) => (
                        <button
                          key={merchant.id}
                          onClick={() => {
                            changeMerchant(merchant.id, merchant.name)
                            setIsSelectorOpen(false)
                          }}
                          className="w-full flex items-center justify-between p-3 border border-transparent hover:border-zinc-200/80 hover:bg-zinc-50 rounded-2xl transition-all text-left active:scale-[0.99] group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-zinc-100 group-hover:bg-zinc-950 group-hover:text-white flex items-center justify-center text-xs font-black tracking-tight shrink-0 transition-colors">
                              {merchant.name?.[0]?.toUpperCase() || 'M'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13.5px] font-black text-zinc-900 group-hover:text-zinc-950 truncate transition-colors">{merchant.name}</span>
                              <span className="text-[9px] text-zinc-400 group-hover:text-zinc-500 font-medium truncate font-mono">ID: {merchant.id}</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all font-bold shrink-0">เลือก &rarr;</span>
                        </button>
                      ))
                    ) : (
                      <div className="py-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
                        <BuildingStorefrontIcon className="w-8 h-8 opacity-30" />
                        <span>ไม่พบร้านค้าที่ตรงตามต้องการ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Inspect Option (if search query is valid UUID) */}
                {isQueryUuid && (
                  <button
                    onClick={() => {
                      changeMerchant(searchQuery.trim(), 'Custom ID')
                      setIsSelectorOpen(false)
                    }}
                    className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-black/10"
                  >
                    เข้าตรวจสอบระบบด้วย ID ที่ระบุ
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </SidebarContext.Provider>
    </ProtectedRoute>
  )
}