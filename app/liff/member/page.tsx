'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, Loader2, Leaf, Ticket, Clock, History, CircleUserRound } from 'lucide-react';
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
  
  const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'history'>('home');
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
        const { data: history } = await supabase.from('pos_points_history').select('*').in('member_id', [member.id, userId]).order('created_at', { ascending: false }).limit(20);
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
    return () => { supabase.removeChannel(channel); };
  }, [lineProfile, liffLoading]);

  const handleLinkPhone = async () => {
    if (!nicknameInput.trim() || phoneInput.length < 9) return;
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
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
    } catch (e) { console.error(e); } finally { setIsLinkingPhone(false); }
  };

  const handleHarvest = async () => {
    if (!confirm('ยืนยันการเก็บเกี่ยวต้นไม้และรับคูปอง?')) return;
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
            alert('เก็บเกี่ยวสำเร็จ! คูปองอยู่ในบัญชีของคุณแล้ว');
            fetchData();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) { alert('Error harvesting'); } finally { setIsHarvesting(false); }
  }

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline="Loading..." />;

  const points = memberInfo?.points || 0;
  const progressPercent = Math.min(100, (points / POINTS_REQUIRED) * 100);
  const isReadyToHarvest = points >= POINTS_REQUIRED;

  const renderTabContent = () => {
    switch(activeTab) {
        case 'home':
            return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="pb-32">
                    
                    {/* Header Profile */}
                    <div className="flex items-center gap-4 mb-6 mt-2">
                        {lineProfile?.pictureUrl ? (
                            <img src={lineProfile.pictureUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400">
                                <CircleUserRound size={24} />
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-gray-500 font-medium">สวัสดี,</p>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                {memberInfo?.full_name || lineProfile?.displayName || 'คุณลูกค้า'}
                            </h2>
                        </div>
                    </div>

                    {!memberInfo?.phone && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex justify-between items-center shadow-sm">
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">รับสิทธิพิเศษเต็มรูปแบบ</h4>
                                <p className="text-xs text-amber-700 mt-0.5">เชื่อมต่อเบอร์โทรศัพท์เพื่อสะสมหยดน้ำ</p>
                            </div>
                            <button onClick={() => setShowPhoneModal(true)} className="bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform">
                                เชื่อมต่อ
                            </button>
                        </div>
                    )}

                    {/* The Digital Garden Hero Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white relative overflow-hidden mb-8">
                        {/* Soft Glow Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-sage-50/50 to-transparent -z-10" />
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Leaf size={16} className="text-sage-600" /> Digital Garden
                            </h3>
                            {memberInfo?.title && (
                                <span className="bg-sage-100 text-sage-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {memberInfo.title}
                                </span>
                            )}
                        </div>

                        {/* Plant Animation Area */}
                        <div className="h-[220px] w-full relative mb-6 rounded-2xl bg-gradient-to-t from-gray-50 to-white/50 border border-gray-100/50 shadow-inner">
                            <AnimatedMinimalTree progress={progressPercent} />
                        </div>

                        {/* Progress Bar & Drops */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-3xl font-black text-sage-700 tracking-tighter leading-none">
                                        {points.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium mt-1">หยดน้ำที่สะสมได้</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900">{POINTS_REQUIRED.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">เป้าหมาย</div>
                                </div>
                            </div>

                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                    className="h-full bg-sage-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: \`\${progressPercent}%\` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {/* Harvest Button */}
                        <div className="mt-6">
                            <button 
                                disabled={!isReadyToHarvest || isHarvesting}
                                onClick={handleHarvest}
                                className={\`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm
                                    \${isReadyToHarvest 
                                        ? 'bg-sage-600 text-white hover:bg-sage-700 active:scale-95 shadow-sage-600/20' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}\`}
                            >
                                {isHarvesting ? <Loader2 size={18} className="animate-spin mx-auto" /> : (isReadyToHarvest ? 'เก็บเกี่ยวคูปอง' : 'รดน้ำต่อไป')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        case 'rewards':
            return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="pb-32 pt-2">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Rewards</h2>
                            <p className="text-sm text-gray-500 mt-1">คูปองส่วนลดของคุณ</p>
                        </div>
                        <span className="bg-sage-100 text-sage-800 text-xs font-bold px-3 py-1 rounded-full">
                            {coupons.length} ใบ
                        </span>
                    </div>
                    
                    {coupons.length > 0 ? (
                        <div className="space-y-4">
                            {coupons.map(c => (
                                <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden relative">
                                    {/* Ticket left decor */}
                                    <div className="w-4 bg-sage-500 flex flex-col justify-between py-2 border-r border-dashed border-white/50">
                                        {/* Perforations */}
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="w-1.5 h-3 bg-white rounded-r-full -ml-1 opacity-50" />
                                        ))}
                                    </div>
                                    <div className="p-5 flex-1">
                                        <div className="text-[10px] uppercase tracking-widest text-sage-600 font-bold mb-1">Coupon</div>
                                        <h4 className="text-base font-bold text-gray-900">{c.coupon_name}</h4>
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                            <History size={12} /> ใช้สิทธิ์ได้ที่หน้าเคาน์เตอร์
                                        </p>
                                    </div>
                                    {/* Circle Cutouts to look like a ticket */}
                                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-r border-gray-100" />
                                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-l border-gray-100" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                            <Ticket size={48} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-sm font-bold text-gray-900 mb-1">ยังไม่มีคูปอง</h3>
                            <p className="text-xs text-gray-500">ปลูกต้นไม้ให้ครบ 1,000 หยดเพื่อรับคูปอง</p>
                        </div>
                    )}
                </motion.div>
            );
        case 'history':
            return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="pb-32 pt-2">
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Stats & History</h2>
                        <p className="text-sm text-gray-500 mt-1">สถิติและประวัติการใช้งานของคุณ</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">เมนูโปรด</div>
                            <div className="text-base font-bold text-sage-700 line-clamp-2 leading-tight h-10">{stats?.favoriteMenu || '-'}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">ดื่มไปแล้ว</div>
                            <div className="text-2xl font-black text-sage-700 tracking-tighter">
                                {stats?.totalCups || 0} <span className="text-sm font-bold text-gray-500 tracking-normal">แก้ว</span>
                            </div>
                        </div>
                    </div>

                    {/* History Timeline */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Clock size={16} className="text-sage-600" /> ประวัติสะสมหยดน้ำ
                        </h3>
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {pointsHistory.length > 0 ? pointsHistory.map((h, i) => (
                                <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6">
                                    <div className={\`flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 \${h.type === 'earn' ? 'bg-sage-100 text-sage-600' : 'bg-gray-100 text-gray-500'}\`}>
                                        {h.type === 'earn' ? <Leaf size={14} /> : <Ticket size={14} />}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ml-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-sm font-bold text-gray-900">{h.description}</div>
                                            <div className={\`text-sm font-black \${h.type === 'earn' ? 'text-sage-600' : 'text-gray-900'}\`}>
                                                {h.type === 'earn' ? '+' : '-'}{Math.abs(h.points)}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                            {new Date(h.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm relative z-10">
                                    ยังไม่มีประวัติการใช้งาน
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-sage-200">
      
      {/* Top Nav (Optional, maybe just back button) */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md z-40">
        <button onClick={() => router.back()} className="text-gray-900 p-2 -ml-2 bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      </header>

      <main className="px-5 max-w-md mx-auto">
        <AnimatePresence mode="wait">
            {renderTabContent()}
        </AnimatePresence>
      </main>

      {/* Standard iOS-style Bottom Tab Bar */}
      <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
          
          <button 
            onClick={() => setActiveTab('home')}
            className={\`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors \${activeTab === 'home' ? 'text-sage-600' : 'text-gray-400 hover:text-gray-600'}\`}
          >
            <div className={\`p-1.5 rounded-full transition-all \${activeTab === 'home' ? 'bg-sage-50' : 'bg-transparent'}\`}>
                <Leaf size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />
            </div>
            <span className={\`text-[10px] font-medium \${activeTab === 'home' ? 'text-sage-700 font-bold' : ''}\`}>Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('rewards')}
            className={\`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors \${activeTab === 'rewards' ? 'text-sage-600' : 'text-gray-400 hover:text-gray-600'}\`}
          >
            <div className={\`p-1.5 rounded-full transition-all relative \${activeTab === 'rewards' ? 'bg-sage-50' : 'bg-transparent'}\`}>
                <Ticket size={22} strokeWidth={activeTab === 'rewards' ? 2.5 : 1.5} />
                {coupons.length > 0 && (
                    <span className="absolute top-1 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
            </div>
            <span className={\`text-[10px] font-medium \${activeTab === 'rewards' ? 'text-sage-700 font-bold' : ''}\`}>Rewards</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={\`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors \${activeTab === 'history' ? 'text-sage-600' : 'text-gray-400 hover:text-gray-600'}\`}
          >
            <div className={\`p-1.5 rounded-full transition-all \${activeTab === 'history' ? 'bg-sage-50' : 'bg-transparent'}\`}>
                <History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 1.5} />
            </div>
            <span className={\`text-[10px] font-medium \${activeTab === 'history' ? 'text-sage-700 font-bold' : ''}\`}>Stats</span>
          </button>

        </div>
      </nav>

      {/* Phone Modal (Glassmorphism) */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl z-10">
              <button onClick={() => setShowPhoneModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-full p-2">
                <X size={16} strokeWidth={2} />
              </button>
              
              <div className="w-12 h-12 bg-sage-50 text-sage-600 rounded-full flex items-center justify-center mb-6">
                  <CircleUserRound size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">เชื่อมต่อบัญชี</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">กรุณากรอกข้อมูลเพื่อสะสมหยดน้ำอัตโนมัติเมื่อสั่งซื้อที่หน้าร้าน</p>
              
              <div className="space-y-4 mb-8">
                  <div className="relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute top-2 left-4">ชื่อเล่น / ชื่อเรียก</label>
                      <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pt-7 pb-3 px-4 text-sm font-medium outline-none focus:bg-white focus:border-sage-400 focus:ring-4 focus:ring-sage-50 transition-all" />
                  </div>
                  <div className="relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute top-2 left-4">เบอร์โทรศัพท์</label>
                      <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pt-7 pb-3 px-4 text-sm font-medium outline-none focus:bg-white focus:border-sage-400 focus:ring-4 focus:ring-sage-50 transition-all tracking-wider" />
                  </div>
              </div>
              
              <button onClick={handleLinkPhone} disabled={isLinkingPhone} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20">
                {isLinkingPhone ? <Loader2 size={18} className="animate-spin" /> : 'บันทึกข้อมูล'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
