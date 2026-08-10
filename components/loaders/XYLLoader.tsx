'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface XYLLoaderProps {
  mini?: boolean
  tagline?: string
  posterUrl?: string | null
}

const XYLLoader: React.FC<XYLLoaderProps> = ({ mini = false, tagline, posterUrl }) => {
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

  if (posterUrl) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-black text-white font-sans overflow-hidden select-none"
        >
          {/* Poster Image Layer */}
          <div className="absolute inset-0 z-0">
            <img
              loading="eager"
              src={posterUrl}
              alt="Promotional Splash"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 w-full pt-10 px-6 flex justify-between items-center">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black tracking-wider text-white uppercase">XYLEM STUDIO</span>
            </div>
          </div>

          {/* Bottom Loading Progress Bar */}
          <div className="relative z-10 w-full pb-10 px-6 max-w-md mx-auto flex flex-col items-center space-y-3">
            <div className="w-full bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-white/90">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {tagline || 'กำลังโหลดระบบ...'}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-amber-300">LIFF APP</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 rounded-full w-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  const studioLetters = ['S', 'T', 'U', 'D', 'I', 'O']

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundColor: '#fdfdfd',
          backgroundImage: "url('https://www.transparenttextures.com/patterns/white-paperboard.png')",
          fontFamily: "'Playfair Display', serif"
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {/* Orbit Box */}
          <div className="relative w-[140px] h-[140px] flex items-center justify-center mb-[30px]">
            {/* Outer Orbit */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: [0.5, 0.1, 0.4, 0.9] }}
              className="absolute inset-0 border border-[#e8e8e8] border-t-[#1a1a1a] rounded-full"
            />
            {/* Inner Orbit */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[7.5%] border border-transparent border-b-[#cccccc] rounded-full opacity-50"
            />
            
            {/* Logo Stack */}
            <motion.div
              animate={{ opacity: [1, 0.85, 1], scale: [1, 0.98, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center select-none z-10 leading-[0.75]"
            >
              <span className="text-[36px] font-normal text-[#1a1a1a] tracking-wider">X</span>
              <span className="text-[36px] font-normal text-[#1a1a1a] tracking-wider">Y</span>
              <span className="text-[36px] font-normal italic text-[#1a1a1a] tracking-wider translate-x-[3px]">L</span>
            </motion.div>
          </div>

          {/* STUDIO Loader */}
          <div className="flex gap-3 mt-[5px]">
            {studioLetters.map((letter, i) => (
              <motion.span
                key={i}
                animate={{ color: ['#cccccc', '#1a1a1a', '#cccccc'] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15
                }}
                className="text-[11px] font-normal tracking-[6px] uppercase"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Optional Tagline */}
          {tagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-[9px] font-normal uppercase tracking-[0.4em] text-[#1a1a1a]"
            >
              {tagline}
            </motion.p>
          )}
        </div>

        {/* Local Styles for Font and Pattern fallback */}
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        `}</style>
      </motion.div>
    </AnimatePresence>
  )
}

export default XYLLoader
