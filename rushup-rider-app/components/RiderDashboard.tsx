'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Navigation, Phone, MapPin, CheckCircle2, MessageSquare, Shield,
  Clock, Wallet, History, Power, User, X, Camera, ChevronRight, Loader2, RefreshCcw, ChevronDown,
  BarChart3, Award, Settings, Bell, HelpCircle, UserPlus, FileText, Smartphone, AlertCircle, Copy, Check
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface RiderDashboardProps {
  profile: any
}

export default function RiderDashboard({ profile }: RiderDashboardProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('active')
  const [activeView, setActiveView] = useState<string>('home') // home, kyc, earnings, analytics, incentives, wallet, withdraw, tier, profile, settings, smart_notify, notifications, help_center, referral, dispatch
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)

  // Status & loader states
  const [isOnline, setIsOnline] = useState(profile?.is_active ?? false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPrototypeSelector, setShowPrototypeSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Data lists
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  const [earningsToday, setEarningsToday] = useState(0)
  const [branchNames, setBranchNames] = useState<Record<string, string>>({})

  // Form & Interaction states
  const [copiedCode, setCopiedCode] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Settings states
  const [notifySound, setNotifySound] = useState(true)
  const [notifyVibrate, setNotifyVibrate] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)
  const [stackJobs, setStackJobs] = useState(true)
  const [defaultNavMap, setDefaultNavMap] = useState('google')

  // Payment/Complete Modal States
  const [completeModalJob, setCompleteModalJob] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null)
  const [cashReceived, setCashReceived] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('')
  const [isCompleting, setIsCompleting] = useState(false)

  // Toggle online/offline status in Supabase
  const handleToggleStatus = async (status: boolean) => {
    setIsOnline(status)
    setShowStatusDropdown(false)
    try {
      await supabase.from('profiles').update({ is_active: status }).eq('id', profile.id)
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  // Load jobs from Supabase
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch available jobs
      const { data: availData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('order_type', 'delivery')
        .is('staff_id', null)
        .in('status', ['paid', 'accepted'])
        .order('created_at', { ascending: false })

      if (availData) setAvailableJobs(availData)

      // 2. Fetch my active jobs
      const { data: actData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('staff_id', profile.id)
        .in('status', ['preparing', 'shipping', 'out_for_delivery'])
        .order('created_at', { ascending: false })

      if (actData) {
        setActiveJobs(actData)
        const branchIds = actData.map(j => j.branch_id).filter(Boolean)
        if (branchIds.length > 0) {
          const { data: branches } = await supabase
            .from('branches')
            .select('id, name')
            .in('id', branchIds)
          
          if (branches) {
            const nameMap: Record<string, string> = {}
            branches.forEach((b: any) => {
              nameMap[b.id] = b.name
            })
            setBranchNames(prev => ({ ...prev, ...nameMap }))
          }
        }
      }

      // 3. Fetch completed history
      const { data: histData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('staff_id', profile.id)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })

      if (histData) {
        setHistoryJobs(histData)
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        
        const todayCompleted = histData.filter((job: any) => {
          const completedDate = new Date(job.paid_at || job.created_at)
          return completedDate >= startOfDay
        })

        const totalEarned = todayCompleted.reduce((sum: number, job: any) => sum + Number(job.delivery_fee || 0), 0)
        setEarningsToday(totalEarned)
      }
    } catch (err) {
      console.error('Failed to load jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const channel = supabase
      .channel('rider-dashboard-updates-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_orders' }, () => {
        fetchJobs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Lock unverified riders to the Onboarding & KYC screen
  useEffect(() => {
    if (profile && profile.is_verified === false) {
      setActiveView('kyc')
    }
  }, [profile])

  // Claim Order (Accept Job)
  const handleClaimJob = async (orderId: string) => {
    setIsLoading(true)
    try {
      await supabase
        .from('pos_orders')
        .update({ 
          staff_id: profile.id,
          status: 'preparing'
        })
        .eq('id', orderId)
      
      fetchJobs()
      setActiveTab('active')
      setActiveView('home')
    } catch (err) {
      console.error('Failed to claim order:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Picked up food from restaurant
  const handlePickedUp = async (orderId: string) => {
    setIsLoading(true)
    try {
      await supabase
        .from('pos_orders')
        .update({ status: 'shipping' })
        .eq('id', orderId)
      
      fetchJobs()
    } catch (err) {
      console.error('Failed to mark picked up:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `rider_proof_${Date.now()}.${fileExt}`
      const filePath = `proofs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pos_menu_images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('pos_menu_images')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        setProofPhotoUrl(data.publicUrl)
      }
    } catch (err) {
      console.error('Failed to upload proof:', err)
      alert('อัปโหลดรูปล้มเหลว')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Complete Order
  const handleCompleteDelivery = async () => {
    if (!completeModalJob || isCompleting) return
    setIsCompleting(true)

    const orderTotal = Number(completeModalJob.net_total || completeModalJob.total_amount || 0)
    const numCashReceived = Number(cashReceived) || 0
    const cashChange = Math.max(0, numCashReceived - orderTotal)

    if (paymentMethod === 'cash' && numCashReceived > 0 && numCashReceived < orderTotal) {
      alert('ยอดเงินที่รับมาน้อยกว่ายอดชำระจริง')
      setIsCompleting(false)
      return
    }

    try {
      await supabase.from('pos_order_payments').insert({
        order_id: completeModalJob.id,
        payment_method: paymentMethod || 'transfer',
        amount: orderTotal,
        received_amount: paymentMethod === 'cash' ? numCashReceived : orderTotal,
        change_amount: paymentMethod === 'cash' ? cashChange : 0,
        status: 'paid'
      })

      const updatePayload: any = {
        status: 'completed',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString()
      }

      if (proofPhotoUrl) {
        updatePayload.customer_image = proofPhotoUrl
      }

      await supabase
        .from('pos_orders')
        .update(updatePayload)
        .eq('id', completeModalJob.id)

      setCompleteModalJob(null)
      setPaymentMethod(null)
      setCashReceived('')
      setProofPhotoUrl('')
      
      fetchJobs()
      setActiveView('home')
    } catch (err) {
      console.error('Failed to complete delivery:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const openMaps = (job: any) => {
    const lat = job.delivery_latitude
    const lng = job.delivery_longitude
    const url = lat && lng 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.delivery_address || '')}`
    window.open(url, '_blank')
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText('RIDER-999')
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalAmount || !selectedBank) return
    setIsWithdrawing(true)
    setTimeout(() => {
      setIsWithdrawing(false)
      alert('ยื่นคำขอถอนเงินสำเร็จ! ยอดเงินจะเข้าบัญชีภายใน 24 ชม.')
      setWithdrawalAmount('')
      setSelectedBank('')
      setActiveView('wallet')
    }, 1500)
  }

  // List of all 22 screens in the design library
  const designScreens = [
    { id: 'home', label: '04 Home Dashboard', category: 'Main' },
    { id: 'available', label: '04 Available Jobs (งานใหม่)', category: 'Main' },
    { id: 'order_details_preparing', label: '05 Live Order & Pick Up', category: 'Active Order' },
    { id: 'order_details_shipping', label: '06 Active Delivery Details', category: 'Active Order' },
    { id: 'dispatch', label: '22 Dispatch & Map Route', category: 'Active Order' },
    { id: 'kyc', label: '03 Onboarding & KYC (ยืนยันตน)', category: 'KYC & Account' },
    { id: 'profile', label: '15 Profile Settings (ข้อมูลโปรไฟล์)', category: 'KYC & Account' },
    { id: 'tier', label: '14 Rider Tier & Quality Rating', category: 'KYC & Account' },
    { id: 'history', label: '07 Trip History & Receipts', category: 'Earnings & Logs' },
    { id: 'earnings', label: '08 Earnings History Charts', category: 'Earnings & Logs' },
    { id: 'daily_earnings', label: '09 Daily Earnings Dashboard', category: 'Earnings & Logs' },
    { id: 'analytics', label: '10 Weekly Analytics Report', category: 'Earnings & Logs' },
    { id: 'incentives', label: '11 Bonus & Target Incentives', category: 'Earnings & Logs' },
    { id: 'wallet', label: '12 Wallet & Payout Balance', category: 'Earnings & Logs' },
    { id: 'withdraw', label: '13 Payout & Payout Form', category: 'Earnings & Logs' },
    { id: 'settings', label: '16 General Settings & Maps', category: 'Preferences' },
    { id: 'smart_notify', label: '17 Smart Sound & Auto-Accept', category: 'Preferences' },
    { id: 'notifications', label: '18 System Inbox & Alerts', category: 'Support' },
    { id: 'help_center', label: '19 Help Center & Support Hotline', category: 'Support' },
    { id: 'referral', label: '21 Referral & Invite Perks', category: 'Support' },
  ]

  // Render Red Curved Header Banner common in designs
  const renderRedHeader = (title: string, subtitle?: string) => (
    <div className="bg-[#C62229] pt-8 pb-14 rounded-b-[32px] px-6 text-white relative z-0 shrink-0 select-none">
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
      {subtitle && <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-1">{subtitle}</p>}
    </div>
  )

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-zinc-900 flex flex-col font-sans max-w-md mx-auto relative overflow-hidden border-x border-zinc-200 shadow-2xl pb-10">
      
      {/* 📱 TOP HEADER (Rendered on Home, Available, Order Details views) */}
      {!['kyc', 'profile', 'tier', 'history', 'earnings', 'daily_earnings', 'analytics', 'incentives', 'wallet', 'withdraw', 'settings', 'smart_notify', 'notifications', 'help_center', 'referral', 'dispatch'].includes(activeView) && (
        <header className="bg-white px-5 py-4 border-b border-zinc-100 shrink-0 flex items-center justify-between z-30 shadow-sm select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              <img src="/logo.png" alt="RUSH UP" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#1A1A18] tracking-tight leading-none mb-0.5">RUSH UP RIDER</h1>
            </div>
          </div>

          {/* Stateful Dropdown status */}
          <div className="relative">
            <button 
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-black text-zinc-650 hover:bg-zinc-50 transition-all"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              {isOnline ? 'พร้อมรับงาน' : 'พักรับงาน'}
              <ChevronDown size={14} className="text-zinc-400" />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowStatusDropdown(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-36 bg-white border border-zinc-150 rounded-2xl shadow-xl z-30 overflow-hidden py-1"
                  >
                    <button onClick={() => handleToggleStatus(true)} className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-zinc-50 flex items-center gap-2 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมรับงาน
                    </button>
                    <button onClick={() => handleToggleStatus(false)} className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-zinc-50 flex items-center gap-2 text-zinc-500">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span> พักรับงาน
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>
      )}

      {/* 📋 STATE ROUTED MAIN VIEWS */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* ================================================================= */}
          {/* 🟢 VIEW: HOME (04 Home Dashboard / Available List Toggle) */}
          {/* ================================================================= */}
          {activeView === 'home' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
              
              {/* Home Dashboard Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 shrink-0">
                <div className="bg-white p-3 rounded-2xl border border-zinc-150 shadow-sm text-center">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">งานวันนี้</p>
                  <p className="text-base font-black text-zinc-900">12 งาน</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-zinc-150 shadow-sm text-center">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">ระยะทาง</p>
                  <p className="text-base font-black text-zinc-900">42.5 KM</p>
                </div>
                <div className="bg-[#C62229]/5 border border-[#C62229]/20 p-3 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-[#C62229] uppercase tracking-wider mb-0.5">รายได้สะสม</p>
                  <p className="text-base font-black text-[#C62229]">฿{earningsToday}</p>
                </div>
              </div>

              {/* Active Jobs Grid / Alerts */}
              <div className="px-4 pb-4 space-y-4 flex-1">
                {activeJobs.length > 0 ? (
                  activeJobs.map((job) => (
                    <div 
                      key={job.id} 
                      onClick={() => setActiveView(job.status === 'preparing' ? 'order_details_preparing' : 'order_details_shipping')}
                      className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-md flex justify-between items-center cursor-pointer hover:border-[#C62229] transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-[#C62229] uppercase tracking-widest">งานปัจจุบัน</span>
                          <span className="text-[10px] font-bold text-zinc-400">#{job.order_number}</span>
                        </div>
                        <h4 className="text-base font-black text-zinc-900">{job.customer_name || 'ลูกค้า'}</h4>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                          {job.status === 'preparing' ? 'ร้านค้ากำลังเตรียมอาหาร • รับอาหารที่เคาน์เตอร์' : 'อาหารกำลังนำส่งอาหารให้ลูกค้า'}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-[#C62229]" />
                    </div>
                  ))
                ) : (
                  <div className="py-12 bg-white border border-zinc-150 rounded-3xl text-center text-zinc-400 shadow-sm">
                    <Clock className="w-12 h-12 mx-auto opacity-15 mb-3 text-zinc-900" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">ไม่มีงานนำส่งที่ค้างอยู่</p>
                    <p className="text-[10px] text-zinc-500 mt-1">สลับแถบเมนูเพื่อเลือกรับงานใหม่</p>
                  </div>
                )}

                {/* Available Jobs Card shortcut */}
                <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">งานจัดส่งใหม่ในระบบ ({availableJobs.length})</h3>
                    <button onClick={fetchJobs} className="text-zinc-400 hover:text-zinc-600">
                      <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {availableJobs.slice(0, 2).map((job) => (
                    <div key={job.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400">#{job.order_number}</span>
                        <h4 className="text-xs font-black text-zinc-900 truncate max-w-[200px]">{job.customer_name || 'ลูกค้า'}</h4>
                        <p className="text-[10px] text-zinc-550 truncate max-w-[200px] mt-0.5">{job.delivery_address}</p>
                      </div>
                      <button 
                        onClick={() => handleClaimJob(job.id)}
                        className="bg-[#C62229] hover:bg-red-700 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all"
                      >
                        รับงาน
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setActiveTab('available')}
                    className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-[10px] font-black uppercase text-zinc-650 tracking-wider text-center block transition-all"
                  >
                    ดูรายการงานว่างทั้งหมด
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: ORDER DETAILS PREPARING (05 Live Order & Pick Up) */}
          {/* ================================================================= */}
          {activeView === 'order_details_preparing' && activeJobs[0] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
              {/* Map visual section */}
              <div className="relative h-[240px] w-full bg-[#E5E9E6] shrink-0 border-b border-zinc-150">
                <svg className="w-full h-full" viewBox="0 0 400 240" fill="none">
                  <rect width="400" height="240" fill="#E4ECE7" />
                  <path d="M-20,110 L420,110" stroke="#FFFFFF" strokeWidth="36" />
                  <path d="M120,-20 L120,260" stroke="#FFFFFF" strokeWidth="32" />
                  <path d="M310,-20 L310,260" stroke="#FFFFFF" strokeWidth="28" />
                  <path d="M-20,200 L420,170" stroke="#FFFFFF" strokeWidth="26" />
                  <path d="M 75,110 L 160,185 L 310,180" stroke="#C62229" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <g transform="translate(75, 110)">
                    <circle cx="0" cy="0" r="16" fill="#243342" stroke="white" strokeWidth="2.5" />
                    <path d="M-5,3 V-2 L0,-6 L5,-2 V3 H2 V0 H-2 V3 H-5Z" fill="white" />
                  </g>
                  <g transform="translate(160, 185)">
                    <circle cx="0" cy="0" r="15" fill="#C62229" stroke="white" strokeWidth="2.5" />
                    <path d="M-6,3 A 2,2 0 1,1 -6,-1 A 2,2 0 1,1 -6,3 M6,3 A 2,2 0 1,1 6,-1 A 2,2 0 1,1 6,3 M-6,1 L-2,-3 L2,-3 L6,1 M-2,-3 L-4,1 M2,-3 L0,1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </g>
                </svg>
                <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-xl shadow-md border border-zinc-150 text-[9px] font-black uppercase tracking-widest text-zinc-550">
                  NEXT • 0.8 KM
                </div>
                <button onClick={() => openMaps(activeJobs[0])} className="absolute top-4 right-4 w-10 h-10 bg-white border border-zinc-150 rounded-xl shadow-md flex items-center justify-center text-[#1A1A18] active:scale-95 transition-transform">
                  <Navigation size={18} className="rotate-45" />
                </button>
              </div>

              {/* Bottom detail card */}
              <div className="bg-white p-6 border-t border-zinc-100 flex flex-col flex-1 justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-zinc-450 uppercase mb-1">
                        #{activeJobs[0].order_number.replace('#', '#RU-')} • 0.8 KM • 08 MIN
                      </p>
                      <h2 className="text-xl font-black text-[#1A1A18] tracking-tight">ไปรับอาหารที่ร้าน</h2>
                      <p className="text-xs font-bold text-zinc-450 mt-1">{branchNames[activeJobs[0].branch_id] || 'ครัวบ้านตา'} • รับที่เคาน์เตอร์</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest mb-1 leading-none">EARNING</p>
                      <p className="text-2xl font-black text-zinc-900 leading-none">฿{activeJobs[0].delivery_fee || 0}</p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 my-4" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-zinc-450 tracking-widest uppercase">STATUS</span>
                    <span className="font-black flex items-center gap-1.5 text-[#C62229]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C62229] animate-pulse"></span> กำลังไปรับ
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-4" />

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a href={`tel:${activeJobs[0].branch_phone || '02xxxxxx'}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-black transition-all">
                      <Phone size={14} /> โทรหาร้าน
                    </a>
                    <button onClick={() => alert('แชทยังไม่เปิดใช้งาน')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-black transition-all">
                      <MessageSquare size={14} /> แชตร้าน
                    </button>
                  </div>
                </div>

                <button onClick={() => handlePickedUp(activeJobs[0].id)} className="mt-6 w-full h-12 bg-[#C62229] hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> รับอาหารแล้ว (เริ่มนำส่ง)
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: ORDER DETAILS SHIPPING (06 Active Delivery Details) */}
          {/* ================================================================= */}
          {activeView === 'order_details_shipping' && activeJobs[0] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
              {/* Map visual section */}
              <div className="relative h-[240px] w-full bg-[#E5E9E6] shrink-0 border-b border-zinc-150">
                <svg className="w-full h-full" viewBox="0 0 400 240" fill="none">
                  <rect width="400" height="240" fill="#E4ECE7" />
                  <path d="M-20,110 L420,110" stroke="#FFFFFF" strokeWidth="36" />
                  <path d="M120,-20 L120,260" stroke="#FFFFFF" strokeWidth="32" />
                  <path d="M310,-20 L310,260" stroke="#FFFFFF" strokeWidth="28" />
                  <path d="M-20,200 L420,170" stroke="#FFFFFF" strokeWidth="26" />
                  <path d="M 160,185 L 310,180" stroke="#C62229" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <g transform="translate(160, 185)">
                    <circle cx="0" cy="0" r="15" fill="#C62229" stroke="white" strokeWidth="2.5" />
                    <path d="M-6,3 A 2,2 0 1,1 -6,-1 A 2,2 0 1,1 -6,3 M6,3 A 2,2 0 1,1 6,-1 A 2,2 0 1,1 6,3 M-6,1 L-2,-3 L2,-3 L6,1 M-2,-3 L-4,1 M2,-3 L0,1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </g>
                  <g transform="translate(310, 180)">
                    <circle cx="0" cy="0" r="14" fill="#C62229" stroke="white" strokeWidth="2.5" />
                    <path d="M0,-5 C-2.2,-5 -4,-3.2 -4,-1 C-4,1.8 0,6 0,6 C0,6 4,1.8 4,-1 C4,-3.2 2.2,-5 0,-5 Z M0,-2 C-0.5,-2 -1,-1.5 -1,-1 C-1,-0.5 -0.5,0 0,0 C0.5,0 1,-0.5 1,-1 C1,-1.5 0.5,-2 0,-2 Z" fill="white" />
                  </g>
                </svg>
                <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-xl shadow-md border border-zinc-150 text-[9px] font-black uppercase tracking-widest text-zinc-550">
                  NEXT • 1.2 KM
                </div>
                <button onClick={() => openMaps(activeJobs[0])} className="absolute top-4 right-4 w-10 h-10 bg-white border border-zinc-150 rounded-xl shadow-md flex items-center justify-center text-[#1A1A18] active:scale-95 transition-transform">
                  <Navigation size={18} className="rotate-45" />
                </button>
              </div>

              {/* Bottom detail card */}
              <div className="bg-white p-6 border-t border-zinc-100 flex flex-col flex-1 justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-zinc-450 uppercase mb-1">
                        #{activeJobs[0].order_number.replace('#', '#RU-')} • 1.2 KM • 10 MIN
                      </p>
                      <h2 className="text-xl font-black text-[#1A1A18] tracking-tight">ไปส่งอาหารให้ลูกค้า</h2>
                      <p className="text-xs font-bold text-zinc-450 mt-1">{activeJobs[0].customer_name || 'ลูกค้า'} • {activeJobs[0].delivery_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest mb-1 leading-none">EARNING</p>
                      <p className="text-2xl font-black text-zinc-900 leading-none">฿{activeJobs[0].delivery_fee || 0}</p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 my-4" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-zinc-450 tracking-widest uppercase">STATUS</span>
                    <span className="font-black flex items-center gap-1.5 text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> กำลังไปส่ง
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-4" />

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a href={activeJobs[0].reference_name ? `tel:${activeJobs[0].reference_name}` : '#'} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-black transition-all">
                      <Phone size={14} /> โทรหาลูกค้า
                    </a>
                    <button onClick={() => alert('แชทยังไม่เปิดใช้งาน')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-black transition-all">
                      <MessageSquare size={14} /> แชตลูกค้า
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setProofPhotoUrl('')
                    setPaymentMethod(null)
                    setCashReceived('')
                    setCompleteModalJob(activeJobs[0])
                  }} 
                  className="mt-6 w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> ส่งอาหารสำเร็จ (ปิดงาน)
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: ONBOARDING & KYC (03 Onboarding & KYC) */}
          {/* ================================================================= */}
          {activeView === 'kyc' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("ยืนยันตัวตน (KYC)", "RUSH UP RIDER ONBOARDING")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                {profile?.is_verified === false ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-pulse">
                    <AlertCircle className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <h4 className="text-xs font-black text-amber-800">รอดำเนินการอนุมัติบัญชี</h4>
                      <p className="text-[10px] text-amber-600 mt-0.5">เอกสารของท่านอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ (24-48 ชม.)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                    <div>
                      <h4 className="text-xs font-black text-emerald-800">ยืนยันตัวตนเรียบร้อยแล้ว</h4>
                      <p className="text-[10px] text-emerald-600 mt-0.5">บัญชีของคุณผ่านการตรวจสอบและพร้อมรับงานจัดส่งอาหารแล้ว</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">รายการตรวจสอบเอกสาร</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">บัตรประชาชนตัวจริง (ID Card)</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">ดึงข้อมูลและพิกัดใบหน้าสำเร็จ</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Approved</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">ใบอนุญาตขับขี่ (Driver's License)</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">เอกสารไม่หมดอายุ</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Approved</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">สำเนาทะเบียนรถ & ข้อมูลยานพาหนะ</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">
                        {profile?.is_verified === false ? 'กำลังตรวจสอบทะเบียนเล่มรถ' : 'ตรวจสอบสิทธิ์สำเร็จ'}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${profile?.is_verified === false ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                      {profile?.is_verified === false ? 'In Review' : 'Approved'}
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">บัญชีธนาคารรับเงิน (Bookbank)</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">เชื่อมโยงพร้อมโอนค่ารอบอัตโนมัติ</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Approved</span>
                  </div>
                </div>

                {profile?.is_verified === false ? (
                  <button 
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }} 
                    className="w-full py-4 bg-zinc-800 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center"
                  >
                    ออกจากระบบ (Sign Out)
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveView('home')} 
                    className="w-full py-4 bg-[#C62229] hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center"
                  >
                    กลับสู่หน้าแดชบอร์ดหลัก
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: TRIP HISTORY & RECEIPTS (07 Trip History & Receipts) */}
          {/* ================================================================= */}
          {activeView === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("ประวัติงานเดลิเวอรี่", "TRIP HISTORY LOGS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-4 flex-1">
                {historyJobs.length === 0 ? (
                  <div className="py-20 text-center text-zinc-400">
                    <History className="w-12 h-12 mx-auto opacity-15 mb-3 text-[#1A1A18]" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">ยังไม่มีประวัติการส่งอาหารของคุณ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">คลิกออเดอร์เพื่อดูสลิปใบเสร็จ</span>
                    {historyJobs.map((job) => (
                      <div 
                        key={job.id} 
                        onClick={() => setSelectedReceipt(job)}
                        className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-150 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">#{job.order_number.replace('#', '#RU-')}</p>
                          <h4 className="text-sm font-black text-zinc-900">{job.customer_name || 'ลูกค้า'}</h4>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {new Date(job.paid_at || job.created_at).toLocaleDateString('th-TH')} • {new Date(job.paid_at || job.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[#C62229] font-black text-sm block">+฿{job.delivery_fee || 0}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">{job.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Receipt Modal */}
              <AnimatePresence>
                {selectedReceipt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-zinc-150 rounded-3xl p-6 w-full max-w-sm flex flex-col text-zinc-900 shadow-2xl relative">
                      <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
                        <X size={20} />
                      </button>
                      <div className="text-center border-b border-zinc-100 pb-4 mb-4">
                        <h4 className="text-base font-black uppercase text-[#C62229] tracking-wider">RUSH UP RIDER</h4>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Receipt / สลิปประวัติงาน</p>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-zinc-500">เลขที่ออเดอร์</span><span className="font-bold text-zinc-800">{selectedReceipt.order_number.replace('#', '#RU-')}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">ร้านอาหาร</span><span className="font-bold text-zinc-800">{branchNames[selectedReceipt.branch_id] || 'ครัวบ้านตา'}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">ลูกค้าผู้รับ</span><span className="font-bold text-zinc-800">{selectedReceipt.customer_name || 'ลูกค้า'}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">การชำระเงิน</span><span className="font-bold text-zinc-800">{selectedReceipt.payment_method === 'cash' ? 'เงินสด (COD)' : 'โอนผ่านระบบ'}</span></div>
                        <div className="h-px bg-zinc-100 my-2" />
                        <div className="flex justify-between text-sm font-black"><span className="text-zinc-900">ค่ารอบการจัดส่ง</span><span className="text-[#C62229]">฿{selectedReceipt.delivery_fee || 0}</span></div>
                      </div>
                      <button onClick={() => setSelectedReceipt(null)} className="mt-6 w-full py-3 bg-zinc-900 hover:bg-black text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all">
                        ปิดหน้าจอนี้
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: EARNINGS & GRAPHS (08/09 Earnings History & Daily Earnings) */}
          {/* ================================================================= */}
          {activeView === 'earnings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("รายได้ของฉัน", "EARNINGS HISTORY")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Weekly Total */}
                <div className="text-center py-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">รายได้รวมสัปดาห์นี้</span>
                  <h3 className="text-3xl font-black text-[#1A1A18] mt-1">฿3,240</h3>
                </div>

                {/* Pure CSS Bar Chart (NO External Libraries) */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">สถิติรายได้รายวัน (จ. - อา.)</span>
                  <div className="h-36 flex items-end justify-between px-2 pt-6 border-b border-zinc-150 shrink-0 select-none">
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-zinc-200 rounded-t-sm h-[30px]"></div><span className="text-[8px] font-bold text-zinc-400">จ.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-zinc-200 rounded-t-sm h-[45px]"></div><span className="text-[8px] font-bold text-zinc-400">อ.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-zinc-200 rounded-t-sm h-[20px]"></div><span className="text-[8px] font-bold text-zinc-400">พ.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-zinc-200 rounded-t-sm h-[60px]"></div><span className="text-[8px] font-bold text-zinc-400">พฤ.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-[#C62229] rounded-t-sm h-[80px]"></div><span className="text-[8px] font-black text-[#C62229]">ศ.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-[#C62229] rounded-t-sm h-[95px]"></div><span className="text-[8px] font-black text-[#C62229]">ส.</span></div>
                    <div className="flex flex-col items-center gap-1.5 w-8"><div className="w-4 bg-zinc-200 rounded-t-sm h-[50px]"></div><span className="text-[8px] font-bold text-zinc-400">อา.</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => setActiveView('daily_earnings')} className="py-3 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-[10px] font-black uppercase text-zinc-700 tracking-wider text-center transition-all">
                    ดูสรุปรายได้รายวัน
                  </button>
                  <button onClick={() => setActiveView('wallet')} className="py-3 bg-[#C62229] hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all">
                    เข้าสู่กระเป๋าเงิน
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: DAILY EARNINGS (09 Daily Earnings Dashboard) */}
          {/* ================================================================= */}
          {activeView === 'daily_earnings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("รายได้รายวันวันนี้", "DAILY INCOME REPORT")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">การแตกสัดส่วนรายได้วันนี้</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">ค่ารอบการจัดส่งอาหาร</span>
                    <span className="text-sm font-black text-zinc-900">฿{earningsToday}</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">ค่าทิปพิเศษจากลูกค้า</span>
                    <span className="text-sm font-black text-zinc-900">฿80</span>
                  </div>

                  <div className="p-4 bg-[#C62229]/5 border border-[#C62229]/20 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-black text-[#C62229]">เงินรางวัลภารกิจพิเศษ (โบนัส)</span>
                    <span className="text-sm font-black text-[#C62229]">฿120</span>
                  </div>

                  <div className="h-px bg-zinc-150 my-4" />
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-black text-[#1A1A18] uppercase tracking-wider">รายรับสุทธิทั้งหมด</span>
                    <span className="text-2xl font-black text-[#C62229]">฿{earningsToday + 80 + 120}</span>
                  </div>
                </div>

                <button onClick={() => setActiveView('earnings')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  ย้อนกลับหน้ายอดสะสม
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: WEEKLY ANALYTICS (10 Weekly Analytics) */}
          {/* ================================================================= */}
          {activeView === 'analytics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("รายงานวิเคราะห์ประจำสัปดาห์", "WEEKLY ANALYTICS & STATS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-5 flex-1">
                
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">อัตราคะแนนและประสิทธิภาพการทำงาน</span>
                  
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-full border-4 border-[#C62229] flex items-center justify-center font-black text-xs text-[#C62229] shrink-0">
                      98%
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-800">อัตราการกดรับงาน (Acceptance Rate)</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">ยอดเยี่ยม • อยู่ในเกณฑ์ระดับ Gold Tier</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-emerald-600 shrink-0">
                      100%
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-800">อัตราการส่งสำเร็จ (Completion Rate)</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">ไม่มีประวัติปฏิเสธงานหรือส่งของตกหล่น</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">เวลาออนไลน์สะสม</p>
                      <h3 className="text-base font-black text-zinc-900">36.5 ชม.</h3>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">ดาวคะแนนเฉลี่ย</p>
                      <h3 className="text-base font-black text-zinc-900">4.9 ★</h3>
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-[#C62229] hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: BONUS & INCENTIVES (11 Bonus & Incentives) */}
          {/* ================================================================= */}
          {activeView === 'incentives' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("โบนัสและอินเซนทีฟ", "REWARDS & INCENTIVE PLANS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Target Progress Card */}
                <div className="p-5 bg-zinc-50 border border-zinc-150 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-zinc-800">เป้าหมายภารกิจจัดส่งประจำวัน</h4>
                    <span className="text-xs font-black text-[#C62229]">8/10 ออเดอร์</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#C62229] h-full" style={{ width: '80%' }}></div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    ส่งงานจัดส่งอาหารอีกเพียง **2 ออเดอร์** วันนี้ เพื่อผ่านเงื่อนไขรับโบนัสเป้าหมายพิเศษมูลค่า **+฿100** ประจำวัน!
                  </p>
                </div>

                {/* Incentive Tiers lists */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">รายการระดับเป้าหมายสะสมรอบสัปดาห์</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">เป้าหมายขั้นที่ 1 (ครบ 30 ออเดอร์/สัปดาห์)</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">รับโบนัสสะสมพิเศษประจำสัปดาห์</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 font-bold">+฿300</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">เป้าหมายขั้นที่ 2 (ครบ 60 ออเดอร์/สัปดาห์)</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">รับโบนัสสะสมพิเศษพนักงานดีเด่น</p>
                    </div>
                    <span className="text-xs font-black text-zinc-500 font-bold">+฿800</span>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: WALLET (12 Wallet & Payouts) */}
          {/* ================================================================= */}
          {activeView === 'wallet' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("กระเป๋าเงินไรเดอร์", "WALLET & PAYOUT BALANCE")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Wallet Balance Card */}
                <div className="p-6 bg-zinc-50 border border-zinc-150 rounded-3xl text-center space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ยอดเงินคงเหลือถอนได้</span>
                  <h2 className="text-3xl font-black text-zinc-900">฿1,840</h2>
                  <p className="text-[9px] text-zinc-500 pt-1">หักยอดชำระขั้นต่ำ 100 บาทคงเหลือในระบบ</p>
                </div>

                {/* Cash on hand Limit */}
                <div className="p-4 bg-[#C62229]/5 border border-[#C62229]/20 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-700">วงเงินสดติดตัว (COD Collected)</span>
                    <span className="font-black text-[#C62229]">฿320 / ฿1,000</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#C62229] h-full" style={{ width: '32%' }}></div>
                  </div>
                  <p className="text-[9px] text-zinc-500">ยอดค้างจ่ายระบบ หากสะสมเกิน 1,000 บาท ระบบรับงานใหม่จะระงับอัตโนมัติ</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => setActiveView('withdraw')} className="py-3.5 bg-[#C62229] hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider text-center transition-all">
                    แจ้งถอนเงินสด
                  </button>
                  <button onClick={() => alert('ฟังก์ชันเชื่อมบัญชีพร้อมใช้งานเร็ว ๆ นี้')} className="py-3.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-2xl text-xs font-black uppercase text-zinc-700 tracking-wider text-center transition-all">
                    ผูกบัญชีธนาคาร
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: WITHDRAWAL FORM (13 Payout & Withdrawal) */}
          {/* ================================================================= */}
          {activeView === 'withdraw' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("แจ้งขอถอนเงินรายได้", "PAYOUT & WITHDRAWAL REQUEST")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-5 flex-1">
                
                <form onSubmit={handleWithdrawRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-450">จำนวนเงินที่ต้องการถอน (ยอดถอนได้สูงสุด ฿1,740)</label>
                    <input 
                      type="number"
                      required
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="ระบุจำนวนยอดเงินถอน..."
                      className="w-full h-12 bg-zinc-50 border border-zinc-200 focus:border-[#C62229] focus:bg-white rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-455">โอนเข้าบัญชีธนาคารปลายทาง</label>
                    <select 
                      required
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full h-12 bg-zinc-50 border border-zinc-200 focus:border-[#C62229] focus:bg-white rounded-xl px-4 text-xs font-bold text-zinc-900 outline-none transition-all"
                    >
                      <option value="">เลือกธนาคารปลายทาง...</option>
                      <option value="kbank">ธนาคารกสิกรไทย (042-x-xxx32-1)</option>
                      <option value="scb">ธนาคารไทยพาณิชย์ (120-x-xxx54-2)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={isWithdrawing}
                    className="w-full h-13 bg-[#C62229] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4"
                  >
                    {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ส่งคำขอถอนเงิน'}
                  </button>
                </form>

                <button onClick={() => setActiveView('wallet')} className="w-full py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-xs font-black uppercase text-zinc-650 tracking-wider text-center transition-all">
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: RIDER TIER (14 Rider Tier & Quality) */}
          {/* ================================================================= */}
          {activeView === 'tier' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("คะแนนความประพฤติ & เลเวล", "RIDER TIER & QUALITY RATINGS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Shiny Gold Tier Card */}
                <div className="p-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border border-amber-300 rounded-3xl text-center text-amber-950 shadow-md space-y-2">
                  <Award size={36} className="mx-auto text-amber-950 animate-bounce" />
                  <h3 className="text-lg font-black uppercase tracking-wider">GOLD TIER RIDER</h3>
                  <p className="text-[10px] font-bold">สิทธิประโยชน์: ได้รับลำดับความสำคัญสูงในการกระจายออเดอร์งาน</p>
                </div>

                {/* Score meters */}
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">สรุปคะแนนประเมินการบริการ</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">คะแนนความประพฤติ (Behavior Score)</span>
                    <span className="text-sm font-black text-zinc-900">100 / 100</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">คะแนนรีวิวจากร้านอาหาร</span>
                    <span className="text-sm font-black text-emerald-600">5.0 / 5.0</span>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">คะแนนรีวิวจากลูกค้า</span>
                    <span className="text-sm font-black text-emerald-600">4.9 / 5.0</span>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: PROFILE SETTINGS (15 Profile Settings) */}
          {/* ================================================================= */}
          {activeView === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("แก้ไขโปรไฟล์ข้อมูล", "EDIT PROFILE SETTINGS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Avatar upload representation */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 relative overflow-hidden group">
                    <User size={36} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-[#C62229] uppercase tracking-widest">กดเพื่อเปลี่ยนรูปภาพ</span>
                </div>

                {/* Profile fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ชื่อผู้ใช้งานที่แสดงในระบบ</span>
                    <input type="text" readOnly value={profile?.display_name || 'Rider'} className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-3 text-xs font-bold text-zinc-500 cursor-not-allowed outline-none" />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">เบอร์โทรศัพท์มือถือติดต่อ</span>
                    <input type="text" readOnly value={profile?.phone || '08xxxxxxxx'} className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-3 text-xs font-bold text-zinc-500 cursor-not-allowed outline-none" />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ข้อมูลยานพาหนะและเลขทะเบียน</span>
                    <input type="text" readOnly value={profile?.address || 'Honda Wave 110i'} className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-3 text-xs font-bold text-zinc-500 cursor-not-allowed outline-none" />
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-[#C62229] hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  บันทึกข้อมูลเรียบร้อย
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: GENERAL SETTINGS (16 Settings & Profile) */}
          {/* ================================================================= */}
          {activeView === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("ตั้งค่าแอปพลิเคชัน", "GENERAL APP SETTINGS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">แอปพลิเคชันนำทางเริ่มต้น (Navigation App)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setDefaultNavMap('google')}
                        className={`py-3.5 rounded-xl border text-xs font-black transition-all ${defaultNavMap === 'google' ? 'bg-[#C62229]/10 border-[#C62229] text-[#C62229]' : 'border-zinc-200 bg-white text-zinc-700'}`}
                      >
                        Google Maps
                      </button>
                      <button 
                        onClick={() => setDefaultNavMap('apple')}
                        className={`py-3.5 rounded-xl border text-xs font-black transition-all ${defaultNavMap === 'apple' ? 'bg-[#C62229]/10 border-[#C62229] text-[#C62229]' : 'border-zinc-200 bg-white text-zinc-700'}`}
                      >
                        Apple Maps
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-150 my-2" />

                  <div className="space-y-2">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ภาษาแสดงผลในแอป (Language)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-3.5 rounded-xl border border-[#C62229] bg-[#C62229]/10 text-[#C62229] text-xs font-black">ภาษาไทย (TH)</button>
                      <button className="py-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-black">English (EN)</button>
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าแดชบอร์ดหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: SMART NOTIFICATIONS (17 Smart Notifications) */}
          {/* ================================================================= */}
          {activeView === 'smart_notify' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("ตั้งค่าการแจ้งเตือนพิเศษ", "SMART NOTIFICATIONS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ตัวเลือกเสียงและระบบอัตโนมัติ</span>

                  <div className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800">เสียงเตือนเมื่อมีงานใหม่เข้ามา</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">เปิดรับเสียงแจ้งเตือนงานเร่งด่วน</p>
                    </div>
                    <input type="checkbox" checked={notifySound} onChange={() => setNotifySound(!notifySound)} className="w-4 h-4 text-[#C62229] rounded" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800">ระบบสั่นเตือนในโทรศัพท์</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">สั่นเมื่ออยู่ในกระเป๋ากางเกง</p>
                    </div>
                    <input type="checkbox" checked={notifyVibrate} onChange={() => setNotifyVibrate(!notifyVibrate)} className="w-4 h-4 text-[#C62229] rounded" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800">การรับงานจัดส่งอัตโนมัติ (Auto-Accept)</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">รับงานใหม่ทันทีโดยไม่ต้องสัมผัสหน้าจอ</p>
                    </div>
                    <input type="checkbox" checked={autoAccept} onChange={() => setAutoAccept(!autoAccept)} className="w-4 h-4 text-[#C62229] rounded" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-[#C62229]/5 border border-[#C62229]/20 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-[#C62229]">เปิดรับออเดอร์ซ้อน (Stack Jobs)</h4>
                      <p className="text-[9px] text-red-500 mt-0.5">อนุญาตให้เสนอสองออเดอร์เพื่อรับรายได้สองต่อ</p>
                    </div>
                    <input type="checkbox" checked={stackJobs} onChange={() => setStackJobs(!stackJobs)} className="w-4 h-4 text-[#C62229] rounded" />
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  บันทึกการตั้งค่า
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: NOTIFICATIONS LIST (18/20 Inbox & News Details) */}
          {/* ================================================================= */}
          {activeView === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader(selectedAnnouncement ? "รายละเอียดประกาศ" : "กล่องข้อความแจ้งเตือน", "PLATFORM INBOX & ALERTS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-4 flex-1">
                
                {selectedAnnouncement ? (
                  // 20: Announcement Detail view
                  <div className="space-y-4">
                    <button onClick={() => setSelectedAnnouncement(null)} className="text-xs font-black text-[#C62229] tracking-wider uppercase flex items-center gap-1">
                      ย้อนกลับหน้าหลัก
                    </button>
                    <h3 className="text-base font-black text-zinc-900 leading-tight">{selectedAnnouncement.title}</h3>
                    <p className="text-[10px] text-zinc-400">{selectedAnnouncement.date}</p>
                    <p className="text-xs text-zinc-650 leading-relaxed pt-2 border-t border-zinc-100">
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                ) : (
                  // 18: Notification List
                  <div className="space-y-3">
                    <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ข่าวสารล่าสุดจากแพลตฟอร์ม RUSH UP</span>
                    
                    <div 
                      onClick={() => setSelectedAnnouncement({
                        title: "ประกาศการปรับค่ารอบในช่วงเทศกาลฝนตกหนัก",
                        date: "19 ส.ค. 2026",
                        content: "เพื่อสนับสนุนและคุ้มครองความปลอดภัยของไรเดอร์ทุกคน แพลตฟอร์ม RUSH UP ขอปรับเพิ่มค่ารอบเริ่มต้นขึ้นอีก +฿10 สำหรับออเดอร์จัดส่งในช่วงเวลาที่ฝนตกหนักโดยจะมีสัญลักษณ์แจ้งเตือนในระบบอัตโนมัติ"
                      })}
                      className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors"
                    >
                      <h4 className="text-xs font-black text-zinc-800 leading-snug">ประกาศการปรับค่ารอบในช่วงเทศกาลฝนตกหนัก</h4>
                      <p className="text-[9px] text-zinc-400 mt-1">19 ส.ค. 2026 • ข่าวสารระบบ</p>
                    </div>

                    <div 
                      onClick={() => setSelectedAnnouncement({
                        title: "อัปเดตระบบถอนเงินเข้าบัญชีพร้อมเพย์ความเร็วสูง",
                        date: "15 ส.ค. 2026",
                        content: "ขณะนี้แอป RUSH UP RIDER ได้พัฒนาระบบจ่ายค่ารอบด่วนพิเศษแบบโอนผ่านระบบพร้อมเพย์ สามารถกดถอนเงินสะสมและได้รับเงินโอนกลับเข้าบัญชีทันทีภายใน 5 นาที ไม่เว้นวันหยุดราชการ"
                      })}
                      className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors"
                    >
                      <h4 className="text-xs font-black text-zinc-800 leading-snug">อัปเดตระบบถอนเงินเข้าบัญชีพร้อมเพย์ความเร็วสูง</h4>
                      <p className="text-[9px] text-zinc-400 mt-1">15 ส.ค. 2026 • อัปเดตฟีเจอร์</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: HELP & SUPPORT (19 Help & Support Center) */}
          {/* ================================================================= */}
          {activeView === 'help_center' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("ศูนย์ช่วยเหลือไรเดอร์", "HELP & SUPPORT CENTER")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                {/* Urgent Call Hotline */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-red-800">ฝ่ายสนับสนุนฉุกเฉินไรเดอร์</h4>
                    <p className="text-[9px] text-red-600 mt-0.5">บริการนำส่งอาหารหรือเกิดอุบัติเหตุแจ้งเหตุได้ทันที</p>
                  </div>
                  <a href="tel:1669" className="bg-[#C62229] hover:bg-red-700 text-white text-[10px] font-black uppercase px-3.5 py-2 rounded-xl transition-colors">
                    โทรด่วน
                  </a>
                </div>

                {/* FAQ List representation */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">คำถามที่พบบ่อย (FAQs)</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <h5 className="text-xs font-black text-zinc-800 flex justify-between items-center">
                      วิธีดำเนินการหากหาบ้านลูกค้าไม่เจอ?
                    </h5>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                      หากไรเดอร์ไปถึงจุดหมายแล้วไม่พบบ้านที่ปักหมุด ให้ทำติดต่อโทรหาลูกค้าผ่านปุ่ม "โทรหาลูกค้า" บนหน้าออเดอร์เพื่อขอรับพิกัดบอกทางที่แน่นอน
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <h5 className="text-xs font-black text-zinc-800">
                      ค่ารอบถูกโอนเข้าบัญชีช่วงไหนบ้าง?
                    </h5>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                      ไรเดอร์สามารถกดส่งคำขอถอนเงินได้จากหน้ากระเป๋าเงิน (Wallet) ได้ทุกเมื่อ โดยเงินจะถูกโอนเข้าสู่บัญชีธนาคารของท่านในรอบวันถัดไปทันที
                    </p>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: REFERRAL (21 Referral & Perks) */}
          {/* ================================================================= */}
          {activeView === 'referral' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 z-0">
              {renderRedHeader("แนะนำเพื่อนคนขับใหม่", "REFERRAL & INVITE PERKS")}
              <div className="bg-white rounded-3xl p-5 shadow-sm -mt-8 relative z-10 mx-4 space-y-6 flex-1">
                
                <div className="text-center space-y-2">
                  <UserPlus size={40} className="mx-auto text-[#C62229]" />
                  <h3 className="text-sm font-black text-zinc-900">ชวนเพื่อนรับค่ารอบเพิ่มสองต่อ!</h3>
                  <p className="text-[10px] text-zinc-500 leading-relaxed px-4">
                    ชวนเพื่อนมาร่วมเป็นคนขับไรเดอร์ส่งของกับ RUSH UP เพียงแชร์รหัสเชิญของคุณ และเพื่อนผ่าน KYC พร้อมเริ่มจัดส่งออเดอร์ รับโบนัสทันที **฿100**
                  </p>
                </div>

                {/* Referral Code card */}
                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-3xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">รหัสแนะนำพิเศษของคุณ</span>
                    <h2 className="text-xl font-black text-[#1A1A18] tracking-widest mt-1">RIDER-999</h2>
                  </div>
                  <button 
                    onClick={copyReferralCode}
                    className="flex h-11 px-4 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedCode ? 'Copied' : 'คัดลอก'}
                  </button>
                </div>

                {/* Invites list */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">ประวัติการชวนเพื่อนของท่าน</span>
                  
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-800">คุณสมเกียรติ ยิ้มแย้ม</h5>
                      <p className="text-[9px] text-zinc-500 mt-0.5">ผ่านการยืนยันตัวตนสำเร็จ • จัดส่งครบ 10 ออเดอร์</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600">ได้รับโบนัส ฿100</span>
                  </div>
                </div>

                <button onClick={() => setActiveView('home')} className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all text-center">
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* 🟢 VIEW: DISPATCH (22 Dispatch & Map Route) */}
          {/* ================================================================= */}
          {activeView === 'dispatch' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 relative h-full">
              {/* Standalone Full-screen Map visual mockup */}
              <div className="absolute inset-0 bg-[#E5E9E6] z-0">
                <svg className="w-full h-full" viewBox="0 0 400 640" fill="none" preserveAspectRatio="xMidYMid slice">
                  <rect width="400" height="640" fill="#E4ECE7" />
                  {/* Styled roads grid */}
                  <path d="M-20,150 L420,150" stroke="#FFFFFF" strokeWidth="42" />
                  <path d="M-20,380 L420,380" stroke="#FFFFFF" strokeWidth="38" />
                  <path d="M120,-20 L120,680" stroke="#FFFFFF" strokeWidth="36" />
                  <path d="M300,-20 L300,680" stroke="#FFFFFF" strokeWidth="32" />
                  
                  {/* Road Borders */}
                  <path d="M-20,129 L420,129" stroke="#D1DDD5" strokeWidth="1.5" />
                  <path d="M-20,171 L420,171" stroke="#D1DDD5" strokeWidth="1.5" />
                  <path d="M102,-20 L102,680" stroke="#D1DDD5" strokeWidth="1.5" />
                  <path d="M138,-20 L138,680" stroke="#D1DDD5" strokeWidth="1.5" />
                  
                  {/* Route path overlay */}
                  <path d="M 120,150 L 300,380" stroke="#C62229" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Pins */}
                  <g transform="translate(120, 150)">
                    <circle cx="0" cy="0" r="16" fill="#243342" stroke="white" strokeWidth="2.5" />
                    <path d="M-5,3 V-2 L0,-6 L5,-2 V3 H2 V0 H-2 V3 H-5Z" fill="white" />
                  </g>
                  <g transform="translate(300, 380)">
                    <circle cx="0" cy="0" r="16" fill="#C62229" stroke="white" strokeWidth="2.5" />
                    <path d="M0,-5 C-2.2,-5 -4,-3.2 -4,-1 C-4,1.8 0,6 0,6 C0,6 4,1.8 4,-1 C4,-3.2 2.2,-5 0,-5 Z M0,-2 C-0.5,-2 -1,-1.5 -1,-1 C-1,-0.5 -0.5,0 0,0 C0.5,0 1,-0.5 1,-1 C1,-1.5 0.5,-2 0,-2 Z" fill="white" />
                  </g>
                </svg>
              </div>

              {/* Floating controls */}
              <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-zinc-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C62229]/10 flex items-center justify-center text-[#C62229]">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">นำทางหลัก</h5>
                    <p className="text-xs font-black text-zinc-900">อีก 1.5 กม. เลี้ยวขวาเข้าซอยคอนโดเดอะนอร์ธ</p>
                  </div>
                </div>
              </div>

              {/* Bottom return shortcut */}
              <div className="absolute bottom-6 left-4 right-4 z-10">
                <button onClick={() => setActiveView('home')} className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2">
                  <X size={16} /> ออกจากระบบนำทางแผนที่
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 🧾 BOTTOM NAVIGATION BAR (Rendered on Home, Available, History tabs) */}
      {!['kyc', 'profile', 'tier', 'earnings', 'daily_earnings', 'analytics', 'incentives', 'wallet', 'withdraw', 'settings', 'smart_notify', 'notifications', 'help_center', 'referral', 'dispatch'].includes(activeView) && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-zinc-100 py-3 px-6 flex justify-around items-center z-20 shadow-lg select-none">
          <button 
            onClick={() => {
              setActiveTab('available')
              setActiveView('home')
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'available' ? 'text-[#C62229]' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <Truck className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">งานใหม่</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('active')
              setActiveView('home')
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'active' ? 'text-[#C62229]' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">งานปัจจุบัน</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('history')
              setActiveView('home')
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-[#C62229]' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <History className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">ประวัติ</span>
          </button>
        </nav>
      )}

      {/* ================================================================= */}
      {/* 🛠️ FLOATING PROTOTYPE SWITCHER (PROTOTYPE ONLY) */}
      {/* ================================================================= */}
      <div className="fixed bottom-20 right-4 z-50">
        <button 
          onClick={() => setShowPrototypeSelector(!showPrototypeSelector)}
          className="w-12 h-12 rounded-full bg-[#C62229] border-2 border-white shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <Settings size={20} className={showPrototypeSelector ? 'rotate-90' : ''} />
        </button>

        <AnimatePresence>
          {showPrototypeSelector && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-14 right-0 w-72 bg-white border border-zinc-200 rounded-3xl p-4 shadow-2xl max-h-[360px] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <h4 className="text-xs font-black uppercase text-[#C62229]">Design View Selector</h4>
                <button onClick={() => setShowPrototypeSelector(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              {/* Grouped Screens */}
              <div className="space-y-3">
                {/* KYC Group */}
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">01-03 Onboarding</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    <button onClick={() => { window.location.href = '/login'; setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">01 Login & Access</button>
                    <button onClick={() => { window.location.href = '/register'; setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">02 Rider Sign-up</button>
                    <button onClick={() => { setActiveView('kyc'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">03 Onboarding & KYC</button>
                  </div>
                </div>

                {/* Dashboard & Active order */}
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">04-06 Active Delivery</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    <button onClick={() => { setActiveView('home'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">04 Home Dashboard</button>
                    <button onClick={() => { setActiveView('order_details_preparing'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">05 Live Order & Pick Up</button>
                    <button onClick={() => { setActiveView('order_details_shipping'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">06 Active Delivery Details</button>
                    <button onClick={() => { setActiveView('dispatch'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">22 Dispatch Map View</button>
                  </div>
                </div>

                {/* Earnings & Wallets */}
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">07-13 Income & Payouts</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    <button onClick={() => { setActiveView('history'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">07 Trip History & Receipts</button>
                    <button onClick={() => { setActiveView('earnings'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">08 Earnings Graph charts</button>
                    <button onClick={() => { setActiveView('daily_earnings'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">09 Daily Earnings summary</button>
                    <button onClick={() => { setActiveView('analytics'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">10 Weekly Analytics</button>
                    <button onClick={() => { setActiveView('incentives'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">11 Bonus & Incentives</button>
                    <button onClick={() => { setActiveView('wallet'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">12 Wallet Balance</button>
                    <button onClick={() => { setActiveView('withdraw'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">13 Payout Form</button>
                  </div>
                </div>

                {/* Profiles & Preferences */}
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-black text-zinc-450 uppercase tracking-widest">14-21 Settings & Support</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px]">
                    <button onClick={() => { setActiveView('tier'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">14 Rider Tier & Rating</button>
                    <button onClick={() => { setActiveView('profile'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">15 Profile Settings</button>
                    <button onClick={() => { setActiveView('settings'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">16 Map App Settings</button>
                    <button onClick={() => { setActiveView('smart_notify'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">17 Smart Notification Alert</button>
                    <button onClick={() => { setActiveView('notifications'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">18-20 News announcements</button>
                    <button onClick={() => { setActiveView('help_center'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">19 Help Center & FAQs</button>
                    <button onClick={() => { setActiveView('referral'); setShowPrototypeSelector(false); }} className="w-full text-left py-1 px-2.5 hover:bg-zinc-55 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-700 font-bold">21 Referral invite friends</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🧾 PAYMENT / DELIVERY COMPLETION MODAL */}
      <AnimatePresence>
        {completeModalJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-zinc-150 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-zinc-900 shadow-2xl"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-black text-center mb-1 uppercase tracking-tight">ชำระเงินเดลิเวอรี่</h3>
              <p className="text-[10px] font-bold text-zinc-500 text-center uppercase tracking-widest mb-6">
                #{completeModalJob.order_number} • ยอดรวม ฿{Number(completeModalJob.net_total || completeModalJob.total_amount || 0).toLocaleString()}
              </p>

              <div className="w-full space-y-4">
                {!paymentMethod ? (
                  <>
                    <button onClick={() => setPaymentMethod('cash')} className="w-full py-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                      💵 เงินสด (CASH)
                    </button>
                    <button onClick={() => setPaymentMethod('transfer')} className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-100 transition-colors">
                      📱 โอนเงิน (TRANSFER)
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {paymentMethod === 'cash' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3.5 bg-emerald-50 border border-emerald-250 rounded-xl">
                          <span className="text-xs font-black text-emerald-700">ยอดชำระเงินสด</span>
                          <span className="text-xl font-black text-emerald-700">฿{(completeModalJob.net_total || completeModalJob.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="จำนวนเงินที่รับมา..."
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 focus:border-emerald-500 rounded-xl px-4 text-sm font-bold text-[#1A1A18] outline-none"
                        />
                        {Number(cashReceived) >= Number(completeModalJob.net_total || completeModalJob.total_amount || 0) && (
                          <div className="flex justify-between items-center p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-xs">
                            <span className="font-bold text-zinc-500">เงินทอน</span>
                            <span className="font-black text-black">฿{(Number(cashReceived) - Number(completeModalJob.net_total || completeModalJob.total_amount || 0)).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'transfer' && (
                      <div className="p-3.5 bg-blue-50 border border-blue-150 text-blue-600 rounded-xl text-center text-xs font-bold leading-relaxed">
                        โอนเงินผ่านระบบ PromptPay หรือช่องทางออนไลน์เรียบร้อยแล้ว
                      </div>
                    )}

                    <div className="border-t border-zinc-150 pt-4">
                      <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">ภาพถ่ายหลักฐานส่งของ (PROOFS)</span>
                      {!proofPhotoUrl ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100/80 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-1" /> : <Camera className="w-5 h-5 text-zinc-400 mb-1" />}
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{uploadingPhoto ? 'กำลังอัปโหลด...' : 'กดถ่ายรูป หรืออัปโหลด'}</p>
                          </div>
                          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                        </label>
                      ) : (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-200">
                          <img src={proofPhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                          <button onClick={() => setProofPhotoUrl('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button onClick={handleCompleteDelivery} disabled={isCompleting || uploadingPhoto || (paymentMethod === 'cash' && Number(cashReceived) < (completeModalJob.net_total || completeModalJob.total_amount || 0))} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                        {isCompleting ? 'กำลังบันทึก...' : 'ยืนยันปิดงานส่งสำเร็จ'}
                      </button>
                      <button onClick={() => { setPaymentMethod(null); setCashReceived(''); setProofPhotoUrl(''); }} className="w-full mt-2.5 text-[10px] font-black text-zinc-500 hover:text-zinc-650 uppercase tracking-widest text-center transition-all">ย้อนกลับ</button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setCompleteModalJob(null)} disabled={isCompleting} className="mt-6 text-[10px] font-black text-zinc-550 hover:text-zinc-700 uppercase tracking-widest transition-all">
                ยกเลิก (CANCEL)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  )
}
