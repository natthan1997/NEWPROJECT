'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RUSHUPLoaderProps {
  mini?: boolean
  tagline?: string
  posterUrl?: string | null
}

const RUSHUPLoader: React.FC<RUSHUPLoaderProps> = ({ mini = false, tagline, posterUrl }) => {
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
          className="fixed inset-0 z-[10000] w-full h-full bg-black overflow-hidden select-none"
        >
          <img
            loading="eager"
            src={posterUrl}
            alt="Promotional Splash"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  const studioLetters = ['R', 'U', 'S', 'H', ' ', 'U', 'P']

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          fontFamily: "Inter, system-ui, sans-serif"
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            src="/logo-splash.png"
            alt="RUSH UP Splash Logo"
            className="w-72 sm:w-80 h-auto object-contain select-none"
          />
          {/* Optional Tagline */}
          {tagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-[#C62229] text-center"
            >
              {tagline}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default RUSHUPLoader
