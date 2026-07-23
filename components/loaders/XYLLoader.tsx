'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// Use dynamic import for Lottie since it might use browser globals like window/document
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface XYLLoaderProps {
  mini?: boolean
  tagline?: string
}

const XYLLoader: React.FC<XYLLoaderProps> = ({ mini = false, tagline }) => {
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

  const [animationData, setAnimationData] = React.useState<any>(null)

  React.useEffect(() => {
    fetch('/assets/lottie/rushup-loading.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Error loading Lottie animation:', err))
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#fdfdfd]"
        style={{
          fontFamily: "'Playfair Display', serif"
        }}
      >
        <div className="flex flex-col items-center justify-center w-full max-w-[300px]">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              style={{ width: '100%', height: 'auto' }}
            />
          ) : (
            <div className="w-[140px] h-[140px] flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-10 w-10 border border-[#e8e8e8] border-t-[#1a1a1a] rounded-full"
              />
            </div>
          )}

          {/* Optional Tagline */}
          {tagline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-[9px] font-normal uppercase tracking-[0.4em] text-[#1a1a1a]"
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
