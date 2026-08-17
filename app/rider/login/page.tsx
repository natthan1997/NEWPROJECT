'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Truck, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function RiderLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setLoading(false)
        return
      }

      if (authData?.user) {
        // Fetch profile to verify staff_type
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profileData) {
          await supabase.auth.signOut()
          setError('ไม่พบข้อมูลโปรไฟล์ในระบบ')
          setLoading(false)
          return
        }

        // Allow riders, admins, and managers
        const isAuthorized = 
          profileData.staff_type === 'rider' || 
          profileData.staff_level === 'admin' || 
          profileData.staff_level === 'manager'

        if (!isAuthorized) {
          await supabase.auth.signOut()
          setError('บัญชีนี้ไม่มีสิทธิ์เข้าใช้ระบบพนักงานส่งอาหาร')
          setLoading(false)
          return
        }

        // Successfully authenticated & verified role
        router.replace('/rider')
      }
    } catch (err) {
      console.error(err)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#121214] text-zinc-100 flex flex-col justify-between font-sans max-w-md mx-auto border-x border-zinc-800 shadow-2xl relative overflow-hidden">
      
      {/* 🔝 LOGO HEADER */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="w-full space-y-8 fade-in">
          
          {/* Brand Logo & Intro */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#C62229]/10 border border-[#C62229]/30 flex items-center justify-center text-[#C62229] mx-auto mb-5 animate-pulse">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
              RUSH <span className="text-[#C62229]">UP</span> RIDER
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 leading-none">
              ระบบเข้าสู่ระบบพนักงานจัดส่งอาหาร
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                อีเมลผู้ใช้งาน (EMAIL)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@rushup.com"
                className="w-full h-13 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-2xl px-4 text-sm font-bold text-white outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                รหัสผ่าน (PASSWORD)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-13 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-2xl pl-4 pr-11 text-sm font-bold text-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-[#C62229] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบไรเดอร์'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* 📝 FOOTER LINK */}
      <footer className="p-6 bg-zinc-950 border-t border-zinc-850 text-center">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
          ยังไม่ได้ลงทะเบียนไรเดอร์?{' '}
          <Link href="/rider/register" className="text-[#C62229] font-black underline underline-offset-4 ml-1">
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </p>
      </footer>

    </div>
  )
}
