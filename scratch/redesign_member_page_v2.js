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
  ChevronRight
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

  // --- i18n Dictionary ---
  const t = {
    th: {
      loading: 'กำลังตรวจสอบสิทธิประโยชน์ของคุณ...',
      title: 'สมาชิก Xylem',
      member: 'สมาชิก',
      points: 'คะแนนสะสม',
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
      pts: 'แต้ม'
    },
    en: {
      loading: 'Checking your benefits...',
      title: 'Xylem Member',
      member: 'Member',
      points: 'Available Points',
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
      pts: 'PTS'
    },
    zh: {
      loading: '正在检查您的福利...',
      title: 'Xylem 会员',
      member: '会员',
      points: '可用积分',
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
      pts: '分'
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'];

  // Define Tiers with translations
  const getTiers = (loc: string) => [
    { name: loc === 'en' ? 'Seed' : loc === 'zh' ? '种子' : 'Seed', minPoints: 0, color: '#86efac', bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
    { name: loc === 'en' ? 'Sprout' : loc === 'zh' ? '发芽' : 'Sprout', minPoints: 500, color: '#4ade80', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🪴' },
    { name: loc === 'en' ? 'Tree' : loc === 'zh' ? '大树' : 'Tree', minPoints: 2000, color: '#22c55e', bg: 'bg-emerald-500', text: 'text-white', icon: '🌳' },
    { name: loc === 'en' ? 'Bloom' : loc === 'zh' ? '开花' : 'Bloom', minPoints: 5000, color: '#16a34a', bg: 'bg-emerald-700', text: 'text-white', icon: '🌸' }
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
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-gray-900 selection:bg-emerald-100">
      
      {/* 📱 Mobile App Header (Clean & Native) */}
      <header className="sticky top-0 z-50 bg-[#F8F9FA]/80 backdrop-blur-xl flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-base font-bold tracking-tight">{dict.title}</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="px-4 py-4 space-y-6">
        
        {/* 💳 Native Card Style for Profile */}
        <section>
          <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden">
                {lineProfile?.pictureUrl ? (
                  <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold tracking-tight text-gray-900 leading-tight mb-1">
                  {lineProfile?.displayName || 'XYL Member'}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-sm border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <span>{currentTier.icon}</span>
                  <span>{currentTier.name} {dict.member}</span>
                </div>
              </div>
            </div>

            {/* Points Summary */}
            <div className="bg-gray-50/50 rounded-[16px] p-4 border border-gray-100">
               <div className="flex justify-between items-center mb-3">
                 <p className="text-xs font-semibold text-gray-500">{dict.points}</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-black tracking-tight text-gray-900">{memberInfo?.points || 0}</span>
                   <span className="text-[10px] font-bold text-gray-400">{dict.pts}</span>
                 </div>
               </div>

               {/* iOS Style Progress Bar */}
               {nextTier ? (
                 <div className="mt-4 space-y-2">
                   <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: \`\${progressPercent}%\` }}
                       transition={{ duration: 0.8, ease: "easeOut" }}
                       className="h-full bg-emerald-500 rounded-full"
                     />
                   </div>
                   <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                     <span>{totalAccumulated} {dict.pts}</span>
                     <span>{nextTier.minPoints - totalAccumulated} {dict.pointsToNextTier} {nextTier.name}</span>
                   </div>
                 </div>
               ) : (
                 <div className="mt-4 flex items-center justify-center gap-1.5 text-emerald-600 text-[11px] font-bold bg-emerald-50 py-2 rounded-lg">
                   <Award size={14} />
                   {dict.maxTier}
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* 📱 Native Segmented Control */}
        <section className="space-y-4">
           <div className="flex bg-gray-200/60 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('rewards')}
                className={\`flex-1 py-2 px-4 rounded-lg text-[13px] font-semibold transition-all \${activeTab === 'rewards' ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgb(0,0,0,0.1)]' : 'text-gray-500'}\`}
              >
                {dict.rewardsCatalog}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={\`flex-1 py-2 px-4 rounded-lg text-[13px] font-semibold transition-all \${activeTab === 'history' ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgb(0,0,0,0.1)]' : 'text-gray-500'}\`}
              >
                {dict.pointsHistory}
              </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'rewards' ? (
               <motion.div 
                 key="rewards"
                 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                 className="grid grid-cols-1 gap-3"
               >
                 {rewards.length > 0 ? rewards.map((reward) => (
                   <div key={reward.id} className="bg-white rounded-[20px] p-3 flex gap-3 items-center shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100/60">
                      <div className="w-20 h-20 bg-gray-50 rounded-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift size={24} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight">{reward.title || reward.name}</h4>
                        <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{reward.description}</p>
                        <div className="flex items-center gap-1.5 mt-2.5">
                           <Leaf size={12} className="text-emerald-500" />
                           <span className="text-[12px] font-bold text-emerald-600">{reward.points_required} {dict.pts}</span>
                        </div>
                      </div>
                      <button 
                         disabled={(memberInfo?.points || 0) < reward.points_required}
                        className={\`h-8 px-3 rounded-full text-[11px] font-bold transition-all \${
                          (memberInfo?.points || 0) >= reward.points_required 
                          ? 'bg-gray-900 text-white active:scale-95' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }\`}
                      >
                        {dict.redeem}
                      </button>
                   </div>
                 )) : (
                   <div className="py-12 text-center bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                      <div className="w-14 h-14 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Gift size={24} />
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 mb-1">{dict.noRewards}</h3>
                      <p className="text-[13px] text-gray-500">{dict.checkBackLater}</p>
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div 
                 key="history"
                 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                 className="space-y-2.5"
               >
                 {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                   <div key={item.id} className="bg-white rounded-[16px] p-4 flex justify-between items-center shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100/50">
                     <div className="flex gap-3 items-center">
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${item.type === 'earn' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-500'}\`}>
                           {item.type === 'earn' ? <TrendingUp size={18} /> : <Gift size={18} />}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-gray-900 leading-tight">
                             {item.description || (item.type === 'earn' ? dict.earnedPoints : dict.redeemedReward)}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                             <Clock size={10} /> {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                     </div>
                     <span className={\`text-[15px] font-bold tracking-tight \${item.type === 'earn' ? 'text-emerald-500' : 'text-gray-900'}\`}>
                        {item.type === 'earn' ? '+' : '-'}{item.points}
                     </span>
                   </div>
                 )) : (
                   <div className="py-12 text-center bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                      <div className="w-14 h-14 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <History size={24} />
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 mb-1">{dict.noHistory}</h3>
                      <p className="text-[13px] text-gray-500">{dict.historyEmpty}</p>
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Redesigned LiffMemberPage V2 (Clean Native App + i18n)');
