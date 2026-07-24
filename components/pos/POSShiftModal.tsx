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
            className="absolute inset-0 bg-[#3a3a38]/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#FBFBFA] shadow-2xl overflow-hidden border border-[#E5E5DF]"
          >
            {/* Attendance Gate Blocked Overlay */}
            <AnimatePresence>
              {showBlockedModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute inset-0 z-[60] bg-white flex flex-col justify-between p-8 text-center"
                >
                  <div className="space-y-6 flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <AlertTriangle size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1A1A18] uppercase tracking-tight mb-2">
                        ไม่สามารถเปิดกะ POS ได้
                      </h3>
                      <p className="text-[11px] font-bold text-red-600 bg-red-50 p-3 border border-red-100 rounded-none leading-relaxed">
                        พนักงานตารางงานวันนี้ยังไม่ได้ลงเวลาเข้างานใน Dashboard อีก {eligibilityData?.missingCheckInStaff?.length || 0} คน
                      </p>
                    </div>

                    {/* Missing Staff List */}
                    <div className="w-full bg-gray-50 border border-gray-100 p-4 space-y-2 max-h-40 overflow-y-auto text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        รายชื่อพนักงานที่ยังไม่ลงเวลาเข้างาน:
                      </p>
                      {eligibilityData?.missingCheckInStaff?.map((staff: any) => (
                        <div key={staff.id} className="flex justify-between items-center bg-white p-2 border border-gray-200">
                          <span className="text-xs font-bold text-[#1A1A18]">• {staff.display_name || staff.full_name || staff.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForLeave(staff.id);
                              setShowLeaveModal(true);
                            }}
                            className="text-[9px] font-black bg-amber-500 text-white px-2 py-1 uppercase tracking-tighter hover:bg-amber-600 transition-colors"
                          >
                            แจ้งลากะทันหัน
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => checkEligibility()}
                      disabled={checkingEligibility}
                      className="w-full h-12 bg-[#1A1A18] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      {checkingEligibility ? <XYLLoader mini /> : '🔄 ตรวจสอบการลงเวลาอีกครั้ง'}
                    </button>
                    <button 
                      onClick={() => setShowBlockedModal(false)}
                      className="w-full h-10 bg-gray-50 text-gray-400 font-bold uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all"
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-[70] bg-white flex flex-col justify-between p-8 text-center"
                >
                  <div className="space-y-6 flex-1 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1A1A18] uppercase tracking-tight mb-1">
                        แจ้งลากะทันหันสำหรับวันนี้
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400">
                        ระบบจะยกเว้นการบังคับลงเวลาเข้างานของพนักงานคนนี้เฉพาะวันนี้เพื่อเปิดกะ POS
                      </p>
                    </div>

                    <div className="w-full space-y-4 text-left">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">เหตุผลการลา:</label>
                        <input 
                          type="text"
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 p-3 text-xs font-bold text-[#1A1A18] outline-none focus:ring-1 focus:ring-black"
                          placeholder="ระบุเหตุผล เช่น ลาป่วย / ลากิจกะทันหัน"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleGrantEmergencyLeave(selectedStaffForLeave)}
                      disabled={isSubmittingLeave}
                      className="w-full h-12 bg-amber-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingLeave ? <XYLLoader mini /> : 'ยืนยันการแจ้งลากะทันหัน'}
                    </button>
                    <button 
                      onClick={() => setShowLeaveModal(false)}
                      className="w-full h-10 bg-gray-50 text-gray-400 font-bold uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all"
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
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-10 text-center space-y-8"
                >
                  <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center animate-bounce">
                    <AlertTriangle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1A18] mb-2 uppercase">{locale === 'en' ? 'ยืนยันการเปิดลิ้นชัก?' : locale === 'zh' ? 'ยืนยันการเปิดลิ้นชัก?' : 'ยืนยันการเปิดลิ้นชัก?'}</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'en' ? 'เงินเริ่มต้น: ฿' : locale === 'zh' ? 'เงินเริ่มต้น: ฿' : 'เงินเริ่มต้น: ฿'}{openingCash.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col w-full gap-3">
                    <button 
                      onClick={handleConfirmedOpen}
                      disabled={isSubmitting}
                      className="w-full h-16 bg-[#1A1A18] text-white font-black uppercase tracking-[0.3em] text-[11px] hover:bg-black transition-all flex items-center justify-center gap-4"
                    >
                      {isSubmitting ? <XYLLoader mini /> : 'ยืนยันและเปิดลิ้นชัก'}
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="w-full h-14 bg-gray-50 text-[#8C8A81] font-black uppercase tracking-[0.2em] text-[9px] hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      {locale === 'en' ? '                       ยกเลิกเพื่อแก้ไข                     ' : locale === 'zh' ? '                       ยกเลิกเพื่อแก้ไข                     ' : '                       ยกเลิกเพื่อแก้ไข                     '}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="p-8 border-b border-[#F0F0E8] flex items-center justify-between bg-white">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1A1A18] text-white flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A1A18]">{locale === 'en' ? 'เปิดกะทำงานใหม่' : locale === 'zh' ? 'เปิดกะทำงานใหม่' : 'เปิดกะทำงานใหม่'}</h2>
                    <p className="text-[9px] font-bold text-[#8C8A81] uppercase tracking-[0.1em] mt-1">{locale === 'en' ? 'ยืนยันการเริ่มกะทำงาน' : locale === 'zh' ? 'ยืนยันการเริ่มกะทำงาน' : 'ยืนยันการเริ่มกะทำงาน'}</p>
                  </div>
               </div>
               <button 
                 onClick={onClose}
                 className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#1A1A18] transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-10 space-y-10">
               <div className="space-y-3">
                  <button
                    type="button"
                    onClick={openDrawerBeforeCounting}
                    disabled={isOpeningDrawer}
                    className="w-full h-14 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center gap-3 font-black uppercase tracking-[0.25em] text-[10px] hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    {isOpeningDrawer ? <XYLLoader mini /> : <Printer size={16} />}
                    <span>{locale === 'en' ? 'เปิดลิ้นชักก่อนนับเงิน' : locale === 'zh' ? 'เปิดลิ้นชักก่อนนับเงิน' : 'เปิดลิ้นชักก่อนนับเงิน'}</span>
                  </button>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    {locale === 'en' ? 'กดปุ่มนี้ก่อนกรอกเงินเปิดกะ เพื่อให้พนักงานนับเงินได้จริง' : locale === 'zh' ? 'กดปุ่มนี้ก่อนกรอกเงินเปิดกะ เพื่อให้พนักงานนับเงินได้จริง' : 'กดปุ่มนี้ก่อนกรอกเงินเปิดกะ เพื่อให้พนักงานนับเงินได้จริง'}
                  </p>
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8C8A81] block">
                    {locale === 'en' ? '                     ระบุเงินสดเริ่มต้นในลิ้นชัก (Opening Cash)                   ' : locale === 'zh' ? '                     ระบุเงินสดเริ่มต้นในลิ้นชัก (Opening Cash)                   ' : '                     ระบุเงินสดเริ่มต้นในลิ้นชัก (Opening Cash)                   '}</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-gray-300 group-focus-within:text-[#1A1A18]">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}</span>
                    <input 
                      autoFocus
                      type="number" 
                      value={openingCash || ''} 
                      onChange={e => setOpeningCash(Number(e.target.value))}
                      className="w-full bg-white border border-[#E5E5DF] py-10 pl-14 pr-8 text-5xl font-black outline-none focus:ring-1 focus:ring-[#1A1A18] transition-all text-[#1A1A18]"
                      placeholder="0"
                      required
                    />
                  </div>
                  <p className="text-[10px] font-medium text-amber-600 bg-amber-50/50 p-4 leading-relaxed border-l-2 border-amber-300 uppercase tracking-tighter">
                    {locale === 'en' ? '                     * กรุณาตรวจสอบเงินในลิ้นชักให้ถูกต้องก่อนเริ่มกะทำงาน เพื่อความแม่นยำของใบสรุปยอดปิดกะท้ายวัน                   ' : locale === 'zh' ? '                     * กรุณาตรวจสอบเงินในลิ้นชักให้ถูกต้องก่อนเริ่มกะทำงาน เพื่อความแม่นยำของใบสรุปยอดปิดกะท้ายวัน                   ' : '                     * กรุณาตรวจสอบเงินในลิ้นชักให้ถูกต้องก่อนเริ่มกะทำงาน เพื่อความแม่นยำของใบสรุปยอดปิดกะท้ายวัน                   '}</p>
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full h-20 bg-[#1A1A18] text-white flex items-center justify-center gap-6 group hover:bg-[#2B2B28] transition-all disabled:opacity-50"
               >
                 {isSubmitting ? (
                   <XYLLoader mini />
                 ) : (
                   <>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">{locale === 'en' ? 'ยืนยันและเปิดลิ้นชัก' : locale === 'zh' ? 'ยืนยันและเปิดลิ้นชัก' : 'ยืนยันและเปิดลิ้นชัก'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                   </>
                 )}
               </button>
            </form>

            <div className="px-10 pb-8 text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300">{locale === 'en' ? 'ระบบปฏิบัติการ XYL STUDIO • v1.0.32' : locale === 'zh' ? 'ระบบปฏิบัติการ XYL STUDIO • v1.0.32' : 'ระบบปฏิบัติการ XYL STUDIO • v1.0.32'}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
