'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Gift, Coins, Sparkles, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';

export default function MysteryBoxPage() {
    const router = useRouter();
    const { isDataReady, lineProfile } = useLiff();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [points, setPoints] = useState(0);
    const [reward, setReward] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const COST = 50;

    useEffect(() => {
        if (!isDataReady) return;
        if (!lineProfile?.userId) {
            setLoading(false);
            return;
        }

        const fetchPoints = async () => {
            try {
                const { data } = await supabase
                    .from('pos_members')
                    .select('points')
                    .eq('line_user_id', lineProfile.userId)
                    .single();
                
                if (data) {
                    setPoints(data.points || 0);
                }
            } catch (err) {
                console.error("Error fetching points:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, [isDataReady, lineProfile]);

    const handlePlay = async () => {
        if (points < COST) return;
        if (!lineProfile?.userId) return;

        setPlaying(true);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/liff/mystery-box', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: lineProfile.userId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'เกิดข้อผิดพลาด');
            }

            // Simulate suspense for animation
            setTimeout(() => {
                setReward(data.wonPoints);
                setPoints(data.newTotal);
                setPlaying(false);
            }, 2000);

        } catch (err: any) {
            setErrorMsg(err.message);
            setPlaying(false);
        }
    };

    if (!isDataReady || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <XYLLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24 relative overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="px-4 py-4 flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/liff/member')}
                        className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[14px] font-black tracking-widest text-[#1A1A18]">MYSTERY BOX</span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wider">กล่องสุ่มหรรษา</span>
                    </div>
                    <div className="w-10 h-10"></div>
                </div>
            </div>

            {/* Current Points Bar */}
            <div className="px-5 py-4">
                <div className="bg-emerald-50 rounded-[16px] p-4 flex items-center justify-between border border-emerald-100/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <Coins size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-widest mb-0.5">พอยท์ของคุณ</p>
                            <p className="text-[18px] font-black text-emerald-700 leading-none">{points} <span className="text-[12px] font-semibold">Pts</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="px-5 py-10 flex flex-col items-center justify-center relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -z-10"></div>

                <AnimatePresence mode="wait">
                    {!reward ? (
                        <motion.div 
                            key="box"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0, y: 50 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div 
                                animate={playing ? {
                                    y: [0, -20, 0, -20, 0],
                                    rotate: [0, -5, 5, -5, 0],
                                    scale: [1, 1.1, 1, 1.1, 1]
                                } : {
                                    y: [0, -10, 0]
                                }}
                                transition={playing ? {
                                    duration: 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                } : {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-48 h-48 mb-8 relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-[32px] shadow-lg shadow-[#F5E6C4]/50 flex items-center justify-center border border-[#F5E6C4]">
                                    <Gift size={80} className="text-[#8B651B]" />
                                </div>
                            </motion.div>

                            <div className="text-center mb-8">
                                <h2 className="text-[24px] font-black text-[#1A1A18] mb-2">เสี่ยงโชคกล่องสุ่ม</h2>
                                <p className="text-gray-500 text-[14px]">ใช้ {COST} คะแนน เพื่อลุ้นรับคะแนนโบนัสสูงสุดถึง 500 Pts!</p>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-[13px] flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {errorMsg}
                                </div>
                            )}

                            <button 
                                onClick={handlePlay}
                                disabled={playing || points < COST}
                                className={`w-full max-w-[280px] h-14 rounded-full flex items-center justify-center gap-2 text-[15px] font-bold tracking-wider transition-all
                                    ${points >= COST 
                                        ? 'bg-[#1A1A18] text-white shadow-xl shadow-black/10 active:scale-95' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {playing ? (
                                    <>กำลังเปิดกล่อง...</>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        เปิดกล่องสุ่ม ({COST} Pts)
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="reward"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div 
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-48 h-48 mb-8 relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[32px] shadow-2xl shadow-emerald-500/30 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <p className="text-[14px] font-bold uppercase tracking-widest mb-1 opacity-80">ได้รับ</p>
                                        <p className="text-[54px] font-black leading-none drop-shadow-md">+{reward}</p>
                                        <p className="text-[12px] font-bold mt-1 opacity-80 uppercase tracking-widest">Points</p>
                                    </div>
                                </div>
                                {/* Sparkles Around */}
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-10 -z-10">
                                    <div className="absolute top-0 left-1/2 text-emerald-400"><Sparkles size={24} /></div>
                                    <div className="absolute bottom-0 right-1/4 text-yellow-400"><Sparkles size={20} /></div>
                                    <div className="absolute top-1/4 -left-4 text-emerald-300"><Sparkles size={16} /></div>
                                </motion.div>
                            </motion.div>

                            <div className="text-center mb-10">
                                <h2 className="text-[24px] font-black text-emerald-600 mb-2">ยินดีด้วย! 🎉</h2>
                                <p className="text-gray-500 text-[14px]">คะแนนโบนัสถูกเพิ่มเข้าบัญชีของคุณเรียบร้อยแล้ว</p>
                            </div>

                            <div className="flex gap-3 w-full max-w-[280px]">
                                <button 
                                    onClick={() => setReward(null)}
                                    disabled={points < COST}
                                    className={`flex-1 h-12 rounded-full font-bold text-[14px] transition-all
                                        ${points >= COST 
                                            ? 'bg-emerald-50 text-emerald-600 active:scale-95' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    เล่นอีกครั้ง
                                </button>
                                <button 
                                    onClick={() => router.push('/liff/member')}
                                    className="flex-1 h-12 rounded-full bg-[#1A1A18] text-white font-bold text-[14px] active:scale-95 transition-all shadow-xl shadow-black/10"
                                >
                                    กลับหน้าแรก
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
