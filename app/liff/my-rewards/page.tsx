'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import Link from 'next/link';

export default function MyRewardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading } = useLiff();
  
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      setLoading(true);
      const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', userId).maybeSingle();
      if (member) {
        setMemberInfo(member);
        const { data: couponsData } = await supabase.from('pos_member_coupons').select('*').eq('member_id', member.id).order('created_at', { ascending: false });
        if (couponsData) setVouchers(couponsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liffLoading) fetchData();
  }, [lineProfile, liffLoading]);

  if (liffLoading || loading) return <XYLLoader tagline="กำลังโหลดคูปองของคุณ..." />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24">
      
      {/* 📱 Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => router.push('/liff/member')} className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[14px] font-bold tracking-widest text-[#7B8B7B] uppercase">รางวัลของฉัน</h1>
        <div className="w-6"></div>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-4">
        
        {vouchers.length > 0 ? vouchers.map((voucher) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={voucher.id} 
            className={`flex border rounded-[20px] overflow-hidden bg-white shadow-sm ${voucher.status !== 'active' ? 'border-gray-100 opacity-60 grayscale' : 'border-gray-200'}`}
          >
            <div className={`w-[90px] border-r border-dashed border-gray-200 flex flex-col items-center justify-center p-4 ${voucher.status === 'active' ? 'bg-[#A3B1A3]/10 text-[#7B8B7B]' : 'bg-gray-50 text-gray-500'}`}>
              <Ticket size={24} className="mb-2 opacity-50" />
              <span className="text-xl font-bold leading-none tracking-tight">
                {voucher.discount_type === 'percent' ? voucher.discount_value : voucher.discount_type === 'free_item' ? 'FREE' : voucher.discount_value}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">
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
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {new Date(voucher.created_at).toLocaleDateString('en-GB')}
                </span>
                <button 
                  disabled={voucher.status !== 'active'}
                  className={`text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider ${
                    voucher.status !== 'active' ? 'bg-gray-100 text-gray-400' : 'bg-[#7B8B7B] text-white shadow-sm'
                  }`}
                >
                  {voucher.status !== 'active' ? 'Used' : 'Ready'}
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Ticket size={28} className="text-gray-300" />
            </div>
            <h3 className="text-[15px] font-medium text-gray-900 mb-1">ยังไม่มีคูปอง</h3>
            <p className="text-[13px] text-gray-500 mb-6">แลกของรางวัลเพื่อรับคูปองส่วนลดและสิทธิพิเศษมากมาย</p>
            <Link href="/liff/rewards" className="bg-[#1A1A18] text-white px-6 py-2.5 rounded-full text-[13px] font-medium hover:bg-black transition-colors">
                ไปที่หน้าของรางวัล
            </Link>
          </div>
        )}
      </main>

    </div>
  );
}
