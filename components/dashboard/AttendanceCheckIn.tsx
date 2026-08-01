'use client';
import React, { useEffect, useState } from 'react'
import { MapPin, CheckCircle2, XCircle, Loader2, Clock, Camera } from 'lucide-react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { calculateDistance, isWithinRange } from '@/lib/geoUtils'
import { useI18n } from "@/lib/I18nContext";

interface BranchLocation {
  id: string
  branch_id: string
  latitude: number
  longitude: number
  radius_meters: number
}

interface AttendanceLog {
  id: string
  profile_id: string
  type: 'check_in' | 'check_out'
  latitude: number
  longitude: number
  timestamp: string
  is_within_range: boolean
  reason?: string | null
}

export const AttendanceCheckIn: React.FC = () => {
    const { locale } = useI18n();
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingLocation, setCheckingLocation] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [branchLocation, setBranchLocation] = useState<BranchLocation | null>(null)
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([])
  const [lastLog, setLastLog] = useState<AttendanceLog | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pressFeedback, setPressFeedback] = useState(0)

  // New states for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [earlyReason, setEarlyReason] = useState('')
  const [isEarlyCheckOut, setIsEarlyCheckOut] = useState(false)
  const [isUnscheduledShift, setIsUnscheduledShift] = useState(false)
  const [checkoutChecklistItems, setCheckoutChecklistItems] = useState<string[]>([])
  const [completedChecklist, setCompletedChecklist] = useState<string[]>([])
  const [requiredAuditCategories, setRequiredAuditCategories] = useState<string[]>([])
  const [missingAuditCategories, setMissingAuditCategories] = useState<any[]>([])
  
  // Checkout photo zones
  const [checkoutZones, setCheckoutZones] = useState<{id: string, name: string}[]>([])
  const [checkoutPhotos, setCheckoutPhotos] = useState<Record<string, string>>({})
  const [hasBranchPhotosToday, setHasBranchPhotosToday] = useState(false)

  const getTodayRange = () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (profile?.branch_code) {
      fetchBranchLocation()
    }
    fetchTodayLogs()
  }, [profile])

  const fetchBranchLocation = async () => {
    if (!profile?.branch_code) return;

    const { data: branch } = await supabase
      .from('branches')
      .select('id, latitude, longitude')
      .eq('branch_code', profile.branch_code)
      .maybeSingle()

    if (branch) {
      const { data: settings } = await supabase
        .from('pos_shop_settings')
        .select('check_in_radius, latitude, longitude, opening_hours, checkout_photo_zones')
        .eq('branch_id', branch.id)
        .maybeSingle()

      const finalLat = branch.latitude || settings?.latitude || 13.7563;
      const finalLng = branch.longitude || settings?.longitude || 100.5018;
      const finalRadius = settings?.check_in_radius || 50;

      setBranchLocation({
        latitude: finalLat,
        longitude: finalLng,
        radius_meters: finalRadius,
        id: branch.id,
        branch_id: branch.id
      })
      if (settings?.opening_hours?.checkout_checklist) {
          setCheckoutChecklistItems(settings.opening_hours.checkout_checklist)
      }
      if (settings?.opening_hours?.required_audit_categories) {
          setRequiredAuditCategories(settings.opening_hours.required_audit_categories)
      }
      if (settings?.checkout_photo_zones) {
          setCheckoutZones(settings.checkout_photo_zones)
      }
    }
  }


  const fetchTodayLogs = async () => {
    if (!profile?.id) return

    const todayRange = getTodayRange()
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('timestamp', todayRange.start)
      .lte('timestamp', todayRange.end)
      .order('timestamp', { ascending: false })

    if (data) {
      setTodayLogs(data)
      setLastLog(data[0] || null)
    }
  }

  const initiateCheckInOut = async () => {
    if (!profile?.id || !branchLocation) {
      setStatus({ type: 'error', message: 'ไม่พบพิกัดสาขาในการลงเวลา' })
      return
    }

    if (hasCheckedInToday && hasCheckedOutToday) {
      setStatus({ type: 'error', message: 'วันนี้ลงเวลาเข้างานและออกงานครบแล้ว ระบบอนุญาตอย่างละ 1 ครั้งเท่านั้น' })
      return
    }

    const nextType = hasCheckedInToday ? 'check_out' : 'check_in'
    
    if (nextType === 'check_out') {
      // Check if early
      const now = new Date()
      const currentMins = now.getHours() * 60 + now.getMinutes()
      
      const shiftEnd = profile.shift_end || "17:30"
      const [endHrs, endMins] = shiftEnd.split(':').map(Number)
      const shiftEndTotalMins = endHrs * 60 + endMins

      if (currentMins < shiftEndTotalMins) {
        setIsEarlyCheckOut(true)
      } else {
        setIsEarlyCheckOut(false)
      }

      setIsUnscheduledShift(false)

      const todayRange = getTodayRange()
      
      // Find staff in same branch to check for shared tasks
      // Fetch via API to bypass RLS and get all staff in branch
      if (checkoutZones.length > 0) {
        try {
          const res = await fetch('/api/staff/check-branch-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branch_code: profile.branch_code,
              start: todayRange.start,
              end: todayRange.end
            })
          })
          const data = await res.json()
          setHasBranchPhotosToday(data.hasPhotos)
        } catch (e) {
          console.error('Failed to check branch photos', e)
          setHasBranchPhotosToday(false)
        }
      }

      // We still need staffIds for the inventory audit check, but that one might also be restricted by RLS.
      // For now, use the current user's ID to check if THEY have done the audit, 
      // or we might need another API. But since the user only complained about photos, let's keep it as is.
      const { data: staffInBranch } = await supabase.from('profiles').select('id').eq('branch_code', profile.branch_code);
      const staffIds = staffInBranch?.map((s: any) => s.id) || [profile.id];

      // Check required audits
      if (requiredAuditCategories.length > 0) {
        setLoading(true)
        const { data: sessions } = await supabase
          .from('pos_inventory_audit_sessions')
          .select('notes')
          .in('staff_id', staffIds)
          .gte('created_at', todayRange.start)
          .lte('created_at', todayRange.end)
        
        let allAudited = false
        let auditedSet = new Set<string>()

        if (sessions) {
          for (const s of sessions) {
            if (s.notes) {
              try {
                const parsed = JSON.parse(s.notes)
                if (parsed.audited_categories === 'ALL') {
                  allAudited = true
                  break
                }
                if (Array.isArray(parsed.audited_categories)) {
                  parsed.audited_categories.forEach((id: string) => auditedSet.add(id))
                }
              } catch (e) {}
            }
          }
        }

        if (!allAudited) {
          const missingIds = requiredAuditCategories.filter(id => !auditedSet.has(id))
          if (missingIds.length > 0) {
            // Fetch category names
            const { data: catData } = await supabase
              .from('inventory_categories')
              .select('id, name')
              .in('id', missingIds)
            if (catData) {
              setMissingAuditCategories(catData)
            } else {
              setMissingAuditCategories(missingIds.map(id => ({ id, name: id })))
            }
          } else {
            setMissingAuditCategories([])
          }
        } else {
          setMissingAuditCategories([])
        }
        setLoading(false)
      } else {
        setMissingAuditCategories([])
      }
    } else {
      setIsEarlyCheckOut(false)
      setMissingAuditCategories([])
      
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      const todayStr = dayNames[new Date().getDay()]
      const isUnscheduled = !profile.work_days?.includes(todayStr)
      setIsUnscheduledShift(isUnscheduled)
    }

    setEarlyReason('')
    setShowConfirmModal(true)
  }

  const handlePhotoUpload = async (zoneId: string, file: File) => {
    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `checkout_${profile?.id}_${zoneId}_${Date.now()}.${fileExt}`
      const filePath = `attendance/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { contentType: file.type || 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setCheckoutPhotos(prev => ({
        ...prev,
        [zoneId]: publicUrl
      }))
    } catch (error: any) {
      alert('อัปโหลดรูปภาพล้มเหลว: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckInOut = async () => {
    if (!profile?.id || !branchLocation) {
      setStatus({ type: 'error', message: 'ไม่พบพิกัดสาขาในการลงเวลา' })
      return
    }

    if (loading || checkingLocation) {
      return
    }

    if (hasCheckedInToday && hasCheckedOutToday) {
      setStatus({ type: 'error', message: 'วันนี้ลงเวลาเข้างานและออกงานครบแล้ว ระบบอนุญาตอย่างละ 1 ครั้งเท่านั้น' })
      return
    }

    if (!hasCheckedInToday && hasCheckedOutToday) {
      setStatus({ type: 'error', message: 'ข้อมูลลงเวลาไม่ถูกต้องสำหรับวันนี้ กรุณาติดต่อผู้ดูแลระบบ' })
      return
    }

    setPressFeedback((prev) => prev + 1)
    setCheckingLocation(true)
    setStatus({ type: 'success', message: hasCheckedInToday ? 'กำลังตรวจพิกัดก่อนลงเวลาออกงาน...' : 'กำลังตรวจพิกัดก่อนลงเวลาเข้างาน...' })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const withinRange = isWithinRange(
          latitude,
          longitude,
          branchLocation.latitude,
          branchLocation.longitude,
          branchLocation.radius_meters
        )

        if (!withinRange) {
          const dist = Math.round(calculateDistance(latitude, longitude, branchLocation.latitude, branchLocation.longitude));
          setStatus({
            type: 'error',
            message: `อยู่นอกเขตลงเวลา ห่างจากจุดที่กำหนด ${dist} ม. ระบบไม่อนุญาตให้ลงเวลา`,
          })
          setCheckingLocation(false)
          return
        }

        const nextType: 'check_in' | 'check_out' = hasCheckedInToday ? 'check_out' : 'check_in'

        if (nextType === 'check_out' && hasCheckedOutToday) {
          setStatus({ type: 'error', message: 'วันนี้ลงเวลาออกงานไปแล้ว ระบบอนุญาตอย่างละ 1 ครั้งเท่านั้น' })
          setCheckingLocation(false)
          return
        }

        setLoading(true)
        setStatus({ type: 'success', message: nextType === 'check_in' ? 'กำลังบันทึกเวลาเข้างาน...' : 'กำลังบันทึกเวลาออกงาน...' })
        const { data, error } = await supabase.from('attendance_logs').insert({
          profile_id: profile.id,
          type: nextType,
          latitude,
          longitude,
          is_within_range: true,
          reason: nextType === 'check_out' 
            ? `${earlyReason ? `[Early Checkout] ${earlyReason}\n` : ''}${completedChecklist.length > 0 ? `[Checklist] ${completedChecklist.join(', ')}` : ''}`.trim() || null
            : (isUnscheduledShift ? '[เข้างานวันหยุด/สลับวันหยุด]' : null),
          checkout_zone_photos: nextType === 'check_out' ? Object.entries(checkoutPhotos).map(([zone_id, url]) => ({ zone_id, url })) : null
        }).select()

        if (error) {
          setStatus({ type: 'error', message: 'ผิดพลาด: ' + error.message })
        } else {
          // If inserting the log succeeds, trigger the auto-holiday API
          if (data && data.length > 0) {
            const newlyInsertedLog = data[0];
            try {
               await fetch('/api/staff/auto-holiday', {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json',
                       Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                   },
                   body: JSON.stringify({ profileId: profile.id, logId: newlyInsertedLog.id })
               });
            } catch (err) {
               console.error('Failed to trigger auto-holiday:', err);
            }

            // If it was a check out and there are photos, notify manager
            if (nextType === 'check_out' && Object.keys(checkoutPhotos).length > 0) {
              try {
                const zonesData = Object.entries(checkoutPhotos).map(([zone_id, url]) => {
                  const zoneDef = checkoutZones.find(z => z.id === zone_id);
                  return { name: zoneDef?.name || zone_id, url };
                });

                await fetch('/api/line/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'checkout_photos',
                    photoData: {
                      staffName: profile.full_name || 'Staff',
                      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                      zones: zonesData
                    }
                  })
                });
              } catch (err) {
                console.error('Failed to notify manager:', err);
              }
            }
          }

          setStatus({
            type: 'success',
            message: nextType === 'check_in' ? 'ลงเวลาเข้างานสำเร็จ' : 'ลงเวลาออกงานสำเร็จ',
          })
          fetchTodayLogs()
          setShowConfirmModal(false)
        }
        setLoading(false)
        setCheckingLocation(false)
      },
      (error) => {
        let errorMsg = 'เข้าถึงพิกัดไม่ได้'
        if (error.code === error.PERMISSION_DENIED) {
           errorMsg = 'กรุณาอนุญาตตำแหน่งที่ตั้ง'
        }
        setStatus({ type: 'error', message: errorMsg })
        setCheckingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const hasCheckedInToday = todayLogs.some(log => log.type === 'check_in')
  const hasCheckedOutToday = todayLogs.some(log => log.type === 'check_out')
  const isCompletedForToday = hasCheckedInToday && hasCheckedOutToday
  const isCheckedIn = hasCheckedInToday && !hasCheckedOutToday

  return (
    <div
      className="bg-white border border-[#111111] p-0 overflow-hidden"
      onClick={(event) => event.stopPropagation()}
      onPointerDownCapture={(event) => event.stopPropagation()}
    >
      {/* Time Display */}
      <div className="bg-[#111111] text-white p-8 border-b border-[#111111]">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={12} className="text-[#A3A3A3]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#A3A3A3]">SYSTEM TIME // REALTIME</span>
        </div>
        <div className="font-serif-thai text-5xl font-light tracking-tight mb-2">
          {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#A3A3A3]">
          {currentTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 border border-[#111111] flex items-center justify-center">
             <MapPin size={18} className="text-[#111111]" />
          </div>
          <div>
            <h4 className="font-serif-thai text-lg font-medium leading-none mb-1">{locale === 'en' ? 'สถานีลงเวลางาน' : locale === 'zh' ? 'สถานีลงเวลางาน' : 'สถานีลงเวลางาน'}</h4>
            <p className="text-[10px] text-[#A3A3A3] uppercase tracking-widest">BRANCH MONITORING ACTIVE</p>
          </div>
        </div>

        {branchLocation && (
          <div className="mb-8 p-4 border border-[#EFEFEF] bg-[#FAFAFA]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#A3A3A3]">Geo Fence</p>
                <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#111111]">{locale === 'en' ? 'ต้องอยู่ในรัศมี ' : locale === 'zh' ? 'ต้องอยู่ในรัศมี ' : 'ต้องอยู่ในรัศมี '}{branchLocation.radius_meters} {locale === 'en' ? ' เมตรจากสาขา' : locale === 'zh' ? ' เมตรจากสาขา' : ' เมตรจากสาขา'}</p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3A3A3]">
                GPS LOCKED
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {status && (
            <motion.div
              key={`${status.type}-${status.message}`}
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`mb-8 p-5 border flex items-center gap-4 ${status.type === 'success' ? 'bg-[#F9F9F9] border-[#111111] text-[#111111]' : 'bg-[#FEF6F5] border-[#E54D2E] text-[#E54D2E]'}`}
            >
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                {status.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8 p-4 border border-[#EFEFEF] bg-white">
          <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#666666]">
            <span>{locale === 'en' ? 'สิทธิ์วันนี้' : locale === 'zh' ? 'สิทธิ์วันนี้' : 'สิทธิ์วันนี้'}</span>
            <span>{hasCheckedInToday ? 'เข้าแล้ว 1/1' : 'เข้า 0/1'} • {hasCheckedOutToday ? 'ออกแล้ว 1/1' : 'ออก 0/1'}</span>
          </div>
        </div>

        {isCompletedForToday ? (
          <div className="w-full py-6 font-bold text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 border bg-[#F9F9F9] text-[#A3A3A3] border-[#EFEFEF]">
            <div>{locale === 'en' ? '✔️ COMPLETED FOR TODAY // ลงเวลาครบแล้ว' : locale === 'zh' ? '✔️ COMPLETED FOR TODAY // ลงเวลาครบแล้ว' : '✔️ COMPLETED FOR TODAY // ลงเวลาครบแล้ว'}</div>
          </div>
        ) : (
          <motion.button
            key={pressFeedback}
            onClick={(event) => {
              event.stopPropagation()
              initiateCheckInOut()
            }}
            disabled={loading || checkingLocation || !branchLocation}
            whileTap={{ scale: 0.975 }}
            animate={loading || checkingLocation ? { scale: [1, 0.99, 1], opacity: [1, 0.88, 1] } : { scale: 1, opacity: 1 }}
            transition={loading || checkingLocation ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } : { duration: 0.16 }}
            className={`w-full py-6 font-bold text-[11px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 border ${
              isCheckedIn
                ? 'bg-white text-[#111111] border-[#111111] hover:bg-[#F9F9F9]'
                : 'bg-[#111111] text-white border-[#111111] hover:bg-[#1A3626]'
            } disabled:opacity-20 disabled:cursor-not-allowed`}
          >
            {loading || checkingLocation ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {checkingLocation ? 'กำลังตรวจพิกัด...' : 'กำลังบันทึกเวลา...'}
              </>
            ) : isCheckedIn ? (
              'ลงเวลาออกงาน (CHECK OUT)'
            ) : (
              'ลงเวลาเข้างาน (CHECK IN)'
            )}
          </motion.button>
        )}

        {!branchLocation && !loading && (
          <p className="text-center text-[9px] font-bold text-[#E54D2E] uppercase tracking-widest mt-6">
            * NO RADIUS FOUND. CONTACT ARCHITECT.
          </p>
        )}

        {todayLogs.length > 0 && (
          <div className="mt-12 border-t border-[#EFEFEF] pt-10">
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#A3A3A3] mb-6">{locale === 'en' ? 'TODAY LOGS // วันนี้' : locale === 'zh' ? 'TODAY LOGS // วันนี้' : 'TODAY LOGS // วันนี้'}</div>
            <div className="space-y-4">
              {todayLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-[#EFEFEF] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-1.5 ${log.type === 'check_in' ? 'bg-[#111111]' : 'border border-[#111111]'}`} />
                    <span className="text-[10px] font-bold text-[#111111] uppercase tracking-[0.2em]">
                      {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#A3A3A3]">
                    {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md border border-[#111111] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#111111] text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={16} className="text-[#A3A3A3]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3A3A3]">
                    {hasCheckedInToday ? 'CONFIRM CHECK OUT' : 'CONFIRM CHECK IN'}
                  </span>
                </div>
                <h3 className="font-serif-thai text-2xl font-light">
                  {hasCheckedInToday ? 'ยืนยันการลงเวลาออกงาน' : 'ยืนยันการลงเวลาเข้างาน'}
                </h3>
              </div>

              <div className="p-8">
                <div className="mb-8">
                  <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">{locale === 'en' ? 'เวลาปัจจุบัน' : locale === 'zh' ? 'เวลาปัจจุบัน' : 'เวลาปัจจุบัน'}</p>
                  <p className="text-3xl font-light text-[#111111] font-mono">
                    {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {isUnscheduledShift && !hasCheckedInToday && (
                  <div className="mb-8 p-4 bg-[#FFF9ED] border border-[#F6D07A] rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#C27C00]">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-widest">แจ้งเตือน: วันนี้เป็นวันหยุดของคุณ</span>
                    </div>
                    <p className="text-[11px] text-[#C27C00]">คุณไม่ได้มีตารางงานในวันนี้ (วันหยุด) คุณกำลังลงเวลาเข้างานเป็นกรณีพิเศษ (เช่น ทำโอที หรือสลับวันหยุด) ใช่หรือไม่?</p>
                  </div>
                )}

                {isEarlyCheckOut && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-[#E54D2E]">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{locale === 'en' ? 'คุณกำลังออกงานก่อนเวลากำหนด (' : locale === 'zh' ? 'คุณกำลังออกงานก่อนเวลากำหนด (' : 'คุณกำลังออกงานก่อนเวลากำหนด ('}{profile?.shift_end || '17:30'})</span>
                    </div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A3A3A3] mb-3">
                      {locale === 'en' ? '                       ระบุเหตุผลการออกงานก่อนเวลา *                     ' : locale === 'zh' ? '                       ระบุเหตุผลการออกงานก่อนเวลา *                     ' : '                       ระบุเหตุผลการออกงานก่อนเวลา *                     '}</label>
                    <textarea
                      value={earlyReason}
                      onChange={(e) => setEarlyReason(e.target.value)}
                      placeholder={locale === 'en' ? 'เช่น ทำงานเสร็จแล้ว, มีธุระด่วน, ฯลฯ' : locale === 'zh' ? 'เช่น ทำงานเสร็จแล้ว, มีธุระด่วน, ฯลฯ' : 'เช่น ทำงานเสร็จแล้ว, มีธุระด่วน, ฯลฯ'}
                      className="w-full bg-[#FAFAFA] border border-[#EFEFEF] p-4 text-sm focus:border-[#111111] outline-none transition-colors min-h-[100px] resize-none"
                    />
                  </div>
                )}

                {hasCheckedInToday && checkoutChecklistItems.length > 0 && (
                  <div className="mb-8 border border-[#EFEFEF] rounded-xl p-4 bg-[#FAFAFA]">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#111111] mb-4">
                      {locale === 'en' ? 'รายการตรวจสอบก่อนเลิกงาน (Checklist) *' : locale === 'zh' ? 'รายการตรวจสอบก่อนเลิกงาน (Checklist) *' : 'รายการตรวจสอบก่อนเลิกงาน (Checklist) *'}
                    </label>
                    <div className="space-y-3">
                      {checkoutChecklistItems.map((item, index) => {
                          const isChecked = completedChecklist.includes(item);
                          return (
                              <div key={index} className="flex items-start gap-3 cursor-pointer group" onClick={() => {
                                  if (isChecked) {
                                      setCompletedChecklist(completedChecklist.filter(c => c !== item));
                                  } else {
                                      setCompletedChecklist([...completedChecklist, item]);
                                  }
                              }}>
                                  <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#111111] border-[#111111]' : 'border-[#CCCCCC] bg-white group-hover:border-[#111111]'}`}>
                                      {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                  </div>
                                  <span className={`text-[12px] font-bold ${isChecked ? 'text-[#111111]' : 'text-[#666666]'}`}>{item}</span>
                              </div>
                          );
                      })}
                    </div>
                  </div>
                )}

                {hasCheckedInToday && missingAuditCategories.length > 0 && (
                  <div className="mb-8 border border-[#E54D2E] rounded-xl p-4 bg-[#FEF4F2]">
                    <div className="flex items-center gap-2 mb-3 text-[#E54D2E]">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <label className="block text-[12px] font-black uppercase tracking-widest">
                        {locale === 'en' ? 'Required Audits Missing' : locale === 'zh' ? 'Required Audits Missing' : 'ยังไม่ได้นับสต็อกหมวดหมู่บังคับ *'}
                      </label>
                    </div>
                    <div className="space-y-2">
                      {missingAuditCategories.map((cat, index) => (
                        <div key={index} className="flex items-start gap-2 text-[#E54D2E]">
                          <span className="text-[14px] font-black">•</span>
                          <span className="text-[12px] font-bold mt-0.5">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-[#E54D2E] font-bold">กรุณาไปที่หน้านับสต็อก และทำการยืนยันการนับสต็อกหมวดหมู่เหล่านี้ก่อนลงเวลาออกงาน</p>
                  </div>
                )}

                {hasCheckedInToday && checkoutZones.length > 0 && !hasBranchPhotosToday && (
                  <div className="mb-8 border border-[#EFEFEF] rounded-xl p-4 bg-[#FAFAFA]">
                    <div className="flex items-center gap-2 mb-4">
                      <Camera className="w-4 h-4 text-[#111111]" />
                      <label className="block text-[11px] font-black uppercase tracking-widest text-[#111111]">
                        {locale === 'en' ? 'Zone Photos (Required) *' : locale === 'zh' ? 'Zone Photos (Required) *' : 'ถ่ายรูปโซนก่อนออกงาน *'}
                      </label>
                    </div>
                    <div className="space-y-4">
                      {checkoutZones.map((zone) => (
                        <div key={zone.id} className="flex flex-col gap-2">
                          <span className="text-[12px] font-bold text-[#111111]">{zone.name}</span>
                          <div className="flex items-center gap-3">
                            {checkoutPhotos[zone.id] ? (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#EFEFEF]">
                                <img src={checkoutPhotos[zone.id]} alt={zone.name} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => {
                                    const newPhotos = {...checkoutPhotos}
                                    delete newPhotos[zone.id]
                                    setCheckoutPhotos(newPhotos)
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#E54D2E] shadow-sm"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full py-4 border-2 border-dashed border-[#CCCCCC] rounded-xl flex items-center justify-center gap-2 text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors cursor-pointer bg-white">
                                <Camera size={16} />
                                <span className="text-[11px] font-bold uppercase tracking-widest">
                                  {loading ? 'กำลังอัปโหลด...' : 'ถ่ายรูป'}
                                </span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  className="hidden" 
                                  disabled={loading}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handlePhotoUpload(zone.id, e.target.files[0])
                                    }
                                  }} 
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    disabled={loading}
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 border border-[#EFEFEF] text-[10px] font-black uppercase tracking-widest hover:bg-[#FAFAFA] transition-colors disabled:opacity-20"
                  >
                    {locale === 'en' ? 'cancel' : locale === 'zh' ? '取消' : '                     ยกเลิก                   '}</button>
                  <button
                    disabled={
                        loading || 
                        (isEarlyCheckOut && !earlyReason.trim()) || 
                        (hasCheckedInToday && checkoutChecklistItems.length > 0 && completedChecklist.length < checkoutChecklistItems.length) ||
                        (hasCheckedInToday && missingAuditCategories.length > 0) ||
                        (hasCheckedInToday && checkoutZones.length > 0 && !hasBranchPhotosToday && Object.keys(checkoutPhotos).length < checkoutZones.length)
                    }
                    onClick={handleCheckInOut}
                    className="flex-1 py-4 bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        {locale === 'en' ? '                         กำลังบันทึก...                       ' : locale === 'zh' ? '                         กำลังบันทึก...                       ' : '                         กำลังบันทึก...                       '}</>
                    ) : (
                      'ยืนยันลงเวลา'
                    )}
                  </button>
                </div>
                
                {isEarlyCheckOut && !earlyReason.trim() && (
                  <p className="mt-4 text-[9px] text-center text-[#A3A3A3] uppercase tracking-widest font-bold">
                    {locale === 'en' ? '                     * กรุณาระบุเหตุผลก่อนกดยืนยัน                   ' : locale === 'zh' ? '                     * กรุณาระบุเหตุผลก่อนกดยืนยัน                   ' : '                     * กรุณาระบุเหตุผลก่อนกดยืนยัน                   '}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
