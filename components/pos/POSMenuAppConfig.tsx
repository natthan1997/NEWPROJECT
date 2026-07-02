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
  const [childHeader, setChildHeader] = useState<React.ReactNode>(null)


  const tabs = [
    { id: 'items', label: 'เมนู', icon: LayoutGrid },
    { id: 'categories', label: 'หมวดหมู่', icon: Tag },
    { id: 'modifiers', label: 'ตัวเลือก', icon: SlidersHorizontal },
  ]

  // Render tabs in the parent header to save space
  useEffect(() => {
    setViewExtraHeader(
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MenuAppTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                isActive ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [activeTab, setViewExtraHeader])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* TOOLBAR FROM CHILD COMPONENTS */}
      {childHeader && (
        <div className="shrink-0 bg-white px-4 py-3 md:px-6 border-b border-gray-100 flex items-center justify-between shadow-sm relative z-10">
          {childHeader}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar bg-gray-50/30">
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
                setViewExtraHeader={setChildHeader}
                shopSettings={shopSettings}
                hideStockToggle={false}
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
                  setViewExtraHeader={setChildHeader}
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
