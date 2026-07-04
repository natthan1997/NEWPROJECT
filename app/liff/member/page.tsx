
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, Loader2, Leaf, Ticket, BarChart2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import AnimatedMinimalTree from '@/components/AnimatedMinimalTree';
import { useI18n } from "@/lib/I18nContext";

export default function LiffMemberPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'garden' | 'rewards' | 'stats' | 'history'>('garden');

  // Modals
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  const POINTS_REQUIRED = 1000;

  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) {
        setMemberInfo(member);
        const { data: history } = await supabase.from('pos_points_history').select('*').in('member_id', [member.id, userId]).order('created_at', { ascending: false }).limit(10);
        if (history) setPointsHistory(history);
        
        const { data: cps } = await supabase.from('pos_member_coupons').select('*').eq('member_id', member.id).eq('status', 'active');
        if (cps) setCoupons(cps);
      }
      
      const res = await fetch('/api/liff/member/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: userId })
      });
      const statsData = await res.json();
      if (statsData.success) {
          setStats(statsData);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_points_history' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_member_coupons' }, () => fetchData())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lineProfile, liffLoading]);

  const handleLinkPhone = async () => {
    if (!nicknameInput.trim() || phoneInput.length < 9) return;
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
            setShowPhoneModal(false);
            fetchData();
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLinkingPhone(false);
    }
  };

  const handleHarvest = async () => {
    if (!confirm('เก็บเกี่ยวต้นไม้และรับคูปอง?')) return;
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    setIsHarvesting(true);
    try {
        const res = await fetch('/api/liff/member/harvest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId: userId })
        });
        const data = await res.json();
        if (data.success) {
            alert('เก็บเกี่ยวสำเร็จ คูปองอยู่ในบัญชีของคุณแล้ว');
            fetchData();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        alert('Error harvesting');
    } finally {
        setIsHarvesting(false);
    }
  }

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline="Loading..." />;

  const points = memberInfo?.points || 0;
  const progressPercent = Math.min(100, (points / POINTS_REQUIRED) * 100);

  const renderTabContent = () => {
    switch(activeTab) {
        case 'garden':
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
                    {/* Profile */}
                    <div className="text-center mb-12 mt-4">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#888888] mb-2">Welcome</div>
                        <h2 className="text-2xl font-light tracking-wide">{memberInfo?.full_name || lineProfile?.displayName || 'Guest'}</h2>
                        
                        {memberInfo?.title ? (
                            <div className="mt-3 text-[9px] uppercase tracking-widest text-[#111111] border border-[#E5E5E5] px-4 py-1.5 rounded-full inline-block">
                            {memberInfo.title}
                            </div>
                        ) : null}

                        {!memberInfo?.phone && (
                            <div className="mt-6">
                                <button onClick={() => setShowPhoneModal(true)} className="text-[10px] uppercase tracking-[0.2em] border-b border-[#111111] pb-1">
                                Connect Phone
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Minimal Tree Area */}
                    <div>
                        <div className="h-[250px] w-full relative mb-12">
                            <AnimatedMinimalTree progress={progressPercent} />
                        </div>

                        <div className="text-center">
                            <div className="text-4xl font-light tracking-tighter mb-2">
                                {points.toLocaleString()} <span className="text-[14px] text-[#888888]">/ {POINTS_REQUIRED.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#888888] mb-8">Drops Collected</div>
                            
                            <div className="w-full h-[1px] bg-[#F5F5F5] relative mb-8">
                                <motion.div 
                                    className="absolute left-0 top-0 h-full bg-[#111111]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>

                            <button 
                                disabled={points < POINTS_REQUIRED || isHarvesting}
                                onClick={handleHarvest}
                                className={`w-full py-4 text-[10px] uppercase tracking-[0.2em] transition-all ${points >= POINTS_REQUIRED ? 'bg-[#111111] text-white' : 'bg-white text-[#888888] border border-[#E5E5E5]'}`}
                            >
                                {isHarvesting ? 'Harvesting...' : (points >= POINTS_REQUIRED ? 'Harvest' : 'Keep Growing')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        case 'rewards':
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24 pt-4">
                    <div className="flex justify-between items-baseline mb-8">
                        <h3 className="text-[10px] uppercase tracking-[0.2em]">Rewards</h3>
                        <span className="text-[10px] text-[#888888]">{coupons.length} Available</span>
                    </div>
                    
                    {coupons.length > 0 ? (
                        <div className="space-y-4">
                            {coupons.map(c => (
                                <div key={c.id} className="border border-[#E5E5E5] p-6 flex justify-between items-center group cursor-pointer hover:border-[#111111] transition-colors">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#888888] mb-2">Coupon</div>
                                        <div className="text-sm font-medium">{c.coupon_name}</div>
                                    </div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#111111]">
                                        Active
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-[#E5E5E5] border-dashed">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#888888]">No Rewards Yet</div>
                        </div>
                    )}
                </motion.div>
            );
        case 'stats':
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24 pt-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] mb-8">Journey</h3>
                    <div className="grid grid-cols-2 gap-px bg-[#E5E5E5] border border-[#E5E5E5]">
                        <div className="bg-white p-6">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-[#888888] mb-3">Favorite</div>
                            <div className="text-sm font-medium">{stats?.favoriteMenu || '-'}</div>
                        </div>
                        <div className="bg-white p-6">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-[#888888] mb-3">Total Cups</div>
                            <div className="text-sm font-medium">{stats?.totalCups || 0}</div>
                        </div>
                    </div>
                </motion.div>
            );
        case 'history':
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24 pt-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] mb-8">History</h3>
                    <div className="space-y-6">
                        {pointsHistory.length > 0 ? pointsHistory.slice(0, 10).map(h => (
                            <div key={h.id} className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs">{h.description}</div>
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-[#888888] mt-1">{new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                                <div className="text-xs">
                                    {h.type === 'earn' ? '+' : '-'}{Math.abs(h.points)}
                                </div>
                            </div>
                        )) : (
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#888888]">No Activity</div>
                        )}
                    </div>
                </motion.div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans overflow-x-hidden">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white z-40 sticky top-0">
        <button onClick={() => router.back()} className="text-[#111111] -ml-2 p-2">
          <ChevronLeft size={24} strokeWidth={1} />
        </button>
        <h1 className="text-[10px] uppercase tracking-[0.3em] font-medium">Member</h1>
        <div className="w-8" />
      </header>

      <main className="px-6 max-w-lg mx-auto min-h-[calc(100vh-200px)]">
        <AnimatePresence mode="wait">
            {renderTabContent()}
        </AnimatePresence>
      </main>

      {/* Ultra Minimal Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-[#F5F5F5] pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('garden')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'garden' ? 'text-[#111111]' : 'text-[#CCCCCC]'}`}
          >
            <Leaf size={18} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-widest">Garden</span>
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'rewards' ? 'text-[#111111]' : 'text-[#CCCCCC]'}`}
          >
            <Ticket size={18} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-widest">Rewards</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'stats' ? 'text-[#111111]' : 'text-[#CCCCCC]'}`}
          >
            <BarChart2 size={18} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-widest">Journey</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'history' ? 'text-[#111111]' : 'text-[#CCCCCC]'}`}
          >
            <Clock size={18} strokeWidth={1.5} />
            <span className="text-[8px] uppercase tracking-widest">History</span>
          </button>
        </div>
      </nav>

      {/* Phone Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhoneModal(false)} className="absolute inset-0 bg-white/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white w-full max-w-sm border border-[#E5E5E5] p-8 z-10 shadow-2xl">
              <button onClick={() => setShowPhoneModal(false)} className="absolute top-6 right-6 text-[#111111]">
                <X size={16} strokeWidth={1} />
              </button>
              <h3 className="text-sm font-medium mb-2">Link Account</h3>
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#888888] mb-8 leading-relaxed">Enter your details to collect drops in-store.</p>
              
              <div className="space-y-4 mb-8">
                  <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="Name" className="w-full border-b border-[#E5E5E5] pb-2 text-sm outline-none focus:border-[#111111] transition-colors bg-transparent rounded-none" />
                  <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="Phone Number" className="w-full border-b border-[#E5E5E5] pb-2 text-sm outline-none focus:border-[#111111] transition-colors bg-transparent rounded-none" />
              </div>
              
              <button onClick={handleLinkPhone} disabled={isLinkingPhone} className="w-full py-4 bg-[#111111] text-white text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                {isLinkingPhone ? 'Saving...' : 'Save Details'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
