'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, QrCode, Gift, Target, ArrowRight, Check } from 'lucide-react';

interface MemberOnboardingGuideProps {
  onClose: () => void;
}

const slides = [
  {
    id: 'points',
    title: 'สะสมคะแนนง่ายๆ',
    description: 'ทุกยอดการสั่งซื้อที่หน้าร้าน จะเปลี่ยนเป็นคะแนนสะสมโดยอัตโนมัติ เพื่อใช้อัปเกรดระดับสมาชิกของคุณ',
    icon: <Trophy size={48} className="text-[#1A1A18]" />,
    bg: 'bg-[#F2ECE4]',
    iconBg: 'bg-white'
  },
  {
    id: 'qr',
    title: 'แสดง QR รับแต้ม',
    description: 'เพียงยื่น QR Code หน้านี้ให้พนักงาน หรือสแกน QR บิลด้วยตัวเอง แต้มจะเด้งเข้าบัญชีทันที',
    icon: <QrCode size={48} className="text-white" />,
    bg: 'bg-gray-100',
    iconBg: 'bg-[#1A1A18]'
  },
  {
    id: 'rewards',
    title: 'แลกของรางวัล & กาชา',
    description: 'ใช้คะแนนของคุณเพื่อแลกส่วนลดพิเศษ หรือจะเสี่ยงดวงกับระบบกาชาเพื่อลุ้นรับรางวัลใหญ่ก็ได้เช่นกัน',
    icon: <Gift size={48} className="text-[#E0A865]" />,
    bg: 'bg-[#FDF8F3]',
    iconBg: 'bg-white'
  },
  {
    id: 'missions',
    title: 'ทำภารกิจสุดท้าทาย',
    description: 'เข้าร่วมแคมเปญและภารกิจพิเศษต่างๆ เพื่อปลดล็อกฉายาและรับคะแนนโบนัสมากมาย',
    icon: <Target size={48} className="text-white" />,
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-800'
  }
];

export function MemberOnboardingGuide({ onClose }: MemberOnboardingGuideProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-56 flex flex-col items-center justify-center relative overflow-hidden ${slides[currentSlide].bg}`}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/20 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-black/5 blur-2xl"></div>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, bounce: 0.5 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl relative z-10 ${slides[currentSlide].iconBg}`}
            >
              {slides[currentSlide].icon}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="p-8 text-center bg-white relative z-20">
          <div className="flex justify-center gap-1.5 mb-6">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-[#1A1A18]' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-[22px] font-black text-gray-900 mb-3 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-8 px-2">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <button 
            onClick={nextSlide}
            className="w-full h-14 bg-[#1A1A18] text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-black/10"
          >
            {isLast ? (
              <>
                เริ่มต้นใช้งาน
                <Check size={18} />
              </>
            ) : (
              <>
                ถัดไป
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
