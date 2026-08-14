'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Gift, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';

export default function RewardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, memberInfo: ctxMemberInfo, isDataReady } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(ctxMemberInfo || null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isDataReady);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (ctxMemberInfo) {
      setMemberInfo(ctxMemberInfo);
    }
  }, [ctxMemberInfo]);

  const isBirthdayMonth = React.useMemo(() => {
    const dobStr = memberInfo?.date_of_birth || memberInfo?.dateOfBirth;
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    return dob.getMonth() === today.getMonth();
  }, [memberInfo]);

  const fetchData = async (isBackgroundSync = false) => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      if (!isBackgroundSync) setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) {
        setMemberInfo(member);
      }
      const { data: rewardsData } = await supabase.from('pos_loyalty_coupons').select('*').eq('is_active', true).eq('is_gacha_only', false).order('cost_points', { ascending: true });
      if (rewardsData) setRewards(rewardsData);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liffLoading) fetchData(isDataReady);
  }, [lineProfile, liffLoading, isDataReady]);

  const handleRedeem = async (couponId: string) => {
    if (!confirm('ยืนยันการแลกคูปองนี้ใช่หรือไม่?')) return;
    try {
      setLoading(true);
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      const res = await fetch('/api/liff/member/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: userId, couponId })
      });
      const data = await res.json();
      if (data.success) {
        alert('แลกคูปองสำเร็จ! คูปองถูกเก็บไว้ในบัญชีของคุณแล้ว');
        fetchData(true);
      } else {
        alert(data.error || 'Failed to redeem');
      }
    } catch (e) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if ((liffLoading || loading) && !isDataReady) return <XYLLoader tagline="กำลังโหลดของรางวัล..." />;

  const filteredRewards = rewards.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const birthdayRewards = filteredRewards.filter(r => r.is_birthday_only);
  const generalRewards = filteredRewards.filter(r => !r.is_birthday_only);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24">
      
      {/* 📱 Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => router.push('/liff/member')} className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[14px] font-bold tracking-widest text-[#1A1A18] uppercase">XYL STUDIO</h1>
        <div className="w-6"></div>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-6">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="ค้นหาของรางวัล" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-full pl-11 pr-4 py-3 text-[14px] focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 shadow-sm"
          />
        </div>

        {/* Birthday Rewards Grid */}
        {isBirthdayMonth && birthdayRewards.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Gift size={16} className="text-pink-500" />
              <span>สิทธิพิเศษเฉพาะเดือนเกิดของคุณ 🎂</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {birthdayRewards.map((reward) => {
                const canRedeem = (memberInfo?.points || 0) >= reward.cost_points;
                return (
                  <motion.div 
                    whileTap={canRedeem ? { scale: 0.98 } : {}}
                    key={reward.id} 
                    className="bg-white border border-pink-100 rounded-[20px] overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(236,72,153,0.08)] relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-amber-300 z-10"></div>
                    <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden group">
                        {reward.image_url ? (
                          <img 
                            src={reward.image_url} 
                            alt={reward.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Gift size={32} className="text-pink-300" />
                        )}
                        <div className="absolute top-2 right-2 bg-pink-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                            BIRTHDAY
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col relative">
                        <h4 className="text-[13px] font-bold text-pink-600 leading-tight mb-1 line-clamp-2 min-h-[38px]">{reward.name}</h4>
                        <p className="text-[10px] text-gray-500 mb-3 line-clamp-1">{reward.description || 'คูปองเดือนเกิด'}</p>
                        
                        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className={`text-[15px] font-black ${canRedeem ? 'text-[#1A1A18]' : 'text-gray-400'}`}>
                                {reward.cost_points.toLocaleString()} <span className="text-[10px] font-medium">พอยท์</span>
                            </span>
                        </div>
                        
                        <button 
                            onClick={() => handleRedeem(reward.id)}
                            disabled={!canRedeem}
                            className={`w-full mt-3 py-2 rounded-xl text-[12px] font-bold transition-all ${
                                canRedeem ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-lg shadow-pink-500/30' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            แลกรับสิทธิ์
                        </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* General Rewards Grid */}
        <h2 className="text-[14px] font-bold text-gray-900 mb-1">ของรางวัลทั้งหมด</h2>
        <div className="grid grid-cols-2 gap-4">
          {generalRewards.length > 0 ? generalRewards.map((reward) => {
            const canRedeem = (memberInfo?.points || 0) >= reward.cost_points;
            return (
              <motion.div 
                whileTap={canRedeem ? { scale: 0.98 } : {}}
                key={reward.id} 
                className="bg-white border border-gray-100 rounded-[20px] overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden group">
                    {reward.image_url ? (
                      <img 
                        src={reward.image_url} 
                        alt={reward.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Gift size={32} className="text-gray-400" />
                    )}
                    
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-bold text-[#1A1A18] uppercase tracking-wider shadow-sm">
                        REDEEM
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-[13px] font-medium text-gray-900 leading-tight mb-1 line-clamp-2 min-h-[38px]">{reward.name}</h4>
                    <p className="text-[11px] text-gray-500 mb-3">{reward.description || 'คูปองใช้กับทางร้าน'}</p>
                    
                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                        <span className={`text-[15px] font-bold ${canRedeem ? 'text-[#1A1A18]' : 'text-gray-400'}`}>
                            {reward.cost_points.toLocaleString()} <span className="text-[10px] font-medium">พอยท์</span>
                        </span>
                    </div>
                    
                    <button 
                        onClick={() => handleRedeem(reward.id)}
                        disabled={!canRedeem}
                        className={`w-full mt-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                            canRedeem ? 'bg-[#1A1A18] text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        แลกรับส่วนลด
                    </button>
                </div>
              </motion.div>
            );
          }) : (
            <div className="col-span-2 py-20 text-center text-gray-400 text-[13px]">
              ไม่พบของรางวัล
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
