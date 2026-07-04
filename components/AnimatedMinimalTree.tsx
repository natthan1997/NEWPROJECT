'use client';
import { motion } from 'framer-motion';

export default function AnimatedMinimalTree({ progress }: { progress: number }) {
  // normalize to 0.05 - 1
  const normalized = Math.max(0.05, Math.min(100, progress) / 100);
  
  const stemColor = "#4A5D4E"; // Sage Green
  const leafColor = "#7C9082"; // Lighter Sage Green
  const soilColor = "#E5E7EB"; // Gray 200

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg width="100%" height="100%" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Soil Base (Frosted/Rounded) */}
        <motion.ellipse 
          cx="100" cy="230" rx="40" ry="8" 
          fill={soilColor}
        />
        
        {/* Main Organic Stem */}
        <motion.path
          d="M100 230 C 105 190 90 140 100 70"
          stroke={stemColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: normalized }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Leaf 1 (Bottom Right) */}
        <motion.path
          d="M 102 180 C 120 170 140 150 130 140 C 120 130 105 160 102 180"
          fill={leafColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.2 ? Math.min(1, (normalized - 0.1) * 1.5) : 0, 
            opacity: normalized >= 0.2 ? 1 : 0 
          }}
          style={{ originX: "102px", originY: "180px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />

        {/* Leaf 2 (Bottom Left) */}
        <motion.path
          d="M 98 150 C 70 145 50 120 60 110 C 70 100 90 130 98 150"
          fill={stemColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.4 ? Math.min(1, (normalized - 0.3) * 1.5) : 0, 
            opacity: normalized >= 0.4 ? 1 : 0 
          }}
          style={{ originX: "98px", originY: "150px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />

        {/* Leaf 3 (Middle Right) */}
        <motion.path
          d="M 100 110 C 130 100 150 70 135 60 C 120 50 105 90 100 110"
          fill={stemColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.6 ? Math.min(1, (normalized - 0.5) * 1.5) : 0, 
            opacity: normalized >= 0.6 ? 1 : 0 
          }}
          style={{ originX: "100px", originY: "110px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />
        
        {/* Leaf 4 (Top Left) */}
        <motion.path
          d="M 99 80 C 75 75 60 50 70 40 C 80 30 95 65 99 80"
          fill={leafColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.8 ? Math.min(1, (normalized - 0.7) * 1.5) : 0, 
            opacity: normalized >= 0.8 ? 1 : 0 
          }}
          style={{ originX: "99px", originY: "80px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />

        {/* Crown Leaf (Top) */}
        <motion.path
          d="M 100 70 C 85 50 90 20 100 10 C 110 20 115 50 100 70"
          fill={stemColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.95 ? 1 : 0, 
            opacity: normalized >= 0.95 ? 1 : 0 
          }}
          style={{ originX: "100px", originY: "70px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />

      </svg>
    </div>
  );
}
