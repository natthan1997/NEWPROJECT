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
  const [leaveType, setLeaveType] = useState<'leave' | 'late'>('leave')
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
      setEligibilityData(null)
      checkEligibility()
    } else {
      setShowBlockedModal(false)
      setShowLeaveModal(false)
      setEligibilityData(null)
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
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-neutral-200/80 font-sans overflow-hidden min-h-[280px]"
          >
            {/* Loading Gate State */}
            {checkingEligibility && !eligibilityData && (
              <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center min-h-[280px]">
                <XYLLoader mini />
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
                  className="w-full flex flex-col justify-between"
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
                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl p-3 text-xs font-bold text-neutral-900 outline-none transition-all"
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
                      {isSubmittingLeave ? <XYLLoader mini /> : (leaveType === 'late' ? 'ยืนยันแจ้งมาสาย' : 'ยืนยันแจ้งลา')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 2: Attendance Gate Blocked View (First View if staff not checked in) */}
            {!showLeaveModal && showBlockedModal && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full flex flex-col justify-between"
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
                    className="w-full h-11 bg-neutral-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                  >
                    {checkingEligibility ? <XYLLoader mini /> : 'ตรวจสอบการลงเวลาอีกครั้ง'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirmation View (If confirming) */}
            {!showLeaveModal && !showBlockedModal && showConfirm && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full flex flex-col justify-between"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-neutral-900 text-white rounded-xl flex items-center justify-center">
                      <Wallet size={17} />
                    </div>
                    <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                      ยืนยันเปิดกะ POS
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                  <p className="text-xs text-neutral-500">เงินสดเริ่มต้นในลิ้นชัก</p>
                  <p className="text-3xl font-black text-neutral-900">฿{openingCash.toLocaleString()}</p>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0">
                  <button 
                    type="button"
                    onClick={handleConfirmedOpen}
                    disabled={isSubmitting}
                    className="w-full h-11 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                  >
                    {isSubmitting ? <XYLLoader mini /> : 'ยืนยันและเริ่มงาน'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Main Open Shift Form View (Shown ONLY after eligibility passed!) */}
            {!showLeaveModal && !showBlockedModal && !showConfirm && !checkingEligibility && (
              <div>
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

                   {/* Opening Cash Input (Pure Native Device Numpad Integration) */}
                   <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                        <span>เงินสดเริ่มต้น</span>
                        {openingCash > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setOpeningCash(0)}
                            className="text-[11px] text-rose-500 hover:text-rose-600 font-bold"
                          >
                            ล้างค่า
                          </button>
                        )}
                      </div>

                      <div className="bg-neutral-50 border border-neutral-200 focus-within:border-neutral-900 focus-within:bg-white rounded-2xl px-4 py-3 flex items-center transition-all">
                        <span className="text-xl font-extrabold text-neutral-400 mr-2 select-none">฿</span>
                        <input 
                          autoFocus
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={openingCash || ''} 
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '')
                            setOpeningCash(val ? Number(val) : 0)
                          }}
                          style={{ outline: 'none', WebkitAppearance: 'none', boxShadow: 'none', border: 'none' }}
                          className="w-full bg-transparent text-3xl font-black text-neutral-900 outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none"
                          placeholder="0"
                          required
                        />
                      </div>
                   </div>

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
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
