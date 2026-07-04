import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
const content = `
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Star, 
  History, 
  Gift, 
  TrendingUp, 
  Award,
  User,
  Clock,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";

// Define Tiers
const TIERS = [
  { name: 'Seed', minPoints: 0, color: '#86efac', bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
  { name: 'Sprout', minPoints: 500, color: '#4ade80', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🪴' },
  { name: 'Tree', minPoints: 2000, color: '#22c55e', bg: 'bg-green-500', text: 'text-white', icon: '🌳' },
  { name: 'Bloom', minPoints: 5000, color: '#16a34a', bg: 'bg-emerald-700', text: 'text-white', icon: '🌸' }
];

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

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={locale === 'en' ? 'Checking your benefits...' : locale === 'zh' ? 'กำลังตรวจสอบสิทธิประโยชน์ของคุณ...' : 'กำลังตรวจสอบสิทธิประโยชน์ของคุณ...'} />;

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
    <div className="min-h-screen bg-[#FDFDFB] pb-24 text-[#1A1A18] font-sans selection:bg-emerald-200">
      {/* 🏛️ Boutique Header */}
      <header className="sticky top-0 z-50 bg-[#FDFDFB]/90 backdrop-blur-md flex items-center px-4 py-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors rounded-full active:bg-gray-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <div className="ml-2 flex-1 flex justify-center pr-6">
          <h1 className="text-xs font-black uppercase tracking-[0.2em]">{locale === 'en' ? 'Xylem Member' : locale === 'zh' ? '会员' : 'Xylem Member'}</h1>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8">
        
        {/* 🎫 Profile Card (Premium Redesign) */}
        <section className="relative">
          <div className="bg-gradient-to-br from-[#1A1A18] to-[#2D2D2A] rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="relative z-10 flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1 flex-shrink-0">
                {lineProfile?.pictureUrl ? (
                  <img src={lineProfile.pictureUrl} alt={lineProfile.displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 rounded-full">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold tracking-tight text-white mb-1 truncate">
                  {lineProfile?.displayName || 'XYL Member'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] \${currentTier.bg} \${currentTier.text} shadow-sm\`}>
                    {currentTier.icon} {currentTier.name}
                  </span>
                  <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">
                    Member
                  </span>
                </div>
              </div>
            </div>

            {/* Points Section */}
            <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <p className="text-[10px] font-medium uppercase text-white/60 tracking-widest mb-1">Available Points</p>
                   <div className="flex items-baseline gap-1.5">
                     <span className="text-4xl font-black tracking-tight text-white">{memberInfo?.points || 0}</span>
                     <span className="text-xs font-bold text-emerald-400">PTS</span>
                   </div>
                 </div>
               </div>

               {/* Tier Progress Bar */}
               {nextTier ? (
                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold text-white/80">
                     <span>{currentTier.name}</span>
                     <span>{totalAccumulated} / {nextTier.minPoints}</span>
                   </div>
                   <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: \`\${progressPercent}%\` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                       className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
                     />
                   </div>
                   <p className="text-[9px] text-white/50 text-right">
                     {nextTier.minPoints - totalAccumulated} points to {nextTier.name}
                   </p>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                   <Star size={12} fill="currentColor" />
                   Max Tier Achieved
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* 🔄 Tabs Section */}
        <section className="space-y-6">
           <div className="flex bg-gray-100/80 backdrop-blur p-1 rounded-full">
              <button 
                onClick={() => setActiveTab('rewards')}
                className={\`flex-1 py-3 px-4 rounded-full text-xs font-bold transition-all relative \${activeTab === 'rewards' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}\`}
              >
                Rewards Catalog
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={\`flex-1 py-3 px-4 rounded-full text-xs font-bold transition-all relative \${activeTab === 'history' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}\`}
              >
                Points History
              </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'rewards' ? (
               <motion.div 
                 key="rewards"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 className="grid grid-cols-1 gap-4"
               >
                 {rewards.length > 0 ? rewards.map((reward) => (
                   <div key={reward.id} className="bg-white rounded-2xl p-4 flex gap-4 items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift size={28} className="text-emerald-500/50" />
                        )}
                        {/* Glass Overlay for icon */}
                        {!reward.image_url && <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay"></div>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight leading-tight">{reward.title || reward.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{reward.description}</p>
                        <div className="flex items-center justify-between mt-3">
                           <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
                             <Leaf size={12} className="text-emerald-500" />
                             <span className="text-[11px] font-black text-emerald-700">{reward.points_required} PTS</span>
                           </div>
                        </div>
                      </div>
                      <button 
                         disabled={(memberInfo?.points || 0) < reward.points_required}
                        className={\`h-10 px-4 rounded-xl text-xs font-bold transition-all \${
                          (memberInfo?.points || 0) >= reward.points_required 
                          ? 'bg-[#1A1A18] text-white hover:bg-black active:scale-95 shadow-md' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }\`}
                      >
                        Redeem
                      </button>
                   </div>
                 )) : (
                   <div className="py-16 text-center bg-white rounded-3xl border border-gray-100/50 shadow-sm">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift size={28} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">No Rewards Yet</h3>
                      <p className="text-xs text-gray-500">Check back later for exclusive rewards.</p>
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div 
                 key="history"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 className="space-y-3"
               >
                 {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                   <div key={item.id} className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100/50">
                     <div className="flex gap-4 items-center">
                        <div className={\`w-12 h-12 rounded-full flex items-center justify-center \${item.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}\`}>
                           {item.type === 'earn' ? <TrendingUp size={20} strokeWidth={2.5} /> : <Gift size={20} strokeWidth={2.5} />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                             {item.description || (item.type === 'earn' ? 'Earned Points' : 'Redeemed Reward')}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                             <Clock size={10} /> {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                     </div>
                     <span className={\`text-lg font-black tracking-tighter \${item.type === 'earn' ? 'text-emerald-600' : 'text-gray-900'}\`}>
                        {item.type === 'earn' ? '+' : '-'}{item.points}
                     </span>
                   </div>
                 )) : (
                   <div className="py-16 text-center bg-white rounded-3xl border border-gray-100/50 shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History size={28} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">No History</h3>
                      <p className="text-xs text-gray-500">Your points activity will appear here.</p>
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
console.log('Redesigned LiffMemberPage');
