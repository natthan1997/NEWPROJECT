'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import RiderDashboard from '@/components/RiderDashboard'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function RiderPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(true)
  const [isRider, setIsRider] = useState(false)
  const [verifiedProfile, setVerifiedProfile] = useState<any>(null)

  useEffect(() => {
    async function checkRiderRole() {
      if (authLoading) return

      if (!user) {
        router.replace('/login')
        return
      }

      try {
        // Fetch fresh profile state to check staff_type
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setVerifiedProfile(data)
          if (data.staff_type === 'rider' || data.staff_level === 'admin' || data.staff_level === 'manager') {
            setIsRider(true)
          }
        }
      } catch (err) {
        console.error('Failed to verify rider role:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    checkRiderRole()
  }, [user, authLoading, router])

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C62229]" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  if (!isRider) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F5F5F7] p-6 text-center text-zinc-900">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-[#C62229] mb-4 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black tracking-tight mb-2 text-[#1A1A18]">ไม่ได้รับสิทธิ์เข้าถึง</h1>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-[280px] mb-6">
          หน้านี้จัดทำขึ้นสำหรับพนักงานส่งอาหาร (Rider) เท่านั้น บัญชีของคุณไม่มีสิทธิ์ในการเข้าใช้งานระบบนี้
        </p>
        <button
          onClick={() => router.replace('/login')}
          className="px-6 py-2.5 bg-[#C62229] hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
        >
          กลับหน้าล็อกอินไรเดอร์
        </button>
      </div>
    )
  }

  return <RiderDashboard profile={verifiedProfile || profile} />
}
