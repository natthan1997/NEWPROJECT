'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

interface Banner {
  id?: string
  image_url: string
  title?: string
  subtitle?: string
}

interface XYLLoaderProps {
  mini?: boolean
  tagline?: string
  banners?: Banner[]
}

const XYLLoader: React.FC<XYLLoaderProps> = ({ mini = false, tagline, banners = [] }) => {
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (banners && banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % banners.length)
      }, 3500)
      return () => clearInterval(timer)
    }
  }, [banners])

  if (mini) {
    return (
      <div className="flex items-center justify-center p-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="h-5 w-5 border border-[#e8e8e8] border-t-[#1a1a1a] rounded-full"
        />
      </div>
    )
  }

  const activeBanner = banners && banners.length > 0 ? banners[currentIdx] : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-between p-6 overflow-hidden select-none"
        style={{
          backgroundColor: '#0F1115',
          color: '#ffffff',
          fontFamily: "'Sarabun', 'Inter', sans-serif"
        }}
      >
        {/* Ambient Glow Background */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-900/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-900/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header / Brand Badge */}
        <div className="w-full max-w-sm flex items-center justify-between pt-4 z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[12px] font-bold tracking-[0.2em] text-gray-300 uppercase">XYLEM STUDIO</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-300">
            <Sparkles size={12} />
            <span>Special Promo</span>
          </div>
        </div>

        {/* Center: Promotional Card / Poster Container */}
        <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center my-6 z-10">
          <div className="w-full relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl flex flex-col justify-end p-6 group">
            {activeBanner ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeBanner.id || currentIdx}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 z-0"
                >
                  <img
                    src={activeBanner.image_url}
                    alt={activeBanner.title || 'Promotion'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </motion.div>
              </AnimatePresence>
            ) : (
              /* Fallback Brand Showcase Poster */
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-inner">
                  <span className="text-4xl font-serif italic text-emerald-400">XYL</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-wide mb-2">XYLEM CAFE</h3>
                <p className="text-xs text-stone-400 tracking-widest uppercase">Coffee & Landscape Experience</p>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
            )}

            {/* Poster Info Overlay */}
            <div className="relative z-10">
              {activeBanner?.title && (
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl font-extrabold text-white mb-1 leading-tight"
                >
                  {activeBanner.title}
                </motion.h2>
              )}
              {activeBanner?.subtitle && (
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs font-medium text-stone-300 line-clamp-2"
                >
                  {activeBanner.subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* Dots Indicator if multiple banners */}
          {banners && banners.length > 1 && (
            <div className="flex gap-1.5 mt-4">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIdx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Loading Progress Bar & Status */}
        <div className="w-full max-w-sm pb-4 z-10">
          <div className="flex items-center justify-between text-[12px] text-stone-300 mb-2 font-medium">
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin text-emerald-400" size={14} />
              <span>{tagline || 'กำลังเชื่อมต่อระบบ LINE...'}</span>
            </span>
            <span className="text-[10px] tracking-wider text-stone-500 uppercase font-mono">LOADING</span>
          </div>

          {/* Shimmer Progress Line */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default XYLLoader
