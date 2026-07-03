'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, X, ArrowLeft, Check, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

type RewardMode = 'points' | 'glasses';

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [mode, setMode] = useState<RewardMode>('points');
  const [amount, setAmount] = useState(10);
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1 glass = 50 points
  const pointsToGenerate = isCustom 
    ? (mode === 'glasses' ? (Number(customValue) || 0) * 50 : (Number(customValue) || 0))
    : (mode === 'glasses' ? amount * 50 : amount);

  const generateQR = async () => {
    if (isCustom && (!customValue || Number(customValue) <= 0)) {
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

  const handlePresetClick = (val: number) => {
    setIsCustom(false);
    setAmount(val);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setCustomValue('');
  };

  const resetGenerator = () => {
    setToken(null);
    setIsCustom(false);
    setAmount(10);
    setCustomValue('');
  };

  return (
    <div className="bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[400px] h-[600px] mx-auto flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-medium text-gray-900 tracking-tight">
            {token ? (locale === 'en' ? 'Scan to Collect' : 'แสกนรับแต้ม') : (locale === 'en' ? 'Issue Points' : 'แจกแต้ม')}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium tracking-widest uppercase mt-1">
            Loyalty Reward
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!token ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 px-8 pb-8 flex flex-col justify-between"
            >
              <div className="space-y-10 mt-4">
                
                {/* Type Switcher */}
                <div className="flex bg-gray-50/80 p-1 rounded-full border border-gray-100">
                  <button
                    onClick={() => { setMode('points'); handlePresetClick(10); }}
                    className={`flex-1 py-2.5 px-4 text-[13px] font-medium rounded-full transition-all duration-300 ${
                      mode === 'points' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {locale === 'en' ? 'Points' : 'คะแนน'}
                  </button>
                  <button
                    onClick={() => { setMode('glasses'); handlePresetClick(1); }}
                    className={`flex-1 py-2.5 px-4 text-[13px] font-medium rounded-full transition-all duration-300 ${
                      mode === 'glasses' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {locale === 'en' ? 'Cups' : 'สะสมแก้ว'}
                  </button>
                </div>

                {/* Amount Display */}
                <div className="text-center">
                   <div className="flex items-baseline justify-center gap-1.5 text-gray-900">
                     <span className="text-[64px] font-light tracking-tighter leading-none">
                       {pointsToGenerate}
                     </span>
                     <span className="text-sm font-medium text-gray-400 mb-2">
                       {locale === 'en' ? 'pts' : 'แต้ม'}
                     </span>
                   </div>
                </div>

                {/* Amount Selection */}
                <div className="relative h-[90px]">
                   <AnimatePresence mode="wait">
                      {!isCustom ? (
                        <motion.div 
                          key="grid"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 grid grid-cols-5 gap-2"
                        >
                          {(mode === 'points' ? [10, 20, 50, 100] : [1, 2, 3, 4]).map((val) => (
                            <button 
                              key={val} 
                              onClick={() => handlePresetClick(val)}
                              className={`rounded-2xl transition-all flex flex-col items-center justify-center border ${
                                amount === val
                                  ? 'border-gray-900 bg-gray-900 text-white' 
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-[17px] font-medium">{val}</span>
                            </button>
                          ))}
                          <button 
                            onClick={handleCustomClick}
                            className="rounded-2xl border border-gray-200 text-gray-500 flex flex-col items-center justify-center hover:bg-gray-50 hover:text-gray-900 transition-all bg-white"
                          >
                            <Edit2 size={16} strokeWidth={1.5} />
                            <span className="text-[9px] font-medium mt-1.5">{locale === 'en' ? 'Custom' : 'กำหนดเอง'}</span>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="input"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex gap-2"
                        >
                          <div className="flex-1 relative">
                            <input 
                              autoFocus
                              type="number"
                              value={customValue}
                              onChange={(e) => setCustomValue(e.target.value)}
                              placeholder="0"
                              className="w-full h-full px-6 text-2xl font-light text-center bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 focus:bg-white transition-all no-spinner"
                            />
                          </div>
                          <button 
                            onClick={() => setIsCustom(false)}
                            className="w-[70px] h-full rounded-2xl bg-white border border-gray-200 text-gray-500 font-medium text-sm flex flex-col items-center justify-center hover:bg-gray-50 transition-all"
                          >
                            <X size={18} strokeWidth={1.5} />
                          </button>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={generateQR}
                disabled={loading}
                className="w-full h-14 bg-gray-900 text-white rounded-[16px] font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCcw size={16} className="animate-spin" /> : <QrCode size={18} strokeWidth={1.5} />}
                {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR Code' : 'สร้างคิวอาร์โค้ด')}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 px-8 pb-8 pt-4 flex flex-col justify-between items-center"
            >
              <div className="w-full flex-1 flex flex-col items-center justify-center">
                
                {/* QR Code Container */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 relative">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm">
                     <Check size={14} strokeWidth={3} />
                   </div>
                   <img src={qrUrl!} alt="QR Code" className="w-44 h-44 object-contain" />
                </div>

                <div className="text-center">
                   <p className="text-[12px] text-gray-400 font-medium tracking-widest uppercase mb-2">
                     {locale === 'en' ? 'Please scan' : 'ให้ลูกค้าสแกน'}
                   </p>
                   <p className="text-[32px] font-medium text-gray-900 leading-none">
                     +{pointsToGenerate} <span className="text-[14px] text-gray-400 font-normal">{locale === 'en' ? 'pts' : 'แต้ม'}</span>
                   </p>
                   <p className="text-[10px] text-gray-300 font-mono tracking-widest mt-4">
                     {token.slice(0, 12)}
                   </p>
                </div>
              </div>

              <div className="w-full flex gap-3 mt-4">
                <button 
                  onClick={resetGenerator}
                  className="flex-1 h-12 rounded-[14px] bg-white text-gray-600 font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-gray-50 border border-gray-200 transition-all"
                >
                  <ArrowLeft size={16} strokeWidth={1.5} /> {locale === 'en' ? 'Back' : 'กลับ'}
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 h-12 rounded-[14px] bg-gray-900 text-white font-medium text-[13px] hover:bg-black transition-all"
                >
                  {locale === 'en' ? 'Done' : 'เสร็จสิ้น'}
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
