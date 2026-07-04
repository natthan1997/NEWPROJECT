
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, User, Info, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";

export default function LiffMemberPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [loading, setLoading] = useState(true);
  const [showBenefits, setShowBenefits] = useState(false);

  const t = {
    th: {
      loading: 'กำลังโหลดข้อมูล...',
      title: 'XYL Member',
      points: 'คะแนนของคุณ',
      rewardsCatalog: 'ของรางวัล',
      pointsHistory: 'ประวัติ',
      pointsToNextTier: 'คะแนนเพื่อเลื่อนระดับ',
      maxTier: 'คุณคือสมาชิกระดับสูงสุด',
      redeem: 'แลกรางวัล',
      noRewards: 'ยังไม่มีของรางวัลในขณะนี้',
      checkBackLater: 'โปรดกลับมาตรวจสอบใหม่ในภายหลัง',
      earnedPoints: 'ได้รับคะแนน',
      redeemedReward: 'แลกของรางวัล',
      noHistory: 'ยังไม่มีประวัติการใช้งาน',
      historyEmpty: 'ประวัติคะแนนของคุณจะแสดงที่นี่',
      pts: 'pts',
      benefitsTitle: 'สิทธิประโยชน์',
      close: 'ปิด',
      howToEarn: 'วิธีสะสมคะแนน',
      earnRule: 'ทุก 100 บาท = 1 คะแนน'
    },
    en: {
      loading: 'Loading data...',
      title: 'XYL Member',
      points: 'Your Points',
      rewardsCatalog: 'Rewards',
      pointsHistory: 'History',
      pointsToNextTier: 'points to',
      maxTier: 'Top Tier Achieved',
      redeem: 'Redeem',
      noRewards: 'No rewards available',
      checkBackLater: 'Please check back later.',
      earnedPoints: 'Earned Points',
      redeemedReward: 'Redeemed Reward',
      noHistory: 'No History',
      historyEmpty: 'Your points history will appear here.',
      pts: 'pts',
      benefitsTitle: 'Benefits',
      close: 'Close',
      howToEarn: 'How to earn',
      earnRule: '100 THB = 1 Point'
    },
    zh: {
      loading: '正在加载...',
      title: 'XYL 会员',
      points: '您的积分',
      rewardsCatalog: '奖励',
      pointsHistory: '历史',
      pointsToNextTier: '分升级至',
      maxTier: '最高等级',
      redeem: '兑换',
      noRewards: '暂无奖励',
      checkBackLater: '请稍后回来查看。',
      earnedPoints: '获得积分',
      redeemedReward: '兑换奖励',
      noHistory: '无历史记录',
      historyEmpty: '您的积分历史将显示在此处。',
      pts: '分',
      benefitsTitle: '会员权益',
      close: '关闭',
      howToEarn: '如何赚取',
      earnRule: '100 泰铢 = 1 积分'
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'];

  const [tiers, setTiers] = useState([
    { name: 'Bronze', minPoints: 0, bg: 'bg-[#F2ECE4]', text: 'text-[#8C6D53]', barColor: 'bg-[#C19A6B]', benefits: ['อัตราสะสมคะแนน 100 บาท = 1 คะแนน', 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน'] },
    { name: 'Silver', minPoints: 500, bg: 'bg-[#F0F2F5]', text: 'text-[#64748B]', barColor: 'bg-[#94A3B8]', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.'] },
    { name: 'Gold', minPoints: 2000, bg: 'bg-[#FCF7E8]', text: 'text-[#B48529]', barColor: 'bg-[#D4AF37]', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.'] },
    { name: 'Platinum', minPoints: 5000, bg: 'bg-[#EBF1F5]', text: 'text-[#3E6578]', barColor: 'bg-[#6495ED]', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.'] }
  ]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  
  const handlePlayMysteryBox = async () => {
    if ((memberInfo?.points || 0) < 50) {
      alert(locale === 'en' ? 'Not enough points (Requires 50 Pts)' : 'แต้มไม่พอ (ต้องใช้ 50 แต้ม)');
      return;
    }
    
    setIsPlayingBox(true);
    setMysteryBoxState('opening');
    
    try {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      const res = await fetch('/api/liff/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      const data = await res.json();
      
      if (data.success) {
        // Wait for animation
        setTimeout(() => {
          setMysteryBoxResult(data.wonPoints);
          setMysteryBoxState('result');
          fetchData(); // Refresh points
          setIsPlayingBox(false);
        }, 1500);
      } else {
        alert(data.error || 'Failed to play');
        setMysteryBoxState('idle');
        setShowMysteryBox(false);
        setIsPlayingBox(false);
      }
    } catch (e) {
      alert('Error connecting to server');
      setMysteryBoxState('idle');
      setShowMysteryBox(false);
      setIsPlayingBox(false);
    }
  };
  
const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) setMemberInfo(member);
      const { data: history } = await supabase.from('pos_points_history').select('*').eq('member_id', userId).order('created_at', { ascending: false });
      if (history) setPointsHistory(history);
      const { data: rewardsData } = await supabase.from('pos_rewards').select('*').eq('is_active', true).order('points_required', { ascending: true });
      if (rewardsData) setRewards(rewardsData);
      
      const { data: tiersData, error: tiersError } = await supabase.from('pos_loyalty_tiers').select('*').eq('is_active', true).order('min_points', { ascending: true });
      if (tiersData && !tiersError) {
        setTiers(tiersData.map(t => ({
          name: t.name, minPoints: t.min_points, bg: t.bg_color, text: t.text_color, barColor: t.bar_color, benefits: t.benefits
        })));
      }
      
      const { data: campData, error: campError } = await supabase.from('pos_campaigns').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (campData && !campError) {
        setCampaigns(campData);
      } else {
        // Fallback default campaigns if table not ready
        setCampaigns([
          { id: '1', title: 'ฝนตกรับคะแนน x2', description: 'รับคะแนนสองเท่าทุกออเดอร์ในวันฝนตก!', icon: '🌧️', type_tag: 'Flash Event', bg_gradient_from: 'from-[#EBF1F5]', bg_gradient_to: 'to-[#D6E4EE]', text_color: 'text-[#1F333C]', tag_color: 'text-[#3E6578]' },
          { id: '2', title: 'ลุ้นกล่องสุ่มทุก 50 Pts', description: 'สะสมครบทุก 50 คะแนน รับสิทธิ์เปิดกล่องสุ่มส่วนลด!', icon: '🎁', type_tag: 'Milestone', bg_gradient_from: 'from-[#FCF7E8]', bg_gradient_to: 'to-[#F5E6C4]', text_color: 'text-[#8B651B]', tag_color: 'text-[#B48529]' },
          { id: '3', title: 'รักษาสถานะของคุณ', description: 'อย่าลืมซื้อสินค้า 1 ชิ้นภายใน 30 วันเพื่อคงระดับ', icon: '⚠️', type_tag: 'Expiring Soon', bg_gradient_from: 'from-[#FFF0F0]', bg_gradient_to: 'to-[#FFE0E0]', text_color: 'text-[#B33535]', tag_color: 'text-[#D94C4C]' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!liffLoading) fetchData();
  }, [lineProfile, liffLoading]);

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={dict.loading} />;

  const totalAccumulated = memberInfo?.total_accumulated_points || memberInfo?.points || 0;
  let currentTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalAccumulated >= tiers[i].minPoints) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = tiers[currentTierIndex];
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const progressPercent = nextTier ? Math.min(100, Math.max(0, ((totalAccumulated - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)) : 100;

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/liff/menu');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans overflow-x-hidden pb-24 selection:bg-gray-200">
      
      {/* 📱 Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[15px] font-medium tracking-wide">{dict.title}</h1>
        <button onClick={() => setShowBenefits(true)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
          <Info size={20} strokeWidth={2} />
        </button>
      </header>

      <main className="px-5 py-6 space-y-8">
        
        {/* 💳 Clean Tier Card with Power Bar */}
        <section>
          <div className={`w-full rounded-2xl p-6 ${currentTier.bg} transition-colors duration-500`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-white/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                {lineProfile?.pictureUrl ? (
                  <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className={currentTier.text} />
                )}
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900 leading-tight">
                  {lineProfile?.displayName || 'Member'}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  ID: {memberInfo?.phone || lineProfile?.userId?.substring(0, 8)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <span className={`text-[13px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/50 ${currentTier.text}`}>
                  {currentTier.name}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[12px] text-gray-500 mb-1">{dict.points}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl font-medium tracking-tight text-gray-900`}>
                  {(memberInfo?.points || 0).toLocaleString()}
                </span>
                <span className="text-[14px] text-gray-500 font-medium">{dict.pts}</span>
              </div>
            </div>
            
            {/* THICK PROGRESS BAR (Power Bar) */}
            <div className="mt-8 bg-white/40 p-4 rounded-xl">
              {nextTier ? (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[12px] font-medium text-gray-600">{currentTier.name}</span>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{dict.pointsToNextTier} {nextTier.name}</span>
                      <span className="text-[14px] font-bold text-gray-900">{(nextTier.minPoints - totalAccumulated).toLocaleString()} {dict.pts}</span>
                    </div>
                  </div>
                  
                  {/* The actual Bar */}
                  <div className="h-3.5 w-full bg-black/10 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                      className={`h-full rounded-full ${currentTier.barColor} relative`}
                    >
                      {/* Shine effect on bar */}
                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30" />
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] text-gray-500 mt-2 font-medium">
                    <span>{currentTier.minPoints.toLocaleString()}</span>
                    <span>{nextTier.minPoints.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[13px] font-medium text-gray-700 text-center py-2 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {dict.maxTier}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 📢 Special Campaigns / Gamification Banners */}
        <section className="space-y-3">
          <h3 className="text-[14px] font-medium text-gray-900 px-1">{locale === 'en' ? 'Special Campaigns' : 'แคมเปญพิเศษ'}</h3>
          
          <div 
            className="flex gap-3 overflow-x-auto pb-4 snap-x -mx-5 px-5" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Custom style for webkit scrollbar hiding since tailwind plugin isn't active */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {campaigns.map((camp) => (
              <div 
                key={camp.id} 
                onClick={() => { if (camp.title.includes('กล่องสุ่ม')) setShowMysteryBox(true); }}
                className={`min-w-[240px] snap-center bg-gradient-to-br ${camp.bg_gradient_from} ${camp.bg_gradient_to} rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">{camp.icon}</div>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${camp.tag_color} bg-white/50 px-2 py-1 rounded-md mb-2 inline-block`}>
                    {camp.type_tag}
                  </span>
                  <h4 className={`text-[14px] font-semibold ${camp.text_color} leading-tight mb-1`}>{camp.title}</h4>
                  <p className={`text-[12px] ${camp.tag_color}`}>{camp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🪄 Minimal Tabs */}
        <section>
          <div className="flex border-b border-gray-100 mb-6">
            <button 
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 pb-3 text-[14px] font-medium transition-colors relative ${activeTab === 'rewards' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {dict.rewardsCatalog}
              {activeTab === 'rewards' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 pb-3 text-[14px] font-medium transition-colors relative ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {dict.pointsHistory}
              {activeTab === 'history' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'rewards' ? (
              <motion.div 
                key="rewards"
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {rewards.length > 0 ? rewards.map((reward) => (
                  <div key={reward.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {reward.image_url ? (
                        <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                      ) : (
                        <Gift size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-[14px] font-medium text-gray-900 leading-tight mb-1">{reward.title || reward.name}</h4>
                      <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">{reward.description}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-[13px] font-medium text-gray-900">{reward.points_required.toLocaleString()} {dict.pts}</span>
                        
                        <button 
                          disabled={(memberInfo?.points || 0) < reward.points_required}
                          className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                            (memberInfo?.points || 0) >= reward.points_required 
                            ? 'bg-gray-900 text-white hover:bg-gray-800' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {dict.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center">
                    <p className="text-[14px] text-gray-400 mb-1">{dict.noRewards}</p>
                    <p className="text-[13px] text-gray-300">{dict.checkBackLater}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        {item.type === 'earn' ? <TrendingUp size={18} /> : <Gift size={18} />}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">
                          {item.description || (item.type === 'earn' ? dict.earnedPoints : dict.redeemedReward)}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[14px] font-medium ${item.type === 'earn' ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <div className="py-16 text-center">
                    <p className="text-[14px] text-gray-400 mb-1">{dict.noHistory}</p>
                    <p className="text-[13px] text-gray-300">{dict.historyEmpty}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* 👑 Minimal Benefits Bottom Sheet */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-50">
                <h3 className="text-[16px] font-medium text-gray-900">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                
                {/* How to earn */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-2">{dict.howToEarn}</h4>
                  <p className="text-[16px] font-medium text-gray-900">{dict.earnRule}</p>
                </div>

                {/* Tiers List */}
                <div className="space-y-6">
                  {tiers.map((tier) => (
                    <div key={tier.name} className="flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${tier.bg} ${tier.text} text-[13px] font-bold uppercase tracking-wider`}>
                        {tier.name[0]}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <h4 className="text-[15px] font-medium text-gray-900">{tier.name}</h4>
                          <span className="text-[12px] text-gray-400">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                        </div>
                        <ul className="space-y-2">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                              <Check size={16} strokeWidth={2} className="text-gray-300 flex-shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🎁 MYSTERY BOX MODAL */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#1A1A18]/80 backdrop-blur-md" onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 overflow-hidden text-center shadow-2xl"
            >
              <button 
                onClick={() => setShowMysteryBox(false)} 
                disabled={mysteryBoxState === 'opening'}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
              >
                <X size={16} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <>
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner relative overflow-hidden">
                    <span className="relative z-10">🎁</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A18] tracking-tight mb-2">
                    {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มหรรษา'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back! (Up to 500 Pts)' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่ม ลุ้นรับแต้มคืนสูงสุด 500 แต้ม!'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-4 bg-[#1A1A18] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:bg-gray-300 shadow-xl"
                  >
                    {(memberInfo?.points || 0) < 50 ? (locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ') : (locale === 'en' ? 'Open Box (50 Pts)' : 'เปิดกล่อง (50 แต้ม)')}
                  </button>
                </>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-8">
                  <motion.div 
                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FCF7E8] to-[#F5E6C4] rounded-full flex items-center justify-center text-6xl shadow-xl"
                  >
                    🎁
                  </motion.div>
                  <h3 className="text-xl font-black text-[#1A1A18] tracking-tight mt-8 animate-pulse">
                    {locale === 'en' ? 'Opening...' : 'กำลังเปิดกล่อง...'}
                  </h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <>
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-28 h-28 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 relative"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl font-black"
                    >
                      {mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-2xl font-black text-[#1A1A18] tracking-tight mb-2">
                    {mysteryBoxResult > 50 ? (locale === 'en' ? 'JACKPOT!' : 'แจ็คพอตแตก!') : mysteryBoxResult === 50 ? (locale === 'en' ? 'Nice!' : 'ดีเลย!') : (locale === 'en' ? 'Ouch!' : 'ได้เกลือออ!')}
                  </h3>
                  <div className="text-emerald-500 font-black text-4xl mb-6 tracking-tighter">
                    +{mysteryBoxResult} <span className="text-xl">PTS</span>
                  </div>
                  <button
                    onClick={() => {
                      setMysteryBoxState('idle');
                      setShowMysteryBox(false);
                    }}
                    className="w-full py-4 bg-gray-100 text-[#1A1A18] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    {locale === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}