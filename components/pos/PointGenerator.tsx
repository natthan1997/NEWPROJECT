'use client';
import React, { useState } from 'react';
import { QrCode, RefreshCcw, CheckCircle2, ArrowLeft, Coffee, Award, X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from "@/lib/I18nContext";

type RewardMode = 'glasses' | 'points';

export default function PointGenerator({ onClose }: { onClose?: () => void }) {
  const { locale } = useI18n();
  const [tab, setTab] = useState<'phone' | 'qr'>('phone');
  const [mode, setMode] = useState<RewardMode>('glasses');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [customValue, setCustomValue] = useState<string>('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const processDirectCredit = async () => {
    if (displayValue <= 0) {
      alert(locale === 'en' ? 'Please enter a valid amount' : 'กรุณาระบุจำนวนที่ถูกต้อง');
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
        // Register new member
        const { data: newMember, error: insertError } = await supabase.from('pos_members').insert({
          phone: phoneNumber,
          points: pointsToGenerate,
          full_name: 'Customer ' + phoneNumber.slice(-4),
          display_name: 'Customer ' + phoneNumber.slice(-4)
        }).select().single();
        if (insertError) throw insertError;
        member = newMember;
      } else {
        // Increment existing
        const { error: rpcError } = await supabase.rpc('increment_member_points', { user_id: member.id, points_to_add: pointsToGenerate });
        if (rpcError) throw rpcError;
      }
      
      // Log history
      await supabase.from('pos_points_history').insert({
        member_id: member.id,
        action: 'earn',
        points: pointsToGenerate,
        description: 'POS Direct Credit'
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
    setSuccessMsg(null);
    setSelectedPreset(1);
    setCustomValue('');
    setMode('glasses');
    setPhoneNumber('');
  };

  return (
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] mx-auto flex flex-col overflow-hidden font-sans border border-gray-100 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1A1A18]">
        <h2 className="text-[18px] font-black text-white uppercase tracking-widest">
          {token || successMsg ? (locale === 'en' ? 'Success' : 'สำเร็จ') : (locale === 'en' ? 'Issue Reward' : 'ให้แต้มลูกค้า')}
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
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setTab('phone')}
                  className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${tab === 'phone' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'Enter Phone' : 'กรอกเบอร์'}
                </button>
                <button
                  onClick={() => setTab('qr')}
                  className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${tab === 'qr' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {locale === 'en' ? 'Scan QR' : 'สแกน QR'}
                </button>
              </div>

              {/* Amount Setup */}
              <div className="flex bg-gray-50 p-1.5 rounded-[16px] mb-4 shadow-inner border border-gray-100">
                <button
                  onClick={() => { setMode('glasses'); setSelectedPreset(1); setCustomValue(''); }}
                  className={`flex-1 py-3 text-[14px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'glasses' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Coffee size={16} className={mode === 'glasses' ? 'text-amber-700' : ''} />
                  {locale === 'en' ? 'Cups' : 'แก้ว'}
                </button>
                <button
                  onClick={() => { setMode('points'); setSelectedPreset(10); setCustomValue(''); }}
                  className={`flex-1 py-3 text-[14px] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 ${
                    mode === 'points' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Award size={16} className={mode === 'points' ? 'text-blue-600' : ''} />
                  {locale === 'en' ? 'Points' : 'แต้ม'}
                </button>
              </div>

              <div className="flex-1">
                {/* Grid Presets */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {presets.map((val) => (
                    <button 
                      key={val} 
                      onClick={() => handlePresetClick(val)}
                      className={`h-[50px] rounded-[12px] text-[16px] font-bold border-2 transition-all flex items-center justify-center gap-1 ${
                        selectedPreset === val
                          ? 'bg-[#1A1A18] border-[#1A1A18] text-white' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-black hover:text-black'
                      }`}
                    >
                      {val} <span className="text-[10px] font-medium opacity-80 uppercase">{unitLabel}</span>
                    </button>
                  ))}
                </div>

                {tab === 'phone' && (
                  <div className="mt-6">
                    <p className="text-[12px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      {locale === 'en' ? 'Customer Phone' : 'เบอร์โทรศัพท์ลูกค้า (สมัครสมาชิกอัตโนมัติ)'}
                    </p>
                    <div className="w-full bg-[#f8f8f8] border-2 border-transparent focus-within:border-[#1A1A18] rounded-2xl py-4 px-6 text-xl font-black text-center tracking-[0.2em] transition-all bg-white flex items-center justify-center min-h-[60px] mb-4">
                      {phoneNumber || <span className="text-gray-300">0XX-XXX-XXXX</span>}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => setPhoneNumber(prev => prev + num)}
                          className="h-12 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-lg rounded-xl transition-all"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setPhoneNumber('')}
                        className="h-12 bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                      >
                        CLR
                      </button>
                      <button
                        onClick={() => setPhoneNumber(prev => prev + '0')}
                        className="h-12 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-lg rounded-xl transition-all"
                      >
                        0
                      </button>
                      <button
                        onClick={() => setPhoneNumber(prev => prev.slice(0, -1))}
                        className="h-12 bg-gray-100 hover:bg-gray-200 text-[#1A1A18] flex items-center justify-center rounded-xl transition-all"
                      >
                        <Delete size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {tab === 'phone' ? (
                  <button 
                    onClick={processDirectCredit}
                    disabled={loading || displayValue <= 0 || phoneNumber.length < 9}
                    className="w-full h-[60px] bg-[#1A1A18] text-white rounded-[16px] font-black text-[16px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                  >
                    {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Award size={20} />}
                    {loading ? (locale === 'en' ? 'Processing...' : 'กำลังดำเนินการ...') : (locale === 'en' ? 'Give Points' : 'ให้แต้มทันที')}
                  </button>
                ) : (
                  <button 
                    onClick={generateQR}
                    disabled={loading || displayValue <= 0}
                    className="w-full h-[60px] bg-[#1A1A18] text-white rounded-[16px] font-black text-[16px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                  >
                    {loading ? <RefreshCcw size={20} className="animate-spin" /> : <QrCode size={20} />}
                    {loading ? (locale === 'en' ? 'Generating...' : 'กำลังสร้าง...') : (locale === 'en' ? 'Generate QR' : 'สร้างคิวอาร์สแกน')}
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
                   <span className="text-[56px] font-black tracking-tighter">{displayValue}</span>
                   <span className="text-[20px] text-gray-400 font-bold ml-2 uppercase tracking-widest">{unitLabel}</span>
                 </div>
                 {mode === 'glasses' && (
                   <p className="text-[14px] text-emerald-500 font-black mt-2 tracking-widest">
                     ( = {pointsToGenerate} PTS )
                   </p>
                 )}
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
                  <ArrowLeft size={18} /> {locale === 'en' ? 'Back' : 'กลับไปแจกรางวัลใหม่'}
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
