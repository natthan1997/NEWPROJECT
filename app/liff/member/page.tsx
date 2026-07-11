
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
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-x-hidden pb-24 selection:bg-amber-100">
      
      {/* 📱 Light Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-5 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[15px] font-bold tracking-tight text-gray-900">{dict.title}</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="space-y-6 px-5 pt-6 relative z-10 max-w-lg mx-auto">
        
        {/* 🟡 Profile Row */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 px-1"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white bg-gray-100 flex items-center justify-center">
              {lineProfile?.pictureUrl ? (
                <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-gray-400" />
              )}
            </div>
            {/* Tier Badge */}
            <div 
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm"
              style={{ backgroundColor: currentTier.bgHex || '#333', color: currentTier.textHex || '#FFF' }}
            >
              {currentTier.name[0]}
            </div>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-gray-900 leading-tight">
              {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {memberInfo?.phone ? (
                <span className="text-[12px] font-medium text-gray-500 font-mono bg-gray-200/50 px-2 py-0.5 rounded-md">
                  {memberInfo.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                </span>
              ) : (
                <button 
                  onClick={() => setShowPhoneModal(true)}
                  className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"
                >
                  + Add Phone
                </button>
              )}
              <button onClick={() => setShowCatalog(true)} className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles size={10} /> ฉายา
              </button>
            </div>
          </div>
        </motion.section>

        {/* ✨ Combined Balance & Progress Card (Reference Design) */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full drop-shadow-sm flex flex-col"
        >
          {/* Top Dark Card: Balance */}
          <div className="bg-[#2C3322] text-white p-6 rounded-[1.5rem] rounded-b-none relative overflow-hidden flex justify-between items-center z-10 border border-[#23281B] shadow-sm">
            <div className="relative z-10">
              <p className="text-white/80 text-[14px] mb-1 font-medium">
                {locale === 'en' ? 'Your Balance' : 'คะแนนสะสมของคุณ'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[44px] leading-none font-serif text-[#F0D59D] tracking-tighter">
                  {(memberInfo?.points || 0).toLocaleString()}
                </span>
                <span className="text-[#F0D59D] text-[16px] font-medium">Points</span>
              </div>
              <p className="text-white/60 text-[12px] mt-1.5 font-medium">
                = ฿{((memberInfo?.points || 0) / 10).toFixed(2)} credit
              </p>
            </div>
            
            <button 
              onClick={() => setShowBenefits(true)}
              className="w-[60px] h-[60px] rounded-full border-[1.5px] border-[#F0D59D]/40 flex items-center justify-center bg-white/5 backdrop-blur-md text-[#F0D59D] shadow-inner relative z-10 hover:bg-white/10 active:scale-95 transition-all"
            >
              <Sparkles size={28} strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Bottom White Card: Progress */}
          <div className="bg-white p-5 rounded-[1.5rem] rounded-t-none border border-gray-200 border-t-0 relative shadow-[0_4px_20px_rgb(0,0,0,0.03)] -mt-1 pt-6 z-0">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[15px] font-semibold text-[#A67C00]">{currentTier.name} Member</span>
              <span className="text-[13px] font-medium text-gray-400">
                {nextTier ? `${(nextTier.minPoints - totalAccumulated).toLocaleString()} pts to ${nextTier.name}` : 'Max Tier Reached'}
              </span>
            </div>
            
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, progressPercent)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="h-full bg-gradient-to-r from-[#D0A951] to-[#EED8A1] rounded-full" 
              />
            </div>
            
            <p className="text-[13px] font-medium text-gray-400">
              {locale === 'en' ? 'Member since' : 'เป็นสมาชิกตั้งแต่'} {new Date(memberInfo?.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </motion.section>

        {/* 📢 Special Campaigns / Gamification (Light Cards) */}
        <motion.section 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="space-y-4 pt-2 -mx-5"
        >
          <div className="flex items-center justify-between px-5">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">{locale === 'en' ? 'Special Campaigns' : 'แคมเปญพิเศษ'}</h3>
          </div>
          
          <div 
            className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory px-5" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {!memberInfo?.phone && (
              <motion.div 
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowPhoneModal(true)}
                className="min-w-[260px] snap-center bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer"
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-100/80 px-2 py-1 rounded-md mb-3 inline-block">
                    {locale === 'en' ? 'Action Required' : 'ภารกิจ'}
                  </span>
                  <h4 className="text-[16px] font-bold text-blue-900 leading-tight mb-1">{locale === 'en' ? 'Link your phone' : 'เชื่อมต่อเบอร์โทรศัพท์'}</h4>
                  <p className="text-[12px] text-blue-800/70 font-medium">{locale === 'en' ? 'To earn points from store' : 'เพื่อสะสมแต้มอัตโนมัติจากหน้าร้าน'}</p>
                </div>
                <div className="mt-5 flex justify-end relative z-10">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            )}

            {campaigns.map((camp) => (
              <motion.div 
                key={camp.id} 
                whileTap={{ scale: 0.96 }}
                onClick={() => { if (camp.title.includes('กล่องสุ่ม')) setShowMysteryBox(true); }}
                className="min-w-[260px] snap-center rounded-[1.5rem] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer bg-white border border-gray-100"
              >
                <div className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-10 bg-gradient-to-br ${camp.bg_gradient_from} ${camp.bg_gradient_to} rounded-full blur-2xl`}></div>
                
                <div className="absolute right-2 bottom-2 text-6xl opacity-10 grayscale">{camp.icon}</div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-gray-100 px-2 py-1 rounded-md mb-3 inline-block">
                    {camp.type_tag}
                  </span>
                  <h4 className="text-[16px] font-bold text-gray-900 leading-tight mb-1">{camp.title}</h4>
                  <p className="text-[12px] text-gray-500 font-medium">{camp.description}</p>
                </div>
                {camp.title.includes('กล่องสุ่ม') && (
                   <div className="mt-5 flex justify-end relative z-10">
                     <div className="px-4 py-2 rounded-full bg-[#1A1A1A] text-white flex items-center gap-1.5 shadow-md">
                       <span className="text-[12px] font-bold">เปิดกล่อง</span>
                       <Gift size={12} className="text-amber-300" />
                     </div>
                   </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 🪄 Sleek Tabs Section (Light Mode) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] min-h-[500px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 pt-6 px-4 pb-10"
        >
          {/* Tab Selector */}
          <div className="flex mb-6 bg-gray-100/80 p-1.5 rounded-full relative">
            {['rewards', 'coupons', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2.5 text-[13px] font-bold capitalize transition-colors relative z-10 ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {tab === 'rewards' ? dict.rewardsCatalog : tab === 'coupons' ? dict.coupons : dict.pointsHistory}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabBackgroundLight" 
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
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
                  <div key={reward.id} className="group flex gap-4 p-4 rounded-[1.5rem] bg-gray-50 border border-gray-100 hover:bg-gray-100/50 transition-all">
                    <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform border border-gray-100 shadow-sm">
                      <Gift size={28} className="text-amber-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{reward.name}</h4>
                      <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mb-3 font-medium">
                        {reward.discount_type === 'free_item' ? 'ฟรี 1 รายการ' : reward.discount_type === 'percent' ? `ลด ${reward.discount_value}%` : `ลด ${reward.discount_value} บาท`}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                           <Sparkles size={12} className="text-amber-600" />
                           <span className="text-[12px] font-bold text-amber-700">{reward.cost_points.toLocaleString()}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleRedeem(reward.id)}
                          disabled={(memberInfo?.points || 0) < reward.cost_points}
                          className={`text-[12px] font-bold px-4 py-2 rounded-full transition-all ${
                            (memberInfo?.points || 0) >= reward.cost_points 
                            ? 'bg-[#1A1A1A] text-white shadow-md active:scale-95' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {dict.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Gift size={24} className="text-gray-400" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noRewards}</p>
                    <p className="text-[12px] text-gray-500">{dict.checkBackLater}</p>
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
                className="space-y-4"
              >
                {vouchers.length > 0 ? vouchers.map((voucher) => (
                  <div key={voucher.id} className={`relative rounded-[1.5rem] overflow-hidden flex flex-col transition-all ${voucher.is_used ? 'bg-gray-50 border-gray-200 opacity-60 grayscale' : 'bg-white border-amber-200 shadow-md'}`} style={{ borderWidth: '1px' }}>
                    <div className="flex items-stretch h-full">
                      <div className={`w-[100px] flex flex-col items-center justify-center p-4 border-r border-dashed ${voucher.is_used ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                        <span className="text-[9px] font-bold uppercase tracking-widest mb-1">
                          {voucher.type === 'percent' ? 'ส่วนลด' : 'มูลค่า'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black tracking-tighter">
                            {voucher.type === 'percent' ? voucher.discount_percent : voucher.discount_amount}
                          </span>
                          <span className="text-sm font-bold opacity-80">
                            {voucher.type === 'percent' ? '%' : '฿'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between relative bg-white">
                        {/* Cutout notch */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F5F5F7] rounded-full border-r border-dashed border-amber-200 z-10" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                        
                        <div>
                          <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1.5 pr-2">{voucher.title}</h4>
                          <p className="text-[12px] text-gray-500 line-clamp-2 font-medium">{voucher.description}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-sm">
                            {voucher.expires_at ? `Exp: ${new Date(voucher.expires_at).toLocaleDateString('en-GB')}` : 'No Expiry'}
                          </span>
                          <button 
                            disabled={voucher.is_used}
                            className={`text-[11px] font-bold px-4 py-2 rounded-full transition-all ${
                              voucher.is_used ? 'bg-gray-200 text-gray-400' : 'bg-[#1A1A1A] text-white shadow-md active:scale-95'
                            }`}
                          >
                            {voucher.is_used ? 'ใช้แล้ว' : dict.useCoupon}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Gift size={24} className="text-gray-400" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noCoupons}</p>
                    <p className="text-[12px] text-gray-500">{dict.noCouponsDesc}</p>
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
                className="space-y-1"
              >
                {pointsHistory.length > 0 ? pointsHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.type === 'earn' ? <TrendingUp size={18} /> : <Gift size={18} />}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 leading-tight mb-0.5">
                          {translateHistoryDescription(item.description, locale as string)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {new Date(item.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[15px] font-bold ${item.type === 'earn' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {item.type === 'earn' ? '+' : '-'}{item.points.toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <History size={24} className="text-gray-400" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 mb-1">{dict.noHistory}</p>
                    <p className="text-[12px] text-gray-500">{dict.historyEmpty}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* 👑 Light Premium Benefits Bottom Sheet */}
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-gray-900">{dict.benefitsTitle}</h3>
                <button onClick={() => setShowBenefits(false)} className="p-2 -mr-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <h4 className="text-[11px] text-gray-400 mb-3 uppercase tracking-widest font-bold">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-gray-50 rounded-[1.5rem] p-5 space-y-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-amber-500 shadow-sm">
                        <Gift size={18} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[13px] font-bold text-gray-900">{dict.howToEarn}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-blue-500 shadow-sm">
                        <User size={18} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[13px] font-bold text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowBenefits(false);
                        setShowCatalog(true);
                      }}
                      className="w-full mt-3 py-3.5 bg-white text-gray-900 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                    >
                      ดูแคตตาล็อคฉายาทั้งหมด
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h4 className="text-[11px] text-gray-400 mb-4 uppercase tracking-widest font-bold">สิทธิประโยชน์ตามระดับ</h4>
                  <div className="space-y-4">
                    {tiers.map((tier) => (
                      <div key={tier.name} className="flex gap-4 items-start bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-[15px] font-bold uppercase tracking-wider" style={{ backgroundColor: tier.bgHex || '#F2ECE4', color: tier.textHex || '#1A1A18' }}>
                          {tier.name[0]}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-baseline gap-2 mb-2">
                            <h4 className="text-[14px] font-bold text-gray-900">{tier.name}</h4>
                            <span className="text-[11px] text-gray-400 font-medium">{tier.minPoints.toLocaleString()} {dict.pts}</span>
                          </div>
                          <ul className="space-y-2">
                            {tier.benefits && tier.benefits.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 font-medium">
                                <Check size={14} strokeWidth={3} className="text-emerald-500 flex-shrink-0 mt-0.5" />
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

      {/* 👑 LIGHT CATALOG MODAL */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F9FA] border-t border-gray-200 rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto pb-safe flex flex-col"
            >
              <div className="sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-xl z-10 px-6 py-5 flex items-center justify-between border-b border-gray-200 shrink-0">
                <h3 className="text-[16px] font-bold text-gray-900">แคตตาล็อคฉายา</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 -mr-2 bg-white rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 shadow-sm transition-colors border border-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  {titles.map((tier, idx) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => setSelectedBadge(tier)}
                      className={`relative flex flex-col items-center justify-center p-5 rounded-[1.5rem] shadow-sm cursor-pointer transition-all ${tier.isUnlocked ? 'bg-white border border-gray-100' : 'bg-gray-100 border border-transparent grayscale opacity-60'}`}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[20px] font-bold mb-3" style={{ backgroundColor: tier.bgHex, color: tier.textHex }}>
                        {tier.name[0]}
                      </div>
                      <h4 className="text-[13px] font-bold text-center text-gray-900 leading-tight mb-1">{tier.name}</h4>
                      
                      {/* Mini Progress */}
                      {!tier.isUnlocked && (
                        <div className="w-full mt-3">
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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

      {/* 🏆 LIGHT BADGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* Header colored banner */}
              <div className="h-28 w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: selectedBadge.bgHex }}>
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-gray-900 transition-colors backdrop-blur-md z-10">
                  <X size={18} />
                </button>
              </div>
              
              {/* Avatar floating */}
              <div className="relative flex justify-center -mt-10">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[30px] font-bold shadow-lg bg-white border-4 border-white relative z-10" style={{ backgroundColor: selectedBadge.bgHex, color: selectedBadge.textHex }}>
                  {selectedBadge.name[0]}
                </div>
              </div>

              <div className="px-6 pb-6 pt-5 text-center">
                <h3 className="text-[20px] font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
                
                {selectedBadge.isUnlocked ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[12px] font-bold rounded-full mb-5">
                    <Check size={14} strokeWidth={3} /> ปลดล็อกแล้ว
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[12px] font-bold rounded-full mb-5">
                    ยังไม่ปลดล็อก
                  </div>
                )}

                <div className="text-left space-y-3">
                  {/* How to get */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Zap size={12} className="text-amber-500" /> ภารกิจรับฉายา
                    </h4>
                    <p className="text-[13px] font-medium text-gray-700 leading-relaxed">{selectedBadge.description || `สะสม ${selectedBadge.minPoints} เป้าหมาย`}</p>
                    
                    {!selectedBadge.isUnlocked && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                          <span className="text-gray-400">ความคืบหน้า</span>
                          <span className="text-gray-900">{selectedBadge.currentValue} / {selectedBadge.minPoints}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${selectedBadge.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  {selectedBadge.benefits && (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Gift size={12} /> สิทธิพิเศษ
                      </h4>
                      <p className="text-[13px] font-medium text-amber-900/80 leading-relaxed whitespace-pre-line">{selectedBadge.benefits}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🎁 LIGHT MYSTERY BOX MODAL */}
      <AnimatePresence>
        {showMysteryBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => !isPlayingBox && mysteryBoxState !== 'opening' && setShowMysteryBox(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 overflow-hidden text-center shadow-2xl"
            >
              <button 
                onClick={() => setShowMysteryBox(false)} 
                disabled={mysteryBoxState === 'opening'}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-30"
              >
                <X size={18} />
              </button>
              
              {mysteryBoxState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-24 h-24 mx-auto bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-5xl mb-5 shadow-sm border border-amber-100 relative overflow-hidden">
                    <span className="relative z-10">🎁</span>
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 mb-2">
                    {locale === 'en' ? 'Mystery Box' : 'กล่องสุ่มหรรษา'}
                  </h3>
                  <p className="text-gray-500 text-[13px] font-medium mb-6 leading-relaxed px-2">
                    {locale === 'en' ? 'Spend 50 points to open a box and win random points back! (Up to 500 Pts)' : 'ใช้ 50 แต้ม เพื่อเปิดกล่องสุ่ม ลุ้นรับแต้มคืนสูงสุด 500 แต้ม!'}
                  </p>
                  <button
                    onClick={handlePlayMysteryBox}
                    disabled={(memberInfo?.points || 0) < 50}
                    className="w-full py-3.5 bg-[#1A1A1A] text-white rounded-xl font-bold text-[14px] hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-md"
                  >
                    {(memberInfo?.points || 0) < 50 ? (locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ') : (locale === 'en' ? 'Open Box (50 Pts)' : 'เปิดกล่อง (50 แต้ม)')}
                  </button>
                </motion.div>
              )}
              
              {mysteryBoxState === 'opening' && (
                <div className="py-8">
                  <motion.div 
                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-28 h-28 mx-auto bg-amber-100 rounded-[1.5rem] flex items-center justify-center text-6xl shadow-inner border border-amber-200"
                  >
                    <span>🎁</span>
                  </motion.div>
                  <h3 className="text-[18px] font-bold text-gray-900 mt-8 animate-pulse">
                    {locale === 'en' ? 'Opening...' : 'กำลังเปิดกล่อง...'}
                  </h3>
                </div>
              )}
              
              {mysteryBoxState === 'result' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-2">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-28 h-28 mx-auto bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mb-6 relative border border-emerald-100 shadow-sm"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl"
                    >
                      {mysteryBoxResult > 50 ? '🎉' : mysteryBoxResult === 50 ? '🎁' : '😅'}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-[20px] font-bold text-gray-900 mb-2">
                    {mysteryBoxResult > 50 ? (locale === 'en' ? 'JACKPOT!' : 'แจ็คพอตแตก!') : mysteryBoxResult === 50 ? (locale === 'en' ? 'Nice!' : 'ดีเลย!') : (locale === 'en' ? 'Ouch!' : 'ได้เกลือออ!')}
                  </h3>
                  <div className="text-emerald-600 font-black text-4xl mb-6 tracking-tighter">
                    +{mysteryBoxResult} <span className="text-xl font-bold opacity-70">PTS</span>
                  </div>
                  <button
                    onClick={() => {
                      setMysteryBoxState('idle');
                      setShowMysteryBox(false);
                    }}
                    className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-[14px] hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {locale === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 📱 LIGHT Phone Link Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPhoneModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] p-7 shadow-2xl z-10 text-center"
            >
              <div className="w-14 h-14 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                 <Zap size={24} />
              </div>
              <h3 className="text-[20px] font-bold text-gray-900 mb-2 leading-tight">
                {locale === 'en' ? 'Link Phone Number' : 'เชื่อมต่อเบอร์โทรศัพท์'}
              </h3>
              <p className="text-[13px] text-gray-500 font-medium mb-6 leading-relaxed">
                {locale === 'en' ? 'Link your phone number to receive points from POS orders.' : 'ระบุเบอร์โทรศัพท์ของคุณเพื่อรับแต้มจากการสั่งซื้อหน้าร้าน (รวมคะแนนอัตโนมัติ)'}
              </p>
              
              <div className="mb-6 space-y-3">
                <input 
                  type="text" 
                  id="nickname-input-modal"
                  value={nicknameInput} 
                  onChange={e => setNicknameInput(e.target.value)} 
                  placeholder={locale === 'en' ? "Nickname / Name" : "ชื่อเล่น / ชื่อเรียก"} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[15px] font-bold text-gray-900 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:font-medium placeholder:text-gray-400" 
                />
                <input 
                  type="tel" 
                  id="phone-input-modal"
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  placeholder="08X-XXX-XXXX" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[18px] font-bold text-gray-900 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:font-medium placeholder:text-gray-400 tracking-wider" 
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[13px] hover:bg-gray-200 transition-colors"
                >
                  {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  onClick={handleLinkPhone}
                  disabled={isLinkingPhone || phoneInput.length < 9 || !nicknameInput.trim()}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-[13px] shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:shadow-none flex justify-center items-center active:scale-95"
                >
                  {isLinkingPhone ? <Loader2 size={18} className="animate-spin" /> : (locale === 'en' ? 'Link Phone' : 'บันทึก')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}