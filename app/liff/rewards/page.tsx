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
  const { lineProfile, loading: liffLoading } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) {
        setMemberInfo(member);
      }
      const { data: rewardsData } = await supabase.from('pos_loyalty_coupons').select('*').eq('is_active', true).order('cost_points', { ascending: true });
      if (rewardsData) setRewards(rewardsData);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liffLoading) fetchData();
  }, [lineProfile, liffLoading]);

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
        fetchData();
      } else {
        alert(data.error || 'Failed to redeem');
      }
    } catch (e) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if (liffLoading || loading) return <XYLLoader tagline="กำลังโหลดของรางวัล..." />;

  const filteredRewards = rewards.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

        {/* Rewards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredRewards.length > 0 ? filteredRewards.map((reward) => {
            const canRedeem = (memberInfo?.points || 0) >= reward.cost_points;
            return (
              <motion.div 
                whileTap={canRedeem ? { scale: 0.98 } : {}}
                key={reward.id} 
                className="bg-white border border-gray-100 rounded-[20px] overflow-hidden flex flex-col shadow-sm"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                    <Gift size={32} className="text-gray-400" />
                    
                    <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-bold text-[#1A1A18] uppercase tracking-wider shadow-sm">
                        REDEEM
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-[13px] font-medium text-gray-900 leading-tight mb-1 line-clamp-2 min-h-[38px]">{reward.name}</h4>
                    <p className="text-[11px] text-gray-500 mb-3">คูปองใช้กับทางร้าน</p>
                    
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
