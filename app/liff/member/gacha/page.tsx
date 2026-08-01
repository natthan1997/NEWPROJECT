'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Ticket, Gift, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import Swal from 'sweetalert2';

// Minimalist Slot Machine Component
const SlotMachineSVG = ({ rolling, onPull }: { rolling: boolean, onPull: () => void }) => {
  const y = useMotionValue(0);

  // 3D Projection Mathematics
  // When the lever is pulled down, it rotates towards the user in 3D space.
  // This causes the arm to appear shorter (foreshortening) and the knob to move down.
  const knobCy = useTransform(y, val => 70 + val);
  const stickTop = useTransform(y, val => Math.min(70 + val + 10, 180));
  const stickHeight = useTransform(y, val => Math.abs(180 - (70 + val + 10)));
  const knobRadius = useTransform(y, val => {
    // Knob gets slightly larger as it rotates towards the camera
    const distance = Math.abs(val - 40);
    const progress = Math.max(0, 1 - (distance / 40));
    return 15 + (progress * 3);
  });

  useEffect(() => {
    // When spin is triggered, physically snap the lever back up like a real slot machine
    const controls = animate(y, 0, { type: "spring", stiffness: 400, damping: 25 });
    return () => controls.stop();
  }, [rolling, y]);

  return (
    <div className="relative w-full max-w-[280px] aspect-[3/4] mx-auto">
      <svg viewBox="0 0 300 400" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FCF7E8" />
            <stop offset="100%" stopColor="#B48529" />
          </linearGradient>
          <linearGradient id="machine-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A1A18" />
            <stop offset="100%" stopColor="#2A2A28" />
          </linearGradient>
          <clipPath id="screen-clip">
            <rect x="50" y="120" width="200" height="80" rx="8" />
          </clipPath>
        </defs>

        {/* Machine Body */}
        <rect x="30" y="40" width="240" height="320" rx="20" fill="url(#machine-body)" stroke="#D4AF37" strokeWidth="2" />
        
        {/* Top Dome */}
        <path d="M50 40 L50 20 Q150 -20 250 20 L250 40 Z" fill="url(#gold-gradient)" />
        <circle cx="150" cy="15" r="12" fill="#1A1A18" />
        <circle cx="150" cy="15" r="6" fill="#D4AF37" />

        {/* Screen Bezel */}
        <rect x="40" y="110" width="220" height="100" rx="12" fill="#333" stroke="#D4AF37" strokeWidth="3" />
        
        {/* White Screen */}
        <rect x="50" y="120" width="200" height="80" rx="8" fill="#FCF7E8" />
        
        {/* Slot Dividers */}
        <line x1="116" y1="120" x2="116" y2="200" stroke="#E5E7EB" strokeWidth="2" />
        <line x1="183" y1="120" x2="183" y2="200" stroke="#E5E7EB" strokeWidth="2" />

        {/* Spinning Symbols */}
        <g clipPath="url(#screen-clip)">
          {/* Column 1 */}
          <motion.g 
            animate={rolling ? { y: [0, -100] } : { y: 0 }} 
            transition={rolling ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: 'spring' }}
          >
            {/* When not rolling, just show a symbol in the center. When rolling, show a long strip */}
            <text x="83" y="168" fontSize="36" textAnchor="middle" fill="#D4AF37">✦</text>
            <text x="83" y="268" fontSize="36" textAnchor="middle" fill="#1A1A18">☕</text>
            <text x="83" y="68" fontSize="36" textAnchor="middle" fill="#1A1A18">☕</text>
          </motion.g>

          {/* Column 2 */}
          <motion.g 
            animate={rolling ? { y: [0, -100] } : { y: 0 }} 
            transition={rolling ? { repeat: Infinity, duration: 0.2, ease: "linear" } : { type: 'spring' }}
          >
            <text x="150" y="168" fontSize="36" textAnchor="middle" fill="#D4AF37">✦</text>
            <text x="150" y="268" fontSize="36" textAnchor="middle" fill="#B48529">✨</text>
            <text x="150" y="68" fontSize="36" textAnchor="middle" fill="#B48529">✨</text>
          </motion.g>

          {/* Column 3 */}
          <motion.g 
            animate={rolling ? { y: [0, -100] } : { y: 0 }} 
            transition={rolling ? { repeat: Infinity, duration: 0.1, ease: "linear" } : { type: 'spring' }}
          >
            <text x="216" y="168" fontSize="36" textAnchor="middle" fill="#D4AF37">✦</text>
            <text x="216" y="268" fontSize="36" textAnchor="middle" fill="#1A1A18">🎁</text>
            <text x="216" y="68" fontSize="36" textAnchor="middle" fill="#1A1A18">🎁</text>
          </motion.g>
        </g>

        {/* Lower Decor */}
        <rect x="60" y="240" width="180" height="60" rx="8" fill="#111" stroke="#333" strokeWidth="2" />
        <rect x="70" y="250" width="160" height="40" rx="4" fill="#1A1A18" />
        <text x="150" y="275" fontSize="14" textAnchor="middle" fill="#D4AF37" letterSpacing="4" className="font-sans font-bold">XYL STUDIO</text>
        
        {/* Tray */}
        <rect x="50" y="320" width="200" height="20" rx="10" fill="#0A0A0A" />

        {/* Lever Base */}
        <path d="M 270 160 Q 290 160 290 180 Q 290 200 270 200 Z" fill="#333" />

        {/* Animated Lever Arm (Simulated 3D) */}
        <g>
          <motion.rect x="275" y={stickTop} width="10" height={stickHeight} rx="5" fill="#CCC" />
          <motion.circle cx="280" cy={knobCy} r={knobRadius} fill="url(#gold-gradient)" />
        </g>
      </svg>

      {/* Invisible Draggable Overlay */}
      {!rolling && (
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 120 }}
          dragElastic={0.1}
          dragSnapToOrigin={true}
          onDragEnd={(e, info) => {
            if (info.offset.y > 40) {
              onPull();
            }
          }}
          style={{ y, position: 'absolute', right: '-8%', top: '10%', width: '80px', height: '140px', cursor: 'grab', touchAction: 'none' }}
        />
      )}

      {/* Helper animation */}
      {!rolling && (
        <motion.div 
           initial={{ y: -5, opacity: 0 }}
           animate={{ y: 5, opacity: 1 }}
           transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
           className="absolute right-[-15%] top-[40%] flex flex-col items-center pointer-events-none"
        >
          <span className="text-[10px] font-black text-[#B48529] tracking-widest mb-1 shadow-sm">PULL</span>
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#D4AF37] to-transparent"></div>
        </motion.div>
      )}
    </div>
  )
}

