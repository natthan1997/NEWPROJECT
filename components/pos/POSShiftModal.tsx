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

  // Shift Attendance Gating States
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibilityData, setEligibilityData] = useState<any>(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<string>('')
  const [leaveReason, setLeaveReason] = useState<string>('แจ้งลาป่วย/ลากะทันหัน')
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)

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
    } else {
      setShowBlockedModal(false)
      setShowLeaveModal(false)
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-neutral-200/90 font-sans"
          >
            {/* Attendance Gate Blocked Overlay */}
            <AnimatePresence>
              {showBlockedModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="absolute inset-0 z-[60] bg-white/98 backdrop-blur-md flex flex-col justify-between p-6 sm:p-7 text-center"
                >
                  <div className="space-y-5 flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/10 ring-4 ring-rose-500/10">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1A1A18] tracking-tight mb-1.5">
                        ไม่สามารถเปิดกะ POS ได้
                      </h3>
                      <p className="text-xs font-bold text-rose-700 bg-rose-50/90 px-4 py-3 border border-rose-200/80 rounded-2xl leading-relaxed shadow-xs">
                        พนักงานที่มีตารางงานวันนี้ยังไม่ได้ลงเวลาเข้างานอีก <span className="underline font-black text-rose-800">{eligibilityData?.missingCheckInStaff?.length || 0} คน</span>
                      </p>
                    </div>

                    {/* Missing Staff List */}
                    <div className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3.5 space-y-2.5 max-h-48 overflow-y-auto text-left shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        รายชื่อพนักงานที่ยังไม่ลงเวลาเข้างาน:
                      </p>
                      {eligibilityData?.missingCheckInStaff?.map((staff: any) => (
                        <div key={staff.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all">
                          <span className="text-xs font-black text-[#1A1A18]">• {staff.display_name || staff.full_name || staff.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForLeave(staff.id);
                              setShowLeaveModal(true);
                            }}
                            className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                          >
                            แจ้งลากะทันหัน
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2.5 pt-4 border-t border-neutral-100">
                    <button 
                      onClick={() => checkEligibility()}
                      disabled={checkingEligibility}
                      className="w-full h-12 bg-[#1A1A18] hover:bg-black text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-black/15 cursor-pointer"
                    >
                      {checkingEligibility ? <XYLLoader mini /> : '🔄 ตรวจสอบการลงเวลาอีกครั้ง'}
                    </button>
                    <button 
                      onClick={() => setShowBlockedModal(false)}
                      className="w-full h-10 bg-neutral-100 text-neutral-600 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      ปิดหน้านี้
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emergency Leave Overlay */}
            <AnimatePresence>
              {showLeaveModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-[70] bg-white flex flex-col justify-between p-6 sm:p-7 text-center"
                >
                  <div className="space-y-5 flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/10 ring-4 ring-amber-500/10">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#1A1A18] tracking-tight mb-1">
                        แจ้งลากะทันหันสำหรับวันนี้
                      </h3>
                      <p className="text-xs font-medium text-neutral-500">
                        ระบบจะยกเว้นการลงเวลาเข้างานของพนักงานคนนี้เฉพาะวันนี้เพื่อเปิดกะ POS
                      </p>
                    </div>

                    <div className="w-full space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">เหตุผลการลา:</label>
                      <input 
                        type="text"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-neutral-50 border-2 border-neutral-200/90 focus:border-[#1A1A18] focus:ring-4 focus:ring-[#1A1A18]/10 rounded-2xl p-3.5 text-xs font-bold text-[#1A1A18] outline-none transition-all shadow-inner"
                        placeholder="ระบุเหตุผล เช่น ลาป่วย / ลากิจกะทันหัน"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2.5 pt-4 border-t border-neutral-100">
                    <button 
                      onClick={() => handleGrantEmergencyLeave(selectedStaffForLeave)}
                      disabled={isSubmittingLeave}
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] cursor-pointer"
                    >
                      {isSubmittingLeave ? <XYLLoader mini /> : 'ยืนยันการแจ้งลากะทันหัน'}
                    </button>
                    <button 
                      onClick={() => setShowLeaveModal(false)}
                      className="w-full h-10 bg-neutral-100 text-neutral-600 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-all cursor-pointer"
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
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/10 ring-4 ring-amber-500/10">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1A1A18] mb-1 tracking-tight">ยืนยันการเปิดลิ้นชักและเริ่มกะ?</h3>
                    <p className="text-xs font-bold text-neutral-500">เงินสดเริ่มต้นในลิ้นชัก: ฿{openingCash.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col w-full gap-2.5">
                    <button 
                      onClick={handleConfirmedOpen}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-[#1A1A18] hover:bg-black text-white font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer"
                    >
                      {isSubmitting ? <XYLLoader mini /> : 'ยืนยันและเปิดลิ้นชัก'}
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="w-full h-10 bg-neutral-100 text-neutral-600 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      ย้อนกลับไปแก้ไข
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-white">
               <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2B2B28] to-[#141412] text-white rounded-2xl flex items-center justify-center shadow-md shadow-black/15">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#1A1A18] tracking-tight">
                      {locale === 'en' ? 'Open New Shift' : 'เปิดกะทำงานใหม่'}
                    </h2>
                    <p className="text-xs font-bold text-neutral-400 mt-0.5">
                      {locale === 'en' ? 'Confirm starting cash' : 'ระบุเงินสดเริ่มต้นเพื่อเปิดกะ POS'}
                    </p>
                  </div>
               </div>
               <button 
                 onClick={onClose}
                 className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer"
               >
                 <X size={18} />
               </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
               {/* Kick Drawer Option */}
               <div>
                  <button
                    type="button"
                    onClick={openDrawerBeforeCounting}
                    disabled={isOpeningDrawer}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/90 text-emerald-800 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-xs hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99] shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isOpeningDrawer ? <XYLLoader mini /> : <Printer size={18} className="text-emerald-700" />}
                    <span>{locale === 'en' ? 'Open Drawer to Count Cash' : 'เปิดลิ้นชักก่อนนับเงิน'}</span>
                  </button>
                  <p className="text-[10px] font-medium text-neutral-400 text-center mt-2">
                    {locale === 'en' ? 'Click to trigger cash drawer kick before counting' : 'กดปุ่มนี้เพื่อทดสอบเปิดลิ้นชักและนับเงินสดก่อนกรอกยอด'}
                  </p>
               </div>

               {/* Opening Cash Input */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    {locale === 'en' ? 'Opening Cash Amount' : 'ระบุเงินสดเริ่มต้นในลิ้นชัก (Opening Cash)'}
                  </label>
                  <div className="bg-neutral-50/80 border-2 border-neutral-200/90 focus-within:border-[#1A1A18] focus-within:ring-4 focus-within:ring-[#1A1A18]/10 rounded-2xl p-4 sm:p-5 flex items-center transition-all shadow-inner">
                    <div className="w-12 h-12 rounded-xl bg-[#1A1A18] text-white font-black flex items-center justify-center text-xl shadow-md shrink-0 mr-3.5">
                      ฿
                    </div>
                    <input 
                      autoFocus
                      type="number" 
                      value={openingCash || ''} 
                      onChange={e => setOpeningCash(Number(e.target.value))}
                      className="w-full bg-transparent text-3xl font-black outline-none text-[#1A1A18]"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-800 font-medium leading-relaxed flex gap-2.5 items-start mt-2.5 shadow-xs">
                    <span className="font-bold text-amber-600 text-sm shrink-0 leading-none mt-0.5">*</span>
                    <span>กรุณาตรวจสอบเงินสดในลิ้นชักให้ถูกต้องก่อนเริ่มกะ เพื่อความแม่นยำของใบสรุปยอดปิดกะท้ายวัน</span>
                  </div>
               </div>

               {/* Main Action Button (Tactile 3D Depth) */}
               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full h-14 bg-[#1A1A18] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 border border-white/10 relative overflow-hidden group cursor-pointer disabled:opacity-50"
               >
                 {isSubmitting ? (
                   <XYLLoader mini />
                 ) : (
                   <>
                    <span className="relative z-10">{locale === 'en' ? 'Confirm and Open Drawer' : 'ยืนยันและเปิดลิ้นชัก'}</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   </>
                 )}
               </button>
            </form>

            <div className="px-6 pb-5 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-neutral-400">
                XYLEM POS • ONLINE SYSTEM
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
