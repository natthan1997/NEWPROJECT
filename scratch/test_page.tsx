
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, User, Info, X, Check, Loader2
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
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'coupons' | 'history'>('rewards');
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [mysteryBoxState, setMysteryBoxState] = useState<'idle' | 'opening' | 'result'>('idle');
  const [mysteryBoxResult, setMysteryBoxResult] = useState(0);
  const [isPlayingBox, setIsPlayingBox] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
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
      earnRule: `ทุก ${earnRate} บาท = 1 คะแนน`,
      coupons: 'คูปองของฉัน',
      noCoupons: 'ยังไม่มีคูปอง',
      noCouponsDesc: 'คุณยังไม่มีคูปองส่วนลดในขณะนี้',
      useCoupon: 'ใช้คูปอง'
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
      earnRule: `${earnRate} THB = 1 Point`,
      coupons: 'My Coupons',
      noCoupons: 'No coupons available',
      noCouponsDesc: 'You do not have any coupons yet.',
      useCoupon: 'Use Coupon'
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
      earnRule: `${earnRate} 泰铢 = 1 积分`,
      coupons: '我的优惠券',
      noCoupons: '没有优惠券',
      noCouponsDesc: '您还没有任何优惠券。',
      useCoupon: '使用优惠券'
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
  
  const handleLinkPhone = async () => {
    if (!nicknameInput.trim()) {
        alert(dict.locale === 'en' ? 'Please enter your nickname or name' : 'กรุณากรอกชื่อเล่นหรือชื่อเรียก');
        document.getElementById('nickname-input-modal')?.focus();
        return;
    }
    if (phoneInput.length < 9) {
        alert(dict.locale === 'en' ? 'Invalid phone number' : 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
        document.getElementById('phone-input-modal')?.focus();
        return;
    }
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;

    setIsLinkingPhone(true);
    try {
        const res = await fetch('/api/liff/member/link-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId: userId, phone: phoneInput, fullName: nicknameInput })
        });
        const data = await res.json();
        
        if (data.success) {
            alert(dict.locale === 'en' ? 'Phone number linked successfully!' : 'เชื่อมต่อเบอร์โทรศัพท์สำเร็จ!');
            setShowPhoneModal(false);
            fetchData();
        } else {
            alert(data.error || 'Failed to link phone');
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

      // Fetch member vouchers (Coupons)
      try {
        const vouchersRes = await fetch('/api/liff/member/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: userId, memberId: member?.id || userId })
        });
        const vouchersData = await vouchersRes.json();
        if (vouchersData.success) {
          setVouchers(vouchersData.vouchers);
        }
      } catch (err) {
        console.error('Failed to load vouchers', err);
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

  const totalAccumulated = memberInfo?.total_accumulated_points || memberInfo?.points || 0;
  
  let calculatedTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalAccumulated >= tiers[i].minPoints) {
      calculatedTierIndex = i;
      break;
    }
  }

  let retainedTierIndex = 0;
  if (memberInfo?.member_tier && typeof memberInfo.member_tier === 'string') {
    const foundIndex = tiers.findIndex(t => t.name.toLowerCase() === memberInfo.member_tier.toLowerCase());
    if (foundIndex !== -1) retainedTierIndex = foundIndex;
  }

  const effectiveTierIndex = Math.max(calculatedTierIndex, retainedTierIndex);
  const currentTier = tiers[effectiveTierIndex];
  const isMaintaining = retainedTierIndex > calculatedTierIndex;

  const currentCalculatedTier = tiers[calculatedTierIndex];
  const nextTier = calculatedTierIndex < tiers.length - 1 ? tiers[calculatedTierIndex + 1] : null;
  const progressPercent = nextTier ? Math.min(100, Math.max(0, ((totalAccumulated - currentCalculatedTier.minPoints) / (nextTier.minPoints - currentCalculatedTier.minPoints)) * 100)) : 100;

  // Points Bar Logic
  const userPoints = memberInfo?.points || 0;
  const nextReward = rewards.find(r => r.cost_points > userPoints);

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
    <div className="min-h-screen bg-white text-[#111111] font-sans overflow-x-hidden pb-24 selection:bg-gray-200">
      
      {/* 📱 Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-50">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[15px] font-bold tracking-wide text-gray-900">{dict.title}</h1>
          <span className="text-[11px] font-medium text-gray-500">{currentTier.name} Member</span>
        </div>
        
        {/* Redeemable Points on Top Right */}
        <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 -mr-2 shadow-inner">
          <span className="text-[13px] font-black text-gray-900">
            {(memberInfo?.points || 0).toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">PTS</span>
        </div>
      </header>

      <main className="px-5 py-6 space-y-10">
        
        {/* 🟡 Center Donut Chart (Uber Rewards Style) */}
        <section className="flex flex-col items-center justify-center text-center mt-2">
          {/* Profile Restored with Nickname and Phone */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-3 shadow-sm border border-gray-100 relative">
              {lineProfile?.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <User size={24} className="text-gray-300" />
                </div>
              )}
            </div>
            {/* Nickname/Name from DB or fallback to LINE */}
            <h2 className="text-[22px] font-black text-gray-900 leading-tight tracking-tight">
              {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Valued Member'}
            </h2>
            {/* Phone Number */}
            {memberInfo?.phone && (
              <p className="text-[13px] text-gray-500 font-bold mt-1 tracking-widest font-mono">
                {memberInfo.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
              </p>
            )}
          </div>

          {/* Donut Chart (TIER PROGRESS) */}
          <div className="relative w-64 h-64 flex items-center justify-center mt-2 mb-6">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle cx="100" cy="100" r="85" fill="none" stroke="#F3F4F6" strokeWidth="16" />
              {/* Progress Track */}
              <circle
                cx="100" cy="100" r="85" fill="none"
                stroke={currentTier.bgHex || currentTier.barColor || '#EAB308'}
                strokeWidth="16" strokeLinecap="round" strokeDasharray="534"
                strokeDashoffset={534 - (534 * (progressPercent / 100))}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[44px] font-black text-gray-900 tracking-tighter leading-none mb-1">
                {totalAccumulated.toLocaleString()}
              </span>
              <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {nextTier ? `OF ${nextTier.minPoints.toLocaleString()} XP` : `MAX TIER`}
              </span>
            </div>
          </div>
          
          <p className="text-[14px] font-bold text-gray-700">
            {nextTier ? (locale === 'en' ? `Unlock ${nextTier.name} by Dec 31` : `เลื่อนเป็น ${nextTier.name} ภายใน 31 ธ.ค.`) : (locale === 'en' ? 'Maximum Tier Reached' : 'คุณอยู่ระดับสูงสุดแล้ว')}
          </p>
        </section>

        {/* 💳 Next Reward Card (Linear) */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
          {/* Subtle colored accent edge */}
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: currentTier.bgHex || currentTier.barColor }} />
          
          <div className="flex justify-between items-start mb-6 pt-1">
            <div className="pr-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {locale === 'en' ? 'Next Reward' : 'เป้าหมายของรางวัลถัดไป'}
              </p>
              <h3 className="text-[16px] font-black text-gray-900 flex items-start gap-2 leading-tight">
                <span className="w-3 h-3 mt-1 shrink-0 rounded-sm rotate-45 shadow-sm" style={{ backgroundColor: currentTier.bgHex || currentTier.barColor }} />
                <span className="line-clamp-2">{nextReward ? nextReward.name : (locale === 'en' ? 'All Unlocked!' : 'แต้มพร้อมแลกทุกรางวัล!')}</span>
              </h3>
            </div>
            {nextReward && (
              <div className="text-right shrink-0">
                <span className="text-[15px] font-black text-gray-900 block">
                  {userPoints.toLocaleString()} <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">of {nextReward.cost_points.toLocaleString()}</span>
                </span>
                <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  {locale === 'en' ? 'Points' : 'แต้ม'}
                </p>
              </div>
            )}
          </div>

          {nextReward ? (
            <div className="h-3.5 w-full bg-gray-100 rounded-full overflow-hidden mb-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userPoints / nextReward.cost_points) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: currentTier.bgHex || currentTier.barColor || '#EAB308' }}
              />
            </div>
          ) : (
            <div className="h-3.5 w-full bg-gray-100 rounded-full overflow-hidden mb-1 shadow-inner">
              <div className="h-full w-full rounded-full" style={{ backgroundColor: currentTier.bgHex || currentTier.barColor || '#EAB308' }} />
            </div>
          )}

          {!memberInfo?.phone && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-gray-900">{locale === 'en' ? 'Link your phone' : 'เชื่อมต่อเบอร์โทรศัพท์'}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{locale === 'en' ? 'To earn points from store' : 'เพื่อสะสมแต้มจากการสั่งหน้าร้าน'}</p>
                </div>
                <button 
                  onClick={() => setShowPhoneModal(true)}
                  className="text-[11px] bg-gray-900 text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider active:scale-95 transition-transform shadow-md"
                >
                  {locale === 'en' ? 'Link' : 'เชื่อมต่อ'}
                </button>
              </div>
            </div>
          )}
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
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${camp.tag_color} bg-white/60 px-2 py-1 rounded-md mb-2 inline-block`}>
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
              className={`flex-1 pb-3 text-[14px] font-bold transition-colors relative ${activeTab === 'rewards' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {dict.rewardsCatalog}
              {activeTab === 'rewards' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`flex-1 pb-3 text-[14px] font-bold transition-colors relative ${activeTab === 'coupons' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {dict.coupons}
              {activeTab === 'coupons' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 pb-3 text-[14px] font-bold transition-colors relative ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
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
                      <Gift size={24} className="text-gray-300" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-[14px] font-medium text-gray-900 leading-tight mb-1">{reward.name}</h4>
                      <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                        {reward.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : reward.discount_type === 'percent' ? `ลด ${reward.discount_value}%` : `ลด ${reward.discount_value} บาท`}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-[13px] font-medium text-gray-900">{reward.cost_points.toLocaleString()} {dict.pts}</span>
                        
                        <button 
                          onClick={() => handleRedeem(reward.id)}
                          disabled={(memberInfo?.points || 0) < reward.cost_points}
                          className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                            (memberInfo?.points || 0) >= reward.cost_points 
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
            ) : activeTab === 'coupons' ? (
              <motion.div 
                key="coupons"
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {vouchers.length > 0 ? vouchers.map((voucher) => (
                  <div key={voucher.id} className={`relative rounded-xl overflow-hidden shadow-sm flex flex-col bg-white border ${voucher.is_used ? 'border-gray-200 opacity-60' : 'border-amber-100'}`}>
                    {/* Ticket Design */}
                    <div className="flex items-stretch">
                      <div className={`w-1/3 flex flex-col items-center justify-center p-4 border-r border-dashed ${voucher.is_used ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                          {voucher.type === 'percent' ? 'ส่วนลด' : 'มูลค่า'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black">
                            {voucher.type === 'percent' ? voucher.discount_percent : voucher.discount_amount}
                          </span>
                          <span className="text-sm font-bold">
                            {voucher.type === 'percent' ? '%' : '฿'}
                          </span>
                        </div>
                      </div>
                      <div className="w-2/3 p-4 flex flex-col justify-between bg-white relative">
                        {/* Cutouts for ticket effect */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-dashed border-gray-200 z-10" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                        
                        <div>
                          <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-1 pr-4">{voucher.title}</h4>
                          <p className="text-[12px] text-gray-500 line-clamp-2">{voucher.description}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-400">
                            {voucher.expires_at ? `หมดอายุ ${new Date(voucher.expires_at).toLocaleDateString('th-TH')}` : 'ไม่มีวันหมดอายุ'}
                          </span>
                          <button 
                            disabled={voucher.is_used}
                            className={`text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors ${
                              voucher.is_used ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white hover:bg-amber-600'
                            }`}
                          >
                            {voucher.is_used ? 'ใช้แล้ว' : dict.useCoupon}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gift size={24} className="text-gray-300" />
                    </div>
                    <p className="text-[14px] text-gray-400 mb-1">{dict.noCoupons}</p>
                    <p className="text-[13px] text-gray-300">{dict.noCouponsDesc}</p>
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
                          {translateHistoryDescription(item.description, locale as string)}
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
                
                {/* Benefits Section */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-3 uppercase tracking-wider font-semibold">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <Gift size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">{dict.howToEarn}</p>
                        <p className="text-[13px] text-gray-500">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-gray-500">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-[14px] font-medium"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Tiers List */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-4 uppercase tracking-wider font-semibold">สิทธิประโยชน์ตามระดับ</h4>
                  <div className="space-y-6">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="flex gap-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: tier.bgHex || '#F2ECE4', color: tier.textHex || '#1A1A18' }}>
                          {tier.name[0]}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-2">
                            <h4 className="text-[15px] font-bold text-gray-900">{tier.name}</h4>
                            <span className="text-[12px] text-gray-400 font-medium">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                          </div>
                          <ul className="space-y-2">
                            {tier.benefits && tier.benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                                <Check size={16} strokeWidth={2} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👑 CATALOG MODAL */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] max-h-[90vh] overflow-y-auto pb-safe flex flex-col"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 flex items-center justify-between border-b border-gray-50 shrink-0">
                <h3 className="text-[16px] font-medium text-gray-900">แคตตาล็อคฉายา</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  {titles.map((tier, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-shadow ${tier.isUnlocked ? 'bg-white border-gray-200' : 'bg-gray-50 border-transparent grayscale opacity-80'}`}
                    >
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shadow-sm mb-3" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[13px] font-medium text-center text-gray-900 leading-tight mb-1">{tier.name}</h4>
                      
                      {/* Mini Progress */}
                      {!tier.isUnlocked && (
                        <div className="w-full mt-2">
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tier.progress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🏆 BADGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header colored banner */}
              <div className="h-24 w-full flex items-center justify-center relative" style={{ backgroundColor: selectedBadge.bgHex }}>
                <button onClick={() => setSelectedBadge(null)} className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/20 rounded-full text-black/50 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              {/* Avatar floating */}
              <div className="relative flex justify-center -mt-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-bold shadow-lg bg-white border-4 border-white" style={{ backgroundColor: selectedBadge.bgHex, color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 text-center">
                <h3 className="text-[20px] font-bold text-gray-900 mb-1">{selectedBadge.name}</h3>
                
                {selectedBadge.isUnlocked ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[12px] font-medium rounded-full mb-6">
                    <Check size={14} /> ปลดล็อกแล้ว
                  </div>
                ) : (
                  <div className="text-[12px] text-gray-500 mb-6">
                    ยังไม่ปลดล็อก
                  </div>
                )}

                <div className="text-left space-y-5">
                  {/* How to get */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">🎯 ภารกิจรับฉายา</h4>
                    <p className="text-[14px] text-gray-800 leading-relaxed">{selectedBadge.description || `สะสม ${selectedBadge.minPoints} เป้าหมาย`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-gray-500">ความคืบหน้า</span>
                          <span className="font-medium">{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${selectedBadge.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  {selectedBadge.benefits && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                      <h4 className="text-[12px] font-bold text-amber-600 uppercase tracking-wider mb-2">🎁 สิทธิพิเศษ</h4>
                      <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
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
      
      {/* 📱 Phone Link Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPhoneModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10"
            >
              <h3 className="text-xl font-black text-[#1A1A18] mb-2">
                {locale === 'en' ? 'Link Phone Number' : 'เชื่อมต่อเบอร์โทรศัพท์'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {locale === 'en' ? 'Link your phone number to receive points from POS orders.' : 'ระบุเบอร์โทรศัพท์ของคุณเพื่อรับแต้มจากการสั่งซื้อหน้าร้าน (รวมคะแนนอัตโนมัติ)'}
              </p>
              
              <div className="mb-6 space-y-3">
                <input 
                  type="text" 
                  id="nickname-input-modal"
                  value={nicknameInput} 
                  onChange={e => setNicknameInput(e.target.value)} 
                  placeholder={locale === 'en' ? "Nickname / Name" : "ชื่อเล่น / ชื่อเรียก"} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[18px] font-bold text-[#1A1A18] text-center focus:ring-2 focus:ring-black outline-none transition-all placeholder:font-medium" 
                />
                <input 
                  type="tel" 
                  id="phone-input-modal"
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  placeholder="08X-XXX-XXXX" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[18px] font-black text-[#1A1A18] text-center focus:ring-2 focus:ring-black outline-none transition-all" 
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-[#1A1A18] rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  onClick={handleLinkPhone}
                  disabled={isLinkingPhone || phoneInput.length < 9 || !nicknameInput.trim()}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isLinkingPhone ? <Loader2 size={18} className="animate-spin" /> : (locale === 'en' ? 'Link' : 'บันทึก')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}