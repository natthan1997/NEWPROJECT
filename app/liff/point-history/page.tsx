'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  HelpCircle,
  ArrowUpDown,
  SlidersHorizontal,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import { useI18n } from "@/lib/I18nContext";

export default function LiffPointHistoryPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, phone, loading: liffLoading, hasSeenLoader } = useLiff();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchPointHistory = async () => {
    const currentUserId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    
    if (!currentUserId && !phone) {
      setFetchLoading(false);
      return;
    }
    
    try {
      setFetchLoading(true);
      // Fetch member info to get the current points and member ID
      let memberQuery = supabase.from('pos_members').select('*');
      if (currentUserId && phone) {
        memberQuery = memberQuery.or(`line_user_id.eq.${currentUserId},phone.eq.${phone}`);
      } else if (currentUserId) {
        memberQuery = memberQuery.eq('line_user_id', currentUserId);
      } else if (phone) {
        memberQuery = memberQuery.eq('phone', phone);
      }
      
      const { data: member } = await memberQuery.maybeSingle();
      if (member) {
        setMemberInfo(member);
        
        // Fetch point transactions from the correct table
        const { data: txs, error: txsError } = await supabase
          .from('pos_points_history')
          .select('*')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (txsError) {
          console.error("Error fetching points:", txsError);
        } else {
          setTransactions(txs || []);
        }
      }
    } catch (err) {
      console.error('Points History fetch failed:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchPointHistory();
  }, [lineProfile, phone]);

  if (liffLoading && !hasSeenLoader) return <XYLLoader tagline={locale === 'en' ? 'Loading points...' : locale === 'zh' ? 'Loading points...' : 'กำลังโหลดประวัติพอยท์...'} />;

  return (
    <div className="min-h-screen bg-[#fcfcf9] pb-20 font-sans">
      {/* 🏛️ Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 py-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[12px] font-black uppercase text-[#1A1A18] tracking-[0.2em]">XYL STUDIO</h1>
          <p className="text-[7px] tracking-[0.3em] text-emerald-500 font-black uppercase mt-0.5">POINT HISTORY</p>
        </div>
        <button onClick={() => router.back()} className="p-2 -mr-2 text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </header>

      <main>
        {/* Top Section */}
        <div className="bg-white px-5 pt-6 pb-6 shadow-sm mb-2 border-b border-gray-100">
          <h2 className="text-[14px] font-black uppercase text-[#1A1A18] tracking-widest mb-1">{locale === 'en' ? 'Points History' : locale === 'zh' ? 'Points History' : 'ประวัติพอยท์'}</h2>
          <p className="text-gray-400 text-[10px] mb-6 tracking-wide">สามารถดูข้อมูลย้อนหลังได้ 2 ปี</p>

          <div className="bg-gray-50 rounded-none p-5 border border-gray-100">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">พอยท์ปัจจุบัน</span>
              <HelpCircle size={12} className="text-gray-300" />
            </div>
            <div className="text-[32px] font-black tracking-tighter text-emerald-500">
              {memberInfo ? (memberInfo.points || 0).toLocaleString() : '0'}
            </div>
          </div>
        </div>

        {/* History List Section */}
        <div className="px-5 py-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[#1A1A18]">รายการล่าสุด</h3>
            <div className="flex items-center gap-4 text-gray-400">
              <button className="active:scale-95 transition-transform"><ArrowUpDown size={16} /></button>
              <button className="active:scale-95 transition-transform"><SlidersHorizontal size={16} /></button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {fetchLoading ? (
               <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="bg-white rounded-none p-5 h-28 animate-pulse border border-gray-100 shadow-sm"></div>
                 ))}
               </motion.div>
            ) : transactions.length === 0 ? (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-none shadow-sm border border-gray-100"
               >
                 <div className="w-16 h-16 bg-gray-50 rounded-none flex items-center justify-center mb-4 text-gray-300">
                   <Gift size={28} />
                 </div>
                 <h2 className="text-[12px] font-black uppercase tracking-widest text-[#1A1A18] mb-1">ยังไม่มีประวัติพอยท์</h2>
                 <p className="text-[10px] text-gray-400">เริ่มต้นสะสมพอยท์จากการสั่งซื้อได้เลย</p>
               </motion.div>
            ) : (
               <motion.div 
                 key="list"
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 className="space-y-3"
               >
                 {transactions.map((tx, idx) => {
                   const isEarn = tx.type === 'earn';
                   const isRefund = tx.type === 'refund';
                   const isPositive = tx.points_change > 0 || isEarn || isRefund;
                   const pointsAmount = tx.points || Math.abs(tx.points_change) || 0;
                   const pointsText = isPositive ? `+${pointsAmount}` : `-${pointsAmount}`;
                   const pointsColor = isPositive ? 'text-emerald-500' : 'text-red-500';
                   const title = isPositive ? 'เพิ่มพอยท์' : 'ใช้พอยท์';
                   
                   return (
                     <motion.div 
                       key={tx.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       className="bg-white rounded-none p-5 shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden"
                     >
                       {/* Left accent border */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                       <div className="flex justify-between items-start">
                         <h4 className="text-[12px] font-black uppercase tracking-widest text-[#1A1A18]">{title}</h4>
                         <span className={`text-[16px] font-black tracking-tighter ${pointsColor}`}>{pointsText}</span>
                       </div>
                       
                       <div className="space-y-1">
                         <div className="flex items-start text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                           <span className="w-[80px] shrink-0">วันที่ทำรายการ:</span>
                           <span className="text-gray-600">
                             {new Date(tx.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} เวลา {new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                           </span>
                         </div>
                         
                         {tx.expires_at && (
                           <div className="flex items-start text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                             <span className="w-[80px] shrink-0">วันหมดอายุ:</span>
                             <span className="text-emerald-600">
                               {new Date(tx.expires_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} เวลา {new Date(tx.expires_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                             </span>
                           </div>
                         )}
                         
                         {tx.description && (
                           <div className="flex items-start text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                             <span className="w-[80px] shrink-0">หมายเหตุ:</span>
                             <span className="text-gray-600">{tx.description}</span>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   );
                 })}
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-between items-center z-50">
        <button onClick={() => router.push('/liff/member')} className="flex flex-col items-center gap-1 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] text-[#64748B]">หน้าหลัก</span>
        </button>
        <button onClick={() => router.push('/liff/rewards')} className="flex flex-col items-center gap-1 p-2">
          <Gift size={24} className="text-[#64748B]" />
          <span className="text-[10px] text-[#64748B]">ของรางวัล</span>
        </button>
        <button onClick={() => router.push('/liff/my-rewards')} className="flex flex-col items-center gap-1 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          <span className="text-[10px] text-[#64748B]">รางวัลของฉัน</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className="text-[10px] text-[#64748B]">การแจ้งเตือน</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          <span className="text-[10px] text-[#64748B]">เมนู</span>
        </button>
      </nav>
    </div>
  );
}
