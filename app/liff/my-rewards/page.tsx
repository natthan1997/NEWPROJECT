'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, ChevronLeft, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLiff } from '@/components/liff/LiffProvider';
import XYLLoader from '@/components/loaders/XYLLoader';
import Link from 'next/link';

interface VoucherItemProps {
  voucher: any;
  onUse: (voucher: any) => void;
  onCancel: (voucher: any) => void;
}

function VoucherItem({ voucher, onUse, onCancel }: VoucherItemProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (voucher.status !== 'claiming') return;

    setTimeLeft(300);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto cancel when time expires
          onCancel(voucher);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [voucher.status, voucher, onCancel]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const isActive = voucher.status === 'active';
  const isClaiming = voucher.status === 'claiming';
  const isUsed = voucher.status === 'used';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex border rounded-[20px] overflow-hidden bg-white shadow-sm transition-all duration-300 ${
        isClaiming
          ? 'border-amber-400 ring-2 ring-amber-100'
          : isUsed || voucher.status === 'expired'
          ? 'border-gray-100 opacity-60 grayscale'
          : 'border-gray-200'
      }`}
    >
      {/* Left Voucher Part */}
      {voucher.image_url ? (
        <div className="w-[90px] border-r border-dashed border-gray-200 shrink-0 relative overflow-hidden bg-gray-100 flex items-center justify-center">
          <img 
            src={voucher.image_url} 
            alt={voucher.coupon_name} 
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        <div
          className={`w-[90px] border-r border-dashed border-gray-200 flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
            isClaiming
              ? 'bg-amber-50 text-amber-700'
              : isActive
              ? 'bg-gray-50 text-[#1A1A18]'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          <Ticket size={24} className="mb-2 opacity-50" />
          <span className="text-xl font-bold leading-none tracking-tight">
            {voucher.discount_type === 'percent'
              ? `${Math.round(voucher.discount_value)}%`
              : voucher.discount_type === 'free_item'
              ? 'FREE'
              : `${Math.round(voucher.discount_value)}`}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">
            {voucher.discount_type === 'percent'
              ? '%'
              : voucher.discount_type === 'free_item'
              ? 'ITEM'
              : 'THB'}
          </span>
        </div>
      )}

      {/* Right Voucher Part */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-[14px] font-bold text-gray-900 mb-1">{voucher.coupon_name}</h4>
          <p className="text-[12px] text-gray-500">
            {voucher.discount_type === 'free_item' ? 'คูปองแลกสินค้าฟรี' : 'คูปองส่วนลด'}
          </p>
          
          {isClaiming && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-max animate-pulse">
              <Clock size={12} />
              <span>แสดงต่อพนักงานก่อนทำรายการ: {formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {new Date(voucher.created_at).toLocaleDateString('en-GB')}
          </span>

          <div className="flex items-center gap-2">
            {isClaiming && (
              <button
                onClick={() => onCancel(voucher)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
              >
                ยกเลิก
              </button>
            )}

            <button
              onClick={() => isActive && onUse(voucher)}
              disabled={!isActive}
              className={`text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300 ${
                isClaiming
                  ? 'bg-amber-500 text-white shadow-sm animate-bounce'
                  : isUsed
                  ? 'bg-gray-100 text-gray-400'
                  : isActive
                  ? 'bg-black text-white hover:bg-neutral-800 shadow-sm active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isClaiming ? 'Claiming' : isUsed ? 'Used' : 'กดใช้งาน'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyRewardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lineProfile, loading: liffLoading, memberInfo: ctxMemberInfo, isDataReady } = useLiff();

  const [memberInfo, setMemberInfo] = useState<any>(ctxMemberInfo || null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isDataReady);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [usedVoucherNotification, setUsedVoucherNotification] = useState<any>(null);
  const [confirmingVoucher, setConfirmingVoucher] = useState<any>(null);

  useEffect(() => {
    if (ctxMemberInfo) {
      setMemberInfo(ctxMemberInfo);
    }
  }, [ctxMemberInfo]);

  const fetchData = async (isBackgroundSync = false) => {
    const userId = lineProfile?.userId || localStorage.getItem('xylem_line_user_id');
    if (!userId) return;
    try {
      if (!isBackgroundSync) {
        setLoading(true);
        setVouchersLoading(true);
      }
      const { data: member } = await supabase
        .from('pos_members')
        .select('*')
        .eq('line_user_id', userId)
        .maybeSingle();

      if (member) {
        setMemberInfo(member);
        const { data: couponsData } = await supabase
          .from('pos_member_coupons')
          .select('*, pos_loyalty_coupons(image_url)')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false });

        if (couponsData) {
          // Normalize so it always has image_url
          const normalizedCoupons = couponsData.map((c: any) => ({
            ...c,
            image_url: c.image_url || c.pos_loyalty_coupons?.image_url || null
          }));
          setVouchers(normalizedCoupons);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setVouchersLoading(false);
    }
  };

  useEffect(() => {
    if (!liffLoading) fetchData(isDataReady);
  }, [lineProfile, liffLoading, isDataReady]);

  // Real-time subscription to update coupons status
  useEffect(() => {
    const channel = supabase
      .channel('liff_member_coupons_watch_all')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pos_member_coupons' },
        (payload: any) => {
          const updated = payload.new;
          
          setVouchers((prev) =>
            prev.map((v) => (v.id === updated.id ? updated : v))
          );

          // If the coupon status became 'used', show the congratulations overlay
          if (updated.status === 'used' && payload.old.status === 'claiming') {
            setUsedVoucherNotification(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleUseCoupon = (voucher: any) => {
    setConfirmingVoucher(voucher);
  };

  const proceedUseCoupon = async (voucher: any) => {
    try {
      const { error } = await supabase
        .from('pos_member_coupons')
        .update({ status: 'claiming' })
        .eq('id', voucher.id);

      if (error) throw error;
      
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, status: 'claiming' } : v))
      );
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleCancelCoupon = async (voucher: any) => {
    try {
      const { error } = await supabase
        .from('pos_member_coupons')
        .update({ status: 'active' })
        .eq('id', voucher.id);

      if (error) throw error;

      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, status: 'active' } : v))
      );
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  if ((liffLoading || loading) && !isDataReady) return <XYLLoader tagline="กำลังโหลดคูปองของคุณ..." />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A18] font-sans pb-24 relative overflow-hidden">
      
      {/* 📱 Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => router.push('/liff/member')}
          className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[14px] font-bold tracking-widest text-[#1A1A18] uppercase">รางวัลของฉัน</h1>
        <div className="w-6"></div>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-lg mx-auto flex flex-col gap-4">
        {vouchersLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1A1A18] rounded-full animate-spin mb-3"></div>
            <p className="text-[13px] text-gray-500">กำลังโหลดคูปองของคุณ...</p>
          </div>
        ) : vouchers.length > 0 ? (
          vouchers.map((voucher) => (
            <VoucherItem
              key={voucher.id}
              voucher={voucher}
              onUse={handleUseCoupon}
              onCancel={handleCancelCoupon}
            />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Ticket size={28} className="text-gray-300" />
            </div>
            <h3 className="text-[15px] font-medium text-gray-900 mb-1">ยังไม่มีคูปอง</h3>
            <p className="text-[13px] text-gray-500 mb-6">แลกของรางวัลเพื่อรับคูปองส่วนลดและสิทธิพิเศษมากมาย</p>
            <Link
              href="/liff/rewards"
              className="bg-[#1A1A18] text-white px-6 py-2.5 rounded-full text-[13px] font-medium hover:bg-black transition-colors"
            >
              ไปที่หน้าของรางวัล
            </Link>
          </div>
        )}
      </main>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmingVoucher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket size={28} className="text-amber-500" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-950 mb-2">ยืนยันเพื่อใช้สิทธิ์คูปอง</h3>
              <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
                คูปองนี้จะมีอายุการใช้งาน 5 นาทีหลังจากกด <br />
                <span className="font-semibold text-amber-600">กรุณาแสดงคูปองต่อหน้าพนักงานที่แคชเชียร์ก่อนกดปุ่มยืนยัน</span> เพื่อทำการสแกนหรือบันทึกส่วนลดในขั้นตอนชำระเงิน
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingVoucher(null)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-500 font-semibold text-[13px] rounded-xl"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={async () => {
                    const v = confirmingVoucher;
                    setConfirmingVoucher(null);
                    await proceedUseCoupon(v);
                  }}
                  className="flex-1 py-3 bg-[#1A1A18] hover:bg-neutral-800 active:scale-95 transition-all text-white font-semibold text-[13px] rounded-xl shadow-md"
                >
                  ยืนยันใช้งาน
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Success Overlay */}
      <AnimatePresence>
        {usedVoucherNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={44} className="text-emerald-500" />
              </div>
              <h3 className="text-[20px] font-black text-gray-950 mb-2">ใช้งานคูปองสำเร็จ!</h3>
              <p className="text-[14px] text-gray-600 mb-1 font-bold">
                {usedVoucherNotification.coupon_name}
              </p>
              <p className="text-[12px] text-gray-400 mb-6">
                พนักงานได้ทำการประยุกต์ใช้คูปองนี้ลงในบิลขายเรียบร้อยแล้ว
              </p>
              <button
                onClick={() => setUsedVoucherNotification(null)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold text-[14px] rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                ตกลง
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
