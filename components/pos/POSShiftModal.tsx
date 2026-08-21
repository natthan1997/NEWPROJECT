'use client';
import React, { useState } from 'react'
import { Wallet, X, ArrowRight, AlertTriangle, Printer, Check, Clock, UserCheck, ChevronsRight, Delete, ShieldCheck } from 'lucide-react'
import RUSHUPLoader from '@/components/loaders/RUSHUPLoader'
import { motion, AnimatePresence, useMotionValue, animate, useTransform } from 'framer-motion'
import { printOpenDrawer } from '@/lib/printerUtils'
import { useI18n } from "@/lib/I18nContext"
import { playAppSound } from '@/lib/audioUtils'

const CashDrawerIcon = () => (
  <img 
    src="/logo.png" 
    alt="RUSH UP Logo" 
    className="h-10 w-auto object-contain mx-auto select-none" 
  />
)

const SwipeButton = ({ onSwipe, isSubmitting }: { onSwipe: () => void; isSubmitting: boolean }) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);

  // Dynamically map drag x position to text opacity
  const textOpacity = useTransform(x, [0, Math.max(1, trackWidth - 100)], [1, 0]);

  React.useEffect(() => {
    if (containerRef.current) {
      setTrackWidth(containerRef.current.offsetWidth);
    }
  }, [containerRef]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = trackWidth - 56; // 48px handle + margins
    const currentX = x.get();
    if (currentX >= threshold * 0.8) {
      setIsSwiped(true);
      onSwipe();
    } else {
      setIsSwiped(false);
      animate(x, 0, { type: "spring", stiffness: 450, damping: 28 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-14 bg-red-50/50 rounded-full border border-red-200/50 p-1 relative overflow-hidden flex items-center justify-center select-none w-full"
    >
      <div className="absolute inset-y-0 left-0 bg-red-500/5 pointer-events-none rounded-l-full" style={{ width: '100%' }} />

      <motion.span 
        style={{ opacity: textOpacity }}
        className="text-[10px] font-black text-red-600/70 z-0 tracking-wider uppercase animate-pulse select-none pointer-events-none"
      >
        {isSubmitting ? 'กำลังดำเนินการ...' : 'สไลด์เพื่อเปิดกะทำงาน'}
      </motion.span>

      {!isSwiped && !isSubmitting && (
        <motion.div
          drag="x"
          dragElastic={0.1}
          dragMomentum={false}
          dragConstraints={{ left: 0, right: Math.max(0, trackWidth - 56) }}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="w-12 h-12 bg-[#C62229] hover:bg-[#a11a1f] active:scale-95 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing absolute left-1 shadow-md z-10 transition-colors"
        >
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <ChevronsRight size={18} />
          </motion.div>
        </motion.div>
      )}

      {(isSwiped || isSubmitting) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#C62229] flex items-center justify-center text-white font-bold text-xs gap-2 rounded-full z-20"
        >
          <RUSHUPLoader mini />
          <span>กำลังเปิดกะ...</span>
        </motion.div>
      )}
    </div>
  );
};

interface POSShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenShift: (cash: number) => Promise<void>
  shopSettings?: any
  isInline?: boolean
}

