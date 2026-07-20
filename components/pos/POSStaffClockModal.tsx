'use client'

import React, { useState, useEffect } from 'react'
import { X, Delete, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useI18n } from "@/lib/I18nContext"

interface POSStaffClockModalProps {
  isOpen: boolean
  onClose: () => void
  shopSettings?: any
}

export default function POSStaffClockModal({
  isOpen,
  onClose,
  shopSettings
}: POSStaffClockModalProps) {
  const { locale } = useI18n()
  const [pin, setPin] = useState<string>('')
  const [error, setError] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  
  const [loading, setLoading] = useState(false)
  const [staffProfile, setStaffProfile] = useState<any>(null)
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError(false)
      setErrorMsg('')
      setStaffProfile(null)
      setTodayLogs([])
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!isOpen) return null

  const getTodayRange = () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  const handleKeyPress = async (num: string) => {
    if (error) {
      setError(false)
      setErrorMsg('')
    }
    
    if (pin.length < 6) {
      const nextPin = pin + num
      setPin(nextPin)
      
      // Auto-validate if length is 4 or 6. For simplicity, we query when length is 4 or 6.
      if (nextPin.length === 4 || nextPin.length === 6) {
        verifyPin(nextPin)
      }
    }
  }

  const verifyPin = async (checkPin: string) => {
    setLoading(true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .eq('pin_code', checkPin)
      .maybeSingle()

    if (profile) {
      // Found staff! Fetch their attendance for today
      setStaffProfile(profile)
      const range = getTodayRange()
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('timestamp', range.start)
        .lte('timestamp', range.end)
        .order('timestamp', { ascending: false })

      if (logs) {
        setTodayLogs(logs)
      }
    } else {
      if (checkPin.length === 6) {
        setError(true)
        setErrorMsg('รหัส PIN ไม่ถูกต้อง')
        setPin('')
      }
    }
    setLoading(false)
  }

  const handleCheckInOut = async (type: 'check_in' | 'check_out') => {
    setLoading(true)
    
    const lat = shopSettings?.latitude || 13.7563
    const lng = shopSettings?.longitude || 100.5018

    const { error: insertError } = await supabase.from('attendance_logs').insert({
      profile_id: staffProfile.id,
      type: type,
      latitude: lat,
      longitude: lng,
      is_within_range: true, // Auto-true for POS
      reason: 'Logged via POS Terminal'
    })

    setLoading(false)
    if (!insertError) {
      onClose()
    } else {
      setError(true)
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDelete = () => {
    if (error) {
      setError(false)
      setErrorMsg('')
    }
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setError(false)
    setErrorMsg('')
    setStaffProfile(null)
  }

  const hasCheckedInToday = todayLogs.some(log => log.type === 'check_in')
  const hasCheckedOutToday = todayLogs.some(log => log.type === 'check_out')
  const isCompletedForToday = hasCheckedInToday && hasCheckedOutToday

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1A1A18]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-md bg-white border border-[#F0F0E8] p-8 sm:p-10 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-black font-bold select-none ${error ? 'animate-shake border-red-500' : ''}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        {staffProfile ? (
          // --- STAFF ACTION SCREEN ---
          <div className="w-full flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gray-50 flex items-center justify-center rounded-full text-[#1A1A18]">
               <span className="text-3xl font-black">{(staffProfile.display_name || staffProfile.full_name || 'S').slice(0,1).toUpperCase()}</span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-black text-[#1A1A18] uppercase tracking-tighter mb-1">
                {staffProfile.display_name || staffProfile.full_name}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {staffProfile.staff_type || 'STAFF'} • {staffProfile.branch_code || 'HQ'}
              </p>
            </div>

            <div className="w-full bg-[#FAFAFA] border border-[#EFEFEF] p-6 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A3A3A3] mb-2">SYSTEM TIME</p>
              <p className="text-4xl font-light font-mono text-[#111111]">
                {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {isCompletedForToday ? (
               <div className="w-full py-6 bg-green-50 text-green-700 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-green-200">
                 <CheckCircle2 size={16} /> COMPLETED FOR TODAY
               </div>
            ) : (
               <div className="w-full flex gap-3">
                 <button
                    disabled={loading || hasCheckedInToday}
                    onClick={() => handleCheckInOut('check_in')}
                    className="flex-1 py-6 bg-[#1A1A18] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 flex flex-col items-center gap-2"
                 >
                   {loading ? <Loader2 className="animate-spin" size={18} /> : 'CHECK IN'}
                 </button>
                 <button
                    disabled={loading || !hasCheckedInToday || hasCheckedOutToday}
                    onClick={() => handleCheckInOut('check_out')}
                    className="flex-1 py-6 bg-[#1A1A18] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20 flex flex-col items-center gap-2"
                 >
                   {loading ? <Loader2 className="animate-spin" size={18} /> : 'CHECK OUT'}
                 </button>
               </div>
            )}
            
            <button
               onClick={handleClear}
               className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 underline underline-offset-4 hover:text-[#1A1A18] mt-4"
            >
              ไม่ใช่ฉัน (Not Me)
            </button>
          </div>
        ) : (
          // --- PIN ENTRY SCREEN ---
          <>
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className={`w-16 h-16 flex items-center justify-center rounded-none transition-colors ${error ? 'bg-red-100 text-red-500' : 'bg-gray-50 text-[#1A1A18]'}`}>
                <Clock size={28} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.25em] leading-tight text-[#1A1A18]">STAFF TIME CLOCK</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-[280px] leading-relaxed">
                {errorMsg || 'ใส่รหัสประจำตัว (PIN) 4-6 หลัก เพื่อลงเวลาเข้า-ออกงาน'}
              </p>
            </div>

            <div className="flex gap-4 mb-10 h-6 items-center">
              {Array.from({ length: 6 }).map((_, idx) => {
                const isFilled = idx < pin.length
                return (
                  <div 
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${error ? 'bg-red-500 scale-110' : isFilled ? 'bg-black scale-110' : 'bg-gray-100 border border-[#F0F0E8]'}`}
                  />
                )
              })}
            </div>

            {loading ? (
               <div className="py-20 flex justify-center w-full max-w-[320px]">
                  <Loader2 className="animate-spin text-[#1A1A18]" size={32} />
               </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    className="h-20 bg-gray-50 hover:bg-black hover:text-white transition-all text-xl font-black uppercase tracking-widest flex items-center justify-center border border-transparent hover:border-black active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  onClick={handleClear}
                  className="h-20 bg-gray-50 hover:bg-gray-100 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 text-gray-400 hover:text-black"
                >
                  Clear
                </button>
                
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-20 bg-gray-50 hover:bg-black hover:text-white transition-all text-xl font-black uppercase tracking-widest flex items-center justify-center border border-transparent hover:border-black active:scale-95"
                >
                  0
                </button>

                <button
                  onClick={handleDelete}
                  className="h-20 bg-gray-50 hover:bg-gray-100 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 text-gray-400 hover:text-black"
                >
                  <Delete size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}
