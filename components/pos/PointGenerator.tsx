'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, X, Delete, CheckCircle2, ArrowLeft, Coffee, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

type RewardMode = 'glasses' | 'points';

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [mode, setMode] = useState<RewardMode>('glasses');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayValue = parseInt(amountStr) || 0;
  const pointsToGenerate = mode === 'glasses' ? displayValue * 50 : displayValue;

  const handleNumpad = (val: string) => {
    if (amountStr === '0') {
      setAmountStr(val);
    } else if (amountStr.length < 5) {
      setAmountStr(amountStr + val);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length > 1) {
      setAmountStr(amountStr.slice(0, -1));
    } else {
      setAmountStr('0');
    }
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  const addPreset = (val: number) => {
    setAmountStr((displayValue + val).toString());
  };

  const generateQR = async () => {
    if (pointsToGenerate <= 0) {
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
    setAmountStr('0');
  };

  const handleModeSwitch = (newMode: RewardMode) => {
    setMode(newMode);
    setAmountStr('0');
  };

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];

  const presets = mode === 'glasses' ? [1, 2, 3, 4] : [10, 20, 50, 100];
  const unitLabel = mode === 'glasses' ? (locale === 'en' ? 'CUPS' : 'แก้ว') : 'PTS';
  const displayLabel = mode === 'glasses' ? (locale === 'en' ? 'Amount of Cups' : 'ระบุจำนวนแก้ว') : (locale === 'en' ? 'Amount of Points' : 'ระบุจำนวนคะแนน');

  return (
    <div className="bg-[#f8f9fa] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-[400px] h-[740px] mx-auto flex flex-col overflow-hidden font-sans border border-white/60">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X size={20} strokeWidth={2} />
        </button>
        <div className="text-center">
          <h2 className="text-[16px] font-semibold text-gray-900 tracking-tight">
            {token ? (locale === 'en' ? 'Reward Ready' : 'คิวอาร์โค้ดพร้อมแล้ว') : (locale === 'en' ? 'Issue Reward' : 'แจกรางวัลลูกค้า')}
          </h2>
        </div>
        <div className="w-10 h-10"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 relative pb-6 px-6 pt-0">
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
              
              {/* Type Switcher */}
              <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-4 shrink-0">
                <button
                  onClick={() => handleModeSwitch('glasses')}
                  className={`flex-1 py-2.5 px-2 text-[14px] font-semibold rounded-[14px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'glasses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Coffee size={16} />
                  {locale === 'en' ? 'Cups' : 'สะสมแก้ว'}
                </button>
                <button
                  onClick={() => handleModeSwitch('points')}
                  className={`flex-1 py-2.5 px-2 text-[14px] font-semibold rounded-[14px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'points' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Award size={16} />
                  {locale === 'en' ? 'Points' : 'คะแนน'}
                </button>
              </div>

              {/* Display Area */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-4 flex flex-col items-center justify-center min-h-[140px] shrink-0">
                <p className="text-[12px] font-medium text-gray-400 tracking-widest uppercase mb-1">
                  {displayLabel}
                </p>
                <div className="flex items-baseline justify-center text-gray-900 overflow-hidden w-full">
                   <span className="text-[72px] font-medium tracking-tighter leading-none truncate px-4">
                     {amountStr}
                   </span>
                   <span className="text-xl font-bold text-gray-400 ml-1">
                     {unitLabel}
                   </span>
                </div>
              </div>

              {/* Presets Row (Adders) */}
              <div className="flex gap-2 mb-4 shrink-0">
                {presets.map((val) => (
                  <button 
                    key={val} 
                    onClick={() => addPreset(val)}
                    className="flex-1 py-3 bg-white border border-gray-200/60 rounded-[16px] text-[15px] font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2 mb-4 flex-1 min-h-[220px]">
                {numpadKeys.map((row, rowIndex) => 
                  row.map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') handleClear();
                        else if (key === '⌫') handleBackspace();
                        else handleNumpad(key);
                      }}
                      className={`rounded-[20px] text-[26px] font-medium transition-all active:scale-95 flex items-center justify-center shadow-sm border
                        ${key === 'C' ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100' : 
                          key === '⌫' ? 'bg-gray-200/80 text-gray-600 border-gray-200 hover:bg-gray-300' : 
                          'bg-white text-gray-800 border-gray-100 hover:bg-gray-50'}`}
                    >
                      {key === '⌫' ? <Delete size={26} strokeWidth={2} /> : key}
                    </button>
                  ))
                )}
              </div>

              {/* Action Button */}
              <button 
                onClick={generateQR}
                disabled={loading || pointsToGenerate <= 0}
                className="w-full h-[60px] bg-gray-900 text-white rounded-[20px] font-bold text-[17px] flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shrink-0"
              >
                {loading ? <RefreshCcw size={20} className="animate-spin" /> : <QrCode size={20} />}
                {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR' : 'สร้างคิวอาร์โค้ด')}
              </button>
              
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full justify-between items-center pt-8"
            >
              
              <div className="flex flex-col items-center w-full">
                {/* QR Code Container */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm mb-6 relative flex items-center justify-center border border-gray-100">
                   <img src={qrUrl!} alt="QR Code" className="w-[200px] h-[200px] object-contain" />
                </div>

                <div className="text-center mb-8">
                   <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-semibold text-sm mb-3">
                     <CheckCircle2 size={18} />
                     <span>{locale === 'en' ? 'Ready to scan' : 'พร้อมให้ลูกค้าสแกน'}</span>
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
                   <p className="text-[12px] text-gray-400 font-medium tracking-widest mt-4 uppercase bg-gray-200/50 py-1.5 px-4 rounded-full inline-block">
                     REF: {token.slice(0, 12)}
                   </p>
                </div>
              </div>

              <button 
                onClick={resetGenerator}
                className="w-full h-[60px] bg-white text-gray-900 border border-gray-200 rounded-[20px] font-bold text-[17px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm shrink-0"
              >
                <ArrowLeft size={18} /> {locale === 'en' ? 'New QR Code' : 'แจกรางวัลใหม่'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
          ::-webkit-scrollbar {
            display: none;
          }
      `}</style>
    </div>
  );
}