export default function POSShiftModal({ isOpen, onClose, onOpenShift, shopSettings, isInline = false }: POSShiftModalProps) {
  const { locale } = useI18n();
  const [openingCash, setOpeningCash] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false)

  // Shift Attendance Gating States
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<any>(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<string>('')
  const [leaveReason, setLeaveReason] = useState<string>('แจ้งลาป่วย/ลากะทันหัน')
  const [leaveType, setLeaveType] = useState<'leave' | 'late'>('leave')
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)

  // Manager PIN Verification for Open Drawer
  const [showPinVerify, setShowPinVerify] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const targetPin = String(shopSettings?.role_permissions?.manager_pin || '').trim() || '1234'

  const handlePinKeyPress = (num: string) => {
    if (pinError) setPinError(false)
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + num
      setEnteredPin(nextPin)
      
      if (nextPin.length === targetPin.length) {
        if (nextPin === targetPin) {
          openDrawerBeforeCounting()
          setEnteredPin('')
          setShowPinVerify(false)
        } else {
          setPinError(true)
          setEnteredPin('')
        }
      }
    }
  }

  const handlePinDelete = () => {
    if (pinError) setPinError(false)
    setEnteredPin(prev => prev.slice(0, -1))
  }

  const handlePinClear = () => {
    setEnteredPin('')
    setPinError(false)
  }

  const checkEligibility = async (skipLoading = false): Promise<boolean> => {
    if (!skipLoading) {
      setCheckingEligibility(true)
    }
    try {
      const res = await fetch('/api/pos/shifts/check-eligibility', { method: 'GET' })
      const data = await res.json()
      if (data && data.success) {
        setEligibilityData(data)
        if (!data.canOpenShift) {
          setShowBlockedModal(true)
          return false
        }
        return true
      }
      return true // fallback if error
    } catch (e) {
      console.error('Check eligibility error:', e)
      return true
    } finally {
      if (!skipLoading) {
        setCheckingEligibility(false)
      }
    }
  }

  React.useEffect(() => {
    if (isOpen || isInline) {
      setEligibilityData(null)
      checkEligibility()
      const shiftSettings = shopSettings?.opening_hours?.shift_settings || {};
        
      if (shiftSettings?.default_start_cash !== undefined && shiftSettings?.default_start_cash !== null) {
        setOpeningCash(Number(shiftSettings.default_start_cash) || 0)
      } else {
        setOpeningCash(0)
      }
    } else {
      setShowBlockedModal(false)
      setShowLeaveModal(false)
    }
  }, [isOpen, isInline, shopSettings])

  const handleGrantEmergencyLeave = async (staffId: string) => {
    if (!staffId) return
    setIsSubmittingLeave(true)
    try {
      const res = await fetch('/api/pos/shifts/emergency-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: staffId, reason: leaveReason })
      })
      const data = await res.json()
      if (data.success) {
        alert('บันทึกการลากะทันหันเรียบร้อยแล้ว')
        setShowLeaveModal(false)
        // Re-check eligibility
        const canOpen = await checkEligibility()
        if (canOpen) {
          setShowBlockedModal(false)
        }
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถบันทึกได้'))
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message)
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  const openDrawerBeforeCounting = async () => {
    setIsOpeningDrawer(true)
    playAppSound('pay')
    try {
      let printers = shopSettings?.printers || []
      let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
      
      if (receiptPrinters.length === 0) {
        let ip = localStorage.getItem('rushup_printer_ip')
        if (ip) {
          receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
        }
      }
      
      if (receiptPrinters.length > 0) {
        for (const rp of receiptPrinters) {
          if (!rp.ip) continue;
          await printOpenDrawer(rp.ip, rp.model)
        }
      }
    } catch (e) {
      console.error("Open drawer error in shift modal:", e)
    } finally {
      setIsOpeningDrawer(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    try {
      const isEligible = await checkEligibility(true)
      if (!isEligible) {
        return
      }
      await onOpenShift(openingCash)
      onClose()
    } catch (err) {
      console.error('Open Shift failed:', err)
      alert('เกิดข้อผิดพลาดในการเปิดกะ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInline) {
    return (
      <div className="relative w-full h-full bg-[#fcfcf9] font-sans overflow-hidden flex flex-col min-h-0">
        {/* Loading Gate State */}
        {checkingEligibility && !eligibilityData && (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center min-h-[280px] my-auto">
            <RUSHUPLoader mini />
            <p className="text-xs font-bold text-neutral-500">กำลังตรวจสอบการลงเวลาพนักงาน...</p>
          </div>
        )}

        {/* STEP 1: Emergency Leave View (If active) */}
        <AnimatePresence mode="wait">
          {showLeaveModal && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full flex-1 flex flex-col justify-between bg-white"
            >
              {/* Overlay Header */}
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${leaveType === 'late' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    <AlertTriangle size={17} />
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                    {leaveType === 'late' ? 'แจ้งมาสาย' : 'แจ้งลากะทันหัน'}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-center space-y-3">
                <p className="text-xs font-medium text-neutral-500 text-center">
                  ระบบจะยกเว้นการลงเวลาเข้างานเฉพาะวันนี้เพื่อเปิดกะ POS
                </p>

                <div className="w-full text-left space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 block">เหตุผลการลา</label>
                  <input 
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#D3202B] rounded-xl p-3 text-xs font-bold text-neutral-900 outline-none transition-all"
                    placeholder="ระบุเหตุผลการลา"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 pt-0">
                <button 
                  type="button"
                  onClick={() => handleGrantEmergencyLeave(selectedStaffForLeave)}
                  disabled={isSubmittingLeave}
                  className={`w-full h-11 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm ${leaveType === 'late' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {isSubmittingLeave ? <RUSHUPLoader mini /> : (leaveType === 'late' ? 'ยืนยันแจ้งมาสาย' : 'ยืนยันแจ้งลา')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="w-full h-10 mt-2 text-neutral-500 font-bold text-xs rounded-xl hover:bg-neutral-50 transition-all border border-neutral-200"
                >
                  ย้อนกลับ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 2: Attendance Gate Blocked View */}
        {!showLeaveModal && showBlockedModal && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="w-full flex-1 flex flex-col justify-between bg-white"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={17} />
                </div>
                <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                  ไม่สามารถเปิดกะได้
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col justify-center space-y-3">
              <p className="text-xs font-bold text-rose-600 bg-rose-50/80 px-3.5 py-2.5 rounded-xl border border-rose-100 text-center">
                พนักงานยังไม่ลงเวลาเข้างาน {eligibilityData?.missingCheckInStaff?.length || 0} คน
              </p>

              {/* Missing Staff List */}
              <div className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto text-left">
                {eligibilityData?.missingCheckInStaff?.map((staff: any) => (
                  <div key={staff.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-xs">
                    <span className="text-xs font-bold text-neutral-900">• {staff.display_name || staff.full_name || staff.email}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffForLeave(staff.id);
                          setLeaveType('late');
                          setLeaveReason('แจ้งมาสาย (จะเข้างานทีหลัง)');
                          setShowLeaveModal(true);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-colors"
                      >
                        มาสาย
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffForLeave(staff.id);
                          setLeaveType('leave');
                          setLeaveReason('แจ้งลาป่วย/ลากะทันหัน');
                          setShowLeaveModal(true);
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors"
                      >
                        ลา
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-0">
              <button 
                type="button"
                onClick={() => checkEligibility()}
                disabled={checkingEligibility}
                className="w-full h-11 bg-[#D3202B] hover:bg-red-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
              >
                {checkingEligibility ? <RUSHUPLoader mini /> : 'ตรวจสอบการลงเวลาอีกครั้ง'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Main Open Shift Form View */}
        {!showLeaveModal && !showBlockedModal && !checkingEligibility && (
          <div className="flex-1 flex flex-col justify-between p-6 bg-[#fcfcf9] select-none h-full">
            {/* Header Badge */}
            <div className="pt-4 flex justify-center w-full relative shrink-0">
              <CashDrawerIcon />
            </div>

            {showPinVerify ? (
              <div className="flex-1 flex flex-col items-center justify-center py-4 my-auto w-full">
                {/* Shield Icon / Title */}
                <div className="flex flex-col items-center text-center space-y-1 mb-8 w-full shrink-0">
                  <h3 className="text-[17px] font-normal tracking-wide text-neutral-800">
                    ยืนยันการเปิดลิ้นชัก
                  </h3>
                  {pinError && <p className="text-[13px] font-medium text-red-500">รหัสไม่ถูกต้อง</p>}
                </div>

                {/* PIN Display Bullets */}
                <div className="flex gap-4 mb-10 h-4 items-center justify-center shrink-0">
                  {Array.from({ length: Math.max(targetPin.length, 4) }).map((_, idx) => {
                    const isFilled = idx < enteredPin.length
                    return (
                      <div 
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border-[1.5px] ${pinError ? 'border-red-500 bg-red-500' : isFilled ? 'border-[#D3202B] bg-[#D3202B]' : 'border-neutral-800 bg-transparent'}`}
                      />
                    )
                  })}
                </div>

                {/* Numeric Numpad (Pure Apple Transparent Style with Red Active) */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] shrink-0 mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinKeyPress(num)}
                      className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
                    >
                      <span className="text-[34px] font-light leading-none">{num}</span>
                    </button>
                  ))}
                  
                  {/* Empty bottom left */}
                  <div className="w-[72px] h-[72px]"></div>
                  
                  {/* Zero */}
                  <button
                    type="button"
                    onClick={() => handlePinKeyPress('0')}
                    className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
                  >
                    <span className="text-[34px] font-light leading-none">0</span>
                  </button>

                  {/* Delete or Cancel Button */}
                  <button
                    type="button"
                    onClick={() => {
                        if (enteredPin.length > 0) {
                            handlePinDelete()
                        } else {
                            setShowPinVerify(false)
                            setEnteredPin('')
                            setPinError(false)
                        }
                    }}
                    className="w-[72px] h-[72px] mx-auto transition-colors text-[15px] font-normal flex items-center justify-center text-neutral-900 active:text-neutral-500"
                  >
                    {enteredPin.length > 0 ? 'ลบ' : 'ยกเลิก'}
                  </button>
                </div>
              </div>
            ) : (
              /* Starting Cash Form Content */
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between mt-8 min-h-0">
                <div className="flex flex-col items-center justify-center text-center space-y-3 py-4 my-auto w-full">
                  <span className="text-[10.5px] font-bold text-neutral-400 tracking-[0.25em] uppercase">
                    Starting Cash
                  </span>
                  
                  <div className="flex justify-center items-baseline focus-within:ring-0">
                    <span className="text-[36px] font-light text-[#1A1A18] mr-1 tracking-tighter leading-none select-none">฿</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={openingCash === 0 ? '' : openingCash.toLocaleString()}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        const val = rawValue === '' ? 0 : Number(rawValue);
                        if (!isNaN(val) && val <= 999999) {
                          setOpeningCash(val);
                        }
                      }}
                      placeholder="0"
                      className="bg-transparent text-[72px] font-medium text-[#1A1A18] tracking-tighter leading-none border-0 outline-none focus:outline-none focus:ring-0 p-0 text-center w-64 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </div>
                </div>

                {/* Shift Staff Attendance List (Typographic & borderless) */}
                {eligibilityData?.scheduledStaff && eligibilityData.scheduledStaff.length > 0 && (
                  <div className="pt-4 border-t border-neutral-100/60 mt-2 select-none shrink-0 w-full mb-4">
                    <p className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase text-center mb-3">
                      {locale === 'en' ? 'Shift Staff Attendance' : 'รายชื่อพนักงานประจำกะทำงาน'}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2.5 justify-center max-w-md mx-auto">
                      {eligibilityData.scheduledStaff.map((staff: any) => {
                        const isCheckedIn = eligibilityData.checkedInStaff?.some((c: any) => c.id === staff.id);
                        const isLeave = eligibilityData.emergencyLeaveStaff?.some((l: any) => l.id === staff.id);
                        
                        return (
                          <div 
                            key={staff.id} 
                            className="flex items-center gap-1 text-[11px] font-bold text-neutral-600"
                          >
                            {isCheckedIn ? (
                              <Check size={14} strokeWidth={3} className="text-[#10B981] shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 block shrink-0" />
                            )}
                            <span className={isLeave ? 'line-through text-neutral-400 opacity-60' : ''}>
                              {staff.display_name || staff.full_name || staff.email}
                            </span>
                            {isLeave && <span className="text-[9px] font-bold text-amber-600 ml-0.5">(ลา)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Open Drawer Button */}
                <button
                  type="button"
                  onClick={() => setShowPinVerify(true)}
                  className="w-full h-10 bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 text-[#1A1A18] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all select-none mb-3"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="10" rx="2.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M7 11V6.5C7 5.11929 8.11929 4 9.5 4H14.5C15.8807 4 17 5.11929 17 6.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M3 15H21" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                  <span>เปิดลิ้นชัก</span>
                </button>

                {/* Swipe to Open Shift button */}
                <div className="shrink-0">
                  <SwipeButton onSwipe={() => handleSubmit()} isSubmitting={isSubmitting} />
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A18]/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-sm bg-[#fcfcf9] rounded-3xl shadow-xl border border-neutral-200/80 font-sans overflow-hidden min-h-[280px]"
          >
            {/* Loading Gate State */}
            {checkingEligibility && !eligibilityData && (
              <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center min-h-[280px]">
                <RUSHUPLoader mini />
                <p className="text-xs font-bold text-neutral-500">กำลังตรวจสอบการลงเวลาพนักงาน...</p>
              </div>
            )}

            {/* STEP 1: Emergency Leave View (If active) */}
            <AnimatePresence mode="wait">
              {showLeaveModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="w-full flex flex-col justify-between bg-white"
                >
                  {/* Overlay Header */}
                  <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${leaveType === 'late' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        <AlertTriangle size={17} />
                      </div>
                      <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                        {leaveType === 'late' ? 'แจ้งมาสาย' : 'แจ้งลากะทันหัน'}
                      </h3>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowLeaveModal(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-center space-y-3">
                    <p className="text-xs font-medium text-neutral-500 text-center">
                      ระบบจะยกเว้นการลงเวลาเข้างานเฉพาะวันนี้เพื่อเปิดกะ POS
                    </p>

                    <div className="w-full text-left space-y-1">
                      <label className="text-[11px] font-bold text-neutral-500 block">เหตุผลการลา</label>
                      <input 
                        type="text"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#D3202B] rounded-xl p-3 text-xs font-bold text-neutral-900 outline-none transition-all"
                        placeholder="ระบุเหตุผลการลา"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 pt-0">
                    <button 
                      type="button"
                      onClick={() => handleGrantEmergencyLeave(selectedStaffForLeave)}
                      disabled={isSubmittingLeave}
                      className={`w-full h-11 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm ${leaveType === 'late' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                      {isSubmittingLeave ? <RUSHUPLoader mini /> : (leaveType === 'late' ? 'ยืนยันแจ้งมาสาย' : 'ยืนยันแจ้งลา')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 2: Attendance Gate Blocked View */}
            {!showLeaveModal && showBlockedModal && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full flex flex-col justify-between bg-white"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={17} />
                    </div>
                    <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                      ไม่สามารถเปิดกะได้
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-center space-y-3">
                  <p className="text-xs font-bold text-rose-600 bg-rose-50/80 px-3.5 py-2.5 rounded-xl border border-rose-100 text-center">
                    พนักงานยังไม่ลงเวลาเข้างาน {eligibilityData?.missingCheckInStaff?.length || 0} คน
                  </p>

                  {/* Missing Staff List */}
                  <div className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto text-left">
                    {eligibilityData?.missingCheckInStaff?.map((staff: any) => (
                      <div key={staff.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-xs">
                        <span className="text-xs font-bold text-neutral-900">• {staff.display_name || staff.full_name || staff.email}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForLeave(staff.id);
                              setLeaveType('late');
                              setLeaveReason('แจ้งมาสาย (จะเข้างานทีหลัง)');
                              setShowLeaveModal(true);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-colors"
                          >
                            มาสาย
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForLeave(staff.id);
                              setLeaveType('leave');
                              setLeaveReason('แจ้งลาป่วย/ลากะทันหัน');
                              setShowLeaveModal(true);
                            }}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors"
                          >
                            ลา
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0">
                  <button 
                    type="button"
                    onClick={() => checkEligibility()}
                    disabled={checkingEligibility}
                    className="w-full h-11 bg-[#D3202B] hover:bg-red-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                  >
                    {checkingEligibility ? <RUSHUPLoader mini /> : 'ตรวจสอบการลงเวลาอีกครั้ง'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Main Open Shift Form View (Shown ONLY after eligibility passed!) */}
            {!showLeaveModal && !showBlockedModal && !checkingEligibility && (
              <div className="p-6 relative select-none">
                {/* Close button */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all z-10"
                >
                  <X size={16} />
                </button>

                {/* Header Badge */}
                <div className="pt-4 flex justify-center w-full relative shrink-0">
                  <CashDrawerIcon />
                </div>

                {showPinVerify ? (
                  /* Inline PIN Pad View (Clean, matching style) */
                  <div className="flex flex-col items-center justify-center py-4 my-auto w-full">
                    {/* Shield Icon / Title */}
                    <div className="flex flex-col items-center text-center space-y-1 mb-8 w-full shrink-0">
                      <h3 className="text-[17px] font-normal tracking-wide text-neutral-800">
                        ยืนยันการเปิดลิ้นชัก
                      </h3>
                      {pinError && <p className="text-[13px] font-medium text-red-500">รหัสไม่ถูกต้อง</p>}
                    </div>

                    {/* PIN Display Bullets */}
                    <div className="flex gap-4 mb-10 h-4 items-center justify-center shrink-0">
                      {Array.from({ length: Math.max(targetPin.length, 4) }).map((_, idx) => {
                        const isFilled = idx < enteredPin.length
                        return (
                          <div 
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border-[1.5px] ${pinError ? 'border-red-500 bg-red-500' : isFilled ? 'border-[#D3202B] bg-[#D3202B]' : 'border-neutral-800 bg-transparent'}`}
                          />
                        )
                      })}
                    </div>

                    {/* Numeric Numpad (Pure Apple Transparent Style with Red Active) */}
                    <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] shrink-0 mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handlePinKeyPress(num)}
                          className="w-[72px] h-[72px] mx-auto rounded-full bg-neutral-100/60 hover:bg-neutral-200/60 active:bg-red-50 active:text-[#D3202B] transition-colors flex items-center justify-center text-neutral-900 border border-black/[0.03]"
                        >
                          <span className="text-[34px] font-light leading-none">{num}</span>
                        </button>
                      ))}
                      
                      {/* Empty bottom left */}
                      <div className="w-[72px] h-[72px]"></div>
                      
                      {/* Zero */}
                      <button
                        type="button"
                        onClick={() => handlePinKeyPress('0')}
                        className="h-16 bg-neutral-100 hover:bg-[#D3202B]/10 hover:text-[#D3202B] active:bg-[#D3202B] active:text-white transition-all text-xl font-black rounded-2xl flex items-center justify-center active:scale-95 text-[#1A1A18]"
                      >
                        0
                      </button>

                      {/* Delete or Cancel Button */}
                      <button
                        type="button"
                        onClick={() => {
                            if (enteredPin.length > 0) {
                                handlePinDelete()
                            } else {
                                setShowPinVerify(false)
                                setEnteredPin('')
                                setPinError(false)
                            }
                        }}
                        className="w-[72px] h-[72px] mx-auto transition-colors text-[15px] font-normal flex items-center justify-center text-neutral-900 active:text-neutral-500"
                      >
                        {enteredPin.length > 0 ? 'ลบ' : 'ยกเลิก'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Starting Cash Form Content */
                  <form onSubmit={handleSubmit} className="space-y-6 mt-8 select-none">
                    <div className="flex flex-col items-center justify-center text-center space-y-3 py-6 my-auto w-full">
                      <span className="text-[10.5px] font-bold text-neutral-400 tracking-[0.25em] uppercase">
                        Starting Cash
                      </span>
                      
                      <div className="flex justify-center items-baseline focus-within:ring-0">
                        <span className="text-[36px] font-light text-[#1A1A18] mr-1 tracking-tighter leading-none select-none">฿</span>
                        <input 
                          type="number"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={openingCash === 0 ? '' : openingCash}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            if (!isNaN(val) && val <= 999999) {
                              setOpeningCash(val);
                            }
                          }}
                          placeholder="0"
                          className="bg-transparent text-[72px] font-medium text-[#1A1A18] tracking-tighter leading-none border-0 outline-none focus:outline-none focus:ring-0 p-0 text-center w-64 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Shift Staff Attendance List (Typographic & borderless) */}
                    {eligibilityData?.scheduledStaff && eligibilityData.scheduledStaff.length > 0 && (
                      <div className="pt-4 border-t border-neutral-100/60 mt-2 select-none shrink-0 w-full mb-4">
                        <p className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase text-center mb-3">
                          {locale === 'en' ? 'Shift Staff Attendance' : 'รายชื่อพนักงานประจำกะทำงาน'}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2.5 justify-center max-w-md mx-auto">
                          {eligibilityData.scheduledStaff.map((staff: any) => {
                            const isCheckedIn = eligibilityData.checkedInStaff?.some((c: any) => c.id === staff.id);
                            const isLeave = eligibilityData.emergencyLeaveStaff?.some((l: any) => l.id === staff.id);
                            
                            return (
                              <div 
                                key={staff.id} 
                                className="flex items-center gap-1 text-[11px] font-bold text-neutral-600"
                              >
                                {isCheckedIn ? (
                                  <Check size={14} strokeWidth={3} className="text-[#10B981] shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 block shrink-0" />
                                )}
                                <span className={isLeave ? 'line-through text-neutral-400 opacity-60' : ''}>
                                  {staff.display_name || staff.full_name || staff.email}
                                </span>
                                {isLeave && <span className="text-[9px] font-bold text-amber-600 ml-0.5">(ลา)</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Open Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setShowPinVerify(true)}
                      className="w-full h-10 bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 text-[#1A1A18] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all select-none mb-3"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="11" width="18" height="10" rx="2.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                        <path d="M7 11V6.5C7 5.11929 8.11929 4 9.5 4H14.5C15.8807 4 17 5.11929 17 6.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 15H21" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                      </svg>
                      <span>เปิดลิ้นชัก</span>
                    </button>

                    {/* Swipe to Open Shift button */}
                    <div className="mt-4 shrink-0">
                      <SwipeButton onSwipe={() => handleSubmit()} isSubmitting={isSubmitting} />
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
