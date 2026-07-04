import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
const content = `
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, User, Clock, Info, X, CheckCircle2, Sparkles, MoveRight
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";

// --- Framer Motion Number Counter ---
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="inline-block"
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

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

  // For header blur on scroll
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], [0, 1]);

  const t = {
    th: {
      loading: 'เตรียมพบกับประสบการณ์สุดพิเศษ...',
      title: 'XYL PRIVILEGE',
      points: 'คะแนนสะสม',
      rewardsCatalog: 'แลกของรางวัล',
      pointsHistory: 'ประวัติคะแนน',
      pointsToNextTier: 'คะแนนสู่ระดับ',
      maxTier: 'คุณคือสมาชิกระดับสูงสุดของเรา',
      redeem: 'แลกรางวัล',
      noRewards: 'กำลังเตรียมของรางวัลสุดพิเศษ',
      checkBackLater: 'โปรดติดตามของรางวัลใหม่ในเร็วๆ นี้',
      earnedPoints: 'ได้รับคะแนน',
      redeemedReward: 'แลกของรางวัล',
      noHistory: 'ยังไม่มีประวัติ',
      historyEmpty: 'ประวัติคะแนนของคุณจะแสดงที่นี่',
      pts: 'PTS',
      benefitsTitle: 'สิทธิประโยชน์สมาชิก',
      close: 'ปิด',
      howToEarn: 'การสะสมคะแนน',
      earnRule: 'ทุกยอดสั่งซื้อ 100 บาท = 1 คะแนน'
    },
    en: {
      loading: 'Preparing your exclusive experience...',
      title: 'XYL PRIVILEGE',
      points: 'Available Points',
      rewardsCatalog: 'Rewards',
      pointsHistory: 'History',
      pointsToNextTier: 'points to',
      maxTier: 'Top Tier Achieved',
      redeem: 'Redeem',
      noRewards: 'Curating exclusive rewards',
      checkBackLater: 'Stay tuned for upcoming rewards.',
      earnedPoints: 'Earned Points',
      redeemedReward: 'Redeemed Reward',
      noHistory: 'No History',
      historyEmpty: 'Your points activity will appear here.',
      pts: 'PTS',
      benefitsTitle: 'Member Privileges',
      close: 'Close',
      howToEarn: 'How to earn',
      earnRule: 'Every 100 THB spent = 1 Point'
    },
    zh: {
      loading: '准备您的专属体验...',
      title: 'XYL 特权',
      points: '可用积分',
      rewardsCatalog: '兑换奖励',
      pointsHistory: '积分历史',
      pointsToNextTier: '分升级至',
      maxTier: '尊贵最高等级',
      redeem: '兑换',
      noRewards: '正在准备独家奖励',
      checkBackLater: '敬请期待即将推出的奖励。',
      earnedPoints: '获得积分',
      redeemedReward: '已兑换奖励',
      noHistory: '无历史记录',
      historyEmpty: '您的积分活动将显示在此处。',
      pts: '分',
      benefitsTitle: '会员特权',
      close: '关闭',
      howToEarn: '如何赚取',
      earnRule: '每消费 100 泰铢 = 1 积分'
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'];

  const TIERS = [
    { 
      name: 'Bronze', minPoints: 0, 
      gradient: 'from-[#b45309] via-[#d97706] to-[#f59e0b]', 
      shadow: 'shadow-orange-900/20',
      text: 'text-orange-50', 
      icon: '🥉',
      benefits: ['อัตราสะสมคะแนน 1x']
    },
    { 
      name: 'Silver', minPoints: 500, 
      gradient: 'from-[#475569] via-[#94a3b8] to-[#cbd5e1]', 
      shadow: 'shadow-slate-900/20',
      text: 'text-slate-900', 
      icon: '🥈',
      benefits: ['อัตราสะสมคะแนน 1.2x', 'เครื่องดื่มฟรีวันเกิด']
    },
    { 
      name: 'Gold', minPoints: 2000, 
      gradient: 'from-[#ca8a04] via-[#facc15] to-[#fef08a]', 
      shadow: 'shadow-yellow-900/20',
      text: 'text-yellow-950', 
      icon: '🥇',
      benefits: ['อัตราสะสมคะแนน 1.5x', 'ส่วนลด 5% ทุกออเดอร์', 'เค้กและเครื่องดื่มฟรีวันเกิด']
    },
    { 
      name: 'Platinum', minPoints: 5000, 
      gradient: 'from-[#0369a1] via-[#38bdf8] to-[#bae6fd]', 
      shadow: 'shadow-sky-900/20',
      text: 'text-sky-950', 
      icon: '💎',
      benefits: ['อัตราสะสมคะแนน 2.0x', 'ส่วนลด 10% ทุกออเดอร์', 'ฟรี Exclusive Workshop ประจำปี']
    }
  ];

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
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalAccumulated >= TIERS[i].minPoints) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = TIERS[currentTierIndex];
  const nextTier = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;
  const progressPercent = nextTier ? Math.min(100, Math.max(0, ((totalAccumulated - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)) : 100;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden relative pb-24">
      
      {/* 🔮 Animated Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-900/30 blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/20 blur-[120px]"
        />
      </div>

      {/* 📱 Glass Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <motion.div style={{ opacity: headerOpacity }} className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-white/80 hover:text-white rounded-full transition-colors active:scale-95">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[14px] font-bold tracking-[0.2em] text-white uppercase">{dict.title}</h1>
          <button onClick={() => setShowBenefits(true)} className="p-2 -mr-2 text-white/80 hover:text-white rounded-full transition-colors active:scale-95">
            <Info size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-2 space-y-8">
        
        {/* 💳 Holographic Tier Card */}
        <section>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="group relative perspective-1000"
          >
            <div className={\`relative w-full aspect-[1.6/1] rounded-[28px] p-6 overflow-hidden bg-gradient-to-br \${currentTier.gradient} shadow-2xl \${currentTier.shadow}\`}>
              
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-50 transform -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 blur-3xl rounded-full -mr-20 -mt-20 mix-blend-overlay"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 blur-2xl rounded-full -ml-10 -mb-10 mix-blend-overlay"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 overflow-hidden flex items-center justify-center p-[1px] shadow-inner">
                      {lineProfile?.pictureUrl ? (
                        <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User size={20} className={currentTier.text} />
                      )}
                    </div>
                    <div>
                      <h2 className={\`text-[15px] font-bold tracking-wide \${currentTier.text} drop-shadow-sm\`}>
                        {lineProfile?.displayName || 'MEMBER'}
                      </h2>
                      <p className={\`text-[10px] font-bold tracking-widest opacity-70 uppercase \${currentTier.text}\`}>
                        ID: {memberInfo?.phone || lineProfile?.userId?.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-2xl drop-shadow-md filter">{currentTier.icon}</span>
                    <span className={\`text-[12px] font-black tracking-widest uppercase mt-1 \${currentTier.text} drop-shadow-sm\`}>{currentTier.name}</span>
                  </div>
                </div>

                <div className="mt-auto">
                   <p className={\`text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1 \${currentTier.text}\`}>{dict.points}</p>
                   <div className="flex items-end gap-1.5 leading-none">
                     <span className={\`text-[48px] font-black tracking-tighter drop-shadow-lg \${currentTier.text}\`}>
                       <AnimatedNumber value={memberInfo?.points || 0} />
                     </span>
                     <span className={\`text-[12px] font-bold opacity-80 mb-2 \${currentTier.text}\`}>{dict.pts}</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Progress to Next Tier */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 px-2"
          >
            {nextTier ? (
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-white/60 mb-2 uppercase tracking-wide">
                  <span>{totalAccumulated.toLocaleString()} {dict.pts}</span>
                  <span className="text-white/90">{nextTier.name} ({nextTier.minPoints.toLocaleString()})</span>
                </div>
                <div className="h-[4px] w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: \`\${progressPercent}%\` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-white/40 to-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] relative"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white blur-sm"></div>
                  </motion.div>
                </div>
                <p className="text-center text-[11px] mt-3 font-medium text-white/50">
                  {dict.pointsToNextTier} <span className="text-white font-bold">{nextTier.name}</span> : <span className="text-emerald-400 font-bold">{(nextTier.minPoints - totalAccumulated).toLocaleString()}</span> {dict.pts}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-[12px] font-bold py-3 bg-emerald-950/30 rounded-2xl border border-emerald-900/50 backdrop-blur-sm">
                <Sparkles size={16} />
                {dict.maxTier}
              </div>
            )}
          </motion.div>
        </section>

        {/* 🪄 Floating Tab Menu */}
        <section className="space-y-6">
           <div className="relative flex p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px]">
              {/* Active Tab Background */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 left-1.5 bg-white/10 rounded-[14px] shadow-lg border border-white/10 backdrop-blur-md"
                initial={false}
                animate={{
                  width: 'calc(50% - 6px)',
                  x: activeTab === 'rewards' ? '0%' : '100%',
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
              
              <button 
                onClick={() => setActiveTab('rewards')}
                className={\`relative z-10 flex-1 py-3 px-4 rounded-[14px] text-[13px] font-bold transition-colors \${activeTab === 'rewards' ? 'text-white' : 'text-white/40 hover:text-white/70'}\`}
              >
                {dict.rewardsCatalog}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={\`relative z-10 flex-1 py-3 px-4 rounded-[14px] text-[13px] font-bold transition-colors \${activeTab === 'history' ? 'text-white' : 'text-white/40 hover:text-white/70'}\`}
              >
                {dict.pointsHistory}
              </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'rewards' ? (
               <motion.div 
                 key="rewards"
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}
                 className="grid grid-cols-1 gap-4"
               >
                 {rewards.length > 0 ? rewards.map((reward, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     key={reward.id} 
                     className="group bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md rounded-[24px] p-4 flex gap-4 items-center border border-white/5 transition-all"
                   >
                      <div className="w-[88px] h-[88px] bg-black/40 rounded-[18px] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 z-10 pointer-events-none" />
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <Gift size={28} className="text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 py-1 pr-1 flex flex-col justify-between h-full">
                        <div>
                          <h4 className="text-[15px] font-bold text-white tracking-tight leading-snug">{reward.title || reward.name}</h4>
                          <p className="text-[12px] text-white/50 mt-1 line-clamp-1">{reward.description}</p>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                             <span className="text-[13px] font-black tracking-widest text-emerald-400">{reward.points_required.toLocaleString()} <span className="text-[10px] text-emerald-400/70">PTS</span></span>
                          </div>
                          
                          <button 
                             disabled={(memberInfo?.points || 0) < reward.points_required}
                            className={\`h-8 px-4 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all \${
                              (memberInfo?.points || 0) >= reward.points_required 
                              ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                              : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }\`}
                          >
                            {dict.redeem}
                          </button>
                        </div>
                      </div>
                   </motion.div>
                 )) : (
                   <div className="py-20 text-center bg-white/[0.02] backdrop-blur-md rounded-[32px] border border-white/5">
                      <div className="w-16 h-16 bg-white/5 text-white/30 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Gift size={28} />
                      </div>
                      <h3 className="text-[16px] font-bold text-white mb-2">{dict.noRewards}</h3>
                      <p className="text-[13px] text-white/50">{dict.checkBackLater}</p>
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div 
                 key="history"
                 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                 className="space-y-3"
               >
                 {pointsHistory.length > 0 ? pointsHistory.map((item, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                     key={item.id} 
                     className="bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-md rounded-[20px] p-4 flex justify-between items-center border border-white/5 transition-colors"
                   >
                     <div className="flex gap-4 items-center">
                        <div className={\`w-12 h-12 rounded-full flex items-center justify-center border \${item.type === 'earn' ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400' : 'bg-orange-950/50 border-orange-900/50 text-orange-400'}\`}>
                           {item.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-white/90 leading-tight">
                             {item.description || (item.type === 'earn' ? dict.earnedPoints : dict.redeemedReward)}
                          </h4>
                          <p className="text-[11px] text-white/40 mt-1.5 flex items-center gap-1 font-medium tracking-wide uppercase">
                             {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className={\`text-[16px] font-black tracking-widest \${item.type === 'earn' ? 'text-emerald-400' : 'text-white'}\`}>
                          {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                       </span>
                       <span className="text-[9px] text-white/40 font-bold uppercase mt-0.5">PTS</span>
                     </div>
                   </motion.div>
                 )) : (
                   <div className="py-20 text-center bg-white/[0.02] backdrop-blur-md rounded-[32px] border border-white/5">
                      <div className="w-16 h-16 bg-white/5 text-white/30 rounded-full flex items-center justify-center mx-auto mb-5">
                        <History size={28} />
                      </div>
                      <h3 className="text-[16px] font-bold text-white mb-2">{dict.noHistory}</h3>
                      <p className="text-[13px] text-white/50">{dict.historyEmpty}</p>
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </section>
      </main>

      {/* 👑 Benefits Modal (Ultra Premium Glass Sheet) */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-2xl rounded-t-[36px] shadow-2xl border-t border-white/10 max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-[#121212]/80 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-white/5">
                <h3 className="text-[16px] font-extrabold tracking-widest uppercase text-white">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                
                {/* How to earn */}
                <div className="relative overflow-hidden rounded-[24px] p-6 border border-emerald-500/20 bg-emerald-950/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <h4 className="text-[12px] font-bold tracking-widest uppercase text-emerald-400 mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> {dict.howToEarn}
                    </h4>
                    <p className="text-[16px] font-medium text-emerald-50/90 leading-relaxed">{dict.earnRule}</p>
                  </div>
                </div>

                {/* Tiers List */}
                <div className="space-y-6">
                  {TIERS.map((tier, idx) => (
                    <div key={tier.name} className="relative">
                      
                      <div className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
                        {/* Tier Glow */}
                        <div className={\`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 bg-gradient-to-br \${tier.gradient}\`} />
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl drop-shadow-lg">{tier.icon}</span>
                              <div>
                                <h4 className={\`text-[16px] font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r \${tier.gradient}\`}>{tier.name}</h4>
                                <p className="text-[11px] text-white/40 font-medium mt-0.5 tracking-wide">{tier.minPoints.toLocaleString()} PTS REQUIRED</p>
                              </div>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {tier.benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-3 text-[13px] text-white/70 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Required style for shimmer animation */}
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      \`}} />
    </div>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Redesigned LiffMemberPage V4 (Holographic / Dark Mode / Apple Wallet Style)');
