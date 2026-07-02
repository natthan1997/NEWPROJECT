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
      <div className="flex items-center text-xl font-black uppercase tracking-tight">
        จัดการเมนูอาหาร (MENU APP)
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
    <div className="flex h-full flex-col overflow-hidden bg-[#FDFDFB] font-bold">
      {/* APP-LIKE TOP TABS */}
      <div className="shrink-0 border-b border-gray-100 bg-white shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex p-4 gap-2 w-max min-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MenuAppTab)}
                className={`flex flex-1 min-w-[120px] md:min-w-[160px] items-center justify-center gap-2 rounded-2xl p-4 transition-all ${
                  isActive
                    ? 'bg-[#1A1A18] text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span className="text-sm font-black tracking-tight">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-[#F5F4F0]/30 relative no-scrollbar">
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
