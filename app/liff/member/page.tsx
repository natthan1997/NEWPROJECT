'use client';

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronRight, ChevronLeft, Info, X, Gift, Phone, Globe, Facebook, MessageCircle, QrCode, Coins, Sparkles, AlertCircle, Loader2, CheckCircle2, HelpCircle, ArrowRight, History, XCircle, Clock, Target
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, animate } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import { MemberOnboardingGuide } from '@/components/liff/MemberOnboardingGuide';
import { HistoryListSkeleton } from '@/components/liff/LiffSkeleton';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";
import RegistrationForm from './RegistrationForm';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { calculateDistance, isWithinRange } from '@/lib/geoUtils';

const ScanPointsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="m12 15 2.09 1.1-.4-2.32 1.68-1.64-2.33-.34L12 9.6l-1.04 2.2-2.33.34 1.68 1.64-.4 2.32L12 15z" />
  </svg>
);

// Animated Counter for Points
const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return controls.stop;
  }, [value, count]);

  return <>{displayValue}</>;
};

// Minimalist Particle Explosion
const ParticleExplosion = () => {
  const particles = Array.from({ length: 40 });
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const velocity = 100 + Math.random() * 150;
        const radian = (angle * Math.PI) / 180;
        const tx = Math.cos(radian) * velocity;
        const ty = Math.sin(radian) * velocity;
        const size = Math.random() * 6 + 4;
        const isCircle = Math.random() > 0.5;
        const delay = Math.random() * 0.2;
        
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ 
              x: [0, tx, tx + (Math.random() * 20 - 10)], 
              y: [0, ty, ty + 100 + Math.random() * 50],
              scale: [0, 1, 0],
              opacity: [1, 1, 0],
              rotate: [0, Math.random() * 360]
            }}
            transition={{ 
              duration: 1.5 + Math.random() * 1, 
              delay: 0.1 + delay,
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="absolute"
            style={{
              width: size,
              height: size,
              backgroundColor: Math.random() > 0.7 ? '#9CA3AF' : '#1A1A18', // Mix of gray and black
              borderRadius: isCircle ? '50%' : '2px'
            }}
          />
        );
      })}
    </div>
  );
};

