
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, User, Info, X, Check, Loader2, BarChart2, Tag
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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'history' | 'stats' | 'coupons'>('tree');
  
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
        const { data: history } = await supabase.from('pos_points_history').select('*').in('member_id', [member.id, userId]).order('created_at', { ascending: false });
        if (history) setPointsHistory(history);
        
        const { data: cps } = await supabase.from('pos_member_coupons').select('*').eq('member_id', member.id).eq('status', 'active');
        if (cps) setCoupons(cps);
      }
      
      // Fetch Stats
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_points_history' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_member_coupons' }, () => {
        fetchData();
      })
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
    if (!confirm('ยืนยันการเก็บเกี่ยวต้นไม้ (ใช้ 1,000 หยดน้ำ)?')) return;
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
            alert('เก็บเกี่ยวสำเร็จ! คุณได้รับคูปองฟรีต้นไม้ 1 ต้น');
            setActiveTab('coupons');
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
  
  // Tree logic
  let treeIcon = "🌱";
  let treeStage = "เมล็ดพันธุ์";
  if (points >= 800) { treeIcon = "🌳"; treeStage = "ต้นไม้ใหญ่"; }
  else if (points >= 300) { treeIcon = "🪴"; treeStage = "ต้นไม้กำลังโต"; }
  else if (points >= 100) { treeIcon = "🌿"; treeStage = "ต้นอ่อน"; }

  const progressPercent = Math.min(100, (points / POINTS_REQUIRED) * 100);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A18] font-sans overflow-x-hidden pb-24 selection:bg-sage-200">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-[#1A1A18] transition-colors">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[13px] font-black uppercase tracking-[0.2em]">XYL GARDEN</h1>
        <div className="w-8" />
      </header>

      <main className="px-5 py-6 space-y-8">
        
        {/* Profile Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
             {lineProfile?.pictureUrl ? <img src={lineProfile.pictureUrl} className="w-full h-full object-cover" /> : <User />}
           </div>
           <div>
             <h2 className="text-[16px] font-black tracking-tight">{memberInfo?.full_name || lineProfile?.displayName || 'Member'}</h2>
             {memberInfo?.title ? (
                 <div className="text-[10px] text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full inline-block mt-1 font-black uppercase tracking-widest">
                    👑 {memberInfo.title}
                 </div>
             ) : (
                 <div className="text-[10px] text-gray-400 mt-1">{memberInfo?.phone || 'ยังไม่ได้ผูกเบอร์'}</div>
             )}
             {!memberInfo?.phone && (
                 <button onClick={() => setShowPhoneModal(true)} className="text-[9px] bg-black text-white px-2 py-1 rounded-full mt-2 font-bold uppercase tracking-widest">+ ผูกเบอร์รับแต้ม</button>
             )}
           </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6 sticky top-[68px] bg-[#FAFAF9]/90 backdrop-blur-md z-30 pt-2">
            {[
                { id: 'tree', label: 'ต้นไม้ของฉัน' },
                { id: 'coupons', label: 'คูปอง' },
                { id: 'stats', label: 'XYL Wrapped' },
                { id: 'history', label: 'ประวัติ' },
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 pb-3 text-[11px] font-black uppercase tracking-widest transition-colors relative ${activeTab === tab.id ? 'text-sage-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-sage-600" />}
                </button>
            ))}
        </div>

        <AnimatePresence mode="wait">
            {activeTab === 'tree' && (
                <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">สถานะ: {treeStage}</div>
                        
                        <motion.div 
                            animate={{ y: [0, -10, 0] }} 
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="text-8xl mb-8 filter drop-shadow-xl"
                        >
                            {treeIcon}
                        </motion.div>

                        <div className="mb-2">
                            <span className="text-4xl font-black tracking-tighter text-sage-600">{points.toLocaleString()}</span>
                            <span className="text-sm font-bold text-gray-400 ml-1">/ {POINTS_REQUIRED.toLocaleString()} หยดน้ำ</span>
                        </div>

                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-gradient-to-r from-sage-400 to-sage-600 relative"
                            >
                                <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]" />
                            </motion.div>
                        </div>

                        <button 
                            disabled={points < POINTS_REQUIRED || isHarvesting}
                            onClick={handleHarvest}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${points >= POINTS_REQUIRED ? 'bg-sage-600 text-white shadow-xl shadow-sage-600/30 active:scale-95' : 'bg-gray-100 text-gray-400'}`}
                        >
                            {isHarvesting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (points >= POINTS_REQUIRED ? 'เก็บเกี่ยว (รับฟรี 1 ต้น)' : 'ต้องการอีก 1,000 หยดน้ำ')}
                        </button>
                    </div>
                    <div className="text-center text-[10px] text-gray-400 font-bold">ทุกการซื้อเครื่องดื่ม/อาหารที่ XYL จะกลายเป็นหยดน้ำเพื่อหล่อเลี้ยงต้นไม้นี้</div>
                </motion.div>
            )}

            {activeTab === 'coupons' && (
                <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {coupons.length > 0 ? coupons.map(c => (
                        <div key={c.id} className="bg-sage-600 text-white p-6 rounded-3xl shadow-xl flex items-center gap-5 relative overflow-hidden">
                            <div className="absolute -right-10 -bottom-10 text-9xl opacity-10">🎫</div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                                <Gift size={24} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-sage-200 mb-1">สิทธิ์ที่สามารถใช้งานได้</div>
                                <div className="text-lg font-black leading-tight">{c.coupon_name}</div>
                                <div className="text-[9px] text-sage-200 mt-2">แจ้งเบอร์โทรศัพท์ที่หน้าเคาน์เตอร์เพื่อใช้สิทธิ์</div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 text-gray-300 font-bold">
                            <Tag size={48} className="mx-auto mb-4 opacity-20" />
                            <div className="text-sm">ยังไม่มีคูปอง</div>
                            <div className="text-[10px]">ปลูกต้นไม้ให้โตเพื่อรับคูปองฟรี</div>
                        </div>
                    )}
                </motion.div>
            )}

            {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="bg-[#1A1A18] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart2 size={120} /></div>
                        <h3 className="text-2xl font-black italic tracking-tighter mb-8 relative z-10">XYL Wrapped.</h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">เมนูโปรดของคุณ</div>
                                <div className="text-2xl font-black text-sage-400">{stats?.favoriteMenu || 'กำลังคำนวณ...'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">วันที่เจอกันบ่อยที่สุด</div>
                                <div className="text-xl font-black">{stats?.mostVisitedDay || 'กำลังคำนวณ...'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">จำนวนแก้วทั้งหมดที่ดื่มด้วยกัน</div>
                                <div className="text-xl font-black tabular-nums">{stats?.totalCups || 0} แก้ว</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {pointsHistory.map(h => (
                        <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'earn' ? 'bg-sage-50 text-sage-600' : 'bg-red-50 text-red-500'}`}>
                                    {h.type === 'earn' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                                <div>
                                    <div className="text-xs font-black">{h.description}</div>
                                    <div className="text-[9px] text-gray-400 font-bold mt-0.5">{new Date(h.created_at).toLocaleDateString('th-TH')}</div>
                                </div>
                            </div>
                            <div className={`font-black tabular-nums ${h.type === 'earn' ? 'text-sage-600' : 'text-red-500'}`}>
                                {h.type === 'earn' ? '+' : '-'}{Math.abs(h.points)}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>

      </main>

      {/* Phone Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhoneModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 text-center">
              <h3 className="text-xl font-black mb-2">ผูกเบอร์โทรศัพท์</h3>
              <p className="text-xs text-gray-500 mb-6">เพื่อรับหยดน้ำจากการสั่งซื้อหน้าร้าน</p>
              <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="ชื่อเล่น" className="w-full bg-gray-50 rounded-xl p-4 font-bold text-center mb-3 outline-none" />
              <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="เบอร์โทรศัพท์" className="w-full bg-gray-50 rounded-xl p-4 font-black text-center mb-6 outline-none" />
              <div className="flex gap-3">
                <button onClick={() => setShowPhoneModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">ยกเลิก</button>
                <button onClick={handleLinkPhone} disabled={isLinkingPhone} className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm">บันทึก</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
