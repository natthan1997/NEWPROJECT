'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, ChevronLeft, Info, X, Gift, Phone, Globe, Facebook, MessageCircle, QrCode, Coins, Sparkles, AlertCircle
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
  const [quickRewards, setQuickRewards] = useState<any[]>([]);

  // Mystery Box State
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [playingMysteryBox, setPlayingMysteryBox] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<number | null>(null);
  const [mysteryCouponReward, setMysteryCouponReward] = useState<string | null>(null);
  const [mysteryError, setMysteryError] = useState<string | null>(null);
  const [mysteryBoxCost, setMysteryBoxCost] = useState(50);

  const t = {
    th: {
      loading: 'กำลังโหลดข้อมูล...',
      title: 'คะแนนสะสมของคุณ',
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
    { name: 'Bronze', minPoints: 0, bgHex: '#F2ECE4', textHex: '#8C6D53', cardBg: 'bg-gradient-to-br from-[#B89F89] to-[#8C6D53]', benefits: [`อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน`] },
    { name: 'Silver', minPoints: 500, bgHex: '#F0F2F5', textHex: '#64748B', cardBg: 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด'] },
    { name: 'Gold', minPoints: 2000, bgHex: '#FCF7E8', textHex: '#B48529', cardBg: 'bg-gradient-to-br from-[#D4AF37] to-[#B48529]', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์'] },
    { name: 'Platinum', minPoints: 5000, bgHex: '#EBF1F5', textHex: '#3E6578', cardBg: 'bg-gradient-to-br from-[#3E6578] to-[#1E3A47]', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์'] }
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
  
  const fetchData = async (isBackgroundSync = false) => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      if (!isBackgroundSync) setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      const { data: shopSettings } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (shopSettings && shopSettings.opening_hours) {
        if (shopSettings.opening_hours.loyalty_earn_rate) {
          setEarnRate(shopSettings.opening_hours.loyalty_earn_rate);
        }
        if (shopSettings.opening_hours.mystery_box_cost !== undefined) {
          setMysteryBoxCost(shopSettings.opening_hours.mystery_box_cost);
        }
      }
      if (member) {
        setMemberInfo(member);
      }
      
      try {
        const { data: campaignsData } = await supabase.from('pos_campaigns').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        const { data: loyaltyCampaigns } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true);
        
        const mappedLoyalty = loyaltyCampaigns ? loyaltyCampaigns.map(c => ({
          id: c.id,
          title: c.name,
          description: `รับพอยท์คูณ ${c.multiplier} เมื่อซื้อ${c.applicable_categories && c.applicable_categories.length > 0 ? (Array.isArray(c.applicable_categories) ? c.applicable_categories.join(', ') : c.applicable_categories) : 'สินค้าที่ร่วมรายการ'}`,
          icon: '✨',
          type_tag: 'MULTIPLIER',
          bg_gradient_from: 'from-[#1A1A18]',
          bg_gradient_to: 'to-gray-800',
          text_color: 'text-white',
          tag_color: 'text-white'
        })) : [];

        if (campaignsData) {
          setCampaigns([...campaignsData, ...mappedLoyalty]);
        } else {
          setCampaigns(mappedLoyalty);
        }
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }

      try {
        const { data: rewardsData } = await supabase.from('pos_loyalty_coupons').select('*').eq('is_active', true).order('cost_points', { ascending: true }).limit(5);
        if (rewardsData) setQuickRewards(rewardsData);
      } catch (err) {
        console.error('Failed to load rewards', err);
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
            currentValue: t.currentValue,
            description: t.description,
            benefits: t.benefits
          })));
        }
      } catch (err) {
        console.error('Failed to load smart badges', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackgroundSync) setLoading(false);
    }
  };

  const handlePlayMysteryBox = async () => {
      const currentPoints = memberInfo?.points || 0;
      if (currentPoints < MYSTERY_COST) return;
      if (!lineProfile?.userId) return;

      setPlayingMysteryBox(true);
      setMysteryError(null);

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
        if (!data.success) {
            throw new Error(data.error || 'เกิดข้อผิดพลาด');
        }
        
        // Simulate suspense for animation
        setTimeout(() => {
          setMysteryReward(data.wonPoints);
          setMysteryCouponReward(data.wonCoupon || null);
          setMemberInfo(prev => prev ? {...prev, points: data.newTotal} : null);
          setPlayingMysteryBox(false);
        }, 2000);

      } catch (err: any) {
          setMysteryError(err.message);
          setPlayingMysteryBox(false);
      }
  };

  useEffect(() => {
    if (!liffLoading) fetchData(false);
    
    const channel = supabase.channel('member_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
        fetchData(true); // Background sync
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lineProfile, liffLoading]);

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={dict.loading} />;
  if (loading) return <XYLLoader tagline={dict.loading} />;

  if (!memberInfo || !memberInfo.phone || !memberInfo.pdpa_consent) {
    return <RegistrationForm key={memberInfo?.id || 'new'} lineProfile={lineProfile} onSubmit={handleRegistrationSubmit} isSubmitting={isLinkingPhone} initialData={memberInfo} />;
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <button 
            onClick={() => router.push('/liff/menu')} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-95 transition-transform text-gray-600"
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
            <h1 className="text-[14px] font-bold tracking-widest text-[#1A1A18]">{dict.title}</h1>
        </div>
        <div className="w-10 h-10"></div>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-8">
        
        {/* 🟡 Hero Points Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full flex flex-col"
        >
          <div className={`p-7 rounded-[24px] relative flex flex-col overflow-hidden shadow-sm ${currentTier.cardBg || 'bg-[#1A1A18]'}`}>
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
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-[15px] font-medium leading-tight">
                                {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}
                            </div>
                            {activeTitle && (
                                <button 
                                  onClick={() => setShowCatalog(true)}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-0.5 shadow-sm active:scale-95 transition-transform"
                                  style={{ backgroundColor: activeTitle.bgHex || '#F5F5F5', color: activeTitle.textHex || '#1A1A18' }}
                                >
                                  {activeTitle.name}
                                  <ChevronRight size={10} className="opacity-60" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 opacity-90 mt-0.5">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.textHex }}></span>
                                </span>
                                <span className="text-[12px] font-medium">{currentTier.name}</span>
                            </div>
                            {!activeTitle && (
                                <>
                                    <span className="text-white/40 text-[10px]">|</span>
                                    <button onClick={() => setShowCatalog(true)} className="text-[11px] font-medium text-white hover:text-white transition-colors underline decoration-white/40 underline-offset-2">
                                        ดูฉายา
                                    </button>
                                </>
                            )}
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
                    <span className="text-[#1A1A18]">{totalAccumulated}</span> <span className="text-gray-400 font-normal">/ {nextTier ? nextTier.minPoints : 'Max'}</span>
                </span>
            </div>
            <div className="w-full h-[6px] rounded-full overflow-hidden bg-gray-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, progressPercent)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full" 
                  style={{ backgroundColor: currentTier.textHex }}
                />
            </div>
          </div>
          
          <div className="flex justify-center mt-6 relative z-20 gap-3">
            <Link href="/liff/point-history" className="text-[13px] font-medium text-[#1A1A18] flex items-center gap-1 py-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm">
                ดูประวัติพอยท์ <ChevronRight size={14} />
            </Link>
            <Link href="/liff/my-rewards" className="text-[13px] font-medium text-[#1A1A18] flex items-center gap-1 py-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors shadow-sm">
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
            
            {campaigns.length > 0 ? campaigns.map((campaign, idx) => {
                const bgFrom = campaign.bg_gradient_from || 'from-[#1A1A18]';
                const bgTo = campaign.bg_gradient_to || 'to-gray-800';
                const textCol = campaign.text_color || 'text-white';
                const tagCol = campaign.tag_color || 'text-white';
                const icon = campaign.icon || '🎁';
                
                const isMysteryBox = campaign.title.includes('กล่องสุ่ม');
                if (isMysteryBox) {
                    return (
                        <div onClick={() => setShowMysteryBox(true)} key={campaign.id} className={`min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-end relative overflow-hidden shadow-sm bg-gradient-to-br ${bgFrom} ${bgTo} cursor-pointer active:scale-95 transition-transform block`}>
                            <div className="absolute top-4 right-4 opacity-90 w-16 h-16">
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                                    <rect x="20" y="45" width="60" height="45" fill="#F2ECE4" />
                                    <rect x="15" y="30" width="70" height="15" fill="#FCF7E8" />
                                    <rect x="42" y="30" width="16" height="60" fill="#E3D9C3" />
                                    <rect x="20" y="45" width="60" height="45" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <rect x="15" y="30" width="70" height="15" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <line x1="42" y1="30" x2="42" y2="90" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <line x1="58" y1="30" x2="58" y2="90" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 25 15 35 30Z" fill="#F2ECE4" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 25 10 40 25C45 30 50 30 50 30Z" fill="#E3D9C3" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 75 15 65 30Z" fill="#F2ECE4" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 75 10 60 25C55 30 50 30 50 30Z" fill="#E3D9C3" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <circle cx="50" cy="30" r="5" fill="#FCF7E8" stroke="#1A1A18" strokeWidth="4" />
                                </svg>
                            </div>
                            <div className="relative z-10">
                                <span className={`inline-block px-2 py-1 bg-white/20 ${tagCol} text-[10px] font-bold tracking-widest uppercase rounded mb-2 backdrop-blur-sm`}>
                                    {campaign.type_tag || 'PROMO'}
                                </span>
                                <h4 className={`${textCol} text-[18px] font-semibold leading-tight mb-1`}>{campaign.title}</h4>
                                <p className={`${textCol} opacity-80 text-[12px]`}>
                                    {campaign.description}
                                </p>
                            </div>
                            <div className="absolute right-4 bottom-4 text-white/50">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={campaign.id} className={`min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-end relative overflow-hidden shadow-sm bg-gradient-to-br ${bgFrom} ${bgTo}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-20 text-[80px] leading-none">
                            {icon}
                        </div>
                        <div className="relative z-10">
                            <span className={`inline-block px-2 py-1 bg-white/20 ${tagCol} text-[10px] font-bold tracking-widest uppercase rounded mb-2 backdrop-blur-sm`}>
                                {campaign.type_tag || 'PROMO'}
                            </span>
                            <h4 className={`${textCol} text-[18px] font-semibold leading-tight mb-1`}>{campaign.title}</h4>
                            <p className={`${textCol} opacity-80 text-[12px]`}>
                                {campaign.description}
                            </p>
                        </div>
                    </div>
                );
            }) : (
                <div className="min-w-[280px] h-[160px] snap-center rounded-[20px] p-5 flex flex-col justify-center items-center relative overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                    <Gift size={32} className="text-gray-300 mb-2" />
                    <p className="text-[13px] font-medium text-gray-500">รอพบกับแคมเปญใหม่ๆ เร็วๆนี้</p>
                </div>
            )}
          </div>
        </motion.section>

        {/* 📢 Campaigns/Titles */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="-mx-5 mt-4"
        >
          <div className="px-5 mb-4 flex justify-between items-baseline">
            <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">แลกของรางวัล</h3>
            <Link href="/liff/rewards" className="text-[12px] text-[#1A1A18] font-medium">ดูทั้งหมด</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {quickRewards.length > 0 ? quickRewards.map((reward) => (
                <div key={reward.id} onClick={() => router.push('/liff/rewards')} className="min-w-[160px] h-[120px] snap-center bg-white border border-gray-100 rounded-[20px] flex flex-col p-4 shadow-sm relative cursor-pointer active:scale-95 transition-transform">
                    <div className="absolute top-3 right-3 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-[9px] font-bold text-[#1A1A18] uppercase tracking-wider">
                        REDEEM
                    </div>
                    <Gift size={24} className="text-gray-400 mb-2" />
                    <h4 className="text-[13px] font-bold text-[#1A1A18] leading-tight mb-1 line-clamp-2 pr-4">
                        {reward.discount_type === 'percent' ? `ส่วนลด ${reward.discount_value}%` : reward.discount_type === 'free_item' ? `ฟรี ${reward.discount_value}` : `ส่วนลด ฿${reward.discount_value}`}
                    </h4>
                    <p className="text-[12px] text-gray-500 mt-auto font-medium tracking-tight">ใช้ {reward.cost_points.toLocaleString()} พอยท์</p>
                </div>
            )) : (
                <div onClick={() => router.push('/liff/rewards')} className="min-w-[280px] h-[140px] snap-center bg-gray-100 rounded-[20px] flex items-center justify-center relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"></div>
                    <div className="relative z-10 text-center">
                        <Gift size={32} className="text-[#1A1A18] mx-auto mb-2" />
                        <p className="text-[14px] text-[#1A1A18] font-medium">ไปที่หน้าของรางวัลเพื่อดูสิทธิพิเศษ</p>
                    </div>
                </div>
            )}
            
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

      {/* 👑 Clean Bottom Sheet - Catalog */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-[60] bg-gray-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[32px] max-h-[90vh] overflow-y-auto pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[15px] font-black text-gray-900">ฉายาของคุณ</h3>
                <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-900 p-1 bg-gray-50 rounded-full">
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {titles.map((tier, idx) => (
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={`bg-white border p-5 rounded-[20px] flex flex-col items-center cursor-pointer ${tier.isUnlocked ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60 grayscale'}`}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold mb-3 shadow-sm" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[13px] font-black text-gray-900 mb-1">{tier.name}</h4>
                      
                      {!tier.isUnlocked && (
                        <div className="w-full mt-2 h-[4px] bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-300" style={{ width: `${tier.progress}%` }}></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🏆 Clean Badge Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] overflow-hidden shadow-2xl"
            >
              <div className="h-24 w-full flex items-start justify-end p-4 relative" style={{ backgroundColor: selectedBadge.bgHex }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-black bg-white shadow-md absolute -bottom-8 left-1/2 -translate-x-1/2" style={{ color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
                <button onClick={() => setSelectedBadge(null)} className="text-black/30 hover:text-black/60 transition-colors z-10 bg-white/30 rounded-full p-1">
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="pt-12 pb-6 px-6 text-center">
                <h3 className="text-[18px] font-black text-gray-900 mb-1">{selectedBadge.name}</h3>
                
                <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-6">
                  {selectedBadge.isUnlocked ? 'Unlocked' : 'Locked'}
                </div>

                <div className="text-left bg-gray-50 rounded-[16px] p-5">
                  <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">เงื่อนไขการรับฉายา</h4>
                  <div className="flex items-start gap-3 text-[13px] font-medium text-gray-900">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    </div>
                    <span className="leading-relaxed text-left">{selectedBadge.description || `ทำภารกิจครบ ${selectedBadge.minPoints.toLocaleString()}`}</span>
                  </div>
                  
                  {selectedBadge.benefits && (
                    <>
                      <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3 mt-4 border-t border-gray-200 pt-4">สิทธิพิเศษฉายานี้</h4>
                      <div className="flex items-start gap-3 text-[13px] font-medium text-[#1A1A18]">
                        <div className="w-6 h-6 rounded-full bg-[#1A1A18] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-[10px]">✨</span>
                        </div>
                        <span className="leading-relaxed text-left">{selectedBadge.benefits}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎁 Bottom Sheet - Mystery Box */}
      <AnimatePresence>
        {showMysteryBox && (
          <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { if (!playingMysteryBox && !mysteryReward) setShowMysteryBox(false); }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="bg-white rounded-[28px] w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 rounded-t-[28px]">
                    <div className="flex flex-col">
                        <h3 className="text-[16px] font-black text-gray-900 tracking-tight">กล่องสุ่มหรรษา</h3>
                        <span className="text-[11px] text-gray-500 font-bold tracking-wide">ลุ้นรับคะแนนพิเศษ</span>
                    </div>
                    {!playingMysteryBox && (
                        <button onClick={() => { setShowMysteryBox(false); setMysteryReward(null); }} className="text-gray-400 hover:text-gray-900 p-1.5 bg-gray-50 rounded-full active:scale-95 transition-all">
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    )}
                  </div>

                  <div className="p-6 flex flex-col items-center justify-center relative min-h-[320px]">
                    {!mysteryReward ? (
                        <motion.div 
                            key="box"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0, y: 30 }}
                            className="flex flex-col items-center w-full"
                        >
                            <motion.div 
                                animate={playingMysteryBox ? {
                                    y: [0, -15, 0, -15, 0],
                                    rotate: [0, -5, 5, -5, 0],
                                    scale: [1, 1.05, 1, 1.05, 1]
                                } : {
                                    y: [0, -5, 0]
                                }}
                                transition={playingMysteryBox ? {
                                    duration: 0.4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                } : {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-32 h-32 mb-6 relative flex items-center justify-center"
                            >
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                                    <rect x="20" y="45" width="60" height="45" fill="#F2ECE4" />
                                    <rect x="15" y="30" width="70" height="15" fill="#FCF7E8" />
                                    <rect x="42" y="30" width="16" height="60" fill="#E3D9C3" />
                                    <rect x="20" y="45" width="60" height="45" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <rect x="15" y="30" width="70" height="15" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <line x1="42" y1="30" x2="42" y2="90" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <line x1="58" y1="30" x2="58" y2="90" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 25 15 35 30Z" fill="#F2ECE4" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 25 10 40 25C45 30 50 30 50 30Z" fill="#E3D9C3" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 75 15 65 30Z" fill="#F2ECE4" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <path d="M50 30C50 30 75 10 60 25C55 30 50 30 50 30Z" fill="#E3D9C3" stroke="#1A1A18" strokeWidth="4" strokeLinejoin="round" />
                                    <circle cx="50" cy="30" r="5" fill="#FCF7E8" stroke="#1A1A18" strokeWidth="4" />
                                </svg>
                            </motion.div>

                            <div className="text-center mb-6">
                                <p className="text-gray-700 font-medium text-[13px] leading-relaxed">ใช้ {mysteryBoxCost} คะแนน เพื่อลุ้นรับคะแนน<br/>โบนัสสูงสุดถึง 500 Pts!</p>
                            </div>

                            {mysteryError && (
                                <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-medium flex items-center gap-2 w-full">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{mysteryError}</span>
                                </div>
                            )}

                            <button 
                                onClick={handlePlayMysteryBox}
                                disabled={playingMysteryBox || (memberInfo?.points || 0) < mysteryBoxCost}
                                className={`w-full h-14 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold tracking-wider transition-all
                                    ${(memberInfo?.points || 0) >= mysteryBoxCost 
                                        ? 'bg-[#1A1A18] text-white shadow-md hover:bg-black active:scale-95' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {playingMysteryBox ? (
                                    <>กำลังเปิดกล่อง...</>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        แลก {mysteryBoxCost} Pts เพื่อสุ่ม
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="reward"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center w-full"
                        >
                            <motion.div 
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-32 h-32 mb-6 relative"
                            >
                                <div className="absolute inset-0 bg-[#1A1A18] rounded-[24px] shadow-lg flex items-center justify-center">
                                    <div className="text-center text-white p-2">
                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-1 opacity-80">ได้รับ</p>
                                        {mysteryCouponReward ? (
                                          <p className="text-[16px] font-black leading-tight text-center">{mysteryCouponReward}</p>
                                        ) : (
                                          <p className="text-[40px] font-black leading-none">+{mysteryReward}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <div className="text-center mb-8">
                                <h2 className="text-[20px] font-black text-gray-900 mb-2">ยินดีด้วย! 🎉</h2>
                                <p className="text-gray-500 text-[13px] font-medium">คะแนนโบนัสถูกเพิ่มเข้าบัญชีของคุณเรียบร้อยแล้ว</p>
                            </div>

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setMysteryReward(null)}
                                    disabled={(memberInfo?.points || 0) < MYSTERY_COST}
                                    className={`flex-1 h-12 rounded-full font-bold text-[13px] transition-all
                                        ${(memberInfo?.points || 0) >= MYSTERY_COST 
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95' 
                                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    เล่นอีกครั้ง
                                </button>
                                <button 
                                    onClick={() => { setShowMysteryBox(false); setMysteryReward(null); }}
                                    className="flex-1 h-12 rounded-full bg-[#1A1A18] text-white font-bold text-[13px] active:scale-95 transition-all shadow-lg shadow-black/10"
                                >
                                    ตกลง
                                </button>
                            </div>
                        </motion.div>
                    )}
                  </div>
                </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}