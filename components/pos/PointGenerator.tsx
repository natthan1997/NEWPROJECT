'use client';
import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCcw, CheckCircle2, ArrowLeft, Award, X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  
  const [purchaseAmount, setPurchaseAmount] = useState('');
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [earnRate, setEarnRate] = useState<number>(1); // 1 THB = 1 Point by default

  useEffect(() => {
    // Fetch shop settings for earn rate
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('pos_shop_settings')
        .select('opening_hours')
        .limit(1)
        .single();
      if (data && data.opening_hours && data.opening_hours.loyalty_earn_rate) {
        setEarnRate(data.opening_hours.loyalty_earn_rate);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!token) {
        setIsClaimed(false);
        return;
    }

    // Poll every 1.5s to see if token is used
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('pos_qr_reward_tokens')
          .select('is_used')
          .eq('token', token)
          .single();
          
        if (!error && data && data.is_used) {
           setIsClaimed(true);
           clearInterval(interval);
           // Auto close after 2.5 seconds
           setTimeout(() => {
              if (onClose) onClose();
           }, 2500);
        }
      } catch (err) {
        // ignore network error during polling
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [token, onClose]);

  // Calculate points based on earn rate
  const amountInt = parseInt(purchaseAmount) || 0;
  const pointsToGenerate = earnRate > 0 ? Math.floor(amountInt / earnRate) : 0;

  const handleNumpadPress = (num: string) => {
    if (purchaseAmount.length < 6) setPurchaseAmount(prev => prev + num);
  };

  const handleNumpadClear = () => {
    setPurchaseAmount('');
  };

  const handleNumpadDelete = () => {
    setPurchaseAmount(prev => prev.slice(0, -1));
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
    setPurchaseAmount('');
  };

  return (
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] mx-auto flex flex-col overflow-hidden font-sans border border-gray-100 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1A1A18]">
        <h2 className="text-[18px] font-black text-white uppercase tracking-widest">
          {token ? (locale === 'en' ? 'Success' : 'สำเร็จ') : (locale === 'en' ? 'Issue Points' : 'ให้แต้มลูกค้าตามยอดซื้อ')}
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
          {!token ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              
              <div className="flex-1">
                {/* Amount Input */}
                <div className="mb-3">
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center flex-1">
                      {locale === 'en' ? 'Purchase Amount (THB)' : 'กรอกยอดชำระเงินของลูกค้า (บาท)'}
                    </p>
                  </div>
                  {earnRate > 1 && (
                    <div className="flex justify-center mb-2">
                       <span className="text-[9px] font-black tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                         Rate: {earnRate} {locale === 'en' ? 'THB' : 'บาท'} = 1 {locale === 'en' ? 'PT' : 'แต้ม'}
                       </span>
                    </div>
                  )}
                  <div
                    className={`w-full border-2 rounded-2xl py-4 px-6 text-2xl font-black text-center tracking-widest transition-all min-h-[64px] flex items-center justify-between border-[#1A1A18] bg-white text-black shadow-sm`}
                  >
                     <span className="text-gray-300">฿</span>
                     <span>{purchaseAmount || '0'}</span>
                     <span className="text-emerald-500 text-sm bg-emerald-50 px-3 py-1.5 rounded-xl">+{pointsToGenerate} PTS</span>
                  </div>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2 mb-2 mt-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumpadPress(String(num))}
                      className="h-14 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-xl rounded-2xl transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleNumpadClear}
                    className="h-14 bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                  >
                    CLR
                  </button>
                  <button
                    onClick={() => handleNumpadPress('0')}
                    className="h-14 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-xl rounded-2xl transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={handleNumpadDelete}
                    className="h-14 bg-gray-100 hover:bg-gray-200 text-[#1A1A18] flex items-center justify-center rounded-2xl transition-all"
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={generateQR}
                  disabled={loading || pointsToGenerate <= 0}
                  className="w-full h-[60px] bg-[#1A1A18] text-white rounded-[16px] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                >
                  {loading ? <RefreshCcw size={20} className="animate-spin" /> : <QrCode size={20} />}
                  {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR' : `สร้างคิวอาร์สแกนรับ ${pointsToGenerate} แต้ม`)}
                </button>
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
                 {isClaimed ? (
                   <div className="inline-flex items-center justify-center gap-2 text-white bg-emerald-500 px-6 py-2.5 rounded-full font-bold text-[16px] mb-4 animate-in zoom-in duration-300 shadow-lg">
                     <CheckCircle2 size={24} />
                     <span>{locale === 'en' ? 'Points Claimed Successfully!' : 'ลูกค้ารับแต้มเรียบร้อยแล้ว!'}</span>
                   </div>
                 ) : (
                   <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[15px] mb-4">
                     <RefreshCcw size={16} className="animate-spin opacity-50" />
                     <span>{locale === 'en' ? 'Waiting for customer to scan...' : 'รอให้ลูกค้าสแกน...'}</span>
                   </div>
                 )}
                 
                 <div className="flex items-baseline justify-center text-[#1A1A18] leading-none tracking-tight">
                   <span className="text-[56px] font-black tracking-tighter">{pointsToGenerate}</span>
                   <span className="text-[20px] text-gray-400 font-bold ml-2 uppercase tracking-widest">PTS</span>
                 </div>
              </div>

              {/* QR Code */}
              {token && (
                <div className={`bg-white p-6 rounded-[24px] shadow-xl border-4 transition-all duration-500 mb-8 w-[240px] h-[240px] relative ${isClaimed ? 'border-emerald-500 scale-105' : 'border-transparent'}`}>
                   <img loading="lazy"  src={qrUrl!} alt="QR Code" className={`w-full h-full object-contain transition-opacity duration-500 ${isClaimed ? 'opacity-20' : 'opacity-100'}`} />
                   {isClaimed && (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <CheckCircle2 size={80} className="text-emerald-500 animate-in zoom-in duration-500 delay-150" />
                     </div>
                   )}
                </div>
              )}

              <div className="w-full space-y-3 mt-auto">
                {token && (
                  <p className="text-[13px] text-gray-400 font-bold tracking-widest text-center uppercase bg-gray-100 py-2 rounded-lg">
                    REF: {token.slice(0, 12)}
                  </p>
                )}
                {!isClaimed && (
                  <button 
                    onClick={resetGenerator}
                    className="w-full h-[56px] bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft size={18} /> {locale === 'en' ? 'Back' : 'กลับไปทำรายการใหม่'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
