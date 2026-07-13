
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, User, Info, X, Check, Loader2, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";
import RegistrationForm from './RegistrationForm';

export default function LiffMemberPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [mysteryBoxState, setMysteryBoxState] = useState<'idle' | 'opening' | 'result'>('idle');
  const [mysteryBoxResult, setMysteryBoxResult] = useState(0);
  const [isPlayingBox, setIsPlayingBox] = useState(false);
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBenefits, setShowBenefits] = useState(false);
  const [earnRate, setEarnRate] = useState(100);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

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
      earnRule: `ทุก ${earnRate} บาท = 1 คะแนน`
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
      earnRule: `${earnRate} THB = 1 Point`
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
      earnRule: `${earnRate} 泰铢 = 1 积分`
    }
  };
  const dict = t[(locale as keyof typeof t) || 'th'];

  const [titles, setTitles] = useState<any[]>([]);
  const [activeTitle, setActiveTitle] = useState<any>(null);
  const tiers = React.useMemo(() => [
    { name: 'Bronze', minPoints: 0, bg: 'bg-[#F2ECE4]', text: 'text-[#8C6D53]', barColor: 'bg-[#C19A6B]', bgHex: '#F2ECE4', textHex: '#8C6D53', benefits: [`อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน`, 'รับสิทธิ์ลุ้นกล่องสุ่มเมื่อครบ 50 คะแนน'] },
    { name: 'Silver', minPoints: 500, bg: 'bg-[#F0F2F5]', text: 'text-[#64748B]', barColor: 'bg-[#94A3B8]', bgHex: '#F0F2F5', textHex: '#64748B', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด', 'สิทธิ์สั่งซื้อต้นไม้คอลเลกชันใหม่ล่วงหน้า 12 ชม.'] },
    { name: 'Gold', minPoints: 2000, bg: 'bg-[#FCF7E8]', text: 'text-[#B48529]', barColor: 'bg-[#D4AF37]', bgHex: '#FCF7E8', textHex: '#B48529', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์', 'สิทธิ์ Fast Track ลัดคิวเข้ารับบริการ', 'สิทธิ์สั่งซื้อต้นไม้ Rare Item ล่วงหน้า 24 ชม.'] },
    { name: 'Platinum', minPoints: 5000, bg: 'bg-[#EBF1F5]', text: 'text-[#3E6578]', barColor: 'bg-[#6495ED]', bgHex: '#EBF1F5', textHex: '#3E6578', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์', 'สิทธิ์ Fast Track ขั้นสูงสุด', 'เบอร์ติดต่อสายตรง (Direct Line) ปรึกษาผู้เชี่ยวชาญ 24 ชม.'] }
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
        const { data: history } = await supabase.from('pos_points_history').select('*').in('member_id', [member.id, userId]).order('created_at', { ascending: false });
        if (history) setPointsHistory(history);
      }
      const { data: rewardsData } = await supabase.from('pos_loyalty_coupons').select('*').eq('is_active', true).order('cost_points', { ascending: true });
      if (rewardsData) setRewards(rewardsData);
      if (member) {
        const { data: couponsData } = await supabase.from('pos_member_coupons').select('*').eq('member_id', member.id).order('created_at', { ascending: false });
        if (couponsData) setVouchers(couponsData);
      }
      
      // Fetch smart badges from our new API
      const lineUserId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      try {
        const titlesRes = await fetch('/api/liff/member/titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId, memberId: member?.id || userId })
        });
        const titlesData = await titlesRes.json();
        if (titlesData.success) {
          setActiveTitle(titlesData.activeTitle);
          setTitles(titlesData.titles.map((t: any) => ({
            name: t.name,
            minPoints: t.rule_threshold, // used for progress threshold
            bgHex: t.badge_color || '#F2ECE4',
            textHex: '#1A1A18',
            barHex: '#1A1A18',
            description: t.description || '',
            benefits: t.benefits || '',
            isUnlocked: t.isUnlocked,
            progress: t.progress,
            currentValue: t.currentValue
          })));
        }
      } catch (err) {
        console.error('Failed to load smart badges', err);
      }
      
      const { data: campData, error: campError } = await supabase.from('pos_loyalty_campaigns').select('*').eq('is_active', true);
      if (campData && !campError && campData.length > 0) {
        const defaultGradients = [
          { from: 'from-orange-100', to: 'to-amber-50', text: 'text-orange-900', tag: 'text-orange-800' },
          { from: 'from-blue-100', to: 'to-cyan-50', text: 'text-blue-900', tag: 'text-blue-800' },
          { from: 'from-purple-100', to: 'to-pink-50', text: 'text-purple-900', tag: 'text-purple-800' },
          { from: 'from-emerald-100', to: 'to-teal-50', text: 'text-emerald-900', tag: 'text-emerald-800' },
        ];
        
        setCampaigns(campData.map((c, i) => {
          const style = defaultGradients[i % defaultGradients.length];
          return {
            ...c,
            title: c.name,
            description: c.applicable_categories && c.applicable_categories.length > 0 ? `เฉพาะหมวด: ${c.applicable_categories.join(', ')}` : 'ทุกหมวดหมู่',
            bg_gradient_from: style.from,
            bg_gradient_to: style.to,
            text_color: style.text,
            tag_color: style.tag,
            icon: '✨',
            type_tag: `แต้ม x${c.multiplier}`
          };
        }));
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

  const handleRedeem = async (couponId: string) => {
    if (!confirm(locale === 'en' ? 'Confirm redemption?' : 'ยืนยันการแลกคูปองนี้ใช่หรือไม่?')) return;
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
        alert(locale === 'en' ? 'Redeemed successfully! Coupon added to your account.' : 'แลกคูปองสำเร็จ! คูปองถูกเก็บไว้ในบัญชีของคุณแล้ว');
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

  useEffect(() => {
    if (!liffLoading) fetchData();
    
    const channel = supabase.channel('member_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_points_history' }, () => {
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

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/liff/menu');
    }
  };

  const translateHistoryDescription = (desc: string | undefined | null, locale: string) => {
    if (!desc) return locale === 'en' ? 'General Transaction' : locale === 'zh' ? '一般交易' : 'รายการทั่วไป';
    if (desc.includes('Earned from POS Order #')) {
        const orderNum = desc.split('#')[1] || '';
        return locale === 'en' ? `Earned from Order #${orderNum}` : locale === 'zh' ? `从订单获得积分 #${orderNum}` : `ได้รับจากออเดอร์ #${orderNum}`;
    }
    if (desc.includes('Redeemed') && desc.includes('pts for POS Order #')) {
        const match = desc.match(/Redeemed (\d+) pts for POS Order #(.+)/);
        if (match) {
            return locale === 'en' ? `Redeemed ${match[1]} pts for Order #${match[2]}` : locale === 'zh' ? `兑换 ${match[1]} 积分于订单 #${match[2]}` : `ใช้ ${match[1]} แต้มกับออเดอร์ #${match[2]}`;
        }
    }
    if (desc === 'Claimed via QR Code') {
        return locale === 'en' ? 'Claimed via QR Code' : locale === 'zh' ? '通过二维码领取' : 'สแกนรับแต้มจาก QR Code';
    }
    return desc;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans overflow-x-hidden pb-24 selection:bg-gray-200">
      
      {/* 📱 Ultra Clean Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[16px] font-medium tracking-tight text-gray-900">{dict.title}</h1>
        </div>
        <div className="w-6"></div>
      </header>

      <main className="px-5 pt-8 relative z-10 max-w-lg mx-auto flex flex-col gap-8">
        
        {/* 🟡 Minimal Profile Row */}
        <motion.section 
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-4 px-1"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200/50">
            {lineProfile?.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight leading-tight">
                {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}
              </h2>
              {/* Badge Next to Name */}
              {activeTitle && (
                <button 
                  onClick={() => setShowCatalog(true)}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 border border-gray-100/50"
                  style={{ backgroundColor: activeTitle.bgHex || '#F5F5F5', color: activeTitle.textHex || '#1A1A18' }}
                >
                  {activeTitle.name}
                  <ChevronRight size={12} className="opacity-50" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500 font-mono tracking-wide">
                {memberInfo?.phone ? memberInfo.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : ''}
              </span>
              {!activeTitle && (
                <>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setShowCatalog(true)} className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    ดูฉายา
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* ✨ Clean Unified Tier Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full flex flex-col"
        >
          <div 
            className="p-7 rounded-[24px] relative z-10 flex flex-col overflow-hidden shadow-sm border border-black/5" 
            style={{ backgroundColor: currentTier.bgHex || '#F5F5F5' }}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 backdrop-blur-md mb-4 border border-white/40 shadow-sm">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTier.textHex || '#1A1A18' }}></span>
                  <span className="text-[12px] font-bold tracking-wider uppercase" style={{ color: currentTier.textHex || '#1A1A18' }}>
                    {currentTier.name} Member
                  </span>
                </div>
                <p className="text-[13px] font-medium tracking-wide mb-1 opacity-70" style={{ color: currentTier.textHex || '#1A1A18' }}>
                  {locale === 'en' ? 'Your Balance' : 'คะแนนสะสม'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[46px] leading-none font-bold tracking-tight" style={{ color: currentTier.textHex || '#1A1A18' }}>
                    {(memberInfo?.points || 0).toLocaleString()}
                  </span>
                  <span className="text-[15px] font-medium opacity-90" style={{ color: currentTier.textHex || '#1A1A18' }}>pts</span>
                </div>
                <p className="text-[13px] font-medium mt-1.5 opacity-80" style={{ color: currentTier.textHex || '#1A1A18' }}>
                  = ฿{((memberInfo?.points || 0) / 10).toFixed(2)} credit
                </p>
              </div>
              
              <button 
                onClick={() => setShowBenefits(true)}
                className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center border border-white/40 hover:bg-white/80 transition-all shadow-sm"
                style={{ color: currentTier.textHex || '#1A1A18' }}
              >
                <Info size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Progress Section */}
            <div className="relative z-10">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[13px] font-semibold opacity-90" style={{ color: currentTier.textHex || '#1A1A18' }}>
                  {nextTier ? `${(nextTier.minPoints - totalAccumulated).toLocaleString()} pts to ${nextTier.name}` : 'Max Tier Reached'}
                </span>
              </div>
              
              <div className="w-full h-[6px] rounded-full overflow-hidden bg-white/60 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, progressPercent)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full" 
                  style={{ backgroundColor: currentTier.textHex || '#1A1A18' }}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center">
                <p className="text-[11px] font-medium opacity-50 uppercase tracking-widest" style={{ color: currentTier.textHex || '#1A1A18' }}>
                  {locale === 'en' ? 'Member Since' : 'เป็นสมาชิกตั้งแต่'}
                </p>
                <p className="text-[12px] font-semibold opacity-80" style={{ color: currentTier.textHex || '#1A1A18' }}>
                  {new Date(memberInfo?.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 📢 Minimal Campaigns */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="-mx-5"
        >
          <div className="px-5 mb-4">
            <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight">{locale === 'en' ? 'Campaigns' : 'แคมเปญพิเศษ'}</h3>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {!memberInfo?.phone && (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPhoneModal(true)}
                className="min-w-[240px] snap-center bg-white border border-gray-100 rounded-[20px] p-5 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Action Required</span>
                  <h4 className="text-[15px] font-medium text-gray-900 mb-1">{locale === 'en' ? 'Link your phone' : 'เชื่อมต่อเบอร์โทรศัพท์'}</h4>
                  <p className="text-[12px] text-gray-500">{locale === 'en' ? 'Earn points automatically' : 'เพื่อสะสมแต้มอัตโนมัติ'}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            )}

            {campaigns.map((camp) => (
              <motion.div 
                key={camp.id} 
                whileTap={{ scale: 0.98 }}
                onClick={() => { if (camp.title.includes('กล่องสุ่ม')) setShowMysteryBox(true); }}
                className="min-w-[240px] snap-center bg-white border border-gray-100 rounded-[20px] p-5 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{camp.type_tag}</span>
                    <span className="text-xl grayscale opacity-40">{camp.icon}</span>
                  </div>
                  <h4 className="text-[15px] font-medium text-gray-900 mb-1">{camp.title}</h4>
                  <p className="text-[12px] text-gray-500 line-clamp-2">{camp.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 🪄 Minimal Tabs Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="min-h-[500px]"
        >
          {/* Clean Underline Tabs */}
          <div className="flex border-b border-gray-100 mb-6">
            {['rewards', 'coupons', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[14px] font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {tab === 'rewards' ? dict.rewardsCatalog : tab === 'coupons' ? (locale === 'en' ? 'Coupons' : 'คูปอง') : dict.pointsHistory}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline" 
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gray-900 rounded-t-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'rewards' ? (
              <motion.div 
                key="rewards"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {rewards.length > 0 ? rewards.map((reward) => (
                  <div key={reward.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-[20px]">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100/50">
                      <Gift size={24} className="text-gray-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <h4 className="text-[14px] font-medium text-gray-900 leading-tight mb-1">{reward.name}</h4>
                      <p className="text-[12px] text-gray-500 mb-3">
                        {reward.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : reward.discount_type === 'percent' ? `ลด ${reward.discount_value}%` : `ลด ${reward.discount_value} บาท`}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                           <span className="text-[13px] font-medium text-[#8C6D23]">{reward.cost_points.toLocaleString()} pts</span>
                        </div>
                        
                        <button 
                          onClick={() => handleRedeem(reward.id)}
                          disabled={(memberInfo?.points || 0) < reward.cost_points}
                          className={`text-[12px] font-medium px-4 py-2 rounded-full transition-all ${
                            (memberInfo?.points || 0) >= reward.cost_points 
                            ? 'bg-gray-900 text-white active:scale-95' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {dict.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-gray-400 text-[13px]">
                    {dict.noRewards}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'coupons' ? (
              <motion.div 
                key="coupons"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {vouchers.length > 0 ? vouchers.map((voucher) => (
                  <div key={voucher.id} className={`flex border rounded-[20px] overflow-hidden bg-white ${voucher.status !== 'active' ? 'border-gray-100 opacity-60 grayscale' : 'border-gray-200'}`}>
                    <div className="w-[80px] bg-gray-50 border-r border-dashed border-gray-200 flex flex-col items-center justify-center p-4">
                      <span className="text-xl font-light text-gray-900">
                        {voucher.discount_type === 'percent' ? voucher.discount_value : voucher.discount_type === 'free_item' ? 'FREE' : voucher.discount_value}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                        {voucher.discount_type === 'percent' ? '%' : voucher.discount_type === 'free_item' ? 'ITEM' : 'THB'}
                      </span>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[14px] font-medium text-gray-900 mb-1">{voucher.coupon_name}</h4>
                        <p className="text-[12px] text-gray-500">
                           {voucher.discount_type === 'free_item' ? 'คูปองแลกสินค้าฟรี' : 'คูปองส่วนลด'}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {new Date(voucher.created_at).toLocaleDateString('en-GB')}
                        </span>
                        <button 
                          disabled={voucher.status !== 'active'}
                          className={`text-[11px] font-medium px-4 py-1.5 rounded-full ${
                            voucher.status !== 'active' ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white'
                          }`}
                        >
                          {voucher.status !== 'active' ? 'Used' : 'Ready to use'}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-gray-400 text-[13px]">
                    ไม่มีคูปองส่วนลดในขณะนี้
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="space-y-0"
              >
                {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-[14px] font-medium text-gray-900 mb-1">
                        {item.description}
                      </p>
                      <p className="text-[12px] text-gray-400">
                        {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[15px] font-medium ${item.type === 'earn' ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <div className="py-20 text-center text-gray-400 text-[13px]">
                    {dict.noHistory}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* 👑 Clean Bottom Sheet - Benefits */}
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
              className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAFAFA] rounded-t-[32px] max-h-[90vh] overflow-y-auto pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
            >
              <div className="sticky top-0 bg-[#FAFAFA]/90 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-gray-200">
                <h3 className="text-[15px] font-medium text-gray-900">ฉายาของคุณ</h3>
                <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-900 p-1">
                  <X size={20} strokeWidth={2} />
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
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-medium mb-3" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[13px] font-medium text-gray-900 mb-1">{tier.name}</h4>
                      
                      {!tier.isUnlocked && (
                        <div className="w-full mt-2 h-[2px] bg-gray-100 rounded-full overflow-hidden">
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-[60] w-[85%] max-w-sm bg-white rounded-[24px] overflow-hidden"
            >
              <div className="h-20 w-full flex items-center justify-between px-5" style={{ backgroundColor: selectedBadge.bgHex }}>
                <div className="w-6"></div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold bg-white" style={{ color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
                <button onClick={() => setSelectedBadge(null)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 text-center">
                <h3 className="text-[18px] font-medium text-gray-900 mb-1">{selectedBadge.name}</h3>
                
                <div className="text-[12px] text-gray-400 mb-6">
                  {selectedBadge.isUnlocked ? 'Unlocked' : 'Locked'}
                </div>

                <div className="text-left space-y-4">
                  <div>
                    <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Requirement</h4>
                    <p className="text-[13px] text-gray-700">{selectedBadge.description || `สะสม ${selectedBadge.minPoints} เป้าหมาย`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-300" style={{ width: `${selectedBadge.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedBadge.benefits && (
                    <div className="pt-4 border-t border-gray-50">
                      <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Benefits</h4>
                      <p className="text-[13px] text-gray-700 whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎁 Clean Mystery Box */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" 
              onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] p-8 text-center"
            >
              <button onClick={() => setShowMysteryBox(false)} disabled={mysteryBoxState === 'opening'} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-16 h-16 mx-auto bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-5">
                    <span>🎁</span>
                  </div>
                  <h3 className="text-[16px] font-medium text-gray-900 mb-2">Mystery Box</h3>
                  <p className="text-gray-500 text-[13px] mb-6 px-2">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back!' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่มลุ้นแต้มคืนสูงสุด 500 แต้ม'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-[16px] font-medium text-[14px] hover:bg-black active:scale-95 disabled:opacity-50"
                  >
                    Open (50 Pts)
                  </button>
                </motion.div>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-8">
                  <motion.div animate={{ rotate: [-5, 5, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="text-5xl">
                    🎁
                  </motion.div>
                  <h3 className="text-[14px] font-medium text-gray-400 mt-6 animate-pulse">Opening...</h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-2">
                  <div className="text-5xl mb-4">{mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}</div>
                  <h3 className="text-[18px] font-medium text-gray-900 mb-1">
                    {mysteryBoxResult > 50 ? 'JACKPOT!' : mysteryBoxResult === 50 ? 'Nice!' : 'Ouch!'}
                  </h3>
                  <div className="text-gray-900 font-bold text-3xl mb-6">
                    +{mysteryBoxResult} <span className="text-sm font-medium text-gray-400">PTS</span>
                  </div>
                  <button
                    onClick={() => { setMysteryBoxState('idle'); setShowMysteryBox(false); }}
                    className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-[16px] font-medium text-[14px] hover:bg-gray-200"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}