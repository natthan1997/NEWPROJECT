"use client";
import Link from 'next/link';
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/I18nContext'
import { appCopy, pickLocalizedText } from '@/lib/appLocale'
import { formatDateByLocale, formatDateTimeByLocale, formatCurrencyByLocale } from '@/lib/localeFormat'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  UserIcon,
  XMarkIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Loader2, Landmark, Clock, CalendarDays, ChevronLeft, Package, Calculator } from 'lucide-react'
import { useSidebar } from '../_shared/sidebar-context'
import { AttendanceCheckIn } from '@/components/dashboard/AttendanceCheckIn'
import PointGenerator from '@/components/pos/PointGenerator'
import { StaffWorkCalendar } from '@/components/dashboard/StaffWorkCalendar'
import { StaffGamification } from '@/components/dashboard/StaffGamification';
import LiveClock from '@/components/dashboard/LiveClock';
import NotificationBell from '@/components/NotificationBell';

export default function StaffDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { sidebarLocked } = useSidebar();
  const { user, profile } = useAuth();
  const { locale } = useI18n()
  const router = useRouter();
  const copy = appCopy.staffDashboard
  
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Attendance Instant Clock States
  const [todayAttendanceLogs, setTodayAttendanceLogs] = useState<any[]>([])
  const [clockingIn, setClockingIn] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [attendanceNotice, setAttendanceNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null)
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [checkedItems, setCheckedItems] = useState<number[]>([])
  const [canViewShiftSummary, setCanViewShiftSummary] = useState(false)
  const [latestClosedShiftId, setLatestClosedShiftId] = useState<string | null>(null)
  
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

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

  useEffect(() => {
    if (profile?.id) {
      fetchAttendanceSummary();
      fetchTodayAttendance();
      fetchChecklistSettings();
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
      .from('attendance')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('clock_in', start.toISOString())
      .lte('clock_in', end.toISOString())
      .order('clock_in', { ascending: true })

    if (data) {
      setTodayAttendanceLogs(data)
    }
  }

  const fetchAttendanceSummary = async () => {
    if (!profile?.id) return;
    try {
      setAttendanceSummary(prev => ({ ...prev, isLoading: true }));
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (data) {
        setRealTimeProfile(data);
        const { data: salaryData } = await supabase
          .from('staff_salary_summary')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        if (salaryData) {
          setAttendanceSummary({
            daysWorked: salaryData.days_worked || 0,
            lateMinutes: salaryData.late_minutes || 0,
            lateCount: salaryData.late_count || 0,
            otHours: salaryData.ot_hours || 0,
            leaveDays: salaryData.leave_days || 0,
            holidaysUsed: salaryData.holidays_used || 0,
            holidaysPaid: salaryData.holidays_paid || 0,
            deductions: salaryData.deductions || 0,
            lateDeduction: salaryData.late_deduction || 0,
            socialSecurityDeduction: salaryData.social_security_deduction || 0,
            baseSalary: salaryData.base_salary || 0,
            otPay: salaryData.ot_pay || 0,
            holidayPay: salaryData.holiday_pay || 0,
            netSalary: salaryData.net_salary || 0,
            latestPendingLeave: null,
            isLoading: false
          });
        }
      }
    } catch (err) {
      console.error("Error fetching attendance summary:", err);
    } finally {
      setLoading(false);
      setAttendanceSummary(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleInstantClockIn = async () => {
    if (!profile?.id) return;
    setClockingIn(true);
    setAttendanceNotice(null);
    try {
      const response = await fetch('/api/staff/verify-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          branchCode: profile.branch_code,
          isClockIn: true
        })
      });
      const result = await response.json();
      if (result.success) {
        setAttendanceNotice({
          type: 'success',
          title: locale === 'en' ? 'Clock In Successful' : 'ลงเวลาเข้างานสำเร็จ',
          message: result.message || 'บันทึกเวลาเข้างานเรียบร้อยแล้ว'
        });
        fetchTodayAttendance();
        fetchAttendanceSummary();
      } else {
        setAttendanceNotice({
          type: 'error',
          title: locale === 'en' ? 'Clock In Failed' : 'ลงเวลาเข้างานล้มเหลว',
          message: result.error || 'เกิดข้อผิดพลาดในการลงเวลา'
        });
      }
    } catch (error: any) {
      setAttendanceNotice({
        type: 'error',
        title: 'Error',
        message: error.message || 'Network error'
      });
    } finally {
      setClockingIn(false);
    }
  };

  const handleInstantClockOut = async () => {
    if (!profile?.id) return;
    setClockingIn(true);
    setAttendanceNotice(null);
    try {
      const response = await fetch('/api/staff/verify-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          branchCode: profile.branch_code,
          isClockIn: false
        })
      });
      const result = await response.json();
      if (result.success) {
        setAttendanceNotice({
          type: 'success',
          title: locale === 'en' ? 'Clock Out Successful' : 'ลงเวลาออกงานสำเร็จ',
          message: result.message || 'บันทึกเวลาออกงานเรียบร้อยแล้ว'
        });
        fetchTodayAttendance();
        fetchAttendanceSummary();
      } else {
        setAttendanceNotice({
          type: 'error',
          title: locale === 'en' ? 'Clock Out Failed' : 'ลงเวลาออกงานล้มเหลว',
          message: result.error || 'เกิดข้อผิดพลาดในการลงเวลาออกงาน'
        });
      }
    } catch (error: any) {
      setAttendanceNotice({
        type: 'error',
        title: 'Error',
        message: error.message || 'Network error'
      });
    } finally {
      setClockingIn(false);
      setShowClockOutModal(false);
    }
  };

  const isClockedIn = todayAttendanceLogs.length > 0 && !todayAttendanceLogs[todayAttendanceLogs.length - 1].clock_out;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto py-6 px-4 md:px-6">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {locale === 'en' ? 'Staff Portal' : 'ระบบพนักงาน RUSH UP'}
          </h1>
          <p className="text-gray-500 text-lg">
            {locale === 'en' ? `Welcome back, ${profile?.display_name || 'Staff'}` : `ยินดีต้อนรับกลับ, คุณ ${profile?.display_name || 'พนักงาน'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
          <NotificationBell />
        </div>
      </div>

      {pendingConfirmation && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">{locale === 'en' ? 'Verification Pending' : 'อยู่ระหว่างรอการอนุมัติ'}</h3>
            <p className="text-sm text-amber-700 mt-1">
              {locale === 'en' ? 'Your account verification is pending administrator approval.' : 'บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและเปิดใช้งาน'}
            </p>
          </div>
        </div>
      )}

      {/* Attendance & Payroll Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Clocking Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-800" />
              {locale === 'en' ? 'Attendance Check-in' : 'บันทึกเวลาเข้า-ออกงาน'}
            </h2>
            
            {attendanceNotice && (
              <div className={`mb-4 p-4 rounded-xl border ${
                attendanceNotice.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <h4 className="font-bold text-sm">{attendanceNotice.title}</h4>
                <p className="text-xs mt-1">{attendanceNotice.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">
                  {locale === 'en' ? 'Current Status:' : 'สถานะปัจจุบัน:'}
                </p>
                <p className={`text-lg font-bold mt-1 ${isClockedIn ? 'text-green-600' : 'text-gray-500'}`}>
                  {isClockedIn 
                    ? (locale === 'en' ? 'Checked In' : 'เข้างานอยู่') 
                    : (locale === 'en' ? 'Off Duty' : 'ยังไม่เข้างาน')}
                </p>
                {isClockedIn && todayAttendanceLogs[todayAttendanceLogs.length - 1] && (
                  <p className="text-xs text-gray-400 mt-1">
                    {locale === 'en' ? 'Clocked in at:' : 'เวลาเข้างาน: '}{new Date(todayAttendanceLogs[todayAttendanceLogs.length - 1].clock_in).toLocaleTimeString('th-TH')}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                {!isClockedIn ? (
                  <button
                    onClick={handleInstantClockIn}
                    disabled={clockingIn}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {clockingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                    {locale === 'en' ? 'Clock In' : 'ลงเวลาเข้างาน'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowClockOutModal(true)}
                    disabled={clockingIn}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {locale === 'en' ? 'Clock Out' : 'ลงเวลาออกงาน'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Salary Summary Dashboard */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-gray-800" />
              {locale === 'en' ? 'Salary & Attendance Summary' : 'สรุปเวลาทำงานและเงินเดือน'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500">{locale === 'en' ? 'Days Worked' : 'จำนวนวันทำงาน'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceSummary.daysWorked}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500">{locale === 'en' ? 'Late Count' : 'จำนวนครั้งที่สาย'}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{attendanceSummary.lateCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500">{locale === 'en' ? 'OT Hours' : 'ชั่วโมง OT'}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{attendanceSummary.otHours} ชม.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500">{locale === 'en' ? 'Net Pay (Est.)' : 'เงินเดือนสุทธิ (โดยประมาณ)'}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrencyByLocale(attendanceSummary.netSalary, locale)}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-4">
              <Link href="/dashboard/staff/schedule" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                {locale === 'en' ? 'Work Schedule' : 'ตารางเวรทำงาน'}
              </Link>
              <Link href="/dashboard/staff/leaves" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                {locale === 'en' ? 'Request Leave' : 'ยื่นใบลาพักร้อน'}
              </Link>
              {canViewShiftSummary && latestClosedShiftId && (
                <Link href={`/share/shift-summary/${latestClosedShiftId}`} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  {locale === 'en' ? 'Latest Shift Report' : 'ดูรายงาน Shift ล่าสุด'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <StaffGamification />
          {/* Quick POS link */}
          <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <Package size={150} />
            </div>
            <h3 className="text-lg font-bold mb-2">{locale === 'en' ? 'Point of Sale (POS)' : 'เครื่องแคชเชียร์ POS'}</h3>
            <p className="text-xs text-gray-400 mb-6">{locale === 'en' ? 'Open POS terminal, check tables, input orders, and cash out customer bills.' : 'เปิดขายหน้าร้าน รับออเดอร์ลูกค้า โต๊ะอาหาร คูปอง และเช็กบิล'}</p>
            <Link href="/dashboard/pos" className="inline-block px-5 py-2.5 bg-white text-gray-950 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
              {locale === 'en' ? 'Launch POS Terminal' : 'เข้าสู่หน้าจอ POS'}
            </Link>
          </div>
        </div>
      </div>

      {/* Clock Out Confirmation Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {locale === 'en' ? 'Confirm Clock Out' : 'ยืนยันการลงเวลาออกงาน'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'en' 
                ? 'Are you sure you want to end your shift? Make sure you have completed the checkout checklist before leaving.' 
                : 'คุณแน่ใจว่าต้องการลงเวลาออกงานและเสร็จสิ้นการปฏิบัติหน้าที่ใช่หรือไม่? กรุณาตรวจสอบเช็คลิสต์เคลียร์ร้านให้ครบก่อนออกจากงาน'}
            </p>
            
            {checklistItems.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl text-left border border-gray-100 max-h-[150px] overflow-y-auto">
                <p className="text-xs font-bold text-gray-700 mb-2">{locale === 'en' ? 'Closing Checklist:' : 'เช็คลิสต์ปิดร้าน:'}</p>
                <div className="space-y-2">
                  {checklistItems.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checkedItems.includes(idx)} 
                        onChange={() => {
                          setCheckedItems(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
                        }} 
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowClockOutModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button 
                onClick={handleInstantClockOut} 
                disabled={checklistItems.length > 0 && checkedItems.length < checklistItems.length}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {locale === 'en' ? 'Confirm Out' : 'ออกงานทันที'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
