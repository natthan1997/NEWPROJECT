
'use client';
import { motion } from 'framer-motion';

export default function AnimatedMinimalTree({ progress }: { progress: number }) {
  // progress is 0 to 100
  const normalized = Math.min(100, Math.max(0, progress)) / 100;
  
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg width="100%" height="100%" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Base line */}
        <motion.line 
          x1="60" y1="230" x2="140" y2="230" 
          stroke="#E5E5E5" strokeWidth="1" strokeLinecap="round" 
        />
        
        {/* Main Stem */}
        <motion.path
          d="M100 230 C 95 180 105 130 100 60"
          stroke="#111111"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: normalized > 0.05 ? normalized : 0.05 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Leaf 1 (Right) */}
        <motion.path
          d="M 102 190 Q 130 180 140 160 Q 110 170 102 190"
          fill="#111111"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.2 ? Math.min(1, (normalized - 0.1) * 1.5) : 0, 
            opacity: normalized >= 0.2 ? 1 : 0 
          }}
          style={{ originX: "102px", originY: "190px" }}
          transition={{ duration: 1, type: "spring" }}
        />

        {/* Leaf 2 (Left) */}
        <motion.path
          d="M 98 150 Q 70 140 60 120 Q 90 130 98 150"
          fill="#111111"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.4 ? Math.min(1, (normalized - 0.3) * 1.5) : 0, 
            opacity: normalized >= 0.4 ? 1 : 0 
          }}
          style={{ originX: "98px", originY: "150px" }}
          transition={{ duration: 1, type: "spring" }}
        />

        {/* Leaf 3 (Right higher) */}
        <motion.path
          d="M 103 110 Q 120 100 130 80 Q 105 95 103 110"
          fill="#111111"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.6 ? Math.min(1, (normalized - 0.5) * 1.5) : 0, 
            opacity: normalized >= 0.6 ? 1 : 0 
          }}
          style={{ originX: "103px", originY: "110px" }}
          transition={{ duration: 1, type: "spring" }}
        />
        
        {/* Leaf 4 (Left higher) */}
        <motion.path
          d="M 97 80 Q 80 70 70 50 Q 95 65 97 80"
          fill="#111111"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.8 ? Math.min(1, (normalized - 0.7) * 1.5) : 0, 
            opacity: normalized >= 0.8 ? 1 : 0 
          }}
          style={{ originX: "97px", originY: "80px" }}
          transition={{ duration: 1, type: "spring" }}
        />

        {/* Top Leaf */}
        <motion.path
          d="M 100 60 Q 90 40 100 20 Q 110 40 100 60"
          fill="#111111"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: normalized >= 0.95 ? 1 : 0, 
            opacity: normalized >= 0.95 ? 1 : 0 
          }}
          style={{ originX: "100px", originY: "60px" }}
          transition={{ duration: 1, type: "spring" }}
        />

      </svg>
    </div>
  );
}
