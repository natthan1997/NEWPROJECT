'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, Target, CheckCircle2, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import Swal from 'sweetalert2';

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, memberInfo, isDataReady } = useLiff();
  
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'special'>('all');
  const [showRewardMotion, setShowRewardMotion] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  useEffect(() => {
    if (isDataReady && memberInfo?.id) {
      const cacheKey = `member-missions-${memberInfo.id}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setMissions(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}
      
      fetchMissions();
    }
  }, [isDataReady, memberInfo]);

  const fetchMissions = async () => {
    try {
      const res = await fetch(`/api/gamification/missions?memberId=${memberInfo?.id}`);
      const data = await res.json();
      if (data.success) {
        setMissions(data.missions);
        if (memberInfo?.id) {
          try {
            localStorage.setItem(`member-missions-${memberInfo.id}`, JSON.stringify(data.missions));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('Failed to fetch missions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (missionId: string) => {
    setClaiming(missionId);
    try {
      const res = await fetch('/api/gamification/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberInfo?.id, missionId })
      });
      const data = await res.json();
      if (data.success) {
        setRewardAmount(data.reward_tickets || 1);
        setShowRewardMotion(true);
        fetchMissions(); // refresh
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: data.error || 'ไม่สามารถรับรางวัลได้',
          confirmButtonColor: '#1A1A18'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(null);
    }
  };

  if (!isDataReady) return <XYLLoader tagline="กำลังโหลดข้อมูล..." />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <button 
            onClick={() => router.push('/liff/member')} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-95 transition-transform text-gray-600"
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
            <h1 className="text-[16px] font-bold tracking-widest text-[#1A1A18]">ภารกิจและแคมเปญ</h1>
        </div>
        <button 
            onClick={() => router.push('/liff/member/gacha')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FCF7E8] text-[#B48529] rounded-full active:scale-95 transition-transform shadow-sm border border-[#F4E9D8]"
        >
            <Ticket size={16} />
            <span className="font-black text-[13px]">{memberInfo?.gacha_tickets || 0}</span>
        </button>
      </header>

      <main className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-6">
        




        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-[#1A1A18] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              รายวัน
            </button>
            <button 
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'weekly' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              รายสัปดาห์
            </button>
            <button 
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              รายเดือน
            </button>
            <button 
              onClick={() => setActiveTab('special')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'special' ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              พิเศษ
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {loading && missions.length === 0 ? (
              // Skeleton Loader
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="bg-gray-100 h-6 w-16 rounded"></div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"></div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-xl w-full mt-2"></div>
                </div>
              ))
            ) : missions.filter(m => activeTab === 'all' || (m.campaign_type || 'weekly') === activeTab).length === 0 ? (
              <div className="text-center py-10 text-gray-400">ไม่มีแคมเปญในหมวดหมู่นี้</div>
            ) : (
              missions.filter(m => activeTab === 'all' || (m.campaign_type || 'weekly') === activeTab).map((mission) => {
                const targetValue = mission.condition_rules?.count || mission.condition_rules?.targetValue || 1;
                const currentValue = mission.progress?.count || mission.progress?.currentValue || 0;
                const progressPercent = Math.min(100, (currentValue / targetValue) * 100);
                
                return (
                  <div key={mission.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-[15px]">{mission.title}</h3>
                        <p className="text-[12px] text-gray-500 mt-1">{mission.description}</p>
                      </div>
                      <div className="bg-[#FCF7E8] text-[#B48529] px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2">
                        <Gift size={12} /> +{mission.reward_tickets} ตั๋ว
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                        <span>ความคืบหน้า</span>
                        <span>{currentValue} / {targetValue}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {mission.is_completed ? (
                      mission.claimed_at ? (
                         <div className="w-full py-2 bg-green-50 text-green-600 rounded-lg text-center text-[13px] font-bold flex justify-center items-center gap-1">
                           <CheckCircle2 size={16} /> ได้รับตั๋วรางวัลแล้ว
                         </div>
                      ) : (
                        <button 
                          disabled={claiming === mission.id}
                          onClick={() => handleClaim(mission.id)}
                          className="w-full py-2 bg-[#1A1A18] text-white rounded-lg text-[13px] font-bold active:scale-95 transition-transform"
                        >
                          {claiming === mission.id ? 'กำลังรับรางวัล...' : 'รับรางวัลเลย!'}
                        </button>
                      )
                    ) : (
                      <div className="w-full py-2 bg-gray-50 text-gray-400 rounded-lg text-center text-[13px] font-medium">
                        ยังทำไม่สำเร็จ
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

      </main>

      {/* Ticket Reward Motion Overlay */}
      <AnimatePresence>
        {showRewardMotion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white p-8 rounded-[32px] text-center max-w-[280px] w-full shadow-2xl border border-gray-100 flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-[#FCF7E8] text-[#B48529] rounded-full flex items-center justify-center mb-4 shadow-inner"
              >
                <Ticket size={40} />
              </motion.div>
              <h2 className="text-[20px] font-bold text-[#1A1A18] mb-1">ยินดีด้วย!</h2>
              <p className="text-[13px] text-gray-500 mb-6">คุณได้รับตั๋วกาชาเพิ่ม <span className="font-bold text-[#B48529]">+{rewardAmount} ใบ</span></p>
              
              <button 
                onClick={() => setShowRewardMotion(false)}
                className="w-full py-3 bg-[#1A1A18] text-white rounded-full text-[14px] font-bold active:scale-95 transition-transform"
              >
                ยอดเยี่ยม
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
