import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
const content = `
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  History, 
  Gift, 
  TrendingUp, 
  Award,
  User,
  Clock,
  Leaf,
  Info,
  X,
  CheckCircle2,
  Sparkles
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

  // --- i18n Dictionary ---
  const t = {
    th: {
      loading: 'กำลังตรวจสอบสิทธิประโยชน์ของคุณ...',
      title: 'XYL MEMBER',
      member: 'Member',
      points: 'คะแนนสะสมของคุณ',
      rewardsCatalog: 'แลกของรางวัล',
      pointsHistory: 'ประวัติคะแนน',
      pointsToNextTier: 'คะแนนเพื่อเลื่อนระดับ',
      maxTier: 'คุณอยู่ระดับสูงสุดแล้ว',
      redeem: 'แลกรางวัล',
      noRewards: 'ยังไม่มีของรางวัล',
      checkBackLater: 'โปรดกลับมาตรวจสอบของรางวัลใหม่ในภายหลัง',
      earnedPoints: 'ได้รับคะแนน',
      redeemedReward: 'แลกของรางวัล',
      noHistory: 'ไม่มีประวัติ',
      historyEmpty: 'ประวัติคะแนนของคุณจะแสดงที่นี่',
      pts: 'แต้ม',
      benefitsTitle: 'สิทธิประโยชน์สมาชิก',
      close: 'ปิด',
      howToEarn: 'วิธีสะสมคะแนน',
      earnRule: 'ทุกยอดสั่งซื้อ 100 บาท = 1 คะแนน'
    },
    en: {
      loading: 'Checking your benefits...',
      title: 'XYL MEMBER',
      member: 'Member',
      points: 'Your Points',
      rewardsCatalog: 'Rewards',
      pointsHistory: 'History',
      pointsToNextTier: 'points to',
      maxTier: 'Max Tier Achieved',
      redeem: 'Redeem',
      noRewards: 'No Rewards Yet',
      checkBackLater: 'Check back later for exclusive rewards.',
      earnedPoints: 'Earned Points',
      redeemedReward: 'Redeemed Reward',
      noHistory: 'No History',
      historyEmpty: 'Your points activity will appear here.',
      pts: 'PTS',
      benefitsTitle: 'Member Benefits',
      close: 'Close',
      howToEarn: 'How to earn points',
      earnRule: 'Every 100 THB spent = 1 Point'
    },
    zh: {
      loading: '正在检查您的福利...',
      title: 'XYL 会员',
      member: '会员',
      points: '您的积分',
      rewardsCatalog: '兑换奖励',
      pointsHistory: '积分历史',
      pointsToNextTier: '分升级至',
      maxTier: '已达到最高等级',
      redeem: '兑换',
      noRewards: '暂无奖励',
      checkBackLater: '请稍后回来查看独家奖励。',
      earnedPoints: '获得积分',
      redeemedReward: '已兑换奖励',
      noHistory: '无历史记录',
      historyEmpty: '您的积分活动将显示在此处。',
      pts: '分',
      benefitsTitle: '会员特权',
      close: '关闭',
      howToEarn: '如何赚取积分',
      earnRule: '每消费 100 泰铢 = 1 积分'
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'];

  // Define Tiers with translations
  const getTiers = (loc: string) => [
    { 
      name: 'Bronze', minPoints: 0, 
      cardBg: 'bg-gradient-to-br from-[#CD7F32] via-[#A0522D] to-[#8B4513]', 
      textColor: 'text-orange-50', 
      icon: '🥉',
      benefits: ['อัตราสะสมคะแนนปกติ']
    },
    { 
      name: 'Silver', minPoints: 500, 
      cardBg: 'bg-gradient-to-br from-[#E0E0E0] via-[#9E9E9E] to-[#757575]', 
      textColor: 'text-gray-900', 
      icon: '🥈',
      benefits: ['อัตราสะสมคะแนน x1.2', 'คูปองเครื่องดื่มฟรีวันเกิด']
    },
    { 
      name: 'Gold', minPoints: 2000, 
      cardBg: 'bg-gradient-to-br from-[#FFD700] via-[#DAA520] to-[#B8860B]', 
      textColor: 'text-amber-950', 
      icon: '🥇',
      benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'เค้กและเครื่องดื่มฟรีวันเกิด']
    },
    { 
      name: 'Platinum', minPoints: 5000, 
      cardBg: 'bg-gradient-to-br from-[#E5E4E2] via-[#8A9A5B] to-[#556B2F]', 
      textColor: 'text-slate-900', 
      icon: '💎',
      benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'ฟรีเข้าร่วมเวิร์กชอปประจำปี']
    }
  ];
  const TIERS = getTiers(locale || 'th');

  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data: member } = await supabase
        .from('pos_members')
        .select('*')
        .eq('line_user_id', userId)
        .maybeSingle();
      
      if (member) setMemberInfo(member);

      const { data: history } = await supabase
        .from('pos_points_history')
        .select('*')
        .eq('member_id', userId)
        .order('created_at', { ascending: false });
      
      if (history) setPointsHistory(history);

      const { data: rewardsData } = await supabase
        .from('pos_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });
      
      if (rewardsData) setRewards(rewardsData);

    } catch (err) {
      console.error('Error fetching member data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!liffLoading) fetchData();
  }, [lineProfile, liffLoading]);

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={dict.loading} />;

  // Calculate Tier Logic
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
    <div className="min-h-screen bg-[#F4F5F7] pb-24 font-sans text-gray-900 selection:bg-emerald-100 relative">
      
      {/* 📱 Mobile App Header (Clean & Native) */}
      <header className="sticky top-0 z-40 bg-[#F4F5F7]/80 backdrop-blur-xl flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-900 hover:bg-gray-200/50 rounded-full transition-colors active:scale-95">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[15px] font-extrabold tracking-widest text-gray-900 uppercase">{dict.title}</h1>
        <button onClick={() => setShowBenefits(true)} className="p-2 -mr-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors active:scale-95">
          <Info size={22} strokeWidth={2.5} />
        </button>
      </header>

      <main className="px-4 py-2 space-y-6">
        
        {/* 🌟 Premium Digital Card */}
        <section>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={\`\${currentTier.cardBg} rounded-[28px] p-6 shadow-2xl shadow-gray-200 relative overflow-hidden border border-white/20\`}
          >
            {/* Glass effect overlays */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 blur-2xl rounded-full -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex-shrink-0 border border-white/40 shadow-sm overflow-hidden flex items-center justify-center p-0.5">
                    {lineProfile?.pictureUrl ? (
                      <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={20} className={currentTier.textColor} />
                    )}
                  </div>
                  <div>
                    <h2 className={\`text-lg font-bold tracking-tight \${currentTier.textColor} leading-tight drop-shadow-sm\`}>
                      {lineProfile?.displayName || 'XYL Member'}
                    </h2>
                    <p className={\`text-[11px] font-medium opacity-80 \${currentTier.textColor}\`}>ID: {memberInfo?.phone || lineProfile?.userId?.substring(0, 8)}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-sm">
                    <span className="text-lg">{currentTier.icon}</span>
                    <span className={\`text-[13px] font-bold tracking-wide \${currentTier.textColor} drop-shadow-sm\`}>{currentTier.name}</span>
                  </div>
                </div>
              </div>

              {/* Points Summary */}
              <div className="mt-8">
                 <p className={\`text-[11px] font-semibold opacity-80 uppercase tracking-wider mb-1 \${currentTier.textColor}\`}>{dict.points}</p>
                 <div className="flex items-baseline gap-1.5">
                   <span className={\`text-5xl font-black tracking-tighter drop-shadow-md \${currentTier.textColor}\`}>
                     {memberInfo?.points?.toLocaleString() || 0}
                   </span>
                   <span className={\`text-sm font-bold opacity-80 \${currentTier.textColor}\`}>{dict.pts}</span>
                 </div>
              </div>

              {/* iOS Style Progress Bar */}
              {nextTier ? (
                <div className="mt-6">
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1.5 opacity-90">
                    <span className={currentTier.textColor}>{totalAccumulated} {dict.pts}</span>
                    <span className={currentTier.textColor}>{nextTier.minPoints} {dict.pts}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: \`\${progressPercent}%\` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                  </div>
                  <p className={\`text-center text-[10px] mt-2 font-medium opacity-80 \${currentTier.textColor}\`}>
                    อีก {nextTier.minPoints - totalAccumulated} {dict.pointsToNextTier} {nextTier.name}
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex items-center justify-center gap-1.5 text-white/90 text-[11px] font-bold bg-white/20 py-2 rounded-xl backdrop-blur-md border border-white/30">
                  <Sparkles size={14} />
                  {dict.maxTier}
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* 📱 Native Segmented Control */}
        <section className="space-y-5">
           <div className="flex bg-gray-200/80 p-1.5 rounded-[16px] backdrop-blur-sm">
              <button 
                onClick={() => setActiveTab('rewards')}
                className={\`flex-1 py-2.5 px-4 rounded-[12px] text-[13px] font-bold transition-all duration-300 \${activeTab === 'rewards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                {dict.rewardsCatalog}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={\`flex-1 py-2.5 px-4 rounded-[12px] text-[13px] font-bold transition-all duration-300 \${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                {dict.pointsHistory}
              </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'rewards' ? (
               <motion.div 
                 key="rewards"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                 className="grid grid-cols-1 gap-4"
               >
                 {rewards.length > 0 ? rewards.map((reward) => (
                   <div key={reward.id} className="bg-white rounded-[24px] p-3.5 flex gap-4 items-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                      <div className="w-24 h-24 bg-gray-50 rounded-[18px] overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100/50">
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift size={28} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 py-1 pr-1">
                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight leading-snug">{reward.title || reward.name}</h4>
                        <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{reward.description}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
                             <Sparkles size={12} className="text-emerald-500" />
                             <span className="text-[12px] font-bold text-emerald-700">{reward.points_required} {dict.pts}</span>
                          </div>
                          
                          <button 
                             disabled={(memberInfo?.points || 0) < reward.points_required}
                            className={\`h-8 px-4 rounded-full text-[12px] font-bold transition-all \${
                              (memberInfo?.points || 0) >= reward.points_required 
                              ? 'bg-gray-900 text-white active:scale-95 shadow-md shadow-gray-900/20' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }\`}
                          >
                            {dict.redeem}
                          </button>
                        </div>
                      </div>
                   </div>
                 )) : (
                   <div className="py-16 text-center bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift size={28} />
                      </div>
                      <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{dict.noRewards}</h3>
                      <p className="text-[13px] text-gray-500">{dict.checkBackLater}</p>
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div 
                 key="history"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                 className="space-y-3"
               >
                 {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                   <div key={item.id} className="bg-white rounded-[20px] p-4 flex justify-between items-center shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100/80">
                     <div className="flex gap-3.5 items-center">
                        <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${item.type === 'earn' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}\`}>
                           {item.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-gray-900 leading-tight">
                             {item.description || (item.type === 'earn' ? dict.earnedPoints : dict.redeemedReward)}
                          </h4>
                          <p className="text-[12px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                             <Clock size={11} /> {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                     </div>
                     <span className={\`text-[16px] font-black tracking-tight \${item.type === 'earn' ? 'text-emerald-500' : 'text-gray-900'}\`}>
                        {item.type === 'earn' ? '+' : '-'}{item.points}
                     </span>
                   </div>
                 )) : (
                   <div className="py-16 text-center bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History size={28} />
                      </div>
                      <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{dict.noHistory}</h3>
                      <p className="text-[13px] text-gray-500">{dict.historyEmpty}</p>
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </section>
      </main>

      {/* 🛡 Benefits Modal (Bottom Sheet) */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl max-h-[85vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* How to earn */}
                <div className="bg-emerald-50 rounded-[20px] p-5 border border-emerald-100">
                  <h4 className="text-[14px] font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> {dict.howToEarn}
                  </h4>
                  <p className="text-[13px] font-medium text-emerald-700">{dict.earnRule}</p>
                </div>

                {/* Tiers List */}
                <div className="space-y-4">
                  {TIERS.map((tier, idx) => (
                    <div key={tier.name} className="flex gap-4 items-start relative">
                      {/* Timeline line */}
                      {idx !== TIERS.length - 1 && <div className="absolute left-6 top-12 bottom-[-16px] w-[2px] bg-gray-100"></div>}
                      
                      <div className={\`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl shadow-md border-2 border-white relative z-10 \${tier.cardBg}\`}>
                        {tier.icon}
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 rounded-[20px] p-4 shadow-[0_2px_12px_rgb(0,0,0,0.02)]">
                        <div className="flex justify-between items-baseline mb-2">
                          <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">{tier.name}</h4>
                          <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tier.minPoints} {dict.pts}</span>
                        </div>
                        <ul className="space-y-2">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 font-medium">
                              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
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

    </div>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Redesigned LiffMemberPage V3 (Ultra Premium + Benefits Modal)');
