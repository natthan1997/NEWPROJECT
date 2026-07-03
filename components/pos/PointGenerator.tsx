'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, CheckCircle2, ArrowLeft, Award, X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [tab, setTab] = useState<'phone' | 'qr'>('phone');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  
  const [activeInput, setActiveInput] = useState<'phone' | 'amount'>('amount');
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1 THB = 1 Point (or whatever conversion is required, assuming 1:1 for now)
  const pointsToGenerate = parseInt(purchaseAmount) || 0;

  const handleNumpadPress = (num: string) => {
    if (activeInput === 'phone') {
       if (phoneNumber.length < 10) setPhoneNumber(prev => prev + num);
    } else {
       if (purchaseAmount.length < 6) setPurchaseAmount(prev => prev + num);
    }
  };

  const handleNumpadClear = () => {
    if (activeInput === 'phone') {
       setPhoneNumber('');
    } else {
       setPurchaseAmount('');
    }
  };

  const handleNumpadDelete = () => {
    if (activeInput === 'phone') {
       setPhoneNumber(prev => prev.slice(0, -1));
    } else {
       setPurchaseAmount(prev => prev.slice(0, -1));
    }
  };

  const processDirectCredit = async () => {
    if (pointsToGenerate <= 0) {
      alert(locale === 'en' ? 'Please enter a valid amount' : 'กรุณาระบุยอดชำระเงิน');
      return;
    }
    if (phoneNumber.length < 9) {
      alert(locale === 'en' ? 'Please enter a valid phone number' : 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง');
      return;
    }
    setLoading(true);
    try {
      let { data: member } = await supabase.from('pos_members').select('*').eq('phone', phoneNumber).maybeSingle();
      if (!member) {
        const { data: newMember, error: insertError } = await supabase.from('pos_members').insert({
          phone: phoneNumber,
          points: pointsToGenerate,
          full_name: 'Customer ' + phoneNumber.slice(-4),
          display_name: 'Customer ' + phoneNumber.slice(-4)
        }).select().single();
        if (insertError) throw insertError;
        member = newMember;
      } else {
        const { error: rpcError } = await supabase.rpc('increment_member_points', { user_id: member.id, points_to_add: pointsToGenerate });
        if (rpcError) throw rpcError;
      }
      
      await supabase.from('pos_points_history').insert({
        member_id: member.id,
        action: 'earn',
        points: pointsToGenerate,
        description: 'POS Direct Credit (Amount: ' + pointsToGenerate + ' THB)'
      });
      
      setSuccessMsg(locale === 'en' ? `Successfully added ${pointsToGenerate} PTS to ${phoneNumber}` : `เพิ่ม ${pointsToGenerate} แต้ม ให้เบอร์ ${phoneNumber} สำเร็จ!`);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    if (pointsToGenerate <= 0) {
      alert(locale === 'en' ? 'Please enter a valid amount' : 'กรุณาระบุยอดชำระเงิน');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/pos/points/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ points: pointsToGenerate }),
      });
      
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      } else {
        alert(data.error || 'ไม่สามารถสร้างโทเค็นได้');
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = token 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://liff.line.me/2009322178-2dtfXAvi/points/claim?token=${token}`)}`
    : null;

  const resetGenerator = () => {
    setToken(null);
    setSuccessMsg(null);
    setPurchaseAmount('');
    setPhoneNumber('');
    setActiveInput('amount');
  };

  return (
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] mx-auto flex flex-col overflow-hidden font-sans border border-gray-100 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1A1A18]">
        <h2 className="text-[18px] font-black text-white uppercase tracking-widest">
          {token || successMsg ? (locale === 'en' ? 'Success' : 'สำเร็จ') : (locale === 'en' ? 'Issue Points' : 'ให้แต้มลูกค้าตามยอดซื้อ')}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative min-h-[460px]">
        <AnimatePresence mode="wait">
          {!token && !successMsg ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              
              {/* Type Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => { setTab('phone'); setActiveInput('phone'); }}
                  className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${tab === 'phone' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'Enter Phone' : 'กรอกเบอร์'}
                </button>
                <button
                  onClick={() => { setTab('qr'); setActiveInput('amount'); }}
                  className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${tab === 'qr' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'Scan QR' : 'สแกน QR'}
                </button>
              </div>

              <div className="flex-1">
                {/* Amount Input */}
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 ml-1">
                    {locale === 'en' ? 'Purchase Amount (THB)' : 'ยอดชำระเงิน (บาท)'}
                  </p>
                  <button
                    onClick={() => setActiveInput('amount')}
                    className={`w-full border-2 rounded-2xl py-3 px-6 text-xl font-black text-center tracking-widest transition-all min-h-[56px] flex items-center justify-between ${
                      activeInput === 'amount' 
                        ? 'border-[#1A1A18] bg-white text-black shadow-sm' 
                        : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                     <span className="text-gray-300">฿</span>
                     <span>{purchaseAmount || '0'}</span>
                     <span className="text-emerald-500 text-xs bg-emerald-50 px-2 py-1 rounded-md">+{pointsToGenerate} PTS</span>
                  </button>
                </div>

                {tab === 'phone' && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 ml-1">
                      {locale === 'en' ? 'Customer Phone' : 'เบอร์โทรศัพท์ลูกค้า (สมัครสมาชิกอัตโนมัติ)'}
                    </p>
                    <button
                      onClick={() => setActiveInput('phone')}
                      className={`w-full border-2 rounded-2xl py-3 px-6 text-xl font-black text-center tracking-[0.2em] transition-all min-h-[56px] flex items-center justify-center ${
                         activeInput === 'phone' 
                           ? 'border-[#1A1A18] bg-white text-black shadow-sm' 
                           : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {phoneNumber || <span className="text-gray-300">0XX-XXX-XXXX</span>}
                    </button>
                  </div>
                )}
                
                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2 mb-2 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumpadPress(String(num))}
                      className="h-12 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-lg rounded-xl transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleNumpadClear}
                    className="h-12 bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    CLR
                  </button>
                  <button
                    onClick={() => handleNumpadPress('0')}
                    className="h-12 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-lg rounded-xl transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={handleNumpadDelete}
                    className="h-12 bg-gray-100 hover:bg-gray-200 text-[#1A1A18] flex items-center justify-center rounded-xl transition-all"
                  >
                    <Delete size={18} />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {tab === 'phone' ? (
                  <button 
                    onClick={processDirectCredit}
                    disabled={loading || pointsToGenerate <= 0 || phoneNumber.length < 9}
                    className="w-full h-[56px] bg-[#1A1A18] text-white rounded-[16px] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                  >
                    {loading ? <RefreshCcw size={18} className="animate-spin" /> : <Award size={18} />}
                    {loading ? (locale === 'en' ? 'Processing...' : 'กำลังดำเนินการ...') : (locale === 'en' ? 'Give Points' : `ให้ ${pointsToGenerate} แต้ม ทันที`)}
                  </button>
                ) : (
                  <button 
                    onClick={generateQR}
                    disabled={loading || pointsToGenerate <= 0}
                    className="w-full h-[56px] bg-[#1A1A18] text-white rounded-[16px] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                  >
                    {loading ? <RefreshCcw size={18} className="animate-spin" /> : <QrCode size={18} />}
                    {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR' : `สร้างคิวอาร์สแกนรับ ${pointsToGenerate} แต้ม`)}
                  </button>
                )}
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full items-center justify-center py-4"
            >
              <div className="text-center mb-6">
                 <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[15px] mb-4">
                   <CheckCircle2 size={20} />
                   <span>{successMsg || (locale === 'en' ? 'Ready for customer to scan' : 'พร้อมให้ลูกค้าสแกน')}</span>
                 </div>
                 
                 <div className="flex items-baseline justify-center text-[#1A1A18] leading-none tracking-tight">
                   <span className="text-[56px] font-black tracking-tighter">{pointsToGenerate}</span>
                   <span className="text-[20px] text-gray-400 font-bold ml-2 uppercase tracking-widest">PTS</span>
                 </div>
              </div>

              {/* QR Code */}
              {token && (
                <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-100 mb-8 w-[240px] h-[240px]">
                   <img src={qrUrl!} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="w-full space-y-3 mt-auto">
                {token && (
                  <p className="text-[13px] text-gray-400 font-bold tracking-widest text-center uppercase bg-gray-100 py-2 rounded-lg">
                    REF: {token.slice(0, 12)}
                  </p>
                )}
                <button 
                  onClick={resetGenerator}
                  className="w-full h-[56px] bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                >
                  <ArrowLeft size={18} /> {locale === 'en' ? 'Back' : 'กลับไปทำรายการใหม่'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
    </div>
  );
}
