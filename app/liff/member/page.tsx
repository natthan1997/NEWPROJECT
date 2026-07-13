'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, Info, X, Gift, Phone, Globe, Facebook, MessageCircle, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";
import RegistrationForm from './RegistrationForm';
import Link from 'next/link';

export default function LiffMemberPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBenefits, setShowBenefits] = useState(false);
  const [earnRate, setEarnRate] = useState(100);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const t = {
    th: {
      loading: 'กำลังโหลดข้อมูล...',
      title: 'XYL STUDIO',
      points: 'พอยท์ปัจจุบัน',
      pts: 'พอยท์',
      benefitsTitle: 'สิทธิประโยชน์',
      howToEarn: 'วิธีสะสมคะแนน',
      earnRule: `ทุก ${earnRate} บาท = 1 คะแนน`
    },
    en: {
      loading: 'Loading data...',
      title: 'XYL STUDIO',
      points: 'Current Points',
      pts: 'pts',
      benefitsTitle: 'Benefits',
      howToEarn: 'How to earn',
      earnRule: `${earnRate} THB = 1 Point`
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'] || t['th'];

  const [titles, setTitles] = useState<any[]>([]);
  const [activeTitle, setActiveTitle] = useState<any>(null);
  const tiers = React.useMemo(() => [
    { name: 'Bronze', minPoints: 0, bgHex: '#F2ECE4', textHex: '#8C6D53', benefits: [`อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน`] },
    { name: 'Silver', minPoints: 500, bgHex: '#F0F2F5', textHex: '#64748B', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด'] },
    { name: 'Gold', minPoints: 2000, bgHex: '#FCF7E8', textHex: '#B48529', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์'] },
    { name: 'Platinum', minPoints: 5000, bgHex: '#EBF1F5', textHex: '#3E6578', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์'] }
  ], [earnRate]);
  
  const handleRegistrationSubmit = async (data: any) => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;

    setIsLinkingPhone(true);
    try {
        const res = await fetch('/api/liff/member/link-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              lineUserId: userId, 
              phone: data.phone,
              fullName: `${data.firstName} ${data.lastName}`,
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              pdpaConsent: data.pdpaConsent
            })
        });
        const result = await res.json();
        
        if (result.success) {
            fetchData();
        } else {
            alert(result.error || 'Failed to register');
        }
    } catch (e) {
        alert('Error linking phone');
    } finally {
        setIsLinkingPhone(false);
    }
  };
  
  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      const { data: shopSettings } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (shopSettings && shopSettings.opening_hours && shopSettings.opening_hours.loyalty_earn_rate) {
        setEarnRate(shopSettings.opening_hours.loyalty_earn_rate);
      }
      if (member) {
        setMemberInfo(member);
      }
      
      try {
        const { data: campaignsData } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (campaignsData) setCampaigns(campaignsData);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
      
      try {
        const titlesRes = await fetch('/api/liff/member/titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: userId, memberId: member?.id || userId })
        });
        const titlesData = await titlesRes.json();
        if (titlesData.success) {
          setActiveTitle(titlesData.activeTitle);
          setTitles(titlesData.titles.map((t: any) => ({
            name: t.name,
            minPoints: t.rule_threshold,
            bgHex: t.badge_color || '#F2ECE4',
            textHex: '#1A1A18',
            progress: t.progress,
            isUnlocked: t.isUnlocked,
            currentValue: t.currentValue
          })));
        }
      } catch (err) {
        console.error('Failed to load smart badges', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liffLoading) fetchData();
    
    const channel = supabase.channel('member_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lineProfile, liffLoading]);

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={dict.loading} />;
  if (loading) return <XYLLoader tagline={dict.loading} />;

  if (!memberInfo || !memberInfo.phone || !memberInfo.pdpa_consent) {
    return <RegistrationForm lineProfile={lineProfile} onSubmit={handleRegistrationSubmit} isSubmitting={isLinkingPhone} />;
  }

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24">
      
      {/* 📱 Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-[14px] font-bold tracking-widest text-[#7B8B7B] uppercase">{dict.title}</h1>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-8">
        
        {/* 🟡 Hero Points Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full flex flex-col"
        >
          <div className="p-7 rounded-[24px] relative flex flex-col overflow-hidden shadow-sm bg-[#A3B1A3]">
            {/* Background Graphic Accent */}
            <div className="absolute -right-10 -bottom-10 opacity-30 pointer-events-none">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22h20L12 2z" />
                </svg>
            </div>
            
            <div className="relative z-10 text-white">
                <div className="flex justify-between items-start mb-6">
                    <p className="text-[15px] font-medium tracking-wide opacity-90">{dict.points}</p>
                    <button onClick={() => setShowBenefits(true)}>
                        <Info size={20} className="opacity-70" />
                    </button>
                </div>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <div className="bg-white/20 px-2 py-1 rounded text-[12px] font-bold tracking-widest uppercase writing-vertical-rl rotate-180 h-16 flex items-center justify-center" style={{ writingMode: 'vertical-rl' }}>
                    พอยท์
                  </div>
                  <span className="text-[56px] leading-none font-bold tracking-tight">
                    {(memberInfo?.points || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border border-white/30 shrink-0">
                        {lineProfile?.pictureUrl ? (
                            <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/30"></div>
                        )}
                    </div>
                    <div>
                        <div className="text-[14px] font-medium leading-tight">
                            {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}
                        </div>
                        <div className="flex items-center gap-1 opacity-80 mt-0.5">
                            <span className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.textHex }}></span>
                            </span>
                            <span className="text-[12px]">{currentTier.name}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="px-1 mt-6">
            <div className="flex justify-between items-baseline mb-2 text-[#1A1A18]">
                <span className="text-[13px] font-medium flex items-center gap-1">
                    พอยท์สะสมระดับสมาชิก 
                    <button onClick={() => setShowBenefits(true)}><Info size={14} className="text-gray-400" /></button>
                </span>
                <span className="text-[13px] font-semibold">
                    <span className="text-[#7B8B7B]">{totalAccumulated}</span> <span className="text-gray-400 font-normal">/ {nextTier ? nextTier.minPoints : 'Max'}</span>
                </span>
            </div>
            <div className="w-full h-[6px] rounded-full overflow-hidden bg-gray-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, progressPercent)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-[#7B8B7B]" 
                />
            </div>
          </div>
          
          <div className="flex justify-center mt-6 relative z-20 gap-3">
            <Link href="/liff/point-history" className="text-[13px] font-medium text-[#7B8B7B] flex items-center gap-1 py-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm">
                ดูประวัติพอยท์ <ChevronRight size={14} />
            </Link>
            <Link href="/liff/history" className="text-[13px] font-medium text-[#7B8B7B] flex items-center gap-1 py-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm">
                ประวัติการสั่งซื้อ <ChevronRight size={14} />
            </Link>
            <Link href="/liff/my-rewards" className="text-[13px] font-medium text-[#7B8B7B] flex items-center gap-1 py-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm">
                คูปองของฉัน <ChevronRight size={14} />
            </Link>
          </div>
        </motion.section>

        {/* Campaign Cards Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="-mx-5 mt-2"
        >
          <div className="px-5 mb-4 flex justify-between items-baseline">
            <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">แคมเปญพิเศษ</h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {/* Dynamic Campaigns */}
            {campaigns.length > 0 && campaigns.map((campaign, idx) => {
                const gradients = [
                    'from-[#1A1A18] to-gray-800',
                    'from-[#7B8B7B] to-[#5C6E5C]',
                    'from-[#A3B1A3] to-[#8A988A]',
                    'from-[#C8B6A6] to-[#A99787]'
                ];
                const bgGradient = gradients[idx % gradients.length];

                return (
                    <div key={campaign.id} className="min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-end relative overflow-hidden shadow-sm">
                        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`}></div>
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Gift size={80} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <span className="inline-block px-2 py-1 bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase rounded mb-2 backdrop-blur-sm">
                                {campaign.multiplier ? `X${campaign.multiplier} POINTS` : 'PROMO'}
                            </span>
                            <h4 className="text-white text-[18px] font-semibold leading-tight mb-1">{campaign.name}</h4>
                            <p className="text-white/80 text-[12px]">
                                {campaign.start_date && campaign.end_date ? `${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}` : 'แคมเปญพิเศษสำหรับคุณ'}
                            </p>
                        </div>
                    </div>
                );
            })}
            
            {/* Card: Rewards */}
            <Link href="/liff/rewards" className="min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-end relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] to-gray-800"></div>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Gift size={80} className="text-white" />
                </div>
                <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase rounded mb-2 backdrop-blur-sm">REWARDS</span>
                    <h4 className="text-white text-[18px] font-semibold leading-tight mb-1">แลกของรางวัล</h4>
                    <p className="text-gray-300 text-[12px]">ใช้พอยท์แลกรับส่วนลดและสิทธิพิเศษมากมาย</p>
                </div>
            </Link>

            {/* Card: My Coupons */}
            <Link href="/liff/my-rewards" className="min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-end relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B8B7B] to-[#5C6E5C]"></div>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <MessageCircle size={80} className="text-white" />
                </div>
                <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase rounded mb-2 backdrop-blur-sm">MY COUPONS</span>
                    <h4 className="text-white text-[18px] font-semibold leading-tight mb-1">คูปองของฉัน</h4>
                    <p className="text-[#E3E8E3] text-[12px]">ดูคูปองส่วนลดที่คุณมีและพร้อมใช้งาน</p>
                </div>
            </Link>
          </div>
        </motion.section>

        {/* 📢 Campaigns/Titles */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="-mx-5 mt-4"
        >
          <div className="px-5 mb-4 flex justify-between items-baseline">
            <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">แลกของรางวัล</h3>
            <Link href="/liff/rewards" className="text-[12px] text-[#7B8B7B] font-medium">ดูทั้งหมด</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {/* Placeholder for Quick Rewards/Badges */}
            <div className="min-w-[280px] h-[140px] snap-center bg-gray-100 rounded-[20px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E3E8E3] to-white"></div>
                <div className="relative z-10 text-center">
                    <Gift size={32} className="text-[#A3B1A3] mx-auto mb-2" />
                    <p className="text-[14px] text-[#7B8B7B] font-medium">ไปที่หน้าของรางวัลเพื่อดูสิทธิพิเศษ</p>
                </div>
            </div>
            
          </div>
        </motion.section>
      </main>

      {/* 👑 Bottom Sheet - Benefits */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] max-h-[90vh] overflow-y-auto pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[15px] font-medium text-gray-900">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="text-gray-400 hover:text-gray-900 p-1">
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <h4 className="text-[11px] text-gray-400 mb-4 uppercase tracking-widest font-semibold">How it works</h4>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="pt-0.5 text-gray-400"><Gift size={18} strokeWidth={1.5} /></div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900 mb-1">{dict.howToEarn}</p>
                        <p className="text-[13px] text-gray-500">{dict.earnRule}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-gray-100" />

                <div>
                  <h4 className="text-[11px] text-gray-400 mb-4 uppercase tracking-widest font-semibold">Tiers</h4>
                  <div className="space-y-3">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="bg-[#FAFAFA] border border-gray-100 rounded-[20px] p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium" style={{ backgroundColor: tier.bgHex || '#E5E5E5', color: tier.textHex || '#1A1A1A' }}>
                            {tier.name[0]}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-medium text-gray-900">{tier.name}</h4>
                            <p className="text-[12px] text-gray-500">{tier.minPoints.toLocaleString()} {dict.pts}</p>
                          </div>
                        </div>
                        <ul className="space-y-2 pl-11">
                          {tier.benefits && tier.benefits.map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                              <span className="text-gray-300 mt-1">-</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </div>
  );
}