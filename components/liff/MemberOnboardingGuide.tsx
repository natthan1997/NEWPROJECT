'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';

interface MemberOnboardingGuideProps {
  onClose: () => void;
}

const steps = [
  { 
    id: 'tour-profile', 
    title: 'ระดับสมาชิก', 
    text: 'ตรวจสอบคะแนนสะสมปัจจุบันของคุณ และเช็คระดับสมาชิกได้จากตรงนี้เลย',
    position: 'bottom'
  },
  { 
    id: 'tour-missions', 
    title: 'ภารกิจพิเศษ', 
    text: 'ร่วมสนุกกับภารกิจต่างๆ เพื่อรับคะแนนโบนัสและปลดล็อกฉายาสุดเท่',
    position: 'top'
  },
  { 
    id: 'tour-rewards', 
    title: 'แลกรางวัล & สุ่มกาชา', 
    text: 'ใช้คะแนนสะสมเพื่อแลกรับส่วนลด หรือจะใช้สุ่มกาชาลุ้นรับของรางวัลใหญ่ก็ได้',
    position: 'top'
  }
];

export function MemberOnboardingGuide({ onClose }: MemberOnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const measureTarget = useCallback(() => {
    const targetId = steps[currentStep].id;
    const element = document.getElementById(targetId);
    
    if (element) {
      // Scroll into view if needed
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Wait a bit for scroll to finish before measuring
        setTimeout(() => {
          const newRect = element.getBoundingClientRect();
          setTargetRect({
            x: newRect.left - 8,
            y: newRect.top - 8,
            w: newRect.width + 16,
            h: newRect.height + 16
          });
          setIsReady(true);
        }, 400);
        return;
      }

      setTargetRect({
        x: rect.left - 8,
        y: rect.top - 8,
        w: rect.width + 16,
        h: rect.height + 16
      });
      setIsReady(true);
    } else {
      // If element is not found on screen, skip this step
      console.warn(`Element with id ${targetId} not found for onboarding guide`);
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onClose();
      }
    }
  }, [currentStep, onClose]);

  useEffect(() => {
    // Initial measurement, wait for DOM to fully render
    setIsReady(false);
    const timer = setTimeout(() => measureTarget(), 100);

    // Re-measure on resize or scroll
    window.addEventListener('resize', measureTarget);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureTarget);
    };
  }, [measureTarget]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const isLast = currentStep === steps.length - 1;
  const currentData = steps[currentStep];

  // Calculate tooltip position
  let tooltipY = 0;
  let tooltipX = 24; // margin from side

  if (targetRect) {
    if (currentData.position === 'bottom') {
      tooltipY = targetRect.y + targetRect.h + 16;
    } else {
      tooltipY = targetRect.y - 140 - 16; // 140 is approx tooltip height
      if (tooltipY < 20) { // If it goes off top screen, put it below instead
        tooltipY = targetRect.y + targetRect.h + 16;
      }
    }
  }

  if (!isReady || !targetRect) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Click blocker */}
      <div className="absolute inset-0 z-10" />

      {/* SVG Mask for Spotlight */}
      <svg className="absolute inset-0 z-20 pointer-events-none" width="100%" height="100%">
        <defs>
          <mask id="spotlight">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{
                x: targetRect.x,
                y: targetRect.y,
                width: targetRect.w,
                height: targetRect.h
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              rx={16}
              fill="black"
            />
          </mask>
        </defs>
        <motion.rect 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#spotlight)" 
        />
      </svg>

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: currentData.position === 'bottom' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            top: tooltipY,
            left: tooltipX,
            right: tooltipX,
            zIndex: 30
          }}
          className="bg-white rounded-[24px] p-5 shadow-2xl flex flex-col gap-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-[#B48529] uppercase mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B48529]"></span>
                ขั้นตอนที่ {currentStep + 1}/{steps.length}
              </p>
              <h3 className="text-[18px] font-bold text-gray-900 leading-tight">
                {currentData.title}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 -mr-2 -mt-2 bg-gray-50 rounded-full active:scale-95"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
          
          <p className="text-[13px] text-gray-600 leading-relaxed mb-1 font-medium">
            {currentData.text}
          </p>

          <div className="flex justify-between items-center mt-2">
            <button 
              onClick={onClose}
              className="text-[13px] font-bold text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
            >
              ข้าม (Skip)
            </button>
            
            <button 
              onClick={nextStep}
              className="h-10 px-5 bg-gradient-to-r from-[#1A1A18] to-[#2A2A28] text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            >
              {isLast ? (
                <>เริ่มต้นใช้งาน <Check size={16} strokeWidth={2.5} /></>
              ) : (
                <>ถัดไป <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
