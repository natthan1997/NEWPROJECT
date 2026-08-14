"use client";
import Link from 'next/link';
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { JobService, JobAssignment } from "@/lib/jobService";
import { supabase } from '@/lib/supabaseClient';
import { createNotificationWithRetry } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/I18nContext'
import { appCopy, pickLocalizedText } from '@/lib/appLocale'
import { isFollowUpOrder } from '@/lib/serviceFlow'
import { formatDateByLocale, formatDateTimeByLocale } from '@/lib/localeFormat'
import { calculateDistance } from '@/lib/geoUtils'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP);

import { 
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlayIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  XMarkIcon,
  ArrowPathIcon,
  CameraIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { Loader2, Landmark, Clock, CalendarDays, ChevronLeft, Package, Calculator } from 'lucide-react'
import { useSidebar } from '../_shared/sidebar-context'
import { AttendanceCheckIn } from '@/components/dashboard/AttendanceCheckIn'
import PointGenerator from '@/components/pos/PointGenerator'
import { StaffWorkCalendar } from '@/components/dashboard/StaffWorkCalendar'
import Holidays from 'date-holidays';
import { StaffGamification } from '@/components/dashboard/StaffGamification';
import LiveClock from '@/components/dashboard/LiveClock';
import NotificationBell from '@/components/NotificationBell';

interface TaskStats {
  today: number;
  pending: number;
  inProgress: number;
  completedThisWeek: number;
  total: number;
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'completed' | 'started' | 'assigned';
}

interface OpenOrder {
  id: string
  order_code?: string | null
  status: string
  scheduled_date?: string | null
  total?: number | null
  notes?: string | null
  special_instructions?: string | null
  services?: { service_name?: string | null } | null
  houses?: { 
    name?: string | null; 
    address?: string | null;
    house_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    zone_code?: string | null;
  } | null
  profiles?: {
    display_name?: string | null;
    phone?: string | null;
  } | null
}

export default function StaffDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { sidebarLocked } = useSidebar();
  const { user, profile } = useAuth();
  const { locale } = useI18n()
  const router = useRouter();
  const copy = appCopy.staffDashboard
  
  // States
  const [jobs, setJobs] = useState<JobAssignment[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    today: 0,
    pending: 0,
    inProgress: 0,
    completedThisWeek: 0,
    total: 0
  });
  const [attendanceSummary, setAttendanceSummary] = useState({
    daysWorked: 0,
    lateMinutes: 0,
    lateCount: 0,
    otHours: 0,
    leaveDays: 0,
    holidaysUsed: 0,
    holidaysPaid: 0,
    deductions: 0,
    lateDeduction: 0,
    socialSecurityDeduction: 0,
    baseSalary: 0,
    otPay: 0,
    holidayPay: 0,
    netSalary: 0,
    latestPendingLeave: null as any,
    isLoading: false
  });
  const [realTimeProfile, setRealTimeProfile] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [claimingOrderId, setClaimingOrderId] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  // Attendance Instant Clock States
  const [todayAttendanceLogs, setTodayAttendanceLogs] = useState<any[]>([])
  const [clockingIn, setClockingIn] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [attendanceNotice, setAttendanceNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [checkedItems, setCheckedItems] = useState<number[]>([])
  const [requiredAuditCategories, setRequiredAuditCategories] = useState<string[]>([])
  const [missingAuditCategories, setMissingAuditCategories] = useState<any[]>([])
  const allChecklistCompleted = checklistItems.length === 0 || checkedItems.length === checklistItems.length;
  
  // Checkout Photos
  const [requiredPhotoZones, setRequiredPhotoZones] = useState<any[]>([])
  const [missingPhotoZones, setMissingPhotoZones] = useState<any[]>([])
  const [checkoutPhotos, setCheckoutPhotos] = useState<{ [zone_id: string]: File }>({})
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [canViewShiftSummary, setCanViewShiftSummary] = useState(false)
  const [latestClosedShiftId, setLatestClosedShiftId] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      if (profile?.id && !profile.is_verified) {
        const { data } = await supabase
          .from('staff_identity')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle()
        setPendingConfirmation(!!data)
      }
    }
    checkStatus()
  }, [profile])
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OpenOrder | null>(null)

  useEffect(() => {
    if (profile?.id) {
      console.log('--- Staff Dashboard State ---');
      console.log('Profile ID:', profile.id);
      console.log('Role:', profile.role);
      console.log('Staff Type:', profile.staff_type);
      
      const isActuallyCafe = profile.staff_type === 'cafe';
      fetchAttendanceSummary();
      fetchTodayAttendance();
      fetchChecklistSettings();
      if (!isActuallyCafe) {
        refreshAll()
      }
    }
  }, [profile]);

  const fetchChecklistSettings = async () => {
    if (!profile?.branch_code) return;
    
    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('branch_code', profile.branch_code)
        .maybeSingle()
      
      if (branch) {
        const { data: settings } = await supabase
          .from('pos_shop_settings')
          .select('opening_hours, checkout_photo_zones, role_permissions')
          .eq('branch_id', branch.id)
          .maybeSingle()
          
        if (settings) {
        // Check shift summary permission
        const role = profile.staff_level || profile.role || 'staff';
        const isAdmin = ['admin', 'owner', 'superadmin'].includes(role);
        const hasPermission = isAdmin || (settings.role_permissions?.[role] || []).includes('staff:shift-summary');
        setCanViewShiftSummary(hasPermission);

        if (hasPermission) {
          const { data: latestShift } = await supabase
            .from('pos_shifts')
            .select('id')
            .eq('branch_id', branch.id)
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (latestShift) {
            setLatestClosedShiftId(latestShift.id);
          }
        }

        if (settings?.opening_hours?.checkout_checklist) {
            setChecklistItems(settings.opening_hours.checkout_checklist)
          }
          if (settings.opening_hours.required_audit_categories) {
            setRequiredAuditCategories(settings.opening_hours.required_audit_categories)
          }
        }
        if (settings?.checkout_photo_zones) {
          setRequiredPhotoZones(settings.checkout_photo_zones)
        }

      }
    } catch (err) {
      console.error('Error fetching checklist settings', err)
    }
  }

  const fetchTodayAttendance = async () => {
    if (!profile?.id) return
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString())
      .order('timestamp', { ascending: false })

    if (data) {
      setTodayAttendanceLogs(data)
    }
  }

  const hasCheckedInToday = todayAttendanceLogs.some(log => log.type === 'check_in')
  const hasCheckedOutToday = todayAttendanceLogs.some(log => log.type === 'check_out')
  const isCheckedIn = hasCheckedInToday && !hasCheckedOutToday
  const isCompletedToday = hasCheckedInToday && hasCheckedOutToday

  const handleHeroClockClick = async () => {
    if (isCompletedToday) {
      setAttendanceNotice({
        type: 'info',
        title: 'บันทึกเวลาครบถ้วนแล้ว',
        message: 'วันนี้คุณได้ลงเวลาเข้างานและออกงานเรียบร้อยแล้วค่ะ'
      })
      return
    }

    if (isCheckedIn) {
      // Clock Out -> Require Confirmation Modal First to avoid accidental clicks
      
      // 1. Check required stock audits
      if (requiredAuditCategories.length > 0) {
        setClockingIn(true)
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        
        // Get all staff IDs in the same branch
        const { data: branchStaff } = await supabase
           .from('profiles')
           .select('id')
           .eq('branch_code', profile.branch_code)
        
        const branchStaffIds = branchStaff?.map(s => s.id) || [profile.id]

        const { data: sessions } = await supabase
          .from('pos_inventory_audit_sessions')
          .select('notes')
          .in('staff_id', branchStaffIds)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
        
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
            const { data: catData } = await supabase
              .from('inventory_categories')
              .select('id, name')
              .in('id', missingIds)
            
            setMissingAuditCategories(catData || missingIds.map(id => ({ id, name: id })))
          } else {
            setMissingAuditCategories([])
          }
        } else {
          setMissingAuditCategories([])
        }
      }

      // 2. Check required photo zones
      if (requiredPhotoZones.length > 0) {
        setClockingIn(true)
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)

        let bStaffIds = [profile.id]
        if (profile.branch_code) {
          const { data: branchStaff } = await supabase
             .from('profiles')
             .select('id')
             .eq('branch_code', profile.branch_code)
          if (branchStaff) {
             bStaffIds = branchStaff.map(s => s.id)
          }
        }

        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('checkout_zone_photos')
          .in('profile_id', bStaffIds)
          .eq('type', 'check_out')
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString())
          .not('checkout_zone_photos', 'is', null)

        let uploadedZoneIds = new Set<string>()
        if (logs) {
          for (const log of logs) {
            if (log.checkout_zone_photos && Array.isArray(log.checkout_zone_photos)) {
              log.checkout_zone_photos.forEach((photo: any) => {
                if (photo.zone_id) uploadedZoneIds.add(photo.zone_id)
              })
            }
          }
        }

        const missingZones = requiredPhotoZones.filter(zone => !uploadedZoneIds.has(zone.id))
        setMissingPhotoZones(missingZones)
        setClockingIn(false)
      } else {
        setMissingPhotoZones([])
      }

      setShowClockOutModal(true)
      return
    }

    // Clock In
    await executeClockAction('check_in')
  }

  const executeClockAction = async (type: 'check_in' | 'check_out') => {
    if (!profile?.id) return
    setClockingIn(true)
    setAttendanceNotice(null)

    // Fetch Branch Geofence Location
    const { data: branch } = await supabase
      .from('branches')
      .select('id, latitude, longitude')
      .eq('branch_code', profile.branch_code || 'MAIN')
      .maybeSingle()

    let targetLat = branch?.latitude || 13.7563
    let targetLng = branch?.longitude || 100.5018
    let targetRadius = 50

    if (branch?.id) {
      const { data: settings } = await supabase
        .from('pos_shop_settings')
        .select('check_in_radius, latitude, longitude')
        .eq('branch_id', branch.id)
        .maybeSingle()

      if (settings?.latitude) targetLat = Number(settings.latitude)
      if (settings?.longitude) targetLng = Number(settings.longitude)
      if (settings?.check_in_radius) targetRadius = Number(settings.check_in_radius)
    }

    if (!navigator.geolocation) {
      setAttendanceNotice({
        type: 'error',
        title: 'ไม่สามารถดึงตำแหน่งพิกัดได้',
        message: 'อุปกรณ์ของคุณไม่รองรับการดึงพิกัด GPS'
      })
      setClockingIn(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const distMeters = Math.round(calculateDistance(latitude, longitude, targetLat, targetLng) * 1000)
        const isWithin = distMeters <= targetRadius

        if (!isWithin) {
          setAttendanceNotice({
            type: 'error',
            title: 'อยู่นอกพื้นที่ร้าน',
            message: `ท่านอยู่ห่างจากจุดลงเวลา ${distMeters} เมตร (อนุญาตไม่เกิน ${targetRadius} เมตร)`
          })
          setClockingIn(false)
          setShowClockOutModal(false)
          return
        }

        let mappedZonePhotos: any[] = []
        if (type === 'check_out' && Object.keys(checkoutPhotos).length > 0) {
          setIsUploadingPhotos(true)
          const { data: { session } } = await supabase.auth.getSession()
          for (const [zoneId, photoFile] of Object.entries(checkoutPhotos)) {
            const formData = new FormData()
            formData.append('file', photoFile)
            formData.append('bucket', 'attendance-photos')
            try {
              const res = await fetch('/api/admin/storage/upload', {
                method: 'POST',
                headers: {
                  ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                },
                body: formData
              })
              const data = await res.json()
              if (data.publicUrl) {
                mappedZonePhotos.push({ zone_id: zoneId, url: data.publicUrl })
              }
            } catch (e) {
              console.error('Failed to upload photo for zone ' + zoneId, e)
            }
          }
          setIsUploadingPhotos(false)
        }

        const insertPayload: any = {
          profile_id: profile.id,
          type,
          latitude,
          longitude,
          is_within_range: true
        }

        if (type === 'check_out' && mappedZonePhotos.length > 0) {
          insertPayload.checkout_zone_photos = mappedZonePhotos
        }

        const { error: insErr } = await supabase.from('attendance_logs').insert(insertPayload)

        if (insErr) {
          setAttendanceNotice({
            type: 'error',
            title: 'เกิดข้อผิดพลาดในการลงเวลา',
            message: insErr.message
          })
        } else {
          const now = new Date()
          const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'

          if (type === 'check_in') {
            const shiftStart = profile.shift_start || '08:30'
            const [sHrs, sMins] = shiftStart.split(':').map(Number)
            const shiftTotalMins = sHrs * 60 + sMins
            const currentTotalMins = now.getHours() * 60 + now.getMinutes()
            const lateMins = currentTotalMins - shiftTotalMins

            if (lateMins <= 0) {
              setAttendanceNotice({
                type: 'success',
                title: `เข้างานเวลา ${timeStr}`,
                message: 'เข้างานตรงเวลา/ก่อนเวลา ยอดเยี่ยมมากค่ะ! 🎉'
              })
            } else {
              setAttendanceNotice({
                type: 'warning',
                title: `เข้างานเวลา ${timeStr}`,
                message: `เข้างานสาย ${lateMins} นาที (กะเริ่ม ${shiftStart} น.)`
              })
            }
          } else {
            setAttendanceNotice({
              type: 'success',
              title: `ออกงานเวลา ${timeStr}`,
              message: 'บันทึกเวลาเลิกงานเรียบร้อย ขอให้เดินทางกลับบ้านโดยสวัสดิภาพค่ะ! 🏠'
            })
          }

          fetchTodayAttendance()
          fetchAttendanceSummary()
        }
        setClockingIn(false)
        setShowClockOutModal(false)
      },
      (err) => {
        setAttendanceNotice({
          type: 'error',
          title: 'ดึงพิกัดตำแหน่งไม่สำเร็จ',
          message: err.code === err.PERMISSION_DENIED
            ? 'กรุณาเปิดสิทธิ์เข้าถึง Location (ตำแหน่งที่ตั้ง) บนเบราว์เซอร์แล้วลองอีกครั้ง'
            : 'ไม่สามารถดึงข้อมูลพิกัด GPS ได้ในขณะนี้'
        })
        setClockingIn(false)
        setShowClockOutModal(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const fetchAttendanceSummary = async () => {
    if (!profile?.id) return
    setAttendanceSummary(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Fetch latest profile info for accurate wage calculations
      const { data: latestProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (latestProfile) setRealTimeProfile(latestProfile);
      
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      // 1. Fetch attendance logs
      const { data: attendanceData } = await supabase
        .from('attendance_logs')
        .select('*, profiles(shift_start)')
        .eq('profile_id', profile.id)
        .gte('timestamp', firstDay)
        .lte('timestamp', lastDay)

      // 2. Fetch leaves
      const { data: leaveData } = await supabase
        .from('staff_leaves')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'approved')
        .gte('start_date', firstDay)
        .lte('start_date', lastDay)

      // 2.5 Fetch latest pending leave
      const { data: pendingLeaveData } = await supabase
        .from('staff_leaves')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // 3. Fetch cash advances (deductions)
      const { data: advanceData } = await supabase
        .from('staff_cash_advances')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('advance_date', firstDay)
        .lte('advance_date', lastDay)

      // 4. Fetch shop settings for grace period
      const { data: shopSettings } = await supabase
        .from('pos_shop_settings')
        .select('shift_settings')
        .maybeSingle()

      let gracePeriod = 10;
      if (shopSettings?.shift_settings) {
        const shiftSettings = typeof shopSettings.shift_settings === 'string' ? JSON.parse(shopSettings.shift_settings) : shopSettings.shift_settings;
        if (shiftSettings.late_grace_period_minutes !== undefined) {
          gracePeriod = Number(shiftSettings.late_grace_period_minutes);
        }
      }

      const hd = new Holidays('TH');

      let daysWorked = 0
      let lateMinutes = 0
      let lateCount = 0
      let otHours = 0
      let holidaysUsed = 0
      let holidaysPaid = 0

      if (attendanceData) {
        const groupedByDate: Record<string, any> = {}
        attendanceData.forEach(log => {
          const dateStr = new Date(log.timestamp).toLocaleDateString()
          if (!groupedByDate[dateStr]) groupedByDate[dateStr] = []
          groupedByDate[dateStr].push(log)
        })

        Object.values(groupedByDate).forEach((logs: any[]) => {
          const checkInLog = logs.find(l => l.type === 'check_in')
          const checkOutLog = logs.find(l => l.type === 'check_out')

          if (checkInLog) {
            daysWorked++
            
            // Calculate late minutes
            const shiftStart = checkInLog.profiles?.shift_start || "08:30"
            const [sHour, sMin] = shiftStart.split(':').map(Number)
            const checkInDate = new Date(checkInLog.timestamp)
            const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes()
            const targetMins = (sHour || 8) * 60 + (sMin || 30)
            
            if (checkInMins > targetMins + gracePeriod) {
              lateMinutes += (checkInMins - targetMins)
              lateCount++
            }
            
            // Count holidays
            const dateObj = checkInDate;
            const holidaysForDay = hd.isHoliday(dateObj);
            const isPublicHoliday = holidaysForDay && holidaysForDay.length > 0;
            
            if (isPublicHoliday && checkInLog.holiday_pay_status !== 'rejected') {
              // Auto-approve based on profile preference if they worked on a public holiday
              const activeProfile = latestProfile || profile;
              if (activeProfile?.holiday_compensation_type === 'dayoff' || checkInLog.holiday_pay_status === 'approved_dayoff') {
                holidaysUsed++
              } else {
                holidaysPaid++
              }
            } else if (checkInLog.holiday_pay_status === 'approved_dayoff') {
              holidaysUsed++
            } else if (checkInLog.holiday_pay_status === 'approved_pay') {
              holidaysPaid++
            }
          }

          // Calculate OT
          if (checkOutLog && checkOutLog.ot_status === 'approved') {
            otHours += (checkOutLog.ot_approved_minutes || 0) / 60
          }
        })
      }

      const leaveDays = leaveData ? leaveData.length : 0
      const deductions = advanceData ? advanceData.reduce((acc, curr) => acc + Number(curr.amount), 0) : 0
      
      const activeProfile = latestProfile || profile;
      const salaryType = activeProfile?.salary_type || 'daily'
      const compType = activeProfile?.holiday_compensation_type || 'money';
      const dailyWage = Number(activeProfile?.daily_wage || 0)
      const otRate = Number(activeProfile?.overtime_rate_per_hour || 0)

      const otPay = otHours * otRate
      const holidayPay = compType === 'dayoff' ? 0 : (holidaysPaid * (salaryType === 'monthly' ? (dailyWage / 30) : dailyWage))
      const baseSalary = salaryType === 'monthly' ? dailyWage : (daysWorked * dailyWage)
      
      let hourlyRate = 0
      if (salaryType === 'monthly') {
          hourlyRate = (dailyWage / 30) / 8
      } else {
          hourlyRate = dailyWage / 8
      }
      const lateDeduction = (hourlyRate / 60) * lateMinutes
      
      let socialSecurityDeduction = 0;
      if (activeProfile?.has_social_security && baseSalary > 0) {
        const ssfAmount = Math.round(baseSalary * 0.05);
        socialSecurityDeduction = Math.min(750, ssfAmount);
      }

      const netSalary = Math.max(0, baseSalary + otPay + holidayPay - deductions - lateDeduction - socialSecurityDeduction)

      setAttendanceSummary({
        daysWorked,
        lateMinutes,
        lateCount,
        otHours,
        leaveDays,
        holidaysUsed,
        holidaysPaid,
        deductions,
        lateDeduction,
        socialSecurityDeduction,
        baseSalary,
        otPay,
        holidayPay,
        netSalary,
        latestPendingLeave: pendingLeaveData || null,
        isLoading: false
      })

    } catch (err) {
      console.error('Error fetching attendance summary:', err)
      setAttendanceSummary(prev => ({ ...prev, isLoading: false }))
    } finally {
      setLoading(false);
    }
  }

  const fetchOpenOrders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/staff/open-orders?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
      })

      const result = await response.json().catch(() => ({}))
      console.log('Open Orders API Result:', result);
      if (!response.ok) {
        throw new Error(result?.error || pickLocalizedText(locale, copy.loadOpenOrdersFailed))
      }

      setOpenOrders((result?.orders || []) as OpenOrder[])
    } catch (err) {
      console.error('Failed to fetch open orders:', err)
      setOpenOrders([])
    }
  }

  const refreshAll = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(),
        fetchOpenOrders()
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleClaimOrder = async (order: OpenOrder) => {
    setClaimingOrderId(order.id)
    setMessage(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/staff/open-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ orderId: order.id }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || pickLocalizedText(locale, copy.claimFailed))
      }

      setMessage({ type: 'success', text: pickLocalizedText(locale, copy.claimSuccess) })
      await refreshAll()
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || pickLocalizedText(locale, copy.claimFailed) })
    } finally {
      setClaimingOrderId(null)
    }
  }

  // ดึงข้อมูลงานทั้งหมด
  const fetchJobs = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(false); // fetchJobs called by refreshAll which sets loading=true
      setError("");
      
      const jobsData = await JobService.getStaffJobs(profile.id);
      setJobs(jobsData);
      
      // คำนวณสถิติ
      calculateStats(jobsData);
      
      // สร้างกิจกรรมล่าสุด
      generateRecentActivities(jobsData);
      
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // คำนวณสถิติจากข้อมูลงาน
  const calculateStats = (jobsData: JobAssignment[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    let todayCount = 0;
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedThisWeekCount = 0;

    jobsData.forEach(job => {
      // นับงานวันนี้
      if (job.assigned_date) {
        const assignedDate = new Date(job.assigned_date);
        if (assignedDate >= today) {
          todayCount++;
        }
      }

      // นับตามสถานะ
      if (job.status === 'assigned') pendingCount++;
      if (job.status === 'in_progress') inProgressCount++;
      
      // นับงานที่เสร็จสิ้นในสัปดาห์นี้
      if (job.status === 'completed' && job.completed_at) {
        const completedDate = new Date(job.completed_at);
        if (completedDate >= weekStart) {
          completedThisWeekCount++;
        }
      }
    });

    setStats({
      today: todayCount,
      pending: pendingCount,
      inProgress: inProgressCount,
      completedThisWeek: completedThisWeekCount,
      total: jobsData.length
    });
  };

  // สร้างกิจกรรมล่าสุด
  const generateRecentActivities = (jobsData: JobAssignment[]) => {
    const activities: RecentActivity[] = [];

    jobsData.forEach(job => {
      if (job.completed_at) {
        activities.push({
          id: job.id + '_completed',
          description: `${pickLocalizedText(locale, copy.activityCompleted)} #${job.id.slice(0, 8)}`,
          timestamp: job.completed_at,
          type: 'completed'
        });
      }
      
      if (job.started_at) {
        activities.push({
          id: job.id + '_started',
          description: `${pickLocalizedText(locale, copy.activityStarted)} #${job.id.slice(0, 8)}`,
          timestamp: job.started_at,
          type: 'started'
        });
      }
      
      activities.push({
        id: job.id + '_assigned',
        description: `${pickLocalizedText(locale, copy.activityAssigned)} #${job.id.slice(0, 8)}`,
        timestamp: job.created_at,
        type: 'assigned'
      });
    });

    // เรียงตามเวลาล่าสุด
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 5));
  };

  // ส่งแจ้งเตือน
  const sendNotification = async (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (!profile?.id) return;

    const { error } = await createNotificationWithRetry({
      user_id: profile.id,
      title: pickLocalizedText(locale, copy.notificationTitle),
      message,
      type,
      read: false,
    }, { context: 'staff.dashboard.self' });

    if (error) {
      console.error('❌ Failed to create staff notification:', error);
    }
  };

  // อัปเดตสถานะงาน
  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    if (!profile?.id) {
      console.error('❌ No profile ID available');
      return;
    }
    
    try {
      setIsUpdating(jobId);
      
      console.log('🔄 Staff updating job status:', { 
        jobId, 
        newStatus, 
        staffId: profile.id,
        currentJobs: jobs.length 
      });
      
      // อัปเดตสถานะ
      const updatedJob = await JobService.updateJobStatus(jobId, newStatus, profile.id);
      console.log('✅ Job updated returned:', updatedJob);
      
      // รีเฟรชข้อมูลทันที
      console.log('🔄 Refreshing jobs data...');
      await fetchJobs();
      
      const statusMessages = {
        'in_progress': pickLocalizedText(locale, copy.startSuccess),
        'completed': pickLocalizedText(locale, copy.completeSuccess)
      };
      
      const successMessage = statusMessages[newStatus as keyof typeof statusMessages] || 'อัปเดตสถานะสำเร็จ';
      
      setMessage({
        type: 'success',
        text: successMessage
      });

      await sendNotification(successMessage, 'success');
      
      // ลบข้อความหลัง 3 วินาที
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('❌ Error updating job status:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      console.error('❌ Full error details:', error);
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
      await sendNotification(errorMessage, 'warning');
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsUpdating(null);
    }
  };

  // Helper functions
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-[#1A1A1A]" />;
      case 'started':
        return <ClockIcon className="h-4 w-4 text-[#1A1A1A]" />;
      case 'assigned':
        return <ExclamationTriangleIcon className="h-4 w-4 text-[#70706B]" />;
      default:
        return <CalendarDaysIcon className="h-4 w-4 text-[#70706B]" />;
    }
  };

  const isCafe = profile?.staff_type === 'cafe';
  const freshOpenOrders = openOrders.filter((order) => !isFollowUpOrder(order))
  const followUpOpenOrders = openOrders.filter((order) => isFollowUpOrder(order))

  const renderOpenOrderCard = (order: OpenOrder, variant: 'fresh' | 'follow-up') => {
      const { locale } = useI18n();
    const houseData = Array.isArray(order?.houses) ? order.houses[0] : order?.houses;
    const serviceData = Array.isArray(order?.services) ? order.services[0] : order?.services;
    const isFollowUpVariant = variant === 'follow-up'

    return (
      <div
        key={order.id}
        className={`p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between rounded-[24px] shadow-sm ${
          isFollowUpVariant ? 'bg-[#FFFDF7]' : 'bg-white'
        }`}
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-5 gap-3">
            <div className="min-w-0">
              {isFollowUpVariant && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A68A49] block mb-1">FOLLOW-UP VISIT</span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] block mb-2">
                {order.order_code || `#${order.id.slice(0, 8)}`}
              </span>
              <h3 className="text-[16px] font-bold text-[#1A1A18] tracking-tight leading-tight truncate">
                {serviceData?.service_name || 'งานดูแลสวน'}
              </h3>
            </div>
            <div className="text-right shrink-0">
              {isFollowUpVariant ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B5F22] bg-[#F7F2E6] px-3 py-1.5 rounded-full">{locale === 'en' ? 'ต่อเนื่อง' : locale === 'zh' ? 'ต่อเนื่อง' : 'ต่อเนื่อง'}</span>
              ) : (
                <div className="bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-[#F0F0F0]">
                  <span className="text-[14px] font-bold text-[#1A1A18]">{locale === 'en' ? '฿' : locale === 'zh' ? '฿' : '฿'}{order.total?.toLocaleString() || '0'}</span>
                  <p className="text-[9px] text-[#A3A3A3] uppercase tracking-widest font-medium mt-0.5">{locale === 'en' ? 'รายได้' : locale === 'zh' ? 'รายได้' : 'รายได้'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="w-4 h-4 text-[#70706B]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-medium uppercase tracking-widest text-[#A3A3A3] block">{locale === 'en' ? 'วันนัดหมาย' : locale === 'zh' ? 'วันนัดหมาย' : 'วันนัดหมาย'}</span>
                <span className="text-[12px] font-bold text-[#1A1A18] uppercase tracking-widest">
                  {formatDateByLocale(order.scheduled_date, locale)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] flex items-center justify-center shrink-0">
                <MapPinIcon className="w-4 h-4 text-[#70706B]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-medium uppercase tracking-widest text-[#A3A3A3] block">{locale === 'en' ? 'location' : locale === 'zh' ? '地点' : 'สถานที่'}</span>
                <span className="text-[12px] font-bold text-[#1A1A18] uppercase tracking-widest truncate block">
                  {houseData?.name || 'ไม่ระบุ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <button
            onClick={() => handleClaimOrder(order)}
            disabled={claimingOrderId === order.id}
            className={`w-full text-white py-4 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-30 active:scale-[0.98] ${
              isFollowUpVariant ? 'bg-[#7B5F22] hover:bg-[#604818]' : 'bg-[#1A1A18] hover:bg-black'
            }`}
          >
            {claimingOrderId === order.id ? 'กำลังดำเนินการ...' : isFollowUpVariant ? 'รับงานต่อเนื่อง' : 'กดรับงานทันที'}
          </button>
          <button
            onClick={() => setSelectedOrderForDetail(order)}
            className={`w-full py-3.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all ${
              isFollowUpVariant
                ? 'bg-transparent text-[#7B5F22] hover:bg-[#F7F2E6]'
                : 'bg-[#FAFAFA] text-[#70706B] hover:bg-gray-100'
            }`}
          >
            {locale === 'en' ? 'ดูรายละเอียดงาน' : locale === 'zh' ? 'ดูรายละเอียดงาน' : 'ดูรายละเอียดงาน'}
          </button>
        </div>
      </div>
    )
  }

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo('.gsap-reveal', 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'transform'
        }
      );
    }
  }, { dependencies: [loading], scope: containerRef });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E5E5DF] rounded-full animate-spin border-t-[#1A1A1A] mx-auto"></div>
          <div className="mt-4 text-[#70706B] font-medium">{pickLocalizedText(locale, copy.loading)}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className={`transition-all duration-300 ${sidebarLocked ? "ml-64" : "ml-0"} bg-[#F5F5F7] text-[#1D1D1F] font-sans min-h-screen pb-24`}>
        {/* 📱 Organic Top Navigation Bar */}
        <div className="pt-6 pb-4 px-5 max-w-[800px] mx-auto flex items-center justify-between relative text-[#1A1A18] gsap-reveal opacity-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 shadow-sm relative border border-gray-100">
              <img 
                src={profile?.avatar_url || user?.user_metadata?.line_picture_url || user?.user_metadata?.picture_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 tracking-wide">สวัสดี</span>
              <span className="text-[15px] font-bold text-[#1A1A18] leading-tight mt-0.5">{profile?.display_name || 'พนักงาน'}</span>
              <span className="text-[11px] text-gray-500 font-medium mt-0.5">
                {profile?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : profile?.staff_type === 'cafe' ? 'พนักงานคาเฟ่' : profile?.staff_type === 'kitchen' ? 'พนักงานห้องครัว' : 'พนักงาน'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isCafe && (
              <Link href="/dashboard/staff/jobs" className="flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95 transition-all">
                <BriefcaseIcon className="w-5 h-5" />
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>

        {/* 🌿 Hero Attendance Card (Minimal) */}
        <div className="px-5 pb-2 pt-2 max-w-[800px] mx-auto text-[#1D1D1F] gsap-reveal opacity-0">
          <div className="rounded-[32px] p-6 shadow-sm border border-gray-100 bg-white relative overflow-hidden transition-all duration-500">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col text-[#1A1A18]">
                <span className="text-[12px] font-semibold text-gray-400 tracking-wide">เวลาปัจจุบัน</span>
                <span className="text-[44px] font-medium leading-none tracking-tighter mt-1 mb-2 font-mono">
                  <LiveClock />
                </span>
                <span className="text-[12px] font-semibold text-gray-400 tracking-wide">
                  {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleHeroClockClick}
                disabled={clockingIn || isCompletedToday}
                className={`w-[80px] h-[80px] rounded-[24px] flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${
                  isCompletedToday ? 'bg-gray-100 text-gray-400 border border-gray-200' :
                  isCheckedIn ? 'bg-[#1A1A18] text-white shadow-md' :
                  'bg-white text-[#1A1A18] border border-gray-200 shadow-sm hover:bg-gray-50'
                }`}
              >
                {clockingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin text-current" />
                ) : isCompletedToday ? (
                  <CheckCircleIcon className="w-6 h-6 text-current" />
                ) : isCheckedIn ? (
                  <div className="w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  </div>
                ) : (
                  <MapPinIcon className="w-6 h-6 text-current" />
                )}
                <span className="text-[10px] font-bold text-center leading-tight tracking-wide">
                  {clockingIn ? 'บันทึก...' : isCompletedToday ? 'ลงเวลาแล้ว' : isCheckedIn ? 'ลงเวลาออก' : 'ลงเวลาเข้า'}
                </span>
              </motion.button>
            </div>
            
            {/* Minimal Background decoration indicator */}
            {isCheckedIn && !isCompletedToday && (
              <div className="absolute top-0 right-0 w-2 h-full bg-[#1A1A18]"></div>
            )}
            {isCompletedToday && (
              <div className="absolute top-0 right-0 w-2 h-full bg-gray-200"></div>
            )}
          </div>
        </div>

        {/* 🤍 Main Content Container */}
        <main className="p-4 sm:p-6 relative z-20 max-w-[800px] mx-auto flex flex-col gap-6 text-[#1D1D1F] gsap-reveal opacity-0">

        {/* Gamification Dashboard */}
        {profile?.id && profile?.branch_code && (
            <StaffGamification profileId={profile.id} branchCode={profile.branch_code} />
        )}

        {/* Verification Alert */}
        {!profile?.is_verified && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`p-4 rounded-[24px] flex items-center justify-between shadow-xs border bg-white text-[#1A1A18] ${pendingConfirmation ? 'border-amber-200/60' : 'border-red-200'} gsap-reveal`}
          >
            <div className={`flex items-center gap-3 ${pendingConfirmation ? 'text-amber-800' : 'text-red-600'}`}>
              {pendingConfirmation ? (
                <Loader2 className="w-4.5 h-4.5 shrink-0 animate-spin" />
              ) : (
                <ExclamationTriangleIcon className="w-4.5 h-4.5 shrink-0" />
              )}
              <span className="text-xs font-bold leading-relaxed">
                {pendingConfirmation ? 'อยู่ระหว่างตรวจสอบบัญชี' : 'บัญชียังไม่ยืนยันตัวตน'}
              </span>
            </div>
            <Link 
              href="/dashboard/staff/profile?tab=verification" 
              className="text-xs font-bold px-4 py-1.5 rounded-full transition-transform active:scale-95 text-white bg-[#1A1A18] hover:bg-black"
            >
              {pendingConfirmation ? 'ดูข้อมูล' : 'ยืนยัน'}
            </Link>
          </motion.div>
        )}

        {/* Message Banner */}
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 border border-gray-200 p-3.5 rounded-[24px] bg-white text-[#1A1A18] text-xs font-bold text-center shadow-xs">
            {message.text}
          </motion.div>
        )}



        {/* Floating Attendance Notice Overlay Modal */}
        <AnimatePresence>
          {attendanceNotice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-xl border border-gray-100 text-center relative overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto border ${
                  attendanceNotice.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  attendanceNotice.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                  attendanceNotice.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                  'bg-gray-100 border-gray-200 text-gray-700'
                }`}>
                  {attendanceNotice.type === 'success' && <CheckCircleIcon className="w-7 h-7" />}
                  {attendanceNotice.type === 'warning' && <ExclamationTriangleIcon className="w-7 h-7" />}
                  {attendanceNotice.type === 'error' && <XMarkIcon className="w-7 h-7" />}
                  {attendanceNotice.type === 'info' && <ClockIcon className="w-7 h-7" />}
                </div>

                <h3 className="font-bold text-base text-[#1A1A18] mb-2 leading-tight">
                  {attendanceNotice.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  {attendanceNotice.message}
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAttendanceNotice(null)}
                  className="w-full py-3 px-4 rounded-full bg-[#1A1A18] hover:bg-black text-xs font-bold text-white transition-all shadow-xs active:scale-[0.98]"
                >
                  ตกลง / รับทราบ
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Clock Out Confirmation Modal */}
        {showClockOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto text-rose-600 shrink-0">
                <ClockIcon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-center text-[#1D1D1F] mb-1 shrink-0">
                ยืนยันการลงเวลาออกงาน?
              </h3>
              <p className="text-sm text-center text-gray-500 mb-6 shrink-0">
                โปรดตรวจสอบความเรียบร้อยก่อนลงเวลาออกงาน
              </p>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1">

                {/* Stock Audit Validation */}
                {missingAuditCategories.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-left">
                    <h4 className="text-sm font-semibold text-rose-700 mb-2">ยังไม่ได้นับสต็อกหมวดหมู่ต่อไปนี้:</h4>
                    <ul className="list-disc pl-5 text-sm text-rose-600 mb-3 space-y-1">
                      {missingAuditCategories.map((cat, idx) => (
                        <li key={idx}>{cat.name}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-rose-500/80 leading-relaxed">กรุณาไปที่ <span className="font-semibold">ระบบ POS &gt; จัดการสต็อก</span> เพื่อบันทึกการนับสต็อกหมวดหมู่เหล่านี้ให้เรียบร้อย</p>
                  </div>
                )}

                {/* Checklist */}
                {checklistItems.length > 0 && (
                  <div className="flex flex-col gap-3 mb-6">
                    {checklistItems.map((item, idx) => {
                      const isChecked = checkedItems.includes(idx);
                      return (
                        <label key={idx} className="flex items-start gap-3 cursor-pointer group text-left">
                          <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300 group-hover:border-emerald-500'}`}>
                            {isChecked && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-xs font-medium leading-relaxed transition-colors ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>{item}</span>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isChecked} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedItems(prev => [...prev, idx]);
                              } else {
                                setCheckedItems(prev => prev.filter(i => i !== idx));
                              }
                            }} 
                          />
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Photo Enforcement */}
                {missingPhotoZones.length > 0 && (
                  <div className="mb-6 text-left">
                    <label className="block text-sm font-semibold text-[#1D1D1F] mb-3">ถ่ายรูปความเรียบร้อยของโซน <span className="text-rose-500">*</span></label>
                    {missingAuditCategories.length > 0 ? (
                      <div className="p-4 bg-gray-50 rounded-2xl text-center">
                        <p className="text-xs text-gray-500">กรุณานับสต็อกให้เสร็จสิ้นก่อนทำการถ่ายรูป</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {missingPhotoZones.map((zone) => {
                          const hasPhoto = !!checkoutPhotos[zone.id]
                          return (
                            <div key={zone.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{zone.name}</p>
                                <p className="text-[10px] font-medium text-rose-500 mt-0.5">{hasPhoto ? 'ถ่ายรูปแล้ว' : 'รอการอัปโหลด'}</p>
                              </div>
                              {hasPhoto ? (
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                                  <img src={URL.createObjectURL(checkoutPhotos[zone.id])} className="w-full h-full object-cover" />
                                  <button onClick={() => {
                                    const newPhotos = {...checkoutPhotos}
                                    delete newPhotos[zone.id]
                                    setCheckoutPhotos(newPhotos)
                                  }} className="absolute top-0 right-0 bg-black/60 backdrop-blur text-white rounded-bl-lg p-1 hover:bg-rose-500 transition-colors">
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors text-gray-400">
                                  <CameraIcon className="w-5 h-5 mb-0.5" />
                                  <span className="text-[8px] font-medium">ถ่ายรูป</span>
                                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setCheckoutPhotos(prev => ({...prev, [zone.id]: e.target.files![0]}))
                                    }
                                  }} />
                                </label>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 shrink-0">
                  <button
                    onClick={() => {
                      setShowClockOutModal(false)
                      setCheckoutPhotos({})
                    }}
                    disabled={isUploadingPhotos || clockingIn}
                    className="flex-1 py-3 px-4 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  {missingAuditCategories.length > 0 ? (
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('xyl_pos_active_view', 'inventory');
                          window.location.href = '/dashboard/pos';
                        }
                      }}
                      className="flex-1 py-3 px-4 rounded-full text-xs font-bold text-white transition-all shadow-xs bg-[#1A1A18] hover:bg-black"
                    >
                      ไปนับสต็อกที่ POS
                    </button>
                  ) : (
                    <button
                      onClick={() => executeClockAction('check_out')}
                      disabled={!allChecklistCompleted || Object.keys(checkoutPhotos).length < missingPhotoZones.length || isUploadingPhotos || clockingIn}
                      className={`flex-1 py-3 px-4 rounded-full text-xs font-bold text-white transition-all flex items-center justify-center shadow-xs ${allChecklistCompleted && Object.keys(checkoutPhotos).length >= missingPhotoZones.length ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-300 cursor-not-allowed'}`}
                    >
                      {isUploadingPhotos ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'ยืนยันออกงาน'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Available Tasks Section (Garden Staff only) */}
        {!isCafe && (
          <section className="mt-2">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">งานที่พร้อมรับ</h3>
              {openOrders.length > 0 && (
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 tracking-wide">
                  {freshOpenOrders.length} งานใหม่ • {followUpOpenOrders.length} งานต่อเนื่อง
                </span>
              )}
            </div>

            {openOrders.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 px-2 tracking-wide">งานใหม่</h4>
                  {freshOpenOrders.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {freshOpenOrders.map((order) => renderOpenOrderCard(order, 'fresh'))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-[32px] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-white">
                      <p className="text-[12px] font-medium text-gray-400">ไม่มีงานใหม่ที่รอรับ</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 px-2 tracking-wide">งานดูแลต่อเนื่อง</h4>
                  {followUpOpenOrders.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {followUpOpenOrders.map((order) => renderOpenOrderCard(order, 'follow-up'))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-[32px] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-white">
                      <p className="text-[12px] font-medium text-gray-400">ยังไม่มีงานดูแลต่อเนื่องในคิว</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-white">
                <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[13px] font-medium text-gray-400">ไม่มีงานที่รอดำเนินการในขณะนี้</p>
                <button onClick={refreshAll} className="mt-5 text-[12px] font-semibold text-[#1D1D1F] hover:underline">
                  ตรวจสอบอีกครั้ง
                </button>
              </div>
            )}
          </section>
        )}

        {/* ===== STATS & ATTENDANCE DASHBOARD ===== */}
        <div className="w-full mt-2">
          {/* Cafe Staff Attendance & Salary Metrics */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center justify-between px-2 hidden">
              <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">ค่าแรงและการเข้างานประจำเดือน</h3>
            </div>

            {attendanceSummary.isLoading ? (
              <div className="flex justify-center py-10 bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-white">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Minimal 5 Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                    {/* Card 1: วันมาทำงาน */}
                    <Link href="/dashboard/staff/schedule" className="px-4 py-5 bg-white rounded-[24px] shadow-xs border border-gray-100 min-h-[100px] active:scale-95 transition-all flex flex-col justify-between group hover:border-gray-300">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">วันมาทำงาน</span>
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1A1A18] transition-colors" />
                        </div>
                        <div className="text-[20px] font-semibold text-[#1A1A18] tracking-tight">
                            {attendanceSummary.daysWorked} <span className="text-[10px] font-medium text-gray-400">วัน</span>
                        </div>
                    </Link>

                    {/* Card 2: มาสายรวม */}
                    <Link href="/dashboard/staff/lateness" className="px-4 py-5 bg-white rounded-[24px] shadow-xs border border-gray-100 min-h-[100px] active:scale-95 transition-all flex flex-col justify-between group hover:border-gray-300">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">มาสายรวม</span>
                          <ClockIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1A1A18] transition-colors" />
                        </div>
                        <div className="text-[20px] font-semibold text-[#1A1A18] tracking-tight">
                            {attendanceSummary.lateMinutes} <span className="text-[10px] font-medium text-gray-400">นาที</span>
                        </div>
                    </Link>

                    {/* Card 3: โอทีรวม */}
                    <Link href="/dashboard/staff/ot" className="px-4 py-5 bg-white rounded-[24px] shadow-xs border border-gray-100 min-h-[100px] active:scale-95 transition-all flex flex-col justify-between group hover:border-gray-300">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">โอที (OT)</span>
                          <ClockIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1A1A18] transition-colors" />
                        </div>
                        <div className="text-[20px] font-semibold text-[#1A1A18] tracking-tight">
                            {attendanceSummary.otHours.toFixed(1)} <span className="text-[10px] font-medium text-gray-400">ชม.</span>
                        </div>
                    </Link>

                    {/* Card 4: ลาหยุดใช้แล้ว */}
                    <Link href="/dashboard/staff/leaves" className="px-4 py-5 bg-white rounded-[24px] shadow-xs border border-gray-100 min-h-[100px] active:scale-95 transition-all flex flex-col justify-between group hover:border-gray-300">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">ลาใช้แล้ว</span>
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1A1A18] transition-colors" />
                        </div>
                        <div className="text-[20px] font-semibold text-[#1A1A18] tracking-tight">
                            {attendanceSummary.leaveDays} <span className="text-[10px] font-medium text-gray-400">วัน</span>
                        </div>
                    </Link>

                    {/* Card 5: รายงานปิดกะ */}
                    {canViewShiftSummary && (
                      <Link href={latestClosedShiftId ? `/share/shift-summary/${latestClosedShiftId}` : "#"} className={`px-4 py-5 bg-[#1A1A18] rounded-[24px] shadow-xs border border-[#1A1A18] min-h-[100px] active:scale-95 transition-all flex flex-col justify-between group hover:bg-black ${!latestClosedShiftId ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">รายงานกะ</span>
                            <DocumentTextIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                          </div>
                          <div className="text-[12px] font-semibold text-white leading-tight">
                              {latestClosedShiftId ? 'ดู Z-Report' : 'ไม่มีกะ'}
                          </div>
                      </Link>
                    )}
                </div>

                {/* Request Status Section (Minimal) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between px-1 mb-2.5">
                    <h3 className="text-[12px] font-bold text-[#1A1A18] uppercase tracking-wide">สถานะการส่งคำขอ</h3>
                    <Link href="/dashboard/staff/leaves" className="text-[10px] font-bold text-gray-400 hover:text-[#1A1A18] transition-colors">ดูทั้งหมด</Link>
                  </div>
                  {attendanceSummary.latestPendingLeave ? (
                    <div className="bg-white rounded-[20px] p-3.5 flex items-center gap-3 border border-gray-100 shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <CalendarDaysIcon className="w-4 h-4 text-[#1A1A18]" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[12px] font-bold text-[#1A1A18]">
                          {attendanceSummary.latestPendingLeave.leave_type === 'sick' ? 'ลาป่วย' :
                           attendanceSummary.latestPendingLeave.leave_type === 'personal' ? 'ลากิจ' :
                           attendanceSummary.latestPendingLeave.leave_type === 'vacation' ? 'ลาพักร้อน' : 'ลางาน'}
                        </span>
                        <span className="text-[10px] font-medium text-amber-600 mt-0.5">รออนุมัติจากแอดมิน</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {new Date(attendanceSummary.latestPendingLeave.start_date || attendanceSummary.latestPendingLeave.leave_date || attendanceSummary.latestPendingLeave.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[20px] p-3.5 flex items-center gap-3 border border-gray-100 shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[12px] font-bold text-gray-400">สถานะการลา</span>
                        <span className="text-[10px] font-medium text-gray-300 mt-0.5">ไม่มีคำขอที่รออนุมัติ</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Salary Calculation Section (Minimal) */}
                    <div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-xs mb-4">
                        <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-4">ประมาณการเงินเดือน</h4>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                <span className="text-[12px] text-gray-500 font-medium">ค่าแรงพื้นฐาน</span>
                                <span className="text-[13px] font-bold text-[#1A1A18]">{attendanceSummary.baseSalary.toLocaleString()} ฿</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                <span className="text-[12px] text-gray-500 font-medium">ล่วงเวลา (OT)</span>
                                <span className="text-[13px] font-semibold text-gray-600">+{attendanceSummary.otPay.toLocaleString()} ฿</span>
                            </div>
                            {(realTimeProfile?.holiday_compensation_type || profile?.holiday_compensation_type) !== 'dayoff' && (
                              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                  <span className="text-[12px] text-gray-500 font-medium">ชดเชยวันหยุด</span>
                                  <span className="text-[13px] font-semibold text-gray-600">+{attendanceSummary.holidayPay.toLocaleString()} ฿</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                <span className="text-[12px] text-gray-500 font-medium">หักเงิน / เบิก</span>
                                <span className="text-[13px] font-semibold text-gray-400">-{attendanceSummary.deductions.toLocaleString()} ฿</span>
                            </div>
                            {attendanceSummary.lateDeduction > 0 && (
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                <span className="text-[12px] text-rose-500 font-medium">หักมาสายอัตโนมัติ</span>
                                <span className="text-[13px] font-semibold text-rose-500">-{attendanceSummary.lateDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</span>
                            </div>
                            )}
                            {attendanceSummary.socialSecurityDeduction > 0 && (
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                <span className="text-[12px] text-rose-500 font-medium">หักประกันสังคม (SSF)</span>
                                <span className="text-[13px] font-semibold text-rose-500">-{attendanceSummary.socialSecurityDeduction.toLocaleString()} ฿</span>
                            </div>
                            )}
                            <div className="flex justify-between items-end pt-3 mt-1">
                                <span className="text-[11px] font-bold text-[#1A1A18] uppercase tracking-wide">รวมสุทธิ</span>
                                <span className="text-[24px] font-medium text-[#1A1A18] leading-none font-mono tracking-tight">{attendanceSummary.netSalary.toLocaleString()} <span className="text-[12px] text-gray-400 font-medium font-sans">฿</span></span>
                            </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
        </div>
      </main>

      {/* Task Intelligence Overlay */}
      <AnimatePresence>
        {selectedOrderForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col pt-12"
          >
            <div className="px-8 pb-12 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-12">
                 <button onClick={() => setSelectedOrderForDetail(null)} className="w-12 h-12 flex items-center justify-center border border-[#111111] hover:bg-[#FAFAFA] transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                 </button>
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A3A3A3]">{locale === 'en' ? 'ข้อมูลนัดหมายโดยละเอียด' : locale === 'zh' ? 'ข้อมูลนัดหมายโดยละเอียด' : 'ข้อมูลนัดหมายโดยละเอียด'}</span>
              </div>

              <div className="space-y-16">
                 {/* Header Info */}
                 <section>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3A3A3] block mb-4">{selectedOrderForDetail.order_code || 'XLM-ORDER'}</span>
                    <div className="flex items-center gap-3 flex-wrap">
                     <h2 className="font-serif-thai text-5xl font-light text-[#111111] tracking-tighter uppercase leading-none">
                       {selectedOrderForDetail.services?.service_name}
                     </h2>
                     {isFollowUpOrder(selectedOrderForDetail) && (
                      <span className="border border-[#C9B37E] bg-[#FFF7E4] px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#7B5F22]">
                        Follow-up
                      </span>
                     )}
                    </div>
                 </section>

                 <div className="grid md:grid-cols-2 gap-16">
                    {/* Customer & Location */}
                    <section className="space-y-10">
                       <div className="flex items-start gap-6">
                          <div className="w-12 h-12 flex items-center justify-center border border-[#EFEFEF] bg-[#FAFAFA] shrink-0">
                             <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                             <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A3A3] block mb-2">{locale === 'en' ? 'ข้อมูลลูกค้า' : locale === 'zh' ? 'ข้อมูลลูกค้า' : 'ข้อมูลลูกค้า'}</span>
                             <div className="text-xl font-serif-thai text-[#111111]">{selectedOrderForDetail.profiles?.display_name || 'ลูกค้าทั่วไป'}</div>
                             <div className="flex items-center gap-2 mt-3 cursor-pointer group">
                                <PhoneIcon className="w-3 h-3 text-[#A3A3A3]" />
                                <span className="text-[10px] font-bold text-[#A3A3A3] group-hover:text-[#111111] transition-colors">{selectedOrderForDetail.profiles?.phone || 'ไม่ระบุ'}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-start gap-6">
                          <div className="w-12 h-12 flex items-center justify-center border border-[#EFEFEF] bg-[#FAFAFA] shrink-0">
                             <MapPinIcon className="w-5 h-5" />
                          </div>
                          <div>
                             <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A3A3] block mb-2">{locale === 'en' ? 'สถานที่จัดส่งบริการ' : locale === 'zh' ? 'สถานที่จัดส่งบริการ' : 'สถานที่จัดส่งบริการ'}</span>
                             <div className="text-xl font-serif-thai text-[#111111] mb-2">{selectedOrderForDetail.houses?.name}</div>
                             <p className="text-[11px] leading-relaxed text-[#717171] uppercase font-bold tracking-tight mb-6">
                                {selectedOrderForDetail.houses?.address}
                             </p>
                             
                             {selectedOrderForDetail.houses && (
                               <a 
                                 href={selectedOrderForDetail.houses.latitude && selectedOrderForDetail.houses.longitude 
                                   ? `https://www.google.com/maps/dir/?api=1&destination=${selectedOrderForDetail.houses.latitude},${selectedOrderForDetail.houses.longitude}`
                                   : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrderForDetail.houses.address || selectedOrderForDetail.houses.name || '')}`
                                 }
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-3 bg-[#111111] text-white px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all"
                               >
                                  <MapPinIcon className="w-4 h-4" /> 
                                  {selectedOrderForDetail.houses.latitude ? 'นำทางด้วย GPS' : 'เปิดแผนที่ด้วยที่อยู่'}
                               </a>
                             )}
                          </div>
                       </div>
                    </section>

                    {/* Meta & Instructions */}
                    <section className="space-y-10">
                       <div className="grid grid-cols-2 gap-px bg-[#EFEFEF] border border-[#EFEFEF]">
                          <div className="bg-white p-6">
                             <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A3A3] block mb-2">Site Code</span>
                             <div className="text-sm font-bold text-[#111111]">{selectedOrderForDetail.houses?.house_code || 'XLM-BASE'}</div>
                          </div>
                          <div className="bg-white p-6">
                             <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A3A3] block mb-2">Zone</span>
                             <div className="text-sm font-bold text-[#111111]">{selectedOrderForDetail.houses?.zone_code || 'DEFAULT'}</div>
                          </div>
                       </div>

                       <div className="p-8 bg-[#FAFAFA] border border-[#EFEFEF]">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#111111] block mb-4">{locale === 'en' ? 'ข้อมูลเพิ่มเติมจากลูกค้า (สิทธิ์การเข้าพื้นที่)' : locale === 'zh' ? 'ข้อมูลเพิ่มเติมจากลูกค้า (สิทธิ์การเข้าพื้นที่)' : 'ข้อมูลเพิ่มเติมจากลูกค้า (สิทธิ์การเข้าพื้นที่)'}</span>
                          <p className="font-serif-thai italic text-lg text-[#717171] leading-relaxed">
                             {selectedOrderForDetail.notes || 'ลูกค้าไม่ได้ระบุข้อมูลเพิ่มเติม'}
                          </p>
                       </div>
                    </section>
                 </div>

                 {/* Action */}
                 <section className="pt-12 border-t border-[#EFEFEF]">
                    <button
                      onClick={() => { handleClaimOrder(selectedOrderForDetail); setSelectedOrderForDetail(null); }}
                      className="w-full bg-[#111111] text-white py-6 font-bold text-xs uppercase tracking-[0.5em] hover:scale-[1.01] active:scale-100 transition-all shadow-xl shadow-black/5"
                    >
                      {locale === 'en' ? '                       ยืนยันและรับงานทันที                     ' : locale === 'zh' ? '                       ยืนยันและรับงานทันที                     ' : '                       ยืนยันและรับงานทันที                     '}</button>
                    <p className="text-center text-[9px] text-[#A3A3A3] mt-6 font-bold uppercase tracking-widest">{locale === 'en' ? 'การกดรับงานหมายความว่าคุณพร้อมเข้าดำเนินการตามเวลานัดหมาย' : locale === 'zh' ? 'การกดรับงานหมายความว่าคุณพร้อมเข้าดำเนินการตามเวลานัดหมาย' : 'การกดรับงานหมายความว่าคุณพร้อมเข้าดำเนินการตามเวลานัดหมาย'}</p>
                 </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
