'use client';
import React, { useState } from 'react'
import { Wallet, X, ArrowRight, AlertTriangle, Printer } from 'lucide-react'
import XYLLoader from '@/components/loaders/XYLLoader'
import { motion, AnimatePresence } from 'framer-motion'
import { printOpenDrawer } from '@/lib/printerUtils'
import { useI18n } from "@/lib/I18nContext";

interface POSShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenShift: (cash: number) => Promise<void>
  shopSettings?: any
}

export default function POSShiftModal({ isOpen, onClose, onOpenShift, shopSettings }: POSShiftModalProps) {
  const { locale } = useI18n();
  const [openingCash, setOpeningCash] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false)
  const [showNumpad, setShowNumpad] = useState(false)

  // Shift Attendance Gating States
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<any>(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<string>('')
  const [leaveReason, setLeaveReason] = useState<string>('แจ้งลาป่วย/ลากะทันหัน')
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)

  const handleNumpadPress = (val: string) => {
    if (val === 'C') {
      setOpeningCash(0)
    } else if (val === 'DEL') {
      const str = String(openingCash)
      if (str.length <= 1) {
        setOpeningCash(0)
      } else {
        setOpeningCash(Number(str.slice(0, -1)))
      }
    } else {
      const str = openingCash === 0 ? val : String(openingCash) + val
      setOpeningCash(Number(str))
    }
  }

  const checkEligibility = async (): Promise<boolean> => {
    setCheckingEligibility(true)
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
      setCheckingEligibility(false)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      checkEligibility()
      setShowNumpad(false)
    } else {
      setShowBlockedModal(false)
      setShowLeaveModal(false)
      setShowNumpad(false)
    }
  }, [isOpen])

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
    if (isOpeningDrawer) return
    setIsOpeningDrawer(true)
    try {
      let printers = shopSettings?.printers || []
      let receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')

      if (receiptPrinters.length === 0 && typeof window !== 'undefined') {
        const ip = localStorage.getItem('xylem_printer_ip')
        if (ip) {
          receiptPrinters = [{ ip, type: 'receipt', model: 'xprinter-xp-n160ii' }]
        }
      }

      if (receiptPrinters.length === 0) {
        alert('ยังไม่พบเครื่องปริ้นสำหรับเปิดลิ้นชัก')
        return
      }

      for (const rp of receiptPrinters) {
        if (!rp.ip) continue
        await printOpenDrawer(rp.ip, rp.model)
      }
    } catch (err) {
      console.error('Open drawer failed:', err)
      alert('เปิดลิ้นชักไม่สำเร็จ กรุณาตรวจสอบเครื่องปริ้น')
    } finally {
      setIsOpeningDrawer(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // First check staff attendance eligibility
    const isEligible = await checkEligibility()
    if (!isEligible) {
      return // Blocked by Attendance Gating modal
    }
    setShowConfirm(true)
  }

  const handleConfirmedOpen = async () => {
    setIsSubmitting(true)
    try {
      await onOpenShift(openingCash)
      onClose()
    } catch (err) {
      console.error('Open Shift failed:', err)
      alert('เกิดข้อผิดพลาดในการเปิดกะ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSubmitting(false)
      setShowConfirm(false)
    }
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
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-neutral-200/80 font-sans overflow-hidden"
          >
            {/* Attendance Gate Blocked Overlay */}
            <AnimatePresence>
              {showBlockedModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-[60] bg-white flex flex-col justify-between p-6 text-center"
                >
                  <div className="space-y-4 flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-neutral-900 tracking-tight">
                        ไม่สามารถเปิดกะได้
                      </h3>
                      <p className="text-xs font-bold text-rose-600 mt-1">
                        พนักงานยังไม่ลงเวลาเข้างาน {eligibilityData?.missingCheckInStaff?.length || 0} คน
                      </p>
                    </div>

                    {/* Missing Staff List */}
                    <div className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-3 space-y-2 max-h-44 overflow-y-auto text-left">
                      {eligibilityData?.missingCheckInStaff?.map((staff: any) => (
                        <div key={staff.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200/60">
                          <span className="text-xs font-bold text-neutral-900">• {staff.display_name || staff.full_name || staff.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForLeave(staff.id);
                              setShowLeaveModal(true);
                            }}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors"
                          >
                            แจ้งลา
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 pt-3 border-t border-neutral-100">
                    <button 
                      onClick={() => checkEligibility()}
                      disabled={checkingEligibility}
                      className="w-full h-11 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {checkingEligibility ? <XYLLoader mini /> : 'ตรวจสอบอีกครั้ง'}
                    </button>
                    <button 
                      onClick={() => setShowBlockedModal(false)}
                      className="w-full h-8 text-neutral-400 font-bold rounded-lg text-xs hover:text-neutral-700 transition-all"
                    >
                      ปิด
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emergency Leave Overlay */}
            <AnimatePresence>
              {showLeaveModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="absolute inset-0 z-[70] bg-white flex flex-col justify-between p-6 text-center"
                >
                  <div className="space-y-4 flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-neutral-900">
                        แจ้งลากะทันหัน
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        ระบบจะยกเว้นการลงเวลาพนักงานคนนี้เฉพาะวันนี้
                      </p>
                    </div>

                    <div className="w-full text-left">
                      <input 
                        type="text"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-900 transition-all"
                        placeholder="ระบุเหตุผลการลา"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 pt-3 border-t border-neutral-100">
                    <button 
                      onClick={() => handleGrantEmergencyLeave(selectedStaffForLeave)}
                      disabled={isSubmittingLeave}
                      className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingLeave ? <XYLLoader mini /> : 'ยืนยันแจ้งลา'}
                    </button>
                    <button 
                      onClick={() => setShowLeaveModal(false)}
                      className="w-full h-8 text-neutral-400 font-bold rounded-lg text-xs hover:text-neutral-700 transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation Overlay */}
            <AnimatePresence>
              {showConfirm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center space-y-5"
                >
                  <div className="w-12 h-12 bg-neutral-100 text-neutral-800 rounded-2xl flex items-center justify-center">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">ยืนยันเปิดกะ POS?</h3>
                    <p className="text-xs text-neutral-500 mt-1">เงินสดเริ่มต้น: <span className="font-extrabold text-neutral-900">฿{openingCash.toLocaleString()}</span></p>
                  </div>
                  <div className="flex flex-col w-full gap-2 pt-2">
                    <button 
                      onClick={handleConfirmedOpen}
                      disabled={isSubmitting}
                      className="w-full h-11 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <XYLLoader mini /> : 'ยืนยัน'}
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="w-full h-8 text-neutral-400 font-bold text-xs hover:text-neutral-700 transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clean Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-900 text-white rounded-xl flex items-center justify-center">
                    <Wallet size={18} />
                  </div>
                  <h2 className="text-base font-black text-neutral-900">
                    เปิดกะ POS
                  </h2>
               </div>
               <button 
                 onClick={onClose}
                 className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
               >
                 <X size={16} />
               </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
               {/* Test Kick Drawer Option */}
               <button
                 type="button"
                 onClick={openDrawerBeforeCounting}
                 disabled={isOpeningDrawer}
                 className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 text-neutral-700 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all disabled:opacity-50"
               >
                 {isOpeningDrawer ? <XYLLoader mini /> : <Printer size={15} className="text-neutral-500" />}
                 <span>เปิดลิ้นชักทดสอบ</span>
               </button>

               {/* Opening Cash Input Container */}
               <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                    <span>เงินสดเริ่มต้น</span>
                    {showNumpad && (
                      <button 
                        type="button" 
                        onClick={() => setShowNumpad(false)}
                        className="text-[11px] text-neutral-700 hover:text-black font-bold flex items-center gap-1"
                      >
                        เสร็จสิ้น ✕
                      </button>
                    )}
                  </div>

                  <div 
                    onClick={() => setShowNumpad(true)}
                    className={`bg-neutral-50 border rounded-2xl px-4 py-3 flex items-center justify-between transition-all cursor-pointer ${
                      showNumpad ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <span className="text-xl font-extrabold text-neutral-400 mr-2 select-none">฿</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={openingCash || ''} 
                        onFocus={() => setShowNumpad(true)}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          setOpeningCash(val ? Number(val) : 0)
                        }}
                        style={{ outline: 'none', WebkitAppearance: 'none', boxShadow: 'none' }}
                        className="w-full bg-transparent text-2xl font-black text-neutral-900 border-none outline-none ring-0 shadow-none"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
               </div>

               {/* Slide-Up Expandable Touch Numpad Grid (Only shown when user taps cash input!) */}
               <AnimatePresence>
                 {showNumpad && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="space-y-2 overflow-hidden pt-1"
                   >
                     {/* Quick Cash Presets */}
                     <div className="grid grid-cols-3 gap-2">
                       {[500, 1000, 2000].map((amt) => (
                         <button
                           key={amt}
                           type="button"
                           onClick={() => setOpeningCash(amt)}
                           className="py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition-all active:scale-95"
                         >
                           ฿{amt.toLocaleString()}
                         </button>
                       ))}
                     </div>

                     {/* Touch Numpad Buttons */}
                     <div className="grid grid-cols-3 gap-1.5">
                       {['1','2','3','4','5','6','7','8','9','C','0','DEL'].map((btn) => (
                         <button
                           key={btn}
                           type="button"
                           onClick={() => handleNumpadPress(btn)}
                           className={`h-11 rounded-xl font-black text-sm transition-all flex items-center justify-center active:scale-95 ${
                             btn === 'C' 
                               ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                               : btn === 'DEL' 
                               ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200' 
                               : 'bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-900'
                           }`}
                         >
                           {btn === 'DEL' ? '⌫' : btn}
                         </button>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Main Action Button */}
               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50 mt-2"
               >
                 {isSubmitting ? (
                   <XYLLoader mini />
                 ) : (
                   <>
                    <span>เปิดกะทำงาน</span>
                    <ArrowRight size={16} />
                   </>
                 )}
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
