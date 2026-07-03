'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, CheckCircle2, ArrowLeft, Coffee, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

type RewardMode = 'glasses' | 'points';

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [mode, setMode] = useState<RewardMode>('glasses');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [customValue, setCustomValue] = useState<string>('');
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate actual points to send to API
  const getDisplayValue = () => {
    if (selectedPreset !== null) return selectedPreset;
    return parseInt(customValue) || 0;
  };

  const displayValue = getDisplayValue();
  const pointsToGenerate = mode === 'glasses' ? displayValue * 50 : displayValue;

  const presets = mode === 'glasses' ? [1, 2, 3, 4] : [10, 20, 50, 100];
  const unitLabel = mode === 'glasses' ? (locale === 'en' ? 'Cups' : 'แก้ว') : (locale === 'en' ? 'Points' : 'แต้ม');

  const handlePresetClick = (val: number) => {
    setSelectedPreset(val);
    setCustomValue('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset(null);
    setCustomValue(e.target.value);
  };

  const generateQR = async () => {
    if (displayValue <= 0) {
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
    setSelectedPreset(1);
    setCustomValue('');
    setMode('glasses');
  };

  return (
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] mx-auto flex flex-col overflow-hidden font-sans border border-gray-100">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-[18px] font-bold text-gray-900">
          {token ? (locale === 'en' ? 'Reward Ready' : 'คิวอาร์โค้ดพร้อมแล้ว') : (locale === 'en' ? 'Issue Reward' : 'แจกรางวัลลูกค้า')}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-200/50 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
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
              
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1.5 rounded-[16px] mb-6 shadow-inner">
                <button
                  onClick={() => { setMode('glasses'); setSelectedPreset(1); setCustomValue(''); }}
                  className={`flex-1 py-3 text-[15px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'glasses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Coffee size={18} className={mode === 'glasses' ? 'text-amber-700' : ''} />
                  {locale === 'en' ? 'Cups' : 'สะสมแก้ว'}
                </button>
                <button
                  onClick={() => { setMode('points'); setSelectedPreset(10); setCustomValue(''); }}
                  className={`flex-1 py-3 text-[15px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'points' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Award size={18} className={mode === 'points' ? 'text-blue-600' : ''} />
                  {locale === 'en' ? 'Points' : 'คะแนน'}
                </button>
              </div>

              {/* Selection Area */}
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gray-700 mb-3">
                  {locale === 'en' ? 'Select Amount' : 'เลือกจำนวน'}
                </p>
                
                {/* Grid Presets */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {presets.map((val) => (
                    <button 
                      key={val} 
                      onClick={() => handlePresetClick(val)}
                      className={`h-[70px] rounded-[16px] text-[20px] font-bold border-2 transition-all flex items-center justify-center gap-1 ${
                        selectedPreset === val
                          ? 'bg-blue-50 border-blue-600 text-blue-700' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {val} <span className="text-[14px] font-medium opacity-80">{unitLabel}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className={`flex items-center gap-4 p-4 rounded-[16px] border-2 transition-all ${
                  selectedPreset === null 
                    ? 'bg-blue-50 border-blue-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex-1">
                    <p className={`text-[13px] font-semibold ${selectedPreset === null ? 'text-blue-700' : 'text-gray-500'}`}>
                      {locale === 'en' ? 'Custom Amount' : 'ระบุจำนวนเอง'}
                    </p>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      value={customValue}
                      onChange={handleCustomChange}
                      placeholder="0"
                      className="w-[120px] h-[44px] text-[20px] font-bold text-center bg-white border border-gray-300 rounded-[12px] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all no-spinner"
                    />
                    <span className="absolute right-3 text-gray-400 font-medium text-[14px] pointer-events-none">
                      {unitLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-gray-100">
                <button 
                  onClick={generateQR}
                  disabled={loading || displayValue <= 0}
                  className="w-full h-[64px] bg-[#212121] text-white rounded-[16px] font-bold text-[18px] flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 disabled:bg-gray-300 active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                  {loading ? <RefreshCcw size={22} className="animate-spin" /> : <QrCode size={22} />}
                  {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR Code' : 'สร้างคิวอาร์โค้ด')}
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
                 <div className="inline-flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-[15px] mb-4">
                   <CheckCircle2 size={20} />
                   <span>{locale === 'en' ? 'Ready for customer to scan' : 'พร้อมให้ลูกค้าสแกน'}</span>
                 </div>
                 
                 <div className="flex items-baseline justify-center text-gray-900 leading-none tracking-tight">
                   <span className="text-[56px] font-extrabold">{displayValue}</span>
                   <span className="text-[24px] text-gray-400 font-bold ml-2 uppercase">{unitLabel}</span>
                 </div>
                 {mode === 'glasses' && (
                   <p className="text-[14px] text-emerald-600 font-bold mt-2">
                     ( = {pointsToGenerate} PTS )
                   </p>
                 )}
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-100 mb-8 w-[240px] h-[240px]">
                 <img src={qrUrl!} alt="QR Code" className="w-full h-full object-contain" />
              </div>

              <div className="w-full space-y-3 mt-auto">
                <p className="text-[13px] text-gray-400 font-bold tracking-widest text-center uppercase bg-gray-100 py-2 rounded-lg">
                  REF: {token.slice(0, 12)}
                </p>
                <button 
                  onClick={resetGenerator}
                  className="w-full h-[56px] bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                >
                  <ArrowLeft size={18} /> {locale === 'en' ? 'Generate Another' : 'แจกรางวัลใหม่'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
          input[type="number"].no-spinner {
            -moz-appearance: textfield !important;
            appearance: textfield !important;
            margin: 0 !important;
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
