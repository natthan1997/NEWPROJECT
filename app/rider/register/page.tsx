'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Truck, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function RiderRegister() {
  const router = useRouter()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register-rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone,
          vehicleInfo,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result?.error || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      } else if (result?.success) {
        setSuccess('ลงทะเบียนสำเร็จ! กรุณารอผู้ดูแลระบบตรวจสอบและอนุมัติบัญชีของคุณก่อนเข้าใช้งาน')
        setTimeout(() => {
          router.push('/rider/login')
        }, 5000)
      }
    } catch (err) {
      console.error(err)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#121214] text-zinc-100 flex flex-col justify-between font-sans max-w-md mx-auto border-x border-zinc-800 shadow-2xl relative overflow-hidden">
      
      {/* 🔝 LOGO & INTRO */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="w-full space-y-6">
          
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#C62229]/10 border border-[#C62229]/30 flex items-center justify-center text-[#C62229] mx-auto mb-4">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white leading-none">
              สมัครสมาชิกไรเดอร์
            </h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5 leading-none">
              กรอกข้อมูลเพื่อลงทะเบียนร่วมงานส่งอาหารกับ RUSH UP
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ชื่อจริง"
                    className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl px-3 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl px-3 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-655"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">อีเมล (EMAIL)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rider@email.com"
                  className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl px-3 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">เบอร์โทรศัพท์ (PHONE)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxx"
                  className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl px-3 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">ข้อมูลยานพาหนะ / ทะเบียนรถ</label>
                <input
                  type="text"
                  required
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="ยี่ห้อ รุ่น และเลขทะเบียนรถ เช่น Honda Wave 1กข-123"
                  className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl px-3 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl pl-3 pr-9 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่าน"
                      className="w-full h-11 bg-zinc-900 border border-zinc-800 focus:border-[#C62229] focus:bg-zinc-950 rounded-xl pl-3 pr-9 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-650"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-[#C62229] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่งคำขอสมัคร...
                  </>
                ) : (
                  'ส่งข้อมูลสมัครสมาชิก'
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* 📝 FOOTER LINK */}
      <footer className="p-5 bg-zinc-950 border-t border-zinc-850 text-center">
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
          เป็นสมาชิกไรเดอร์อยู่แล้ว?{' '}
          <Link href="/rider/login" className="text-[#C62229] font-black underline underline-offset-4 ml-1">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </footer>

    </div>
  )
}
