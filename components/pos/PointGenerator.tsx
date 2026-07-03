'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, Gift, Award, Coffee, X, Edit3, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-white rounded-[32px] relative overflow-hidden shadow-2xl font-sans w-full max-w-[420px] h-[640px] mx-auto flex flex-col border border-gray-100">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-50 to-white/0 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="px-8 h-[90px] flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
             {token ? <QrCode size={20} /> : <Gift size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 leading-tight">
              {token ? 'รับคะแนนสะสม' : 'สร้างรางวัลสำหรับลูกค้า'}
            </h2>
            <p className="text-xs text-emerald-600/80 font-medium tracking-wide">Loyalty Management</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden z-10">
        <AnimatePresence mode="wait">
          {!token ? (
            <motion.div 
              key="setup-view"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 px-8 pb-8 pt-4 flex flex-col justify-between"
            >
              <div className="space-y-8">
                {/* Mode Selector */}
                <div className="flex p-1 bg-gray-100/80 rounded-2xl shadow-inner">
                  <button
                    onClick={() => { setMode('points'); handlePresetClick(10); }}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === 'points' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Award size={16} />
                    {locale === 'en' ? 'Points' : 'คะแนน'}
                  </button>
                  <button
                    onClick={() => { setMode('glasses'); handlePresetClick(1); }}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === 'glasses' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Coffee size={16} />
                    {locale === 'en' ? 'Cups' : 'สะสมแก้ว'}
                  </button>
                </div>

                {/* Amount Display */}
                <div className="text-center relative py-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                   <p className="text-xs font-medium text-emerald-600/80 uppercase tracking-wider mb-2">
                     {locale === 'en' ? 'Amount to generate' : 'จำนวนที่จะได้รับ'}
                   </p>
                   <div className="flex items-end justify-center gap-2 text-emerald-900">
                     <p className="text-6xl font-bold tracking-tight leading-none">
                       {pointsToGenerate}
                     </p>
                     <span className="text-lg font-semibold text-emerald-600/70 mb-1">
                       {locale === 'en' ? 'pts' : 'แต้ม'}
                     </span>
                   </div>
                </div>

                {/* Grid Overlay */}
                <div className="relative h-[110px]">
                   <AnimatePresence mode="wait">
                      {!isCustom ? (
                        <motion.div 
                          key="grid"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 grid grid-cols-5 gap-2"
                        >
                          {(mode === 'points' ? [10, 20, 50, 100] : [1, 2, 3, 4]).map((val) => (
                            <button 
                              key={val} 
                              onClick={() => handlePresetClick(val)}
                              className={`rounded-2xl text-lg font-bold transition-all flex flex-col items-center justify-center border-2 ${
                                amount === val && !isCustom 
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transform -translate-y-1' 
                                  : 'border-gray-100 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              <span>{val}</span>
                              <span className={`text-[10px] mt-0.5 ${amount === val && !isCustom ? 'text-emerald-100' : 'text-gray-400 font-medium'}`}>
                                {mode === 'points' ? 'แต้ม' : 'แก้ว'}
                              </span>
                            </button>
                          ))}
                          <button 
                            onClick={handleCustomClick}
                            className="rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 flex flex-col items-center justify-center hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all bg-gray-50/50"
                          >
                            <Edit3 size={18} />
                            <span className="text-[10px] font-medium mt-1">{locale === 'en' ? 'Custom' : 'ระบุเอง'}</span>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex gap-2"
                        >
                          <div className="flex-1 relative">
                            <input 
                              autoFocus
                              type="number"
                              value={customValue}
                              onChange={(e) => setCustomValue(e.target.value)}
                              placeholder={locale === 'en' ? 'Enter amount...' : 'ใส่ตัวเลข...'}
                              className="w-full h-full px-6 text-3xl font-bold bg-white text-gray-800 border-2 border-emerald-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-gray-300 placeholder:text-xl no-spinner"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-500">
                              {mode === 'points' ? 'แต้ม' : 'แก้ว'}
                            </div>
                          </div>
                          <button 
                            onClick={() => setIsCustom(false)}
                            className="w-[72px] h-full rounded-2xl bg-gray-100 text-gray-600 font-medium text-sm flex flex-col items-center justify-center gap-1 hover:bg-gray-200 transition-all"
                          >
                            <X size={18} />
                            <span className="text-[10px] uppercase">Cancel</span>
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
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-70 transform active:scale-[0.98]"
              >
                {loading ? <RefreshCcw size={18} className="animate-spin" /> : <QrCode size={18} />}
                {loading ? (locale === 'en' ? 'Generating...' : 'กำลังดำเนินการ...') : (locale === 'en' ? 'Generate QR Code' : 'สร้างคิวอาร์โค้ดแจกแต้ม')}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="result-view"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 px-8 pb-8 pt-2 flex flex-col justify-between items-center"
            >
              <div className="w-full text-center flex-1 flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-semibold tracking-wide mb-6">
                  <CheckCircle2 size={14} />
                  {locale === 'en' ? 'READY TO SCAN' : 'สแกนเพื่อรับแต้ม'}
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 mb-6">
                   <img src={qrUrl!} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl" />
                </div>

                <div className="text-center space-y-1">
                   <p className="text-3xl font-bold text-gray-800 leading-none">
                     +{pointsToGenerate} <span className="text-base text-gray-500 font-semibold">{locale === 'en' ? 'pts' : 'แต้ม'}</span>
                   </p>
                   <p className="text-[11px] font-medium text-gray-400 tracking-wide mt-2">
                     REF: {token.slice(0, 12)}
                   </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 shrink-0 pt-4 mt-2">
                <button 
                  onClick={resetGenerator}
                  className="h-12 rounded-xl bg-gray-50 text-gray-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all border border-gray-200/50"
                >
                  <ArrowLeft size={16} /> {locale === 'en' ? 'Back' : 'กลับ / ทำใหม่'}
                </button>
                <button 
                  onClick={onClose}
                  className="h-12 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  {locale === 'en' ? 'Done' : 'เสร็จสิ้น'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
          /* Force Global Reset for Number Inputs in this component */
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
