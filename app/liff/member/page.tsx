
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

export default function LiffMemberPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden pb-24 selection:bg-white/20 relative">
      
      {/* 🔮 Ambient Background Glow */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[120%] h-[50vh] blur-[120px] opacity-20 pointer-events-none rounded-full"
        style={{ background: `radial-gradient(circle, ${currentTier.bgHex || '#F5E6C4'} 0%, transparent 70%)` }}
      />
      <div className="fixed bottom-[-10%] right-[-10%] w-[100%] h-[40vh] bg-blue-900/10 blur-[100px] pointer-events-none rounded-full" />

      {/* 📱 Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/60 backdrop-blur-3xl px-5 py-4 flex items-center justify-between border-b border-white/5 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-white/70 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[16px] font-black tracking-tight text-white">{dict.title}</h1>
          <span className="text-[11px] font-bold uppercase tracking-widest opacity-80" style={{ color: currentTier.textHex || '#FFF' }}>
            {currentTier.name}
          </span>
        </div>
        
        {/* Redeemable Points */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 -mr-2 shadow-inner border border-white/5 backdrop-blur-md"
        >
          <Sparkles size={12} className="text-amber-300" />
          <span className="text-[13px] font-black text-white tracking-wide">
            {(memberInfo?.points || 0).toLocaleString()}
          </span>
        </motion.div>
      </header>

      <main className="space-y-6 px-5 pt-8 relative z-10">
        
        {/* 🟡 HERO SECTION: Profile & Capsule Progress */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-8"
        >
          {/* Profile Avatar */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="relative mb-6"
          >
            {/* Outer Rotating Glow */}
            <div className="absolute -inset-2 rounded-full opacity-30 animate-[spin_10s_linear_infinite] blur-xl" style={{ backgroundImage: `conic-gradient(from 0deg, transparent, ${currentTier.bgHex || '#fff'}, transparent)` }}></div>
            
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border-[3px] border-white/20 relative z-10 bg-black/50 backdrop-blur-sm p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                {lineProfile?.pictureUrl ? (
                  <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-white/30" />
                )}
              </div>
            </div>

            {/* Floating Tier Badge */}
            <div 
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-[#0A0A0A] flex items-center justify-center text-[14px] font-black shadow-lg z-20"
              style={{ backgroundColor: currentTier.bgHex || '#fff', color: currentTier.textHex || '#000' }}
            >
              {currentTier.name[0]}
            </div>
          </motion.div>
          
          <h2 className="text-[26px] font-black text-white leading-tight tracking-tight mb-1 text-center drop-shadow-md">
            {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Valued Member'}
          </h2>
          {memberInfo?.phone && (
            <p className="text-[13px] text-white/50 font-bold tracking-widest font-mono bg-white/5 px-3 py-1 rounded-full mt-2">
              {memberInfo.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
            </p>
          )}

          {/* ✨ Premium Glass Capsule Progress Bar */}
          <div className="w-full mt-10 relative">
            <div className="flex justify-between items-end mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-white/70 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {currentTier.name}
                </span>
              </div>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                {nextTier ? nextTier.name : 'MAX'}
              </span>
            </div>

            {/* Capsule Track */}
            <div className="h-10 w-full bg-white/5 border border-white/10 rounded-full relative p-1 shadow-inner backdrop-blur-md">
              {/* Fill */}
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(10, progressPercent)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full relative overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                style={{ backgroundColor: currentTier.bgHex || '#fff' }}
              >
                {/* Shine effect inside fill */}
                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/40 to-transparent"></div>
              </motion.div>
              
              {/* Floating Points Tooltip on the bar */}
              <motion.div 
                initial={{ left: '10%', opacity: 0 }}
                animate={{ left: `${Math.max(10, progressPercent)}%`, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="absolute top-1/2 -translate-y-1/2 -ml-[20px] bg-[#0A0A0A] border border-white/20 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg z-10 flex items-center justify-center min-w-[40px]"
              >
                {totalAccumulated.toLocaleString()}
              </motion.div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-[13px] font-medium text-white/60">
                {nextTier ? (
                  <>
                    <span className="text-[15px] font-black text-white mr-1 drop-shadow-sm">{(nextTier.minPoints - totalAccumulated).toLocaleString()}</span> 
                    {locale === 'en' ? 'pts to' : 'แต้มเพื่ออัปเกรดเป็น'} 
                    <span className="font-bold ml-1 text-white opacity-90">{nextTier.name}</span>
                  </>
                ) : (
                  <span className="text-[14px] font-black text-amber-300 drop-shadow-md">{locale === 'en' ? 'Maximum Tier Reached' : 'คุณอยู่ระดับสูงสุดแล้ว'}</span>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ⚡️ Quick Actions (Glass Buttons) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowBenefits(true)}
            className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-3 backdrop-blur-xl shadow-lg"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/90 shadow-inner border border-white/5">
              <Info size={20} />
            </div>
            <span className="text-[13px] font-bold text-white/80 tracking-wide">{dict.benefitsTitle}</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCatalog(true)}
            className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-3 backdrop-blur-xl shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/20 blur-xl rounded-full"></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center text-amber-400 shadow-inner border border-amber-500/20 z-10">
              <Sparkles size={20} />
            </div>
            <span className="text-[13px] font-bold text-white/80 tracking-wide z-10">ฉายาของฉัน</span>
          </motion.button>
        </motion.section>

        {/* 📢 Special Campaigns / Gamification (Neon Cards) */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="space-y-4 pt-4 -mx-5"
        >
          <div className="flex items-center justify-between px-5">
            <h3 className="text-[14px] font-black text-white/90 uppercase tracking-widest">{locale === 'en' ? 'Special Campaigns' : 'แคมเปญพิเศษ'}</h3>
          </div>
          
          <div 
            className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory px-5" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {!memberInfo?.phone && (
              <motion.div 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPhoneModal(true)}
                className="min-w-[280px] snap-center bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden cursor-pointer backdrop-blur-xl"
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/20 px-3 py-1.5 rounded-full mb-4 inline-block backdrop-blur-md shadow-sm border border-white/10">
                    {locale === 'en' ? 'Action Required' : 'ภารกิจ'}
                  </span>
                  <h4 className="text-[18px] font-black text-white leading-tight mb-1 drop-shadow-sm">{locale === 'en' ? 'Link your phone' : 'เชื่อมต่อเบอร์โทรศัพท์'}</h4>
                  <p className="text-[13px] text-white/60 font-medium">{locale === 'en' ? 'To earn points from store' : 'เพื่อสะสมแต้มอัตโนมัติจากการสั่งหน้าร้าน'}</p>
                </div>
                <div className="mt-6 flex justify-end relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/5 hover:bg-white/20 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            )}

            {campaigns.map((camp) => (
              <motion.div 
                key={camp.id} 
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (camp.title.includes('กล่องสุ่ม')) setShowMysteryBox(true); }}
                className="min-w-[280px] snap-center rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden cursor-pointer backdrop-blur-xl border border-white/10"
                style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))` }}
              >
                {/* Background glow based on campaign type */}
                <div className={`absolute top-0 left-0 w-full h-full opacity-20 bg-gradient-to-br ${camp.bg_gradient_from} ${camp.bg_gradient_to} blur-xl`}></div>
                
                <div className="absolute -right-2 -bottom-2 text-8xl opacity-10 drop-shadow-lg grayscale">{camp.icon}</div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/10 px-3 py-1.5 rounded-full mb-4 inline-block backdrop-blur-md shadow-sm border border-white/10">
                    {camp.type_tag}
                  </span>
                  <h4 className="text-[18px] font-black text-white leading-tight mb-1 drop-shadow-sm">{camp.title}</h4>
                  <p className="text-[13px] text-white/60 font-medium">{camp.description}</p>
                </div>
                {camp.title.includes('กล่องสุ่ม') && (
                   <div className="mt-6 flex justify-end relative z-10">
                     <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md flex items-center gap-1.5 border border-white/10 hover:bg-white/20 transition-colors">
                       <span className="text-[13px] font-bold text-white">เปิดกล่องเลย</span>
                       <Gift size={14} className="text-white/70" />
                     </div>
                   </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 🪄 Sleek Tabs Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] min-h-[500px] shadow-2xl border border-white/10 pt-8 px-5 pb-10"
        >
          {/* Tab Selector */}
          <div className="flex mb-8 bg-black/40 p-1.5 rounded-full relative border border-white/5 shadow-inner">
            {['rewards', 'coupons', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[13px] font-black capitalize transition-colors relative z-10 ${activeTab === tab ? 'text-black' : 'text-white/50 hover:text-white/80'}`}
              >
                {tab === 'rewards' ? dict.rewardsCatalog : tab === 'coupons' ? dict.coupons : dict.pointsHistory}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabBackground" 
                    className="absolute inset-0 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'rewards' ? (
              <motion.div 
                key="rewards"
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: -10 }} 
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {rewards.length > 0 ? rewards.map((reward) => (
                  <div key={reward.id} className="group flex gap-4 p-4 rounded-[2rem] bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all">
                    <div className="w-24 h-24 bg-white/5 rounded-[1.5rem] overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform border border-white/5">
                      <Gift size={28} className="text-white/30" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <h4 className="text-[16px] font-black text-white leading-tight mb-1.5">{reward.name}</h4>
                      <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed mb-4 font-medium">
                        {reward.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : reward.discount_type === 'percent' ? `ลด ${reward.discount_value}%` : `ลด ${reward.discount_value} บาท`}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                           <Sparkles size={14} className="text-amber-400" />
                           <span className="text-[13px] font-black text-white">{reward.cost_points.toLocaleString()}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleRedeem(reward.id)}
                          disabled={(memberInfo?.points || 0) < reward.cost_points}
                          className={`text-[12px] font-black px-5 py-2.5 rounded-full transition-all ${
                            (memberInfo?.points || 0) >= reward.cost_points 
                            ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95' 
                            : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          {dict.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                      <Gift size={32} className="text-white/20" />
                    </div>
                    <p className="text-[16px] font-black text-white mb-2">{dict.noRewards}</p>
                    <p className="text-[13px] text-white/40">{dict.checkBackLater}</p>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'coupons' ? (
              <motion.div 
                key="coupons"
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: -10 }} 
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {vouchers.length > 0 ? vouchers.map((voucher) => (
                  <div key={voucher.id} className={`relative rounded-[2rem] overflow-hidden flex flex-col backdrop-blur-xl transition-all ${voucher.is_used ? 'bg-white/5 border-white/5 opacity-50 grayscale' : 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-amber-500/40'}`} style={{ borderWidth: '1px' }}>
                    <div className="flex items-stretch h-full">
                      <div className={`w-[110px] flex flex-col items-center justify-center p-5 border-r border-dashed ${voucher.is_used ? 'border-white/10 text-white/30' : 'border-amber-500/30 text-amber-400'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">
                          {voucher.type === 'percent' ? 'ส่วนลด' : 'มูลค่า'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black tracking-tighter drop-shadow-md">
                            {voucher.type === 'percent' ? voucher.discount_percent : voucher.discount_amount}
                          </span>
                          <span className="text-sm font-bold opacity-80">
                            {voucher.type === 'percent' ? '%' : '฿'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between relative bg-black/20">
                        {/* Cutout notch */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0A0A0A] rounded-full border-r border-dashed border-amber-500/30 z-10" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                        
                        <div>
                          <h4 className="text-[16px] font-black text-white leading-tight mb-2 pr-2">{voucher.title}</h4>
                          <p className="text-[13px] text-white/60 line-clamp-2 font-medium">{voucher.description}</p>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/40 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                            {voucher.expires_at ? `Exp: ${new Date(voucher.expires_at).toLocaleDateString('en-GB')}` : 'No Expiry'}
                          </span>
                          <button 
                            disabled={voucher.is_used}
                            className={`text-[12px] font-black px-6 py-2.5 rounded-full transition-all ${
                              voucher.is_used ? 'bg-white/10 text-white/40' : 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-400 active:scale-95'
                            }`}
                          >
                            {voucher.is_used ? 'ใช้แล้ว' : dict.useCoupon}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                      <Gift size={32} className="text-white/20" />
                    </div>
                    <p className="text-[16px] font-black text-white mb-2">{dict.noCoupons}</p>
                    <p className="text-[13px] text-white/40">{dict.noCouponsDesc}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: -10 }} 
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-3 rounded-2xl">
                    <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center border ${item.type === 'earn' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                        {item.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-white leading-tight mb-1 drop-shadow-sm">
                          {translateHistoryDescription(item.description, locale as string)}
                        </p>
                        <p className="text-[12px] text-white/40 font-medium">
                          {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[16px] font-black tracking-tight ${item.type === 'earn' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-white'}`}>
                      {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <div className="py-24 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                      <History size={32} className="text-white/20" />
                    </div>
                    <p className="text-[16px] font-black text-white mb-2">{dict.noHistory}</p>
                    <p className="text-[13px] text-white/40">{dict.historyEmpty}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* 👑 Dark Premium Benefits Bottom Sheet */}
      <AnimatePresence>
        {showBenefits && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBenefits(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-[#111]/90 backdrop-blur-xl z-10 px-6 py-6 flex items-center justify-between border-b border-white/5">
                <h3 className="text-[18px] font-black text-white">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 -mr-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <h4 className="text-[12px] text-white/40 mb-4 uppercase tracking-widest font-black">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-black/50 rounded-[2rem] p-6 space-y-5 border border-white/5 shadow-inner">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-amber-400">
                        <Gift size={20} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[14px] font-bold text-white">{dict.howToEarn}</p>
                        <p className="text-[13px] text-white/50 mt-1">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-blue-400">
                        <User size={20} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[14px] font-bold text-white">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-white/50 mt-1">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-4 py-4 bg-white/10 text-white rounded-2xl text-[14px] font-black hover:bg-white/20 transition-colors border border-white/5"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>

                <hr className="border-white/5" />

                <div>
                  <h4 className="text-[12px] text-white/40 mb-6 uppercase tracking-widest font-black">สิทธิประโยชน์ตามระดับ</h4>
                  <div className="space-y-6">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="flex gap-4 items-start bg-black/20 p-4 rounded-[2rem] border border-white/5">
                        <div className="w-14 h-14 rounded-3xl flex-shrink-0 flex items-center justify-center text-[16px] font-black uppercase tracking-wider shadow-lg border border-white/20" style={{ backgroundColor: tier.bgHex || '#F2ECE4', color: tier.textHex || '#1A1A18' }}>
                          {tier.name[0]}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-baseline gap-2 mb-3">
                            <h4 className="text-[16px] font-black text-white">{tier.name}</h4>
                            <span className="text-[12px] text-white/40 font-bold">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                          </div>
                          <ul className="space-y-3">
                            {tier.benefits && tier.benefits.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/70 font-medium">
                                <Check size={16} strokeWidth={3} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{b}</span>
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

      {/* 👑 DARK CATALOG MODAL */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto pb-safe flex flex-col"
            >
              <div className="sticky top-0 bg-[#111]/90 backdrop-blur-xl z-10 px-6 py-6 flex items-center justify-between border-b border-white/5 shrink-0">
                <h3 className="text-[18px] font-black text-white">แคตตาล็อคฉายา</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 -mr-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  {titles.map((tier, idx) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-[2rem] border shadow-lg cursor-pointer transition-all ${tier.isUnlocked ? 'bg-black/50 border-white/10' : 'bg-black/20 border-white/5 grayscale opacity-50'}`}
                    >
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-[24px] font-black shadow-inner border border-white/20 mb-4" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[14px] font-bold text-center text-white leading-tight mb-1">{tier.name}</h4>
                      
                      {/* Mini Progress */}
                      {!tier.isUnlocked && (
                        <div className="w-full mt-4">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tier.progress}%` }}></div>
                          </div>
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

      {/* 🏆 DARK BADGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm bg-[#1A1A1A] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
            >
              {/* Header colored banner */}
              <div className="h-32 w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: selectedBadge.bgHex }}>
                <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 transition-colors backdrop-blur-md z-10">
                  <X size={20} />
                </button>
              </div>
              
              {/* Avatar floating */}
              <div className="relative flex justify-center -mt-12">
                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-[36px] font-black shadow-2xl bg-[#1A1A1A] border-4 border-[#1A1A1A] relative z-10" style={{ backgroundColor: selectedBadge.bgHex, color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
              </div>

              <div className="px-6 pb-8 pt-6 text-center">
                <h3 className="text-[22px] font-black text-white mb-3 drop-shadow-md">{selectedBadge.name}</h3>
                
                {selectedBadge.isUnlocked ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[13px] font-black rounded-full mb-6 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    <Check size={16} strokeWidth={3} /> ปลดล็อกแล้ว
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 text-white/40 border border-white/5 text-[13px] font-bold rounded-full mb-6">
                    ยังไม่ปลดล็อก
                  </div>
                )}

                <div className="text-left space-y-4">
                  {/* How to get */}
                  <div className="bg-black/40 rounded-3xl p-5 border border-white/5 shadow-inner">
                    <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-amber-400" /> ภารกิจรับฉายา
                    </h4>
                    <p className="text-[14px] font-medium text-white/80 leading-relaxed">{selectedBadge.description || `สะสม ${selectedBadge.minPoints} เป้าหมาย`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-5">
                        <div className="flex justify-between text-[12px] mb-2 font-bold">
                          <span className="text-white/40">ความคืบหน้า</span>
                          <span className="text-white">{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${selectedBadge.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  {selectedBadge.benefits && (
                    <div className="bg-amber-500/10 rounded-3xl p-5 border border-amber-500/20">
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gift size={14} /> สิทธิพิเศษ
                      </h4>
                      <p className="text-[14px] font-medium text-amber-100/80 leading-relaxed whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🎁 NEON MYSTERY BOX MODAL */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[3rem] p-8 overflow-hidden text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setShowMysteryBox(false)} 
                disabled={mysteryBoxState === 'opening'}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 border border-white/5"
              >
                <X size={20} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-center text-6xl mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden">
                    <span className="relative z-10 drop-shadow-md">🎁</span>
                  </div>
                  <h3 className="text-[24px] font-black text-white tracking-tight mb-2 drop-shadow-md">
                    {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มหรรษา'}
                  </h3>
                  <p className="text-white/50 text-[14px] font-medium mb-8 leading-relaxed px-4">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back! (Up to 500 Pts)' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่ม ลุ้นรับแต้มคืนสูงสุด 500 แต้ม!'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-[15px] uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {(memberInfo?.points || 0) < 50 ? (locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ') : (locale === 'en' ? 'Open Box (50 Pts)' : 'เปิดกล่อง (50 แต้ม)')}
                  </button>
                </motion.div>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-10">
                  <motion.div 
                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-amber-500/40 to-orange-500/20 rounded-[2rem] flex items-center justify-center text-7xl shadow-[0_0_40px_rgba(245,158,11,0.4)] border border-amber-500/40"
                  >
                    <span className="drop-shadow-lg">🎁</span>
                  </motion.div>
                  <h3 className="text-[20px] font-black text-white tracking-tight mt-10 animate-pulse drop-shadow-md">
                    {locale === 'en' ? 'Opening...' : 'กำลังเปิดกล่อง...'}
                  </h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-32 h-32 mx-auto bg-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center mb-8 relative border border-emerald-500/40 shadow-[0_0_40px_rgba(52,211,153,0.3)]"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-7xl font-black drop-shadow-lg"
                    >
                      {mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-[24px] font-black text-white tracking-tight mb-2 drop-shadow-md">
                    {mysteryBoxResult > 50 ? (locale === 'en' ? 'JACKPOT!' : 'แจ็คพอตแตก!') : mysteryBoxResult === 50 ? (locale === 'en' ? 'Nice!' : 'ดีเลย!') : (locale === 'en' ? 'Ouch!' : 'ได้เกลือออ!')}
                  </h3>
                  <div className="text-emerald-400 font-black text-5xl mb-8 tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                    +{mysteryBoxResult} <span className="text-2xl opacity-70">PTS</span>
                  </div>
                  <button
                    onClick={() => {
                      setMysteryBoxState('idle');
                      setShowMysteryBox(false);
                    }}
                    className="w-full py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-[15px] uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all"
                  >
                    {locale === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 📱 DARK Phone Link Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPhoneModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                 <Zap size={28} />
              </div>
              <h3 className="text-[22px] font-black text-white mb-2 leading-tight drop-shadow-md">
                {locale === 'en' ? 'Link Phone Number' : 'เชื่อมต่อเบอร์โทรศัพท์'}
              </h3>
              <p className="text-[14px] text-white/50 font-medium mb-8 leading-relaxed">
                {locale === 'en' ? 'Link your phone number to receive points from POS orders.' : 'ระบุเบอร์โทรศัพท์ของคุณเพื่อรับแต้มจากการสั่งซื้อหน้าร้าน (รวมคะแนนอัตโนมัติ)'}
              </p>
              
              <div className="mb-8 space-y-4">
                <input 
                  type="text" 
                  id="nickname-input-modal"
                  value={nicknameInput} 
                  onChange={e => setNicknameInput(e.target.value)} 
                  placeholder={locale === 'en' ? "Nickname / Name" : "ชื่อเล่น / ชื่อเรียก"} 
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[16px] font-bold text-white text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-white/20 shadow-inner" 
                />
                <input 
                  type="tel" 
                  id="phone-input-modal"
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  placeholder="08X-XXX-XXXX" 
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[20px] font-black text-white text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-white/20 tracking-wider shadow-inner" 
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white/60 border border-white/10 rounded-2xl font-bold text-[14px] hover:bg-white/10 hover:text-white transition-colors"
                >
                  {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  onClick={handleLinkPhone}
                  disabled={isLinkingPhone || phoneInput.length < 9 || !nicknameInput.trim()}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[14px] shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:shadow-none flex justify-center items-center active:scale-95"
                >
                  {isLinkingPhone ? <Loader2 size={20} className="animate-spin" /> : (locale === 'en' ? 'Link Phone' : 'บันทึก')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