export default function GachaPage() {
  const router = useRouter();
  const { memberInfo, isDataReady } = useLiff();
  
  const [pool, setPool] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [tickets, setTickets] = useState(0);
  const [rollResults, setRollResults] = useState<any[] | null>(null);
  const [rollMode, setRollMode] = useState<1 | 10>(1);

  useEffect(() => {
    if (isDataReady && memberInfo) {
      setTickets(memberInfo.gacha_tickets || 0);
      fetchPool();
    }
  }, [isDataReady, memberInfo]);

  const fetchPool = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/gamification/gacha/pool?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setPool(data.pool);
      }
    } catch (e) {
      console.error('Failed to fetch gacha pool:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoll = async (count: number) => {
    if (tickets < count) {
      Swal.fire({
        icon: 'warning',
        title: 'ตั๋วไม่พอ',
        text: 'กรุณาร่วมแคมเปญเพื่อรับตั๋วเพิ่ม',
        confirmButtonColor: '#1A1A18'
      });
      return;
    }

    setRolling(true);
    setRollResults(null);
    try {
      const res = await fetch('/api/gamification/gacha/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberInfo?.id, rollCount: count })
      });
      const data = await res.json();
      
      // Simulate suspense animation
      setTimeout(() => {
        setRolling(false);
        if (data.success) {
          setRollResults(data.results);
          setTickets(data.tickets_remaining);
        } else {
          Swal.fire('ข้อผิดพลาด', data.error || 'เกิดข้อผิดพลาดในการสุ่ม', 'error');
        }
      }, 2000); // 2s spin

    } catch (e) {
      console.error(e);
      setRolling(false);
    }
  };

  const getRarityConfig = (tier: string) => {
    switch(tier) {
      case 'UR': return { color: 'text-[#D4AF37]', bg: 'bg-[#FCF7E8]', border: 'border-[#D4AF37]' };
      case 'SR': return { color: 'text-[#B48529]', bg: 'bg-[#F9F4E3]', border: 'border-[#B48529]' };
      case 'R': return { color: 'text-[#8C6D53]', bg: 'bg-[#F2ECE4]', border: 'border-[#8C6D53]' };
      default: return { color: 'text-[#1A1A18]', bg: 'bg-white', border: 'border-gray-200' };
    }
  };

  if (!isDataReady || loading) return <XYLLoader tagline="เตรียมระบบรางวัล..." />;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A18] font-sans pb-24 selection:bg-[#D4AF37] selection:text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <button 
            onClick={() => router.push('/liff/member')} 
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-transform text-[#1A1A18]"
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
            <h1 className="text-[14px] font-bold tracking-[0.2em] uppercase text-[#1A1A18]">Special Reward</h1>
        </div>
        <div className="w-auto flex justify-end">
            <div className="bg-white border border-[#D4AF37]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[14px] font-bold shadow-sm">
                <Ticket size={14} className="text-[#D4AF37]" /> 
                <span>{tickets}</span>
            </div>
        </div>
      </header>

      <main className="px-5 pt-8 max-w-lg mx-auto flex flex-col items-center">
        
        <div className="text-center mb-8">
            <h2 className="text-[24px] font-black tracking-widest uppercase mb-1">
                Gacha <span className="text-[#D4AF37]">Slot</span>
            </h2>
            <p className="text-gray-500 text-[13px] font-medium tracking-wide">ลุ้นรับของรางวัลและพอยท์พิเศษ</p>
        </div>

        {/* Clean Slot Machine */}
        <div className="mb-10 w-full flex justify-center">
            <SlotMachineSVG rolling={rolling} onPull={() => handleRoll(rollMode)} />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3 z-10 px-2">
            <button 
                disabled={rolling}
                onClick={() => setRollMode(1)}
                className={`flex-1 py-3.5 rounded-xl font-bold active:scale-95 transition-all text-[14px] flex flex-col items-center justify-center gap-0.5 ${rollMode === 1 ? 'bg-[#1A1A18] text-white shadow-lg shadow-black/10' : 'bg-white text-[#1A1A18] border border-gray-200'}`}
            >
                <span>หมุน 1 ครั้ง</span>
                <div className={`text-[10px] font-medium flex items-center gap-1 ${rollMode === 1 ? 'text-[#FCF7E8]/80' : 'text-gray-500'}`}>
                    ใช้ 1 <Ticket size={10} className={rollMode === 1 ? 'text-[#D4AF37]' : 'text-[#D4AF37]'} />
                </div>
            </button>
            <button 
                disabled={rolling}
                onClick={() => setRollMode(10)}
                className={`flex-1 py-3.5 rounded-xl font-bold active:scale-95 transition-all text-[14px] flex flex-col items-center justify-center gap-0.5 ${rollMode === 10 ? 'bg-[#1A1A18] text-white shadow-lg shadow-black/10' : 'bg-white text-[#1A1A18] border border-gray-200'}`}
            >
                <span>หมุน 10 ครั้ง</span>
                <div className={`text-[10px] font-medium tracking-wider ${rollMode === 10 ? 'text-[#FCF7E8]/80' : 'text-[#B48529]'}`}>
                    การันตี SR
                </div>
            </button>
        </div>

        {/* Pool Preview */}
        <div className="w-full mt-12 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-4 flex items-center gap-2">
                <Sparkles size={12} className="text-[#D4AF37]" /> ของรางวัลในตู้
            </h3>
            
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {pool.map(item => {
                    const cfg = getRarityConfig(item.rarity_tier);
                    return (
                        <div key={item.id} className={`shrink-0 w-[100px] p-3 rounded-xl border ${cfg.border} bg-white flex flex-col items-center text-center snap-center relative shadow-sm`}>
                            <div className={`text-[13px] font-black italic mb-2 ${cfg.color}`}>{item.rarity_tier}</div>
                            <div className="text-[11px] font-bold leading-snug text-[#1A1A18] line-clamp-2 h-8">{item.name}</div>
                            <div className={`text-[9px] font-bold mt-2 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{item.drop_rate_percentage}%</div>
                        </div>
                    );
                })}
            </div>
        </div>

      </main>

      {/* Results Modal */}
      <AnimatePresence>
        {rollResults && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#1A1A18]/40 backdrop-blur-md flex flex-col items-center justify-center p-5"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-gray-100"
                >
                    {/* Decorative Header */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] to-[#8A631B]"></div>
                    
                    <button 
                        onClick={() => setRollResults(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6 pt-4">
                        <div className="w-16 h-16 mx-auto mb-3 bg-[#FCF7E8] rounded-full flex items-center justify-center text-[#D4AF37]">
                            <Gift size={28} />
                        </div>
                        <h2 className="font-black text-[20px] text-[#1A1A18] tracking-widest uppercase">
                            Congratulations
                        </h2>
                        <p className="text-gray-500 text-[12px] mt-1 font-medium">คุณได้รับของรางวัล {rollResults.length} ชิ้น</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
                        {rollResults.map((res, idx) => {
                            const cfg = getRarityConfig(res.rarity_tier);
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.05) }}
                                    key={idx} 
                                    className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} bg-white shadow-sm`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black italic text-[14px] ${cfg.bg} ${cfg.color}`}>
                                        {res.rarity_tier}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="text-[13px] font-bold text-[#1A1A18] leading-snug">{res.name}</div>
                                        {res.value_points > 0 && res.reward_type === 'points' && (
                                            <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                +{res.value_points} พอยท์
                                            </div>
                                        )}
                                        {res.is_pity && (
                                            <span className="inline-block mt-1 text-[9px] bg-[#FCF7E8] text-[#B48529] px-1.5 py-0.5 rounded font-bold tracking-wider">
                                                GUARANTEED
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    <button 
                        onClick={() => setRollResults(null)}
                        className="w-full mt-6 py-3.5 bg-[#1A1A18] text-white rounded-xl font-bold text-[14px] active:scale-95 transition-transform"
                    >
                        รับรางวัล
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
