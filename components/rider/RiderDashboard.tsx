'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Navigation, Phone, MapPin, CheckCircle2, 
  Clock, Wallet, History, Power, User, X, Camera, ChevronRight, Loader2, RefreshCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface RiderDashboardProps {
  profile: any
}

export default function RiderDashboard({ profile }: RiderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('active')
  const [isOnline, setIsOnline] = useState(profile?.is_active ?? false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  
  const [earningsToday, setEarningsToday] = useState(0)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Payment/Complete Modal States
  const [completeModalJob, setCompleteModalJob] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null)
  const [cashReceived, setCashReceived] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('')
  const [isCompleting, setIsCompleting] = useState(false)

  // Toggle Rider Online/Offline Status
  const toggleStatus = async () => {
    const nextState = !isOnline
    setIsOnline(nextState)
    try {
      await supabase.from('profiles').update({ is_active: nextState }).eq('id', profile.id)
    } catch (err) {
      console.error('Failed to toggle rider status:', err)
    }
  }

  // Load jobs from Supabase
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch available jobs (Dine-in / Delivery that are paid but not assigned yet)
      const { data: availData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('order_type', 'delivery')
        .is('staff_id', null)
        .in('status', ['paid', 'accepted'])
        .order('created_at', { ascending: false })

      if (availData) setAvailableJobs(availData)

      // 2. Fetch my active jobs (assigned to me, preparing or shipping/delivering)
      const { data: actData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('staff_id', profile.id)
        .in('status', ['preparing', 'shipping', 'out_for_delivery'])
        .order('created_at', { ascending: false })

      if (actData) setActiveJobs(actData)

      // 3. Fetch completed history (assigned to me and completed/delivered)
      const { data: histData } = await supabase
        .from('pos_orders')
        .select('*, items:pos_order_items(*, item:pos_menu_items(*))')
        .eq('staff_id', profile.id)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })

      if (histData) {
        setHistoryJobs(histData)

        // Calculate earnings today
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
      console.error('Failed to load rider jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Real-time Subscriptions
  useEffect(() => {
    fetchJobs()

    const channel = supabase
      .channel('rider-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pos_orders' }, () => {
        fetchJobs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Claim Order (Accept Job)
  const handleClaimJob = async (orderId: string) => {
    setIsLoading(true)
    try {
      await supabase
        .from('pos_orders')
        .update({ 
          staff_id: profile.id,
          status: 'preparing' // Mark preparing so kitchen knows it is claimed
        })
        .eq('id', orderId)
      
      fetchJobs()
      setActiveTab('active')
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
      console.error('Failed to mark order picked up:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Photo Upload Handler (Uploads directly to public menu bucket)
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
      console.error('Failed to upload proof photo:', err)
      alert('อัปโหลดรูปล้มเหลว กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Complete Order Delivery
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
      // 1. Insert Payment Row
      await supabase.from('pos_order_payments').insert({
        order_id: completeModalJob.id,
        payment_method: paymentMethod || 'transfer',
        amount: orderTotal,
        received_amount: paymentMethod === 'cash' ? numCashReceived : orderTotal,
        change_amount: paymentMethod === 'cash' ? cashChange : 0,
        status: 'paid'
      })

      // 2. Update Order with completed status, payment metadata and proof photo URL (if uploaded)
      const updatePayload: any = {
        status: 'completed',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString()
      }

      if (proofPhotoUrl) {
        updatePayload.customer_image = proofPhotoUrl // Store in customer_image field for admin verification
      }

      await supabase
        .from('pos_orders')
        .update(updatePayload)
        .eq('id', completeModalJob.id)

      // 3. Award Loyalty Points
      try {
        const { data: shopSettings } = await supabase
          .from('pos_shop_settings')
          .select('opening_hours')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const oh = shopSettings?.opening_hours || {}
        const earnThb = oh.loyalty_earn_thb !== undefined ? oh.loyalty_earn_thb : (oh.loyalty_earn_rate || 100)
        const earnPts = oh.loyalty_earn_pts !== undefined ? oh.loyalty_earn_pts : 1
        const pointsToEarn = earnThb > 0 ? Math.floor((orderTotal - (completeModalJob.delivery_fee || 0)) / earnThb) * earnPts : 0

        if (pointsToEarn > 0) {
          let memberId = completeModalJob.customer_id
          if (!memberId && completeModalJob.line_user_id) {
            const { data: member } = await supabase.from('pos_members').select('id').eq('line_user_id', completeModalJob.line_user_id).maybeSingle()
            if (member?.id) memberId = member.id
          }

          if (memberId) {
            await supabase.rpc('increment_member_points', {
              user_id: memberId,
              points_to_add: pointsToEarn
            })

            await supabase.from('pos_points_history').insert({
              member_id: memberId,
              order_id: completeModalJob.id,
              points: pointsToEarn,
              points_change: pointsToEarn,
              type: 'earn',
              description: `สะสมแต้มเดลิเวอรี่ #${completeModalJob.order_number}`
            })
          }
        }
      } catch (err) {
        console.error('Failed to credit points:', err)
      }

      // Close modal & reset states
      setCompleteModalJob(null)
      setPaymentMethod(null)
      setCashReceived('')
      setProofPhotoUrl('')
      
      fetchJobs()
    } catch (err) {
      console.error('Failed to complete delivery:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  // Open external maps
  const openMaps = (job: any) => {
    const lat = job.delivery_latitude
    const lng = job.delivery_longitude
    const url = lat && lng 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.delivery_address || '')}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen w-full bg-[#121214] text-zinc-100 flex flex-col font-sans max-w-md mx-auto relative overflow-hidden border-x border-zinc-800 shadow-2xl">
      
      {/* 📱 TOP HEADER */}
      <header className="bg-zinc-950 p-5 pt-7 pb-4 border-b border-zinc-850 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-none mb-1">{profile?.display_name || 'Rider'}</h2>
            <p className="text-[9px] font-bold text-[#C62229] uppercase tracking-widest leading-none">RUSH UP RIDER</p>
          </div>
        </div>

        {/* Online/Offline Toggle */}
        <button 
          onClick={toggleStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </header>

      {/* 💰 DAILY STATS ROW */}
      <section className="bg-zinc-900 border-b border-zinc-850 p-5 shrink-0 flex justify-between items-center gap-4">
        <div className="flex-1">
          <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest mb-1">รายได้วันนี้ (TODAY'S PAY)</p>
          <h3 className="text-2xl font-black text-white leading-none">฿{earningsToday.toLocaleString()}</h3>
        </div>
        <div className="w-px h-8 bg-zinc-800"></div>
        <div className="flex-1 text-right">
          <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest mb-1">ส่งสำเร็จ (COMPLETED)</p>
          <h3 className="text-2xl font-black text-white leading-none">
            {historyJobs.filter(j => {
              const d = new Date(j.paid_at || j.created_at)
              const start = new Date()
              start.setHours(0,0,0,0)
              return d >= start
            }).length} งาน
          </h3>
        </div>
        <button 
          onClick={fetchJobs}
          className="ml-2 w-8 h-8 rounded-full border border-zinc-800 bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </section>

      {/* 📋 MAIN JOBS FEED */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <AnimatePresence mode="wait">
          {isLoading && (
            <div className="flex py-10 w-full items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C62229]" />
              <span className="text-xs font-black uppercase tracking-widest">กำลังโหลดข้อมูล...</span>
            </div>
          )}

          {!isLoading && activeTab === 'available' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {!isOnline && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center">
                  <p className="text-xs font-bold text-amber-400">กรุณาเปิดสถานะ "Online" เพื่อเริ่มรับงาน</p>
                </div>
              )}
              {availableJobs.length === 0 ? (
                <div className="py-20 text-center text-zinc-500">
                  <Truck className="w-12 h-12 mx-auto opacity-10 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">ไม่มีงานจัดส่งใหม่ในขณะนี้</p>
                </div>
              ) : (
                availableJobs.map((job) => (
                  <div key={job.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-[#C62229]/10 text-[#C62229] border border-[#C62229]/20 text-[9px] font-black uppercase tracking-widest mr-2">
                          งานใหม่
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">#{job.order_number}</span>
                      </div>
                      <span className="text-lg font-black text-emerald-400">฿{job.delivery_fee || 0}</span>
                    </div>

                    <h4 className="text-base font-black text-white mb-1">{job.customer_name || 'ลูกค้า'}</h4>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                      <MapPin className="inline w-3.5 h-3.5 mr-1 text-zinc-500" />
                      {job.delivery_address}
                    </p>

                    <button
                      disabled={!isOnline}
                      onClick={() => handleClaimJob(job.id)}
                      className="w-full bg-[#C62229] hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
                    >
                      รับงานนี้
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {!isLoading && activeTab === 'active' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="py-20 text-center text-zinc-500">
                  <Clock className="w-12 h-12 mx-auto opacity-10 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">ยังไม่มีงานที่คุณกดรับไว้</p>
                </div>
              ) : (
                activeJobs.map((job) => {
                  const isExpanded = expandedJobId === job.id
                  const isDelivering = job.status === 'shipping' || job.status === 'out_for_delivery'
                  
                  return (
                    <div key={job.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
                      {/* Job Main Header */}
                      <div 
                        onClick={() => setExpandedJobId(prev => prev === job.id ? null : job.id)}
                        className="p-4 cursor-pointer flex justify-between items-center bg-zinc-900 border-b border-zinc-850"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">#{job.order_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              isDelivering ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {isDelivering ? 'กำลังส่ง' : 'รออาหาร'}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white truncate">{job.customer_name || 'ลูกค้า'}</h4>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">ค่าส่ง</p>
                          <p className="text-base font-black text-emerald-400">฿{job.delivery_fee || 0}</p>
                        </div>
                      </div>

                      {/* Job Expansion Info */}
                      <div className="p-4 bg-zinc-900/60 space-y-4">
                        <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                          <div>
                            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">สถานที่จัดส่ง</span>
                            <span className="text-zinc-200 font-bold block">{job.delivery_address}</span>
                          </div>

                          {job.reference_name && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-zinc-200 font-bold">โทร: {job.reference_name}</span>
                            </div>
                          )}

                          {job.comment && !job.comment.startsWith('COORD:') && (
                            <div className="mt-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                              <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">โน้ตจากลูกค้า</span>
                              <span className="text-zinc-300 font-medium italic">"{job.comment}"</span>
                            </div>
                          )}
                        </div>

                        {/* Navigation & Call Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openMaps(job)}
                            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider transition-all"
                          >
                            <Navigation className="w-4 h-4" /> แผนที่ GPS
                          </button>
                          {job.reference_name ? (
                            <a
                              href={`tel:${job.reference_name}`}
                              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-black uppercase tracking-wider transition-all border border-zinc-700"
                            >
                              <Phone className="w-4 h-4" /> โทรหาลูกค้า
                            </a>
                          ) : (
                            <button
                              disabled
                              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-850 text-zinc-500 text-[11px] font-black uppercase tracking-wider opacity-30 cursor-not-allowed"
                            >
                              <Phone className="w-4 h-4" /> ไม่มีเบอร์โทร
                            </button>
                          )}
                        </div>

                        {/* Progress Status Button */}
                        <div className="pt-2 border-t border-zinc-800">
                          {!isDelivering ? (
                            <button
                              onClick={() => handlePickedUp(job.id)}
                              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Truck className="w-4.5 h-4.5" /> รับอาหารแล้ว (เริ่มนำส่ง)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProofPhotoUrl('')
                                setPaymentMethod(null)
                                setCashReceived('')
                                setCompleteModalJob(job)
                              }}
                              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4.5 h-4.5" /> ส่งอาหารสำเร็จ (ปิดงาน)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}

          {!isLoading && activeTab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {historyJobs.length === 0 ? (
                <div className="py-20 text-center text-zinc-500">
                  <History className="w-12 h-12 mx-auto opacity-10 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">ยังไม่มีประวัติการส่งอาหารของคุณ</p>
                </div>
              ) : (
                historyJobs.map((job) => (
                  <div key={job.id} className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">#{job.order_number}</p>
                      <h4 className="text-sm font-black text-white">{job.customer_name || 'ลูกค้า'}</h4>
                      <p className="text-[10px] text-zinc-450 mt-1">
                        {new Date(job.paid_at || job.created_at).toLocaleDateString('th-TH')} • {new Date(job.paid_at || job.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-black text-sm block">+฿{job.delivery_fee || 0}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">{job.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 🧾 BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950 border-t border-zinc-850 py-2.5 px-6 flex justify-around items-center z-20">
        <button 
          onClick={() => setActiveTab('available')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'available' ? 'text-[#C62229]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">งานใหม่</span>
        </button>

        <button 
          onClick={() => setActiveTab('active')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'active' ? 'text-[#C62229]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">งานปัจจุบัน</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-[#C62229]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">ประวัติ</span>
        </button>
      </nav>

      {/* 🧾 PAYMENT / DELIVERY COMPLETION MODAL */}
      <AnimatePresence>
        {completeModalJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-white"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 animate-pulse" />
              <h3 className="text-lg font-black text-center mb-1 uppercase tracking-tight">ชำระเงินเดลิเวอรี่</h3>
              <p className="text-[10px] font-bold text-zinc-500 text-center uppercase tracking-widest mb-6">
                #{completeModalJob.order_number} • ยอดรวม ฿{Number(completeModalJob.net_total || completeModalJob.total_amount || 0).toLocaleString()}
              </p>

              <div className="w-full space-y-4">
                {/* 1. Payment Method Picker */}
                {!paymentMethod ? (
                  <>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                    >
                      💵 เงินสด (CASH)
                    </button>
                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                    >
                      📱 โอนเงิน (TRANSFER)
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {paymentMethod === 'cash' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <span className="text-xs font-black text-emerald-400">ยอดชำระเงินสด</span>
                          <span className="text-xl font-black text-emerald-400">฿{(completeModalJob.net_total || completeModalJob.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="จำนวนเงินที่รับมา..."
                          className="w-full h-12 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 text-sm font-bold text-white outline-none"
                        />
                        {Number(cashReceived) >= Number(completeModalJob.net_total || completeModalJob.total_amount || 0) && (
                          <div className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs">
                            <span className="font-bold text-zinc-500">เงินทอน</span>
                            <span className="font-black text-white">฿{(Number(cashReceived) - Number(completeModalJob.net_total || completeModalJob.total_amount || 0)).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'transfer' && (
                      <div className="p-3.5 bg-blue-500/5 border border-blue-500/25 text-blue-400 rounded-xl text-center text-xs font-bold leading-relaxed">
                        โอนเงินผ่านระบบ PromptPay หรือช่องทางออนไลน์เรียบร้อยแล้ว
                      </div>
                    )}

                    {/* 2. Photo Proof Upload (Optional) */}
                    <div className="border-t border-zinc-850 pt-4">
                      <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">ภาพถ่ายหลักฐานส่งของ (PROOFS)</span>
                      
                      {!proofPhotoUrl ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-950/80 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingPhoto ? (
                              <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-1" />
                            ) : (
                              <Camera className="w-5 h-5 text-zinc-400 mb-1" />
                            )}
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                              {uploadingPhoto ? 'กำลังอัปโหลด...' : 'กดถ่ายรูป หรืออัปโหลด'}
                            </p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                            disabled={uploadingPhoto}
                          />
                        </label>
                      ) : (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-800">
                          <img src={proofPhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setProofPhotoUrl('')}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Action Buttons */}
                    <div className="pt-2">
                      <button
                        onClick={handleCompleteDelivery}
                        disabled={isCompleting || uploadingPhoto || (paymentMethod === 'cash' && Number(cashReceived) < (completeModalJob.net_total || completeModalJob.total_amount || 0))}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        {isCompleting ? 'กำลังบันทึก...' : 'ยืนยันปิดงานส่งสำเร็จ'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setPaymentMethod(null)
                          setCashReceived('')
                          setProofPhotoUrl('')
                        }}
                        className="w-full mt-2.5 text-[10px] font-black text-zinc-550 hover:text-zinc-400 uppercase tracking-widest transition-colors text-center"
                      >
                        ย้อนกลับ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCompleteModalJob(null)}
                disabled={isCompleting}
                className="mt-6 text-[10px] font-black text-zinc-550 hover:text-zinc-400 uppercase tracking-widest transition-colors"
              >
                ยกเลิก (CANCEL)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  )
}