function LiffMemberContent() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, memberInfo: ctxMemberInfo, isDataReady } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(ctxMemberInfo || null);
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(!isDataReady);

  // Real-time check-in states
  const [activeCheckInId, setActiveCheckInId] = useState<string | null>(null);
  const [activeCouponCount, setActiveCouponCount] = useState(0);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<string | null>(null);
  const [linkedOrder, setLinkedOrder] = useState<any | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    if (ctxMemberInfo) {
      setMemberInfo(ctxMemberInfo);
    }
    
    // Instantly load missions from cache without waiting for waterfall
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (userId) {
      try {
        const cacheKey = `member-missions-preview-${ctxMemberInfo?.id || userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setActiveMissions(JSON.parse(cached));
          setMissionsLoading(false);
        }
      } catch (e) {}
    }
    
    // Prefetch routes for instant navigation
    router.prefetch('/liff/member/missions');
    router.prefetch('/liff/member/gacha');
    router.prefetch('/liff/my-rewards');
    router.prefetch('/liff/point-history');
    router.prefetch('/liff/history');
  }, [ctxMemberInfo, router]);
  const [showBenefits, setShowBenefits] = useState(false);
  const [earnRate, setEarnRate] = useState(100);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [quickRewards, setQuickRewards] = useState<any[]>([]);

  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  // Mystery Box State
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [playingMysteryBox, setPlayingMysteryBox] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<number | null>(null);
  const [mysteryCouponReward, setMysteryCouponReward] = useState<string | null>(null);
  const [mysteryError, setMysteryError] = useState<string | null>(null);
  const [mysteryBoxCost, setMysteryBoxCost] = useState(50);

  // Smart Reward Suggestion
  const [suggestedReward, setSuggestedReward] = useState<any>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Claim Points state
  const searchParams = useSearchParams();
  const rawClaimToken = searchParams.get('claimToken');
  const pathParam = searchParams.get('path');
  const liffState = searchParams.get('liff.state');
  
  const claimToken = useMemo(() => {
    const extractFromStr = (str: string | null | undefined): string | null => {
      if (!str) return null;
      let cur = str;
      for (let i = 0; i < 3; i++) {
        const match = cur.match(/(?:[?&]|%3F|%26)claimToken(?:=3D|=)([^&%]+)/i) || cur.match(/claimToken=([^&]+)/i);
        if (match && match[1]) return match[1];
        try {
          const dec = decodeURIComponent(cur);
          if (dec === cur) break;
          cur = dec;
        } catch {
          break;
        }
      }
      return null;
    };

    if (rawClaimToken) return rawClaimToken;
    const fromPath = extractFromStr(pathParam);
    if (fromPath) return fromPath;
    const fromLiffState = extractFromStr(liffState);
    if (fromLiffState) return fromLiffState;
    if (typeof window !== 'undefined') {
      const fromHref = extractFromStr(window.location.href);
      if (fromHref) return fromHref;
    }
    return null;
  }, [rawClaimToken, pathParam, liffState]);

  const [claimState, setClaimState] = useState<'idle'|'loading'|'success'|'error'|'pending_payment'>(claimToken ? 'loading' : 'idle');
  const [showClaimPopup, setShowClaimPopup] = useState(!!claimToken);
  const [claimPointsEarned, setClaimPointsEarned] = useState(0);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimOrderItems, setClaimOrderItems] = useState<any[]>([]);
  const processingClaimRef = useRef(false);
  const [claimTrigger, setClaimTrigger] = useState(0);

  useEffect(() => {
    if (claimToken) {
      setShowClaimPopup(true);
    }
  }, [claimToken]);

  useEffect(() => {
    const userId = lineProfile?.userId || (typeof window !== 'undefined' ? localStorage.getItem('xylem_line_user_id') : null);
    console.log('[Claim Effect Triggered]', { isDataReady, claimToken, isProcessing: processingClaimRef.current, userId });
    if (claimToken && !processingClaimRef.current) {
      console.log('[Claim Effect] Entering processClaim with userId:', userId);
      processingClaimRef.current = true;
      const processClaim = async () => {
        setClaimState('loading');
        setShowClaimPopup(true);
        try {
          console.log('[Claim Effect] Sending request to /api/liff/points/claim');
          const res = await fetch('/api/liff/points/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              token: claimToken, 
              lineUserId: userId,
              displayName: lineProfile?.displayName,
              avatarUrl: lineProfile?.pictureUrl
            })
          });
          const data = await res.json();
          console.log('[Claim Effect] Response:', data);
          
          if (data.success) {
            setClaimState('success');
            setClaimPointsEarned(data.pointsAdded || 0);
            setClaimOrderItems(data.orderItems || []);
            // Clean URL silently
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('claimToken');
            window.history.replaceState({}, '', newUrl.toString());
            
            // Re-fetch member info to show updated points behind popup
            fetchData(true);

            // Auto close after 4.5 seconds
            setTimeout(() => {
                setShowClaimPopup(false);
            }, 4500);
          } else if (data.isPendingPayment) {
            setClaimState('pending_payment');
            setClaimPointsEarned(data.pointsPending || 0);
            setClaimOrderItems(data.orderItems || []);
            setClaimMessage(data.message || 'คุณจะได้รับคะแนนสะสมหลังจากชำระเงินเรียบร้อยแล้ว');
            
            // Clean URL silently
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('claimToken');
            window.history.replaceState({}, '', newUrl.toString());

            fetchData(true);
          } else if (data.requirePhone) {
            setClaimState('idle');
            setShowClaimPopup(false);
            fetchData(true);
          } else {
            setClaimState('error');
            setClaimMessage(data.error || 'ไม่สามารถรับแต้มได้');
          }
        } catch (e) {
          console.error('[Claim Effect] Error:', e);
          setClaimState('error');
          setClaimMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
      };
      processClaim();
    }
  }, [isDataReady, claimToken, claimState, lineProfile, claimTrigger]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!showClaimPopup && claimState === 'success' && localStorage.getItem('pending_onboarding') === 'true') {
          localStorage.removeItem('pending_onboarding');
          setTimeout(() => setShowOnboarding(true), 500);
      }
    }
  }, [showClaimPopup, claimState]);

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
  const [dbTiers, setDbTiers] = useState<any[]>([]);

  const tiers = React.useMemo(() => {
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.map(tier => {
        let benefitsArray = [];
        if (tier.benefits) {
          if (Array.isArray(tier.benefits)) {
            benefitsArray = tier.benefits;
          } else if (typeof tier.benefits === 'string') {
            try {
              benefitsArray = JSON.parse(tier.benefits);
            } catch (e) {
              benefitsArray = tier.benefits.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
        }
        
        let cardBg = 'bg-gradient-to-br from-[#B89F89] to-[#8C6D53]';
        const nameLower = String(tier.name || '').toLowerCase();
        if (nameLower.includes('silver')) cardBg = 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]';
        else if (nameLower.includes('gold')) cardBg = 'bg-gradient-to-br from-[#D4AF37] to-[#B48529]';
        else if (nameLower.includes('platinum')) cardBg = 'bg-gradient-to-br from-[#3E6578] to-[#1E3A47]';
        
        return {
          name: tier.name,
          minPoints: tier.min_points,
          bgHex: tier.bg_hex || '#F2ECE4',
          textHex: tier.text_hex || '#8C6D53',
          cardBg,
          benefits: benefitsArray
        };
      });
    }

    return [
      { name: 'Bronze', minPoints: 0, bgHex: '#F2ECE4', textHex: '#8C6D53', cardBg: 'bg-gradient-to-br from-[#B89F89] to-[#8C6D53]', benefits: [`อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน`] },
      { name: 'Silver', minPoints: 500, bgHex: '#F0F2F5', textHex: '#64748B', cardBg: 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]', benefits: ['อัตราสะสมคะแนน x1.2', 'เครื่องดื่มพิเศษในเดือนเกิด'] },
      { name: 'Gold', minPoints: 2000, bgHex: '#FCF7E8', textHex: '#B48529', cardBg: 'bg-gradient-to-br from-[#D4AF37] to-[#B48529]', benefits: ['อัตราสะสมคะแนน x1.5', 'ส่วนลด 5% ทุกออเดอร์'] },
      { name: 'Platinum', minPoints: 5000, bgHex: '#EBF1F5', textHex: '#3E6578', cardBg: 'bg-gradient-to-br from-[#3E6578] to-[#1E3A47]', benefits: ['อัตราสะสมคะแนน x2.0', 'ส่วนลด 10% ทุกออเดอร์'] }
    ];
  }, [dbTiers, earnRate]);
  
  const handleRegistrationSubmit = async (data: any) => {
    let userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId && typeof window !== 'undefined' && (window as any).liff) {
      try {
        const decoded = (window as any).liff.getDecodedIDToken();
        if (decoded?.sub) userId = decoded.sub;
      } catch (e) {
        console.warn('Failed to get sub token:', e);
      }
    }
    if (!userId) {
      alert('ไม่พบรหัสผู้ใช้ LINE กรุณาลองปิดและเปิดหน้าต่างใหม่อีกครั้ง');
      return;
    }

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
            setIsRegistrationSuccess(true);
            
            if (claimToken) {
              setTimeout(() => {
                setIsRegistrationSuccess(false);
                processingClaimRef.current = false;
                setClaimState('idle');
                setShowClaimPopup(false);
                fetchData(true);
                setClaimTrigger(prev => prev + 1);
                localStorage.setItem('pending_onboarding', 'true');
              }, 2500);
            } else {
              setTimeout(() => {
                setIsRegistrationSuccess(false);
                setShowOnboarding(true);
              }, 2500);
            }
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
        if (shopSettings.opening_hours.loyalty_earn_thb) {
          setEarnRate(Number(shopSettings.opening_hours.loyalty_earn_thb));
        } else if (shopSettings.opening_hours.loyalty_earn_rate) {
          setEarnRate(Number(shopSettings.opening_hours.loyalty_earn_rate));
        }
        if (shopSettings.opening_hours.mystery_box_cost !== undefined) {
          setMysteryBoxCost(shopSettings.opening_hours.mystery_box_cost);
        }
      }
      if (member) {
        setMemberInfo(member);
        try {
          const { count } = await supabase
            .from('pos_member_coupons')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', member.id)
            .eq('status', 'active');
          if (count !== null) setActiveCouponCount(count);
        } catch (err) {
          console.error('Failed to load active coupons count', err);
        }
      }
      
      try {
        const { data: dbTiersData } = await supabase.from('pos_member_tiers').select('*').order('min_points', { ascending: true });
        if (dbTiersData && dbTiersData.length > 0) {
          setDbTiers(dbTiersData);
        }
      } catch (err) {
        console.error('Failed to load member tiers', err);
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
        const { data: rewardsData } = await supabase.from('pos_loyalty_coupons').select('*').eq('is_active', true).eq('is_gacha_only', false).order('cost_points', { ascending: true }).limit(5);
        if (rewardsData) {
            setQuickRewards(rewardsData);
            
            // Smart Reward Suggestion Logic
            if (member && member.points > 0) {
                const affordableRewards = rewardsData
                    .filter((r: any) => member.points >= r.cost_points)
                    .sort((a: any, b: any) => b.cost_points - a.cost_points);
                
                if (affordableRewards.length > 0) {
                    const hasShown = sessionStorage.getItem('reward_suggestion_shown');
                    if (!hasShown && !claimToken) {
                        setSuggestedReward(affordableRewards[0]);
                        setShowSuggestionModal(true);
                        sessionStorage.setItem('reward_suggestion_shown', 'true');
                    }
                }
            }
        }
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

      try {
        const cacheKey = `member-missions-preview-${member?.id || userId}`;
        let hasCache = false;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            setActiveMissions(JSON.parse(cached));
            setMissionsLoading(false);
            hasCache = true;
          }
        } catch (e) {}

        if (!hasCache) setMissionsLoading(true);
        fetch(`/api/gamification/missions?memberId=${member?.id || userId}`)
          .then(res => res.json())
          .then(missionsData => {
            if (missionsData.success && missionsData.missions) {
              const featured = missionsData.missions.filter((m: any) => !m.is_completed);
              setActiveMissions(featured);
              try { localStorage.setItem(cacheKey, JSON.stringify(featured)); } catch (e) {}
            }
          })
          .catch(err => console.error('Failed to load gamification missions', err))
          .finally(() => setMissionsLoading(false));
      } catch (err) {
        console.error('Failed to start gamification fetch', err);
        setMissionsLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackgroundSync) setLoading(false);
    }
  };

  const handleRedeemQuick = async (reward: any) => {
    const points = memberInfo?.points || 0;
    if (points < reward.cost_points) {
      Swal.fire({
        icon: 'error',
        title: 'พอยท์ไม่พอ 😢',
        text: 'คุณมีพอยท์ไม่เพียงพอสำหรับการแลกรางวัลนี้',
        confirmButtonColor: '#1A1A18',
        confirmButtonText: 'ตกลง',
        shape: 'rounded-2xl'
      });
      return;
    }
    
    const confirmResult = await Swal.fire({
      title: 'ยืนยันการแลกรางวัล',
      text: `ใช้ ${reward.cost_points} พอยท์ เพื่อแลกคูปอง "${reward.name}" ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1A1A18',
      cancelButtonColor: '#e5e7eb',
      cancelButtonText: '<span style="color: black">ยกเลิก</span>',
      confirmButtonText: 'ยืนยัน',
      customClass: {
         popup: 'rounded-3xl',
         confirmButton: 'rounded-full px-6 py-2 font-bold',
         cancelButton: 'rounded-full px-6 py-2 font-bold text-black'
      }
    });

    if (!confirmResult.isConfirmed) return;
    
    // --- Optimistic UI Update ---
    // 1. Immediately update UI to make it feel INSTANT
    setShowRedeemSuccess(true);
    setActiveCouponCount(prev => prev + 1);
    const previousPoints = memberInfo?.points || 0;
    setMemberInfo((prev: any) => prev ? { ...prev, points: prev.points - reward.cost_points } : null);
    
    // 2. Scroll to top so user sees the message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 3. Auto-hide the pointer after 4 seconds
    setTimeout(() => setShowRedeemSuccess(false), 4000);
    
    // --- Background API Request ---
    try {
      const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
      const res = await fetch('/api/liff/member/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: userId, couponId: reward.id })
      });
      const data = await res.json();
      
      if (!data.success) {
        // Rollback on API logical error
        throw new Error(data.error || 'Failed to redeem');
      }
    } catch (e: any) {
      // Rollback UI changes on error
      setShowRedeemSuccess(false);
      setActiveCouponCount(prev => Math.max(0, prev - 1));
      setMemberInfo((prev: any) => prev ? { ...prev, points: previousPoints } : null);
      
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: e.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ในขณะนี้',
        confirmButtonColor: '#1A1A18',
        customClass: { popup: 'rounded-3xl' }
      });
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
    if (!liffLoading) fetchData(isDataReady);
    
    const channel = supabase.channel('member_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
        fetchData(true); // Background sync
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_customer_coupons' }, () => {
        fetchData(true); // Background sync for coupons
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lineProfile, liffLoading, isDataReady]);

  const handleCheckIn = async () => {
    if (!memberInfo || !lineProfile) return;
    setClaimLoading(true);
    
    try {
      // 1. Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }).catch(err => {
        console.error("Geolocation error:", err);
        return null;
      });

      if (!position) {
        setClaimLoading(false);
        Swal.fire({
          icon: 'error',
          title: locale === 'en' ? 'Location Required' : 'ไม่สามารถเข้าถึงตำแหน่งได้',
          text: locale === 'en' ? 'Please allow location access to earn points at the store.' : 'กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง เพื่อสะสมพอยท์ที่หน้าร้าน',
          confirmButtonColor: '#1A1A18'
        });
        return;
      }

      const { latitude, longitude } = position.coords;

      // 2. Fetch all shop settings to get branch locations
      const { data: settings } = await supabase
        .from('pos_shop_settings')
        .select('latitude, longitude, check_in_radius');
      
      let isAtStore = false;
      let minDistance = Infinity;

      if (settings && settings.length > 0) {
        for (const shop of settings) {
          const shopLat = shop.latitude || 13.7563;
          const shopLng = shop.longitude || 100.5018;
          const radius = shop.check_in_radius || 100;
          
          const withinRange = isWithinRange(latitude, longitude, shopLat, shopLng, radius);
          const dist = calculateDistance(latitude, longitude, shopLat, shopLng) * 1000;
          if (dist < minDistance) minDistance = dist;

          if (withinRange) {
            isAtStore = true;
            break;
          }
        }
      } else {
        // If no settings configured in DB, bypass the check
        isAtStore = true;
      }

      if (!isAtStore) {
        setClaimLoading(false);
        Swal.fire({
          icon: 'warning',
          title: locale === 'en' ? 'Outside Store Area' : 'อยู่นอกพื้นที่ร้าน',
          text: locale === 'en' 
            ? `You must be at the cashier to earn points.` 
            : `กดสะสมพอยท์ได้ที่หน้าแคชเชียร์เท่านั้น`,
          confirmButtonColor: '#1A1A18'
        });
        return;
      }

      // Find and delete any existing pending check-ins for this user to avoid stale rows
      await supabase
        .from('pos_member_checkins')
        .update({ status: 'cancelled' })
        .eq('line_user_id', lineProfile.userId)
        .eq('status', 'pending');

      const { data, error } = await supabase
        .from('pos_member_checkins')
        .insert({
          line_user_id: lineProfile.userId,
          member_id: memberInfo.id,
          customer_name: memberInfo.nickname || memberInfo.name || lineProfile.displayName || 'Member',
          customer_image: lineProfile.pictureUrl || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setActiveCheckInId(data.id);
        setCheckInStatus('pending');
        setLinkedOrder(null);
      }
    } catch (err) {
      console.error('Check-in Error:', err);
      alert('ไม่สามารถเช็คอินได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCancelCheckIn = async () => {
    if (!activeCheckInId) return;
    try {
      await supabase
        .from('pos_member_checkins')
        .update({ status: 'cancelled' })
        .eq('id', activeCheckInId);
    } catch (err) {
      console.error('Cancel Check-in Error:', err);
    } finally {
      setActiveCheckInId(null);
      setCheckInStatus(null);
      setLinkedOrder(null);
    }
  };

  const handleCloseCheckInModal = () => {
    setActiveCheckInId(null);
    setCheckInStatus(null);
    setLinkedOrder(null);
  };

  useEffect(() => {
    if (!activeCheckInId) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from('pos_member_checkins')
        .select('*')
        .eq('id', activeCheckInId)
        .maybeSingle();

      if (data) {
        setCheckInStatus(data.status);
        if (data.status === 'completed') {
          if (data.order_id) {
            const { data: order } = await supabase
              .from('pos_orders')
              .select('*, pos_order_items(*, item:pos_menu_items!item_id(name))')
              .eq('id', data.order_id)
              .maybeSingle();

            setLinkedOrder({
              order,
              points_earned: data.points_earned || 0
            });
          }
          clearInterval(pollInterval);
        } else if (data.status === 'cancelled') {
          setActiveCheckInId(null);
          setCheckInStatus(null);
          setLinkedOrder(null);
          clearInterval(pollInterval);
        }
      }
    };

    checkStatus();
    const pollInterval = setInterval(checkStatus, 3000);

    const channel = supabase
      .channel(`checkin_${activeCheckInId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pos_member_checkins',
          filter: `id=eq.${activeCheckInId}`
        },
        async (payload: any) => {
          const updated = payload.new;
          setCheckInStatus(updated.status);
          
          if (updated.status === 'completed') {
            if (updated.order_id) {
              const { data: order } = await supabase
                .from('pos_orders')
                .select('*, pos_order_items(*, item:pos_menu_items!item_id(name))')
                .eq('id', updated.order_id)
                .maybeSingle();

              setLinkedOrder({
                order,
                points_earned: updated.points_earned || 0
              });
            }
            clearInterval(pollInterval);
          } else if (updated.status === 'cancelled') {
            setActiveCheckInId(null);
            setCheckInStatus(null);
            setLinkedOrder(null);
            clearInterval(pollInterval);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [activeCheckInId]);

  const isBirthdayMonth = useMemo(() => {
    const dobStr = memberInfo?.date_of_birth || memberInfo?.dateOfBirth;
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    return dob.getMonth() === today.getMonth();
  }, [memberInfo]);

  const [showBirthdayReveal, setShowBirthdayReveal] = useState(false);
  useEffect(() => {
    if (isBirthdayMonth) {
      setShowBirthdayReveal(true);
      const timer = setTimeout(() => setShowBirthdayReveal(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [isBirthdayMonth]);

  if (liffLoading && !isDataReady && !claimToken) return <XYLLoader tagline={dict.loading} />;
  if (loading && !isDataReady && !claimToken) return <XYLLoader tagline={dict.loading} />;

  if (!memberInfo || !memberInfo.phone || !memberInfo.pdpa_consent) {
    return <RegistrationForm key={memberInfo?.id || 'new'} lineProfile={lineProfile} onSubmit={handleRegistrationSubmit} isSubmitting={isLinkingPhone} initialData={memberInfo} />;
  }

  const totalAccumulated = memberInfo?.total_accumulated_points || memberInfo?.points || 0;

  let currentTierIndex = 0;
  
  // 1. Auto calculate by accumulated points
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalAccumulated >= tiers[i].minPoints) {
      currentTierIndex = i;
      break;
    }
  }

  // 2. Override with manual tier from DB if it exists
  if (memberInfo?.tier_level) {
    const manualTierIndex = tiers.findIndex(t => t.name.toLowerCase() === memberInfo.tier_level.toLowerCase());
    if (manualTierIndex !== -1) {
      currentTierIndex = manualTierIndex;
    }
  }

  const currentTier = tiers[currentTierIndex];
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const progressPercent = nextTier ? Math.min(100, Math.max(0, ((totalAccumulated - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)) : 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24">
      
      {/* 📱 Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-gray-100 relative">
        <button 
            onClick={() => router.push('/liff/menu')} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-95 transition-transform text-gray-600"
        >
            <ChevronLeft size={20} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-[14px] font-bold tracking-widest text-[#1A1A18]">{dict.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/liff/point-history" className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-95 transition-transform relative">
            <History size={20} />
          </Link>
          <Link id="tour-my-rewards" href="/liff/my-rewards" className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-95 transition-transform relative">
            <Gift size={20} className={showRedeemSuccess ? "text-[#E0A865] animate-bounce" : ""} />
            {activeCouponCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {activeCouponCount}
              </span>
            )}
            
            <AnimatePresence>
              {showRedeemSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.8 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="absolute top-full right-0 mt-3 w-48 bg-white text-gray-900 p-3.5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 pointer-events-none"
                >
                  <div className="absolute -top-1.5 right-4 w-3.5 h-3.5 bg-white border-t border-l border-gray-100 rotate-45 rounded-sm"></div>
                  <div className="relative z-10 flex flex-col gap-1 items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-[#FCF7E8] text-[#B48529] flex items-center justify-center mb-0.5">
                      <Gift size={16} />
                    </div>
                    <span className="font-extrabold text-[13px] text-gray-900 mt-1 tracking-tight">เก็บคูปองให้แล้ว!</span>
                    <span className="text-[10.5px] font-medium text-gray-500 leading-tight">คูปองที่แลกจะอยู่ในกล่องของขวัญนี้<br/>สามารถกดเข้ามาดูและใช้งานได้เลยครับ</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </header>

      {/* 🟡 Grand Birthday Reveal Overlay */}
      <AnimatePresence>
        {showBirthdayReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1A1A18]/90 backdrop-blur-xl overflow-hidden"
          >
            {/* Spinning background rays */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(245,158,11,0.4)_360deg)] animate-[spin_4s_linear_infinite] opacity-50"></div>
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent_0_340deg,rgba(236,72,153,0.4)_360deg)] animate-[spin_4s_linear_infinite] opacity-50"></div>
            
            {/* Confetti / Sparkles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '100vh', x: `${Math.random() * 100 - 50}vw`, scale: 0 }}
                animate={{ y: '-100vh', x: `${Math.random() * 100 - 50}vw`, scale: [0, Math.random() * 1.5 + 0.5, 0], rotate: 360 }}
                transition={{ duration: Math.random() * 2 + 2, repeat: Infinity, ease: 'linear', delay: Math.random() * 2 }}
                className="absolute text-amber-300"
              >
                <Sparkles size={Math.random() * 20 + 10} />
              </motion.div>
            ))}

            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], y: 0, opacity: 1 }}
              transition={{ duration: 1.5, type: 'spring', bounce: 0.5 }}
              className="relative z-10 flex flex-col items-center text-center p-8"
            >
              <div className="text-[100px] leading-none mb-4 animate-bounce">🎁</div>
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-pink-400 tracking-tight mb-2 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                HAPPY BIRTHDAY
              </h2>
              <div className="text-2xl font-semibold text-white mb-6">
                {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}!
              </div>
              <p className="text-white/80 text-sm max-w-[250px] leading-relaxed">
                ขอให้มีความสุขมากๆ นะครับ!<br/>ขอบคุณที่ให้เราดูแลในเดือนเกิดสุดพิเศษนี้ ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-8">
        
        {/* 🟡 Hero Points Card */}
        <motion.section 
          id="tour-profile"
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full flex flex-col relative rounded-[32px] overflow-hidden ${isBirthdayMonth ? 'p-[2.5px] shadow-[0_0_20px_rgba(236,72,153,0.3)]' : ''}`}
          style={{ perspective: 1000 }}
        >
          {/* Animated Birthday Border */}
          {isBirthdayMonth && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_270deg,rgba(236,72,153,1)_315deg,rgba(245,158,11,1)_360deg)] animate-[spin_3s_linear_infinite]"></div>
          )}

          <motion.div 
            animate={{ 
              rotateX: [0, 3, -3, 0], 
              rotateY: [0, -3, 3, 0],
              y: [0, -4, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className={`p-8 rounded-[30px] relative z-10 flex flex-col overflow-hidden shadow-xl h-full w-full ${currentTier.cardBg || 'bg-[#1A1A18]'}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Minimalist Accent */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" style={{ transform: 'translateZ(-10px)' }}></div>
            
            {/* Special Birthday Effects Inside the Card */}
            {isBirthdayMonth && (
              <>
                {/* Gold Shimmer Sweep */}
                <motion.div 
                  initial={{ x: '-100%' }} animate={{ x: '200%' }} transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0 pointer-events-none"
                />
                
                {/* Top Right Ribbon / Badge */}
                <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none z-0">
                   <div className="absolute top-6 -right-6 w-40 bg-gradient-to-r from-pink-500 to-amber-500 transform rotate-45 text-center text-white text-[8px] font-extrabold tracking-widest py-1 shadow-lg shadow-pink-500/30">
                     BIRTHDAY MONTH
                   </div>
                </div>

                {/* Floating Sparkles */}
                <motion.div animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3], rotate: [0, 15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-6 left-1/2 text-amber-300 pointer-events-none">
                  <Sparkles size={16} strokeWidth={1.5} />
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} className="absolute bottom-10 right-6 text-pink-300 pointer-events-none">
                  <Sparkles size={14} strokeWidth={1.5} />
                </motion.div>
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.9, 0.3], rotate: [0, -20, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute top-20 right-20 text-yellow-200 pointer-events-none">
                  <Sparkles size={18} strokeWidth={1.5} />
                </motion.div>
              </>
            )}

            {/* Content Container with slight 3D pop */}
            <div className="relative z-10 text-white flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium tracking-[0.15em] uppercase opacity-70 mb-1">{dict.points}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[52px] leading-[1] font-medium tracking-tight">
                                {(memberInfo?.points || 0).toLocaleString()}
                            </span>
                            <span className="text-[14px] font-normal opacity-60">PT</span>
                        </div>
                    </div>
                    <button onClick={() => setShowBenefits(true)} className="text-white/70 hover:text-white transition-colors mt-1">
                        <Info size={22} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-[1.5px] border-white/30 shrink-0">
                        {lineProfile?.pictureUrl ? (
                            <img src={lineProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/20"></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-[17px] font-medium leading-tight truncate">
                                {memberInfo?.nickname || memberInfo?.name || lineProfile?.displayName || 'Member'}
                            </div>
                            {activeTitle && (
                                <button 
                                  onClick={() => setShowCatalog(true)}
                                  className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wider flex items-center gap-0.5"
                                  style={{ backgroundColor: activeTitle.bgHex || '#F5F5F5', color: activeTitle.textHex || '#1A1A18' }}
                                >
                                  {activeTitle.name}
                                  <ChevronRight size={10} className="opacity-60" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.bgHex === '#F2ECE4' ? '#B89F89' : currentTier.textHex }}></span>
                                <span className="text-[12px] font-medium tracking-wide text-white/90">{currentTier.name}</span>
                            </div>
                            {isBirthdayMonth && (
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="ml-1 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-amber-500 rounded text-[9px] font-bold tracking-wider text-white flex items-center gap-1 shadow-lg shadow-pink-500/20">
                                    🎂 SPECIAL
                                </motion.div>
                            )}
                            {!activeTitle && (
                                <button onClick={() => setShowCatalog(true)} className="text-[11px] text-white/50 hover:text-white transition-colors ml-1">
                                    เลือกฉายา &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Progress Section */}
                <div className="mt-auto pt-4 border-t border-white/15">
                  <div className="flex justify-between items-baseline mb-3 text-white">
                      <span className="text-[11px] font-medium opacity-70 tracking-wide">
                          พอยท์สะสมระดับสมาชิก 
                      </span>
                      <span className="text-[12px] font-medium">
                          {totalAccumulated} <span className="opacity-50">/ {nextTier ? nextTier.minPoints : 'Max'}</span>
                      </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden bg-black/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(1, progressPercent)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full rounded-full bg-white/90" 
                      />
                  </div>
                  {nextTier && (
                      <div className="text-[10px] text-white/50 text-right mt-2 tracking-wide">
                          อีก {(nextTier.minPoints - totalAccumulated).toLocaleString()} PT เพื่อเป็นระดับ {nextTier.name}
                      </div>
                  )}
                </div>
            </div>
          </motion.div>
        </motion.section>



        {/* 🎯 Featured Mission & Campaigns Progress */}
        {missionsLoading ? (
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">แคมเปญและภารกิจพิเศษ</h3>
              <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[24px] border border-[#F0F0F0] shadow-sm relative overflow-hidden min-w-[280px] w-[85vw] max-w-[320px] snap-center shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex-1 pr-3">
                    <div className="w-20 h-4 bg-gray-100 rounded mb-2"></div>
                    <div className="w-40 h-5 bg-gray-100 rounded mb-1.5"></div>
                    <div className="w-full h-3 bg-gray-50 rounded"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 shrink-0"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 relative z-10">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="w-12 h-3 bg-gray-100 rounded"></div>
                    <div className="w-16 h-3 bg-gray-100 rounded"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full"></div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <div id="tour-missions" className="-mx-5 mb-8">
            <div className="px-5 mb-4 flex justify-between items-baseline">
              <h3 className="text-[16px] font-semibold text-gray-900 tracking-tight">แคมเปญพิเศษ</h3>
              <button 
                onClick={() => router.push('/liff/member/missions')}
                className="text-[13px] font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                ดูทั้งหมด <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-5 items-stretch" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
              
              {/* 1. Missions */}
              {activeMissions.map((mission, idx) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                  className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative active:scale-[0.98] transition-transform cursor-pointer min-w-[300px] w-[85vw] max-w-[340px] h-full snap-center shrink-0 flex flex-col justify-between group"
                  onClick={() => router.push('/liff/member/missions')}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-3">
                          <div className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold tracking-wide mb-2">
                            {mission.campaign_type === 'daily' ? 'ภารกิจรายวัน' : mission.campaign_type === 'weekly' ? 'ภารกิจรายสัปดาห์' : mission.campaign_type === 'monthly' ? 'ภารกิจรายเดือน' : 'ภารกิจพิเศษ'}
                          </div>
                          <h4 className="text-[#1A1A18] font-bold text-[16px] leading-tight mb-1">{mission.title}</h4>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 shrink-0 group-active:bg-gray-100 transition-colors">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-baseline mb-2.5">
                        <span className="text-[11px] font-medium text-gray-500">ความคืบหน้า</span>
                        <span className="text-[13px] font-bold text-[#1A1A18]">
                          {mission.progress?.count || 0} <span className="text-gray-400 font-medium text-[11px]">/ {mission.condition_rules?.count || 1}</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${Math.min(100, ((mission.progress?.count || 0) / (mission.condition_rules?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* 2. Campaigns */}
              {campaigns.map((campaign, idx) => {
                const isMysteryBox = campaign.title.includes('กล่องสุ่ม');
                return (
                  <div 
                    key={campaign.id} 
                    className="min-w-[300px] w-[85vw] max-w-[340px] h-full snap-center rounded-[24px] p-[1px] relative overflow-hidden shrink-0 cursor-pointer group active:scale-[0.98] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" 
                    onClick={() => isMysteryBox ? setShowMysteryBox(true) : null}
                  >
                      {/* Animated Gradient Border Layer */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#B48529]/30 via-[#F0F0F0] to-[#B48529]/20 opacity-80 group-active:from-[#B48529] group-active:via-[#F4E1A4] group-active:to-[#B48529] transition-colors duration-500"></div>
                      
                      {/* Inner Card content */}
                      <div className="relative h-full bg-white/95 backdrop-blur-xl rounded-[23px] p-5 flex flex-col justify-between overflow-hidden">
                          
                          {/* Decorative Background Blob */}
                          <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-[#F4E1A4]/40 to-[#B48529]/10 rounded-full blur-3xl group-active:scale-150 transition-transform duration-700 ease-out"></div>
                          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-gradient-to-tr from-[#B48529]/10 to-transparent rounded-full blur-2xl group-active:scale-150 transition-transform duration-700 ease-out"></div>

                          <div className="relative z-10 flex flex-col h-full justify-between">
                              {/* Top Section */}
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1 pr-3">
                                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-[#B48529] to-[#996b1c] text-white text-[9px] font-bold tracking-widest uppercase shadow-sm mb-2">
                                              <Sparkles size={10} className="animate-pulse text-[#F4E1A4]" /> {campaign.type_tag || 'SPECIAL EVENT'}
                                          </div>
                                          <h4 className="text-[#1A1A18] text-[16px] font-bold leading-tight mb-1 group-active:text-[#B48529] transition-colors duration-300">
                                              {campaign.title}
                                          </h4>
                                          <p className="text-gray-500 text-[12px] leading-snug line-clamp-2">
                                              {campaign.description}
                                          </p>
                                      </div>
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#B48529]/20 text-[#B48529] shrink-0 shadow-sm group-active:bg-[#B48529] group-active:text-white transition-colors duration-300">
                                          <ChevronRight size={16} />
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Bottom Section (Mirrors Mission Progress Bar area) */}
                              <div className="mt-2 pt-3 border-t border-[#B48529]/20">
                                  <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[#B48529]">
                                         {isMysteryBox ? 'แตะเพื่อเปิดกล่องสุ่ม' : 'แตะเพื่อดูรายละเอียด'}
                                      </span>
                                      <span className="text-[10px] font-bold text-[#B48529]/50 uppercase tracking-widest">
                                          Exclusive
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {activeMissions.length === 0 && campaigns.length === 0 && (
                <div className="min-w-[300px] w-[85vw] max-w-[340px] h-full snap-center rounded-[24px] p-5 flex flex-col justify-center items-center relative overflow-hidden bg-gray-50 border border-gray-100 text-gray-400 shrink-0">
                    <Gift size={32} className="text-gray-300 mb-2" />
                    <p className="text-[12px] font-medium tracking-widest uppercase">รอพบกับแคมเปญใหม่ๆ เร็วๆนี้</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 📢 Campaigns/Titles */}
        <motion.section 
          id="tour-rewards"
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
                <div 
                  key={reward.id} 
                  className="relative group select-none touch-manipulation shrink-0 w-[150px] h-[150px] block cursor-pointer"
                  onClick={() => handleRedeemQuick(reward)}
                >
                  <button className="absolute inset-0 w-full h-full flex text-left font-bold rounded-[1.2rem] overflow-hidden border border-[#E5E5DF]/50 bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 outline-none">
                    {reward.image_url ? (
                      <img loading="lazy" crossOrigin="anonymous" src={reward.image_url} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 z-0" />
                    ) : (
                      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-100 text-gray-300 z-0"><Gift size={48} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-colors duration-300"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-end p-3 font-bold text-white w-full">
                      <div className="flex flex-col w-full gap-0.5 text-left">
                        <div className="flex flex-col w-full">
                          <h4 className="line-clamp-2 text-[13px] leading-tight font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {reward.name}
                          </h4>
                        </div>
                        <div className="flex items-baseline drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5 text-[#FCF7E8]">
                          <span className="text-[16px] font-black leading-none">{reward.cost_points.toLocaleString()}</span>
                          <span className="text-[9px] font-semibold ml-1 opacity-90">พอยท์</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] font-bold text-[#1A1A18] uppercase tracking-wider shadow-sm z-20">
                      REDEEM
                    </div>
                  </button>
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
                    <span className="leading-relaxed text-left">{selectedBadge.description || `ร่วมแคมเปญครบ ${selectedBadge.minPoints.toLocaleString()}`}</span>
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

      {/* 💡 Smart Reward Suggestion Modal */}
      <AnimatePresence>
        {showSuggestionModal && suggestedReward && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSuggestionModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Cover Image Section */}
              <div className="w-full h-[240px] bg-gray-100 relative overflow-hidden">
                {suggestedReward.image_url ? (
                    <motion.img 
                      initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
                      src={suggestedReward.image_url} 
                      alt={suggestedReward.name} 
                      className="w-full h-full object-cover" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#FDF8F3]">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Gift size={72} className="text-[#E0A865]/40" />
                        </motion.div>
                    </div>
                )}
                
                {/* Seamless Gradient Blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent pointer-events-none"></div>
                
                {/* Close Button Overlay */}
                <button 
                  onClick={() => setShowSuggestionModal(false)} 
                  className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors bg-black/20 backdrop-blur-md rounded-full p-1.5 z-10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Text & Action Section */}
              <div className="px-6 pb-6 pt-2 text-center relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDF8F3] text-[#E0A865] rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm border border-[#E0A865]/20">
                    <Sparkles size={12} className="fill-[#E0A865]" /> 
                    Reward Unlocked
                </div>
                
                <h3 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">แต้มคุณครบแล้ว! 🎉</h3>
              <p className="text-[14px] text-gray-500 mb-8 font-medium px-1 leading-relaxed">
                ใช้เพียง <strong className="text-[#E0A865]">{suggestedReward.cost_points.toLocaleString()} แต้ม</strong><br/>
                ก็แลกรับ <strong className="text-gray-900">"{suggestedReward.name}"</strong> ได้ทันที
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowSuggestionModal(false);
                    handleRedeemQuick(suggestedReward);
                  }}
                  className="w-full bg-gradient-to-r from-[#1A1A18] to-[#2A2A28] text-white py-4 rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(26,26,24,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  แลกสิทธิ์ตอนนี้เลย
                </button>
                <button 
                  onClick={() => setShowSuggestionModal(false)}
                  className="w-full text-gray-400 py-3 rounded-[16px] font-bold text-[14px] active:scale-[0.98] transition-colors hover:text-gray-600 hover:bg-gray-50"
                >
                  เก็บแต้มไว้ก่อน
                </button>
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



      {/* Registration Success Overlay */}
      <AnimatePresence>
        {isRegistrationSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#fcfcf9] overflow-hidden px-8"
          >
            <ParticleExplosion />
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="mb-8 flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A18] text-white shadow-2xl shadow-black/20"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={32} strokeWidth={2} />
              </motion.div>
            </motion.div>
            
            <div className="space-y-4 text-center w-full relative z-10">
              <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[28px] font-black text-[#1A1A18] tracking-tighter"
              >
                  สมัครสมาชิกสำเร็จ!
              </motion.h1>
              <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-[12px] font-bold text-gray-500 tracking-widest uppercase"
              >
                  {claimToken ? 'กำลังดำเนินการรับคะแนน...' : 'กำลังพากลับไปยังแชท...'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Onboarding Guide */}
      <AnimatePresence>
        {showOnboarding && (
          <MemberOnboardingGuide 
            onClose={() => {
              setShowOnboarding(false);
              // If they don't have claimToken, redirect them or let them explore
              // The original logic closed the window, but now they are exploring the page, so let them stay!
              if (!claimToken) {
                // Do nothing, they can just browse the member page!
              }
            }} 
          />
        )}
      </AnimatePresence>

      {/* Claim Popup Overlay */}
      <AnimatePresence>
        {showClaimPopup && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fcfcf9] overflow-hidden px-8"
          >
            {claimState === 'loading' && (
              <div className="flex flex-col items-center space-y-4 relative z-10">
                <XYLLoader />
                <motion.p 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase"
                >
                    Verifying
                </motion.p>
              </div>
            )}

            {claimState === 'success' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center w-full max-w-sm relative z-10"
              >
                <ParticleExplosion />
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20, 
                    delay: 0.1 
                  }}
                  className="mb-8 flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A18] text-white shadow-2xl shadow-black/20"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 size={32} strokeWidth={2} />
                  </motion.div>
                </motion.div>
                
                <div className="space-y-2 text-center w-full">
                  <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase"
                  >
                      Points Earned
                  </motion.p>
                  <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex justify-center items-baseline"
                  >
                      <span className="text-[48px] font-light text-[#1A1A18] mr-1 tracking-tighter leading-none">+</span>
                      <h1 className="text-[84px] font-medium text-[#1A1A18] tracking-tighter leading-none">
                          <AnimatedCounter value={claimPointsEarned} />
                      </h1>
                  </motion.div>
                </div>

                {claimOrderItems && claimOrderItems.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full mt-8 pt-6 border-t border-gray-100"
                  >
                    <p className="text-[10px] font-bold text-gray-400 mb-4 tracking-widest uppercase text-center">
                      รายการออเดอร์
                    </p>
                    <div className="space-y-3 max-h-[180px] overflow-y-auto w-full px-2">
                      {claimOrderItems.map((item: any, i: number) => (
                        <div 
                          key={i} 
                          className="flex justify-between items-start text-[13px] py-1 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-gray-800 font-semibold pr-4 leading-snug">{item.item_name}</span>
                          <span className="text-gray-500 font-bold whitespace-nowrap">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {claimState === 'pending_payment' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center w-full max-w-sm relative z-10"
              >
                <ParticleExplosion />
                
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20, 
                    delay: 0.1 
                  }}
                  className="mb-8 flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A18] text-white shadow-2xl shadow-black/20"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 size={32} strokeWidth={2} />
                  </motion.div>
                </motion.div>
                
                <div className="space-y-2 text-center w-full">
                  <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase"
                  >
                      Points Earned
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-center items-baseline"
                  >
                    <span className="text-[48px] font-light text-[#1A1A18] mr-1 tracking-tighter leading-none">+</span>
                    <h1 className="text-[84px] font-medium text-[#1A1A18] tracking-tighter leading-none">
                      <AnimatedCounter value={claimPointsEarned} />
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-4 pt-2"
                  >
                    <p className="text-[14px] font-medium text-gray-500 mt-1 leading-relaxed">
                      คุณจะได้รับคะแนนนี้เมื่อชำระเงินสำเร็จ
                    </p>
                  </motion.div>
                </div>

                {claimOrderItems && claimOrderItems.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full mt-6 pt-6 border-t border-gray-100"
                  >
                    <p className="text-[10px] font-bold text-gray-400 mb-4 tracking-widest uppercase text-center">
                      รายการออเดอร์
                    </p>
                    <div className="space-y-3 max-h-[180px] overflow-y-auto w-full px-2">
                      {claimOrderItems.map((item: any, i: number) => (
                        <div 
                          key={i} 
                          className="flex justify-between items-start text-[13px] py-1 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-gray-800 font-semibold pr-4 leading-snug">{item.item_name}</span>
                          <span className="text-gray-500 font-bold whitespace-nowrap">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={() => setShowClaimPopup(false)}
                  className="mt-8 w-full h-[52px] bg-[#1A1A18] text-white rounded-2xl font-bold text-[13px] tracking-wider uppercase hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center justify-center gap-2"
                >
                  รับทราบ
                </button>
              </motion.div>
            )}

            {claimState === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center w-full max-w-sm relative z-10"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
                    <XCircle size={32} strokeWidth={1.5} />
                </div>
                <div className="space-y-2 text-center w-full">
                    <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Claim Failed</p>
                    <p className="text-[15px] text-[#1A1A18] font-medium px-4">{claimMessage}</p>
                </div>
                <button 
                  onClick={() => setShowClaimPopup(false)}
                  className="mt-10 w-full h-[50px] bg-[#1A1A18] text-white rounded-full font-bold text-[13px] tracking-wide hover:bg-gray-900 transition-colors shadow-xl shadow-black/10 active:scale-95"
                >
                  ย้อนกลับ
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiffMemberPage() {
  return (
    <Suspense fallback={<div className="bg-[#fcfcf9] min-h-screen fixed inset-0 z-50"></div>}>
      <LiffMemberContent />
    </Suspense>
  );
}