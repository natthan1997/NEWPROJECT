'use client';
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Apple, Chrome, Fingerprint, Loader2, ArrowLeft, Phone, User, Store } from 'lucide-react'
import PublicRoute from '@/components/PublicRoute'
import { getUserProfile, signIn, getCustomerHouses, supabase } from '../../lib/supabaseClient'
import { useI18n, type Locale } from '@/lib/I18nContext'

const copyByLocale: Record<Locale, Record<string, string>> = {
  th: {
    invalidCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    emailNotConfirmed: 'กรุณายืนยันอีเมลในกล่องจดหมายของคุณ',
    loginError: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง',
    lineLogin: 'Identify with LINE',
    signingIn: 'IDENTIFYING...',
  },
  en: {
    invalidCredentials: 'Incorrect email or password.',
    emailNotConfirmed: 'Please confirm your email in your inbox.',
    loginError: 'System error. Please try again.',
    lineLogin: 'Identify with LINE',
    signingIn: 'IDENTIFYING...',
  },
  zh: {
    invalidCredentials: '邮箱或密码错误。',
    emailNotConfirmed: '请检查邮箱并确认。',
    loginError: '系统错误，请重试。',
    lineLogin: 'Identify with LINE',
    signingIn: '正在验证...',
  },
}

export default function Login() {
  const { locale } = useI18n()
  const copy = copyByLocale[locale]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState('')
  const [nextPath, setNextPath] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextCandidate = params.get('next') || ''
    if (nextCandidate.startsWith('/dashboard') || nextCandidate.startsWith('/invite')) setNextPath(nextCandidate)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await signIn(email, password)
      if (signInError) {
        const msg = signInError instanceof Error ? signInError.message : String(signInError)
        if (msg.includes('Invalid login credentials')) setError(copy.invalidCredentials)
        else if (msg.includes('Email not confirmed')) setError(copy.emailNotConfirmed)
        else setError(copy.loginError)
      } else if (data?.user) {
        const { data: profile } = await getUserProfile()
        let target = nextPath
        
        // Prevent loop: If they logged out from a dashboard, ProtectedRoute might have appended it as ?next=.
        // If an admin logs in, we don't want them getting stuck in customer/staff dashboards unless it's a specific deep link (has query params).
        if (target) {
          const hasQueryParams = target.includes('?')
          if (!hasQueryParams) {
            if (target === '/dashboard/customer' || target.startsWith('/dashboard/customer/')) {
              target = ''
            } else if (target === '/dashboard/staff' || target.startsWith('/dashboard/staff/')) {
              target = ''
            }
          }
        }

        target = target || (
          (profile?.role === 'admin' || profile?.staff_level === 'admin')
            ? '/dashboard/admin' 
            : profile?.role === 'staff' 
              ? ((profile?.staff_level === 'owner' || profile?.staff_level === 'superadmin') ? '/dashboard/merchant' : (profile?.is_pos_account ? '/dashboard/pos' : '/dashboard/staff'))
              : '/dashboard/customer'
        )

        if (target === '/dashboard/customer' && profile?.id) {
           const { data: houses } = await getCustomerHouses(profile.id)
           if (!houses || houses.length === 0) {
              target = '/dashboard/customer/houses/add'
           }
        }

        router.push(target)
      }
    } catch (err) {
      setError(copy.loginError)
    } finally {
      setLoading(false)
    }
  }

  const handleLineSignIn = async () => {
    setLineLoading(true)
    setError('')
    const url = nextPath ? `/api/auth/line/login?next=${encodeURIComponent(nextPath)}` : '/api/auth/line/login'
    window.location.assign(url)
  }

const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      setError('กรุณายอมรับข้อกำหนดและเงื่อนไข')
      return
    }
    setLoading(true)
    setError('')
    try {
      let cleanedPhone = phone.replace(/[^0-9+]/g, '')
      if (cleanedPhone) {
        if (!cleanedPhone.startsWith('+')) {
          if (cleanedPhone.startsWith('0')) {
            cleanedPhone = '+66' + cleanedPhone.slice(1)
          } else {
            cleanedPhone = '+66' + cleanedPhone
          }
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            store_name: storeName,
            phone: cleanedPhone,
            role: 'customer'
          }
        }
      })

      if (signUpError) {
        setError(signUpError instanceof Error ? signUpError.message : String(signUpError))
      } else if (data?.user) {
        // Create database profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            role: 'customer',
            display_name: displayName,
            phone: cleanedPhone,
            timezone: 'Asia/Bangkok',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('[Register] Profile fallback error:', profileError)
        }

        setError('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี')
        setTimeout(() => {
          setError('')
          setAuthMode('login')
        }, 3000)
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลงทะเบียน')
    } finally {
      setLoading(false)
    }
  }

  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollLeft = container.scrollLeft
    const width = container.clientWidth
    if (width > 0) {
      const slideIndex = Math.round(scrollLeft / width)
      setActiveSlideIndex(slideIndex)
    }
  }

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth
      scrollRef.current.scrollTo({
        left: index * width,
        behavior: 'smooth'
      })
      setActiveSlideIndex(index)
    }
  }

const onboardingSlides = [
    {
      illust: '/onboarding-illust-1.png',
      title: 'จัดการร้านได้ในที่เดียว',
      description: 'รับออเดอร์ จัดการเมนู และติดตามสถานะการเตรียมสินค้าได้อย่างเป็นระบบ',
      primaryText: 'เริ่มต้นใช้งาน',
      secondaryText: 'ข้าม',
      onPrimary: () => scrollToSlide(1),
      onSecondary: () => scrollToSlide(3)
    },
    {
      illust: '/onboarding-illust-2.png',
      title: 'เห็นสต็อกและยอดขายแบบเรียลไทม์',
      description: 'ตรวจสอบสินค้าใกล้หมด และดูรายงานยอดขายได้ทันที',
      primaryText: 'ถัดไป',
      secondaryText: 'ข้าม',
      onPrimary: () => scrollToSlide(2),
      onSecondary: () => scrollToSlide(3)
    },
    {
      illust: '/onboarding-illust-3.png',
      title: 'ชำระเงินได้หลากหลายช่องทาง',
      description: 'รองรับเงินสด บัตร และ QR พร้อมสรุปยอดในขั้นตอนเดียว',
      primaryText: 'เริ่มต้นใช้งาน',
      secondaryText: 'ย้อนกลับ',
      onPrimary: () => scrollToSlide(3),
      onSecondary: () => scrollToSlide(1)
    }
  ]

  const renderOnboardingContent = (isMockup = false) => (
    <div className="w-full h-full bg-white relative flex flex-col justify-between text-zinc-800">
      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full"
      >
        {onboardingSlides.map((slide, idx) => (
          <div key={idx} className="w-full h-full shrink-0 snap-start flex flex-col justify-between p-6 pb-8 bg-white overflow-y-auto">
            {/* Top Logo */}
            <div className="pt-4 flex justify-center shrink-0">
              <img src="/logo-red.png" alt="RUSH UP Logo" className="h-16 w-auto object-contain" />
            </div>

            {/* Center Illustration */}
            <div className="flex-1 flex items-center justify-center py-4 shrink-0 min-h-[220px]">
              <img 
                src={slide.illust} 
                alt={slide.title} 
                className="w-full max-w-[280px] sm:max-w-[340px] h-auto object-contain mx-auto" 
              />
            </div>

            {/* Bottom Content Area */}
            <div className="w-full max-w-md mx-auto flex flex-col items-center shrink-0">
              {/* Text Info */}
              <h2 className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight text-center mb-2">
                {slide.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-semibold leading-relaxed text-center max-w-[280px] sm:max-w-sm mb-6">
                {slide.description}
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 mb-6 px-4">
                <button
                  type="button"
                  onClick={slide.onPrimary}
                  className="w-full bg-[#C62229] hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-500/10 text-xs active:scale-98 transition-all duration-150"
                >
                  {slide.primaryText}
                </button>
                <button
                  type="button"
                  onClick={slide.onSecondary}
                  className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-2xl border border-zinc-200 text-xs active:scale-98 transition-all duration-150"
                >
                  {slide.secondaryText}
                </button>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => scrollToSlide(dotIdx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === dotIdx ? 'w-5 bg-[#C62229]' : 'w-2 bg-zinc-200'}`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Slide 4 (Index 3): Login/Register Form */}
        <div className="w-full h-full shrink-0 snap-start bg-zinc-50/50 flex flex-col justify-center items-center p-6 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-zinc-200/60 shadow-xl shadow-zinc-100/50 p-6 md:p-8">
            {renderLoginForm()}
          </div>
        </div>
      </div>
    </div>
  )

  const renderLoginForm = () => (
    <div className="w-full flex flex-col justify-center animate-fade-in">
      {/* Logo Header */}
      <div className="flex flex-col items-center mb-6 shrink-0">
        <img src="/logo-red.png" alt="RUSH UP Logo" className="h-14 w-auto object-contain mb-1" />
        <span className="text-[10px] font-bold text-zinc-450 tracking-[0.2em] uppercase leading-none">POS</span>
      </div>

      {/* Title & Subtitle */}
      <div className="text-center mb-6 shrink-0">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mb-1">เข้าสู่ระบบ POS</h2>
        <p className="text-zinc-400 text-[11px] font-semibold">จัดการร้านของคุณได้ทุกวัน</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-[#C62229] text-xs text-red-800 font-semibold rounded-r-xl text-left">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email or Staff Code Field */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            อีเมลหรือรหัสพนักงาน
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              required
              placeholder="อีเมลหรือรหัสพนักงาน"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-450"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            รหัสผ่าน
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="รหัสผ่าน"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-455"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-zinc-650 transition-colors shrink-0"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C62229] hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-500/10 text-xs active:scale-98 transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'เข้าสู่ระบบ'}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              alert('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน');
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-[#C62229] transition-colors"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center border-t border-zinc-100 pt-4">
        <p className="text-xs text-zinc-500 font-semibold">
          ยังไม่มีบัญชีร้านค้า?{' '}
          <Link
            href="/register"
            className="text-[#C62229] font-bold hover:underline"
          >
            สมัครใช้งาน
          </Link>
        </p>
      </div>
    </div>
  )

  const renderRegisterForm = () => (
    <div className="w-full flex flex-col justify-center animate-fade-in">
      {/* Logo Header */}
      <div className="flex flex-col items-center mb-6 shrink-0">
        <img src="/logo-red.png" alt="RUSH UP Logo" className="h-14 w-auto object-contain mb-1" />
        <span className="text-[10px] font-bold text-zinc-450 tracking-[0.2em] uppercase leading-none">POS</span>
      </div>

      {/* Title & Subtitle */}
      <div className="text-center mb-6 shrink-0">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mb-1">สร้างบัญชีร้านค้า</h2>
        <p className="text-zinc-400 text-[11px] font-semibold">เริ่มจัดการร้านของคุณวันนี้</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-[#C62229] text-xs text-red-800 font-semibold rounded-r-xl text-left">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3.5">
        {/* ชื่อร้านค้า */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            ชื่อร้านค้า
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <Store className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="ชื่อร้านค้า"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* ชื่อผู้ติดต่อ */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            ชื่อผู้ติดต่อ
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="ชื่อผู้ติดต่อ"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* อีเมล */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            อีเมล
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="อีเมล"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            เบอร์โทรศัพท์
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="เบอร์โทรศัพท์"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* ตั้งรหัสผ่าน */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            ตั้งรหัสผ่าน
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-300 focus-within:bg-white rounded-xl transition-all duration-200">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="ตั้งรหัสผ่าน"
              className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 outline-none text-zinc-800 placeholder-zinc-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-zinc-650 transition-colors shrink-0"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 text-left py-1 animate-fade-in">
          <input
            id="accept-terms"
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-[#C62229] focus:ring-[#C62229]"
          />
          <label htmlFor="accept-terms" className="text-xs text-zinc-500 font-semibold select-none cursor-pointer">
            ฉันยอมรับ <span className="text-[#C62229] underline">ข้อกำหนดและเงื่อนไข</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C62229] hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-500/10 text-xs active:scale-98 transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'สร้างบัญชี'}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center border-t border-zinc-100 pt-4">
        <p className="text-xs text-zinc-500 font-semibold">
          มีบัญชีแล้ว?{' '}
          <button
            type="button"
            onClick={() => {
              setError('');
              setAuthMode('login');
            }}
            className="text-[#C62229] font-bold hover:underline"
          >
            เข้าสู่ระบบ
          </button>
        </p>
      </div>
    </div>
  )

  return (
    <PublicRoute>
      <div className="h-[100dvh] w-full bg-white relative z-40 flex flex-col justify-between overflow-hidden">
        {renderOnboardingContent(false)}
      </div>
    </PublicRoute>
  )
}
