
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, History, Gift, TrendingUp, TrendingDown, User, Info, X, Check, Loader2, Droplet, Tag
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
            alert('เก็บเกี่ยวสำเร็จ! คูปองถูกเพิ่มลงในกล่องคูปองของคุณแล้ว');
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
  
  // Tree logic with real images
  let treeImage = "/images/garden/seed.png";
  let treeStage = "เมล็ดพันธุ์ (Seed)";
  let stageDescription = "รดน้ำอีกนิดเพื่อให้เมล็ดพันธุ์งอกงาม";
  if (points >= 800) { 
      treeImage = "/images/garden/tree.png"; 
      treeStage = "ต้นไม้ใหญ่ (Mature Tree)"; 
      stageDescription = "ใกล้จะได้เวลาเก็บเกี่ยวแล้ว!";
  } else if (points >= 300) { 
      treeImage = "/images/garden/young.png"; 
      treeStage = "ต้นไม้กำลังโต (Young Plant)"; 
      stageDescription = "ต้นไม้ของคุณกำลังเติบโตอย่างสวยงาม";
  } else if (points >= 100) { 
      treeImage = "/images/garden/sprout.png"; 
      treeStage = "ต้นอ่อน (Sprout)"; 
      stageDescription = "ยอดอ่อนเริ่มผลิใบแล้ว รดน้ำต่อไปนะ";
  }

  const progressPercent = Math.min(100, (points / POINTS_REQUIRED) * 100);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A18] font-sans overflow-x-hidden pb-32">
      <header className="sticky top-0 z-40 bg-[#F5F5F0]/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-[#1A1A18] transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A18]">XYL Member</h1>
        <div className="w-8" />
      </header>

      <main className="px-6 space-y-10">
        
        {/* Profile Minimal */}
        <section className="flex items-center gap-5">
           <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
             {lineProfile?.pictureUrl ? <img src={lineProfile.pictureUrl} className="w-full h-full object-cover" /> : <User strokeWidth={1.5} className="text-gray-400" />}
           </div>
           <div>
             <h2 className="text-xl font-bold tracking-tight text-[#1A1A18]">{memberInfo?.full_name || lineProfile?.displayName || 'Member'}</h2>
             {memberInfo?.title ? (
                 <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block mt-2 font-black uppercase tracking-widest">
                    👑 {memberInfo.title}
                 </div>
             ) : (
                 <div className="text-xs text-gray-400 mt-1">{memberInfo?.phone || 'Guest'}</div>
             )}
             {!memberInfo?.phone && (
                 <button onClick={() => setShowPhoneModal(true)} className="text-[10px] bg-black text-white px-4 py-1.5 rounded-full mt-2 font-bold transition-transform active:scale-95">เชื่อมต่อเบอร์โทรศัพท์</button>
             )}
           </div>
        </section>

        {/* Digital Garden Premium Card */}
        <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#EAEAE2] to-transparent rounded-[2.5rem] -z-10 blur-xl opacity-50" />
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden">
                <div className="text-center mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Your Garden</h3>
                    <div className="text-lg font-bold text-[#1A1A18]">{treeStage}</div>
                </div>

                {/* 3D Image Container */}
                <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="w-full h-full relative z-10 drop-shadow-2xl"
                    >
                        {/* We use Next/img or standard img with floating animation */}
                        <motion.img 
                            src={treeImage} 
                            alt={treeStage}
                            className="w-full h-full object-contain"
                            animate={{ y: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        />
                    </motion.div>
                    
                    {/* Shadow under the plant */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-black/5 rounded-[100%] blur-md" />
                </div>

                {/* Progress Bar & Drops */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-1.5 text-sage-600 mb-1">
                                <Droplet size={14} className="fill-current" />
                                <span className="text-3xl font-black tracking-tighter tabular-nums">{points.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-400">Total Drops Collected</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-[#1A1A18]">{POINTS_REQUIRED.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-gray-400">Goal</div>
                        </div>
                    </div>

                    <div className="h-1.5 w-full bg-[#F5F5F0] rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-sage-600 rounded-full"
                        />
                    </div>
                    <div className="text-center text-[10px] font-bold text-gray-400">
                        {stageDescription}
                    </div>
                </div>

                {/* Harvest Button */}
                <div className="mt-8">
                    <button 
                        disabled={points < POINTS_REQUIRED || isHarvesting}
                        onClick={handleHarvest}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${points >= POINTS_REQUIRED ? 'bg-[#1A1A18] text-white shadow-lg active:scale-[0.98]' : 'bg-[#F5F5F0] text-gray-400'}`}
                    >
                        {isHarvesting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (points >= POINTS_REQUIRED ? 'Harvest Tree' : 'Keep Growing')}
                    </button>
                </div>
            </div>
        </section>

        {/* Coupons - Horizontal Scroll */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1A1A18]">My Rewards</h3>
                <span className="text-xs font-bold text-sage-600">{coupons.length} Available</span>
            </div>
            
            {coupons.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-6 snap-x -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {coupons.map(c => (
                        <div key={c.id} className="min-w-[260px] snap-center bg-[#1A1A18] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between aspect-[1.5/1]">
                            <div className="absolute -right-6 -bottom-6 opacity-10">
                                <Gift size={120} />
                            </div>
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-sage-400 mb-2">Available Coupon</div>
                                <div className="text-lg font-bold leading-snug pr-4">{c.coupon_name}</div>
                            </div>
                            <div className="text-[10px] text-gray-400">
                                โปรดแจ้งเบอร์โทรศัพท์ที่หน้าเคาน์เตอร์
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400">
                    <Tag size={32} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
                    <div className="text-xs font-bold">ยังไม่มีคูปอง</div>
                    <div className="text-[10px] mt-1">ปลูกต้นไม้ให้โตเพื่อรับคูปองพิเศษ</div>
                </div>
            )}
        </section>

        {/* Stats - Minimal */}
        <section className="bg-sage-50 rounded-3xl p-6 border border-sage-100/50">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-sage-800 mb-6 flex items-center gap-2">
                <History size={14} /> Your Journey
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Favorite Menu</div>
                    <div className="text-sm font-bold text-sage-700 line-clamp-2">{stats?.favoriteMenu || '-'}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Visits (Cups)</div>
                    <div className="text-sm font-bold text-sage-700">{stats?.totalCups || 0} แก้ว</div>
                </div>
            </div>
        </section>

        {/* History (Recent 5) */}
        <section>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Recent Activity</h3>
            <div className="space-y-1">
                {pointsHistory.length > 0 ? pointsHistory.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'earn' ? 'bg-sage-50 text-sage-600' : 'bg-gray-100 text-gray-500'}`}>
                                {h.type === 'earn' ? <TrendingUp size={16} /> : <Gift size={16} />}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[#1A1A18]">{h.description}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{new Date(h.created_at).toLocaleDateString('th-TH')}</div>
                            </div>
                        </div>
                        <div className={`font-black tabular-nums text-sm ${h.type === 'earn' ? 'text-sage-600' : 'text-[#1A1A18]'}`}>
                            {h.type === 'earn' ? '+' : '-'}{Math.abs(h.points)}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-xs text-gray-400">ไม่มีประวัติการทำรายการ</div>
                )}
            </div>
        </section>

      </main>

      {/* Phone Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhoneModal(false)} className="absolute inset-0 bg-[#1A1A18]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl z-10">
              <button onClick={() => setShowPhoneModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-2">เชื่อมต่อเบอร์โทรศัพท์</h3>
              <p className="text-xs text-gray-500 mb-8 leading-relaxed">กรุณากรอกชื่อเล่นและเบอร์โทรศัพท์ เพื่อรับหยดน้ำสะสมอัตโนมัติเมื่อสั่งซื้อที่หน้าร้าน</p>
              
              <div className="space-y-3 mb-8">
                  <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="ชื่อเล่น" className="w-full bg-[#F5F5F0] rounded-2xl p-4 font-bold text-center outline-none focus:ring-2 focus:ring-[#1A1A18]/20 transition-all" />
                  <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="เบอร์โทรศัพท์" className="w-full bg-[#F5F5F0] rounded-2xl p-4 font-bold text-center outline-none focus:ring-2 focus:ring-[#1A1A18]/20 transition-all tracking-wider" />
              </div>
              
              <button onClick={handleLinkPhone} disabled={isLinkingPhone} className="w-full py-4 bg-[#1A1A18] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                {isLinkingPhone && <Loader2 size={16} className="animate-spin" />}
                บันทึกข้อมูล
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
