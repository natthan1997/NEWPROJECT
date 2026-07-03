'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, Edit2, CheckCircle2, ArrowLeft, Coffee, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

type RewardMode = 'glasses' | 'points';

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [mode, setMode] = useState<RewardMode>('glasses');
  const [amount, setAmount] = useState<number | ''>(1);
  const [isCustom, setIsCustom] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayValue = amount || 0;
  const pointsToGenerate = mode === 'glasses' ? displayValue * 50 : displayValue;

  const presets = mode === 'glasses' ? [1, 2, 3, 4] : [10, 20, 50, 100];
  const unitLabel = mode === 'glasses' ? (locale === 'en' ? 'CUPS' : 'แก้ว') : 'PTS';
  const displayLabel = mode === 'glasses' ? (locale === 'en' ? 'Amount of Cups' : 'จำนวนแก้วที่จะให้') : (locale === 'en' ? 'Points to award' : 'จำนวนคะแนนที่จะให้');

  const generateQR = async () => {
    if (!displayValue || displayValue <= 0) {
      alert(locale === 'en' ? 'Please enter a valid amount' : 'กรุณาระบุจำนวนที่ถูกต้อง');
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
    setIsCustom(false);
    setMode('glasses');
    setAmount(1);
  };

  const handleModeSwitch = (newMode: RewardMode) => {
    setMode(newMode);
    setIsCustom(false);
    setAmount(newMode === 'glasses' ? 1 : 10);
  };

  return (
    <div className="bg-[#f5f5f7] rounded-[32px] shadow-2xl w-full max-w-[420px] mx-auto flex flex-col overflow-hidden font-sans border border-white/50">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-gray-200/50 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
        >
          {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
        </button>
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">
          {token ? (locale === 'en' ? 'Reward Ready' : 'คิวอาร์โค้ดพร้อมแล้ว') : (locale === 'en' ? 'Issue Reward' : 'แจกรางวัลลูกค้า')}
        </h2>
        <div className="w-[74px]"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 px-8 pb-10 pt-2">
        <AnimatePresence mode="wait">
          {!token ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              
              {/* Type Switcher */}
              <div className="flex bg-gray-200/50 p-1 rounded-2xl w-full max-w-[280px] mx-auto mb-6">
                <button
                  onClick={() => handleModeSwitch('glasses')}
                  className={`flex-1 py-2 text-[14px] font-semibold rounded-[12px] transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'glasses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Coffee size={15} />
                  {locale === 'en' ? 'Cups' : 'สะสมแก้ว'}
                </button>
                <button
                  onClick={() => handleModeSwitch('points')}
                  className={`flex-1 py-2 text-[14px] font-semibold rounded-[12px] transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'points' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Award size={15} />
                  {locale === 'en' ? 'Points' : 'คะแนน'}
                </button>
              </div>

              <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-4">
                {displayLabel}
              </p>
              
              <div className="flex items-start justify-center h-[90px] mb-8">
                {isCustom ? (
                  <input 
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-[180px] text-[72px] font-medium tracking-tighter text-gray-900 bg-transparent text-center focus:outline-none placeholder:text-gray-300 no-spinner leading-none"
                  />
                ) : (
                  <span className="text-[80px] font-medium tracking-tighter text-gray-900 leading-none">
                    {amount}
                  </span>
                )}
                <span className="text-xl font-semibold text-gray-400 mt-3 ml-1 uppercase">
                  {unitLabel}
                </span>
              </div>

              {/* Presets Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10 w-full max-w-[320px]">
                {presets.map((val) => (
                  <button 
                    key={val} 
                    onClick={() => { setIsCustom(false); setAmount(val); }}
                    className={`px-5 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                      amount === val && !isCustom
                        ? 'bg-gray-900 text-white shadow-md' 
                        : 'bg-white text-gray-600 border border-gray-200/60 hover:border-gray-300'
                    }`}
                  >
                    {val} <span className="text-[11px] opacity-70 ml-0.5 uppercase">{unitLabel}</span>
                  </button>
                ))}
                
                <button 
                  onClick={() => { setIsCustom(true); setAmount(''); }}
                  className={`px-5 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                    isCustom
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200/60 hover:border-gray-300'
                  }`}
                >
                  <Edit2 size={14} className="inline mr-1.5 -mt-0.5" />
                  {locale === 'en' ? 'Custom' : 'ระบุเอง'}
                </button>
              </div>

              {/* Action Button */}
              <button 
                onClick={generateQR}
                disabled={loading || !displayValue}
                className="w-full h-14 bg-[#007AFF] text-white rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 hover:bg-[#0066D6] transition-all disabled:opacity-50 disabled:bg-gray-300 active:scale-[0.98] shadow-sm"
              >
                {loading ? <RefreshCcw size={20} className="animate-spin" /> : null}
                {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR Code' : 'สร้างคิวอาร์โค้ด')}
              </button>
              
              <div className="text-[12px] text-gray-400 mt-4 text-center">
                {mode === 'glasses' && (
                  <div className="mb-1 text-emerald-600/80 font-medium">
                    ( = {pointsToGenerate} PTS )
                  </div>
                )}
                {locale === 'en' ? 'This code awards reward to the customer.' : 'โค้ดนี้ใช้สำหรับให้ลูกค้าสแกนเพื่อรับรางวัล'}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              
              {/* QR Code Container */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm mb-6 relative w-[240px] h-[240px] flex items-center justify-center border border-gray-100 mt-6">
                 <img src={qrUrl!} alt="QR Code" className="w-[200px] h-[200px] object-contain" />
              </div>

              <div className="text-center mb-8">
                 <div className="flex items-center justify-center gap-1.5 text-[#34C759] font-semibold text-sm mb-2">
                   <CheckCircle2 size={16} />
                   <span>{locale === 'en' ? 'Ready to scan' : 'พร้อมสแกนแล้ว'}</span>
                 </div>
                 <div className="flex items-baseline justify-center text-gray-900 leading-none tracking-tight">
                   <span className="text-[48px] font-medium">+{displayValue}</span>
                   <span className="text-[20px] text-gray-400 font-bold ml-1.5 uppercase">{unitLabel}</span>
                 </div>
                 {mode === 'glasses' && (
                   <p className="text-[13px] text-emerald-600 font-semibold mt-2">
                     ( = {pointsToGenerate} PTS )
                   </p>
                 )}
                 <p className="text-[11px] text-gray-400 font-medium tracking-widest mt-4 uppercase">
                   REF: {token.slice(0, 12)}
                 </p>
              </div>

              <button 
                onClick={resetGenerator}
                className="w-full h-14 bg-white text-gray-900 border border-gray-200 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={18} /> {locale === 'en' ? 'Generate Another' : 'แจกรางวัลใหม่'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
          input[type="number"].no-spinner {
            -moz-appearance: textfield !important;
            appearance: textfield !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          input[type="number"].no-spinner::-webkit-inner-spin-button, 
          input[type="number"].no-spinner::-webkit-outer-spin-button { 
            -webkit-appearance: none !important; 
            margin: 0 !important; 
          }
      `}</style>
    </div>
  );
}
