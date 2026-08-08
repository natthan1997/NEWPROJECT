'use client';
import React, { useState, useEffect } from 'react';
import { X, QrCode, Phone, CheckCircle2, RefreshCcw, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";
import { QRCodeSVG } from 'qrcode.react';
import { buildMemberSearchFilter } from '@/lib/phoneUtils';

interface POSHistoryPointsModalProps {
  order: any;
  shopSettings: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function POSHistoryPointsModal({ order, shopSettings, onClose, onSuccess }: POSHistoryPointsModalProps) {
  const { locale } = useI18n();
  const [mode, setMode] = useState<'qr' | 'phone'>('qr');
  const [loading, setLoading] = useState(false);
  
  // Point calculations
  const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined ? shopSettings.opening_hours.loyalty_earn_thb : (shopSettings?.opening_hours?.loyalty_earn_rate || 100);
  const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined ? shopSettings.opening_hours.loyalty_earn_pts : 1;
  const netTotal = Number(order.net_total ?? order.total_amount) || 0;
  const pointsToGenerate = earnThb > 0 ? Math.floor(netTotal / earnThb) * earnPts : 0;

  // QR Mode State
  const [token, setToken] = useState<string | null>(null);
  const [isQRClaimed, setIsQRClaimed] = useState(false);

  // Phone Mode State
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Generate QR on mount if in QR mode
  useEffect(() => {
    if (mode === 'qr' && !token && !loading) {
      generateQR();
    }
  }, [mode]);

  // Poll for QR claiming
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('pos_qr_reward_tokens')
          .select('is_used, claimed_by')
          .eq('token', token)
          .single();
          
        if (!error && data && data.is_used) {
           setIsQRClaimed(true);
           clearInterval(interval);

           // Try to find the member UUID using the line_user_id stored in claimed_by
           let customerId = null;
           if (data.claimed_by) {
               const { data: memberData } = await supabase
                   .from('pos_members')
                   .select('id')
                   .eq('line_user_id', data.claimed_by)
                   .maybeSingle();
               if (memberData) customerId = memberData.id;
           }

           // Update the order with points and customer_id
           const updatePayload: any = { points_earned: pointsToGenerate };
           if (customerId) updatePayload.customer_id = customerId;
           
           await supabase.from('pos_orders').update(updatePayload).eq('id', order.id);
           setTimeout(() => {
              onSuccess();
           }, 2000);
        }
      } catch (err) {}
    }, 1500);
    return () => clearInterval(interval);
  }, [token]);

  // Search customers by phone
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchTerm]);

  const searchCustomers = async () => {
    const branchId = shopSettings?.shared_member_branch_id || shopSettings?.branch_id;

    let query = supabase
      .from('pos_members')
      .select('*')
      .or(buildMemberSearchFilter(searchTerm));
      
    if (branchId) {
      query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
    }

    const { data } = await query.limit(5);
    if (data) setCustomers(data);
  };

  const generateQR = async () => {
    if (pointsToGenerate <= 0) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/pos/points/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ points: pointsToGenerate, orderId: order.id }),
      });
      const data = await res.json();
      if (data.token) setToken(data.token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGivePointsToPhone = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      // 1. Add points to member
      const newPoints = (selectedCustomer.points || 0) + pointsToGenerate;
      await supabase.from('pos_members').update({ points: newPoints }).eq('id', selectedCustomer.id);
      
      // 2. Insert points history
      await supabase.from('pos_points_history').insert({
        member_id: selectedCustomer.id,
        points: pointsToGenerate,
        type: 'earn',
        description: `Earned from bill ${order.order_number || ''}`.trim(),
        branch_id: order.branch_id
      });

      // 3. Update order with customer and points
      await supabase.from('pos_orders').update({
        customer_id: selectedCustomer.id,
        points_earned: pointsToGenerate
      }).eq('id', order.id);

      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Error updating points');
    } finally {
      setLoading(false);
    }
  };

  if (pointsToGenerate <= 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">ยอดเงินไม่ถึงเกณฑ์สะสมแต้ม</h3>
          <p className="text-gray-500 text-sm mb-6">ยอดบิล {netTotal} บาท ไม่เพียงพอสำหรับสะสมแต้ม (ขั้นต่ำ {earnThb} บาท)</p>
          <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[440px] bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-black uppercase tracking-widest">{locale === 'en' ? 'Collect Points' : 'สะสมแต้มสำหรับบิลนี้'}</h3>
            <p className="text-[11px] text-gray-500 font-bold mt-1">
              ยอดสุทธิ ฿{netTotal.toLocaleString()} = ได้รับ {pointsToGenerate} แต้ม
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-2 bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => setMode('qr')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold rounded-lg transition-all ${mode === 'qr' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200/50'}`}
          >
            <QrCode size={16} /> แสกน QR Code
          </button>
          <button
            onClick={() => setMode('phone')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold rounded-lg transition-all ${mode === 'phone' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200/50'}`}
          >
            <Phone size={16} /> กรอกเบอร์โทร
          </button>
        </div>

        <div className="p-6 min-h-[380px] flex flex-col">
          {mode === 'qr' ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              {isQRClaimed ? (
                <div className="text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-600">ลูกค้าสแกนรับแต้มสำเร็จ!</h3>
                  <p className="text-gray-500 text-sm mt-2">กำลังปิดหน้าต่าง...</p>
                </div>
              ) : token ? (
                <div className="text-center w-full">
                  <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[12px] mb-6">
                    <RefreshCcw size={14} className="animate-spin opacity-50" />
                    <span>รอให้ลูกค้าสแกน...</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 inline-block">
                    <QRCodeSVG 
                      value={`https://liff.line.me/2009322178-2dtfXAvi/?path=${encodeURIComponent(`/liff/member?claimToken=${token}`)}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-6 text-2xl font-black text-black">+{pointsToGenerate} PTS</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <RefreshCcw size={24} className="animate-spin mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Generating QR...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {!selectedCustomer ? (
                <>
                  <div className="relative group mb-4">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      autoFocus
                      placeholder="พิมพ์เบอร์โทร 08x..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-50 border-none py-4 pl-12 pr-4 rounded-xl text-[14px] font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 no-scrollbar">
                    {customers.length === 0 && searchTerm.length >= 2 ? (
                      <p className="text-center text-gray-400 text-sm py-8 font-bold">ไม่พบสมาชิกที่มีเบอร์โทรนี้</p>
                    ) : (
                      customers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCustomer(c)}
                          className="p-3 bg-white border border-gray-100 rounded-xl hover:border-black cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-black">{c.display_name || c.full_name}</p>
                              <p className="text-xs text-gray-500">{c.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-gray-400">มีอยู่</span>
                            <p className="font-black text-sm text-black">{c.points} PTS</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                    <User size={32} />
                  </div>
                  <h4 className="text-xl font-black text-black mb-1">{selectedCustomer.display_name || selectedCustomer.full_name}</h4>
                  <p className="text-gray-500 text-sm font-bold">{selectedCustomer.phone}</p>
                  
                  <div className="mt-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-[12px] font-black uppercase tracking-widest text-emerald-600 mb-1">แต้มที่จะได้รับ</p>
                    <p className="text-3xl font-black text-emerald-600">+{pointsToGenerate} PTS</p>
                  </div>
                  
                  <div className="mt-auto pt-6 flex gap-3">
                    <button 
                      onClick={() => setSelectedCustomer(null)}
                      disabled={loading}
                      className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      เปลี่ยนคน
                    </button>
                    <button 
                      onClick={handleGivePointsToPhone}
                      disabled={loading}
                      className="flex-1 py-4 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      ยืนยันให้แต้ม
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
