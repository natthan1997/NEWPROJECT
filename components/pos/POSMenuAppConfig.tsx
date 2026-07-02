'use client';
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Tag, SlidersHorizontal, ToggleRight } from 'lucide-react'

// --- REUSED SUB-COMPONENTS/PARTS ---
import POSMenuManager from './POSMenuManager'
import POSCategoryManager from './POSCategoryManager'
import POSModifierManager from './POSModifierManager'

interface POSMenuAppConfigProps {
  profile: any
  activeView: string
  setViewExtraHeader: (node: React.ReactNode) => void
  onSetView?: (view: any) => void
  shopSettings?: any
}

type MenuAppTab = 'items' | 'categories' | 'modifiers' | 'stock'

export default function POSMenuAppConfig({
  profile,
  activeView,
  setViewExtraHeader,
  onSetView,
  shopSettings,
}: POSMenuAppConfigProps) {
  const [activeTab, setActiveTab] = useState<MenuAppTab>('items')

  // Set the top extra header (if needed)
  useEffect(() => {
    setViewExtraHeader(
      <div className="flex items-center text-lg md:text-xl font-black uppercase tracking-tight text-gray-800">
        จัดการเมนู (Menu)
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [setViewExtraHeader])

  const tabs = [
    { id: 'items', label: 'รายการเมนู', icon: LayoutGrid },
    { id: 'categories', label: 'หมวดหมู่', icon: Tag },
    { id: 'modifiers', label: 'ตัวเลือกเสริม', icon: SlidersHorizontal },
    { id: 'stock', label: 'อัปเดตสต็อก', icon: ToggleRight },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F5F7]">
      {/* APP-LIKE TOP TABS (CLEAN, iOS STYLE) */}
      <div className="shrink-0 bg-[#F5F5F7] px-4 py-4 md:px-8 border-b border-gray-200/60 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex bg-gray-200/60 p-1.5 rounded-2xl md:rounded-full overflow-x-auto no-scrollbar shadow-inner relative">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MenuAppTab)}
                  className={`relative flex flex-1 min-w-[100px] items-center justify-center gap-2 rounded-xl md:rounded-full py-2.5 px-3 transition-all duration-300 ease-out z-10 ${
                    isActive
                      ? 'text-gray-900 font-bold'
                      : 'text-gray-500 font-medium hover:text-gray-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMenuAppTab"
                      className="absolute inset-0 bg-white rounded-xl md:rounded-full shadow-sm z-[-1]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={18} className={isActive ? 'text-[#1A1A18]' : 'text-gray-400'} />
                  <span className="text-sm whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'items' && (
              <POSMenuManager
                profile={profile}
                activeView={activeView}
                allowedNav={[]}
                onSetView={() => {}}
                setViewExtraHeader={() => {}} // Override to prevent conflicting header changes
                shopSettings={shopSettings}
                hideStockToggle={true}
                forceViewMode="grid"
              />
            )}

            {activeTab === 'categories' && (
              <POSCategoryManager
                shopSettings={shopSettings}
                onCategoriesChange={(cats) => {}}
              />
            )}

            {activeTab === 'modifiers' && (
              <div className="p-4 md:p-10 pb-0">
                <POSModifierManager
                  profile={profile}
                  activeView={activeView}
                  allowedNav={[]}
                  onSetView={() => {}}
                  setViewExtraHeader={() => {}}
                  shopSettings={shopSettings}
                />
              </div>
            )}

            {activeTab === 'stock' && (
              <POSMenuManager
                profile={profile}
                activeView={activeView}
                allowedNav={[]}
                onSetView={() => {}}
                setViewExtraHeader={() => {}}
                shopSettings={shopSettings}
                hideStockToggle={true}
                forceViewMode="stock"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
