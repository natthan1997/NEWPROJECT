'use client';
import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit3, Trash2, Loader2, 
  ChevronRight, Save, LayoutGrid, X,
  Menu as MenuIcon, LogOut, Settings, Users,
  ShieldCheck, UserPlus, Phone, Mail,
  Calendar, Award, Briefcase, Trash, MapPin, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Clock, DollarSign, Star, FileText, Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useI18n } from "@/lib/I18nContext";

interface POSStaffManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift?: any
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
}

function CalendarGrid({ logsList, monthStr }: { logsList: any[]; monthStr: string }): React.ReactElement {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();

  const daysGrid: ({ day: number; logs: any[] } | null)[] = [];
  for (let i = 0; i < firstDay; i++) daysGrid.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const dayLogs = logsList.filter(a => {
      const dateObj = new Date(a.date);
      return dateObj.getDate() === d && (dateObj.getMonth() + 1) === month && dateObj.getFullYear() === year;
    });
    daysGrid.push({ day: d, logs: dayLogs });
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
        <div className="text-red-500">SUN (อา)</div>
        <div>MON (จ)</div>
        <div>TUE (อ)</div>
        <div>WED (พ)</div>
        <div>THU (พฤ)</div>
        <div>FRI (ศ)</div>
        <div className="text-blue-500">SAT (ส)</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysGrid.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="bg-gray-50/40 min-h-[85px] border border-gray-50"></div>;
          const hasLog = cell.logs.length > 0;
          return (
            <div key={`day-${cell.day}`} className={`min-h-[85px] p-2 border transition-all flex flex-col justify-between ${hasLog ? 'bg-white border-gray-300 shadow-xs' : 'bg-gray-50/20 border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${hasLog ? 'text-black' : 'text-gray-300'}`}>{cell.day}</span>
                {hasLog && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
              </div>
              <div className="space-y-1 my-1">
                {cell.logs.map((l: any, i: number) => (
                  <div key={i} className="text-[8px] font-bold p-1 bg-gray-50 border border-gray-100 leading-tight">
                    <div className="font-black text-black line-clamp-1">{l.profiles?.display_name || 'Staff'}</div>
                    <div className="text-gray-500 text-[7px] mt-0.5">
                      {l.clock_in ? new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      {l.clock_out ? `-${new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                    {l.late_minutes > 0 ? (
                      <span className="text-[7px] text-red-600 font-black block">สาย +{l.late_minutes}m</span>
                    ) : l.ot_hours > 0 ? (
                      l.ot_status === 'approved' ? (
                        <span className="text-[7px] text-green-700 font-black block bg-green-50 px-0.5">✓ OT +{l.ot_hours.toFixed(1)}h</span>
                      ) : l.ot_status === 'rejected' ? (
                        <span className="text-[7px] text-gray-400 font-black block line-through">✕ OT +{l.ot_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-[7px] text-amber-600 font-black block">⏳ OT +{l.ot_hours.toFixed(1)}h</span>
                      )
                    ) : (
                      <span className="text-[7px] text-green-600 font-black block">ตรงเวลา</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function POSStaffManager({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, setViewExtraHeader, shopSettings
}: POSStaffManagerProps): React.ReactElement {
  const { locale } = useI18n();
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  // Internal Tabs: 'list' | 'verification' | 'attendance'
  const [internalTab, setInternalTab] = useState<'list' | 'verification' | 'attendance'>('list')
  
  // Detail Panel State
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'attendance' | 'evaluations'>('info')
  const [isSaving, setIsSaving] = useState(false)

  // Verification & Attendance & Evaluations Data
  const [verifications, setVerifications] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])
  const [staffEvaluations, setStaffEvaluations] = useState<any[]>([])
  const [individualAttendances, setIndividualAttendances] = useState<any[]>([])
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0,7))
  const [attendanceViewMode, setAttendanceViewMode] = useState<'list' | 'calendar'>('list')
  const [slideOverViewMode, setSlideOverViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    fetchStaff()
    fetchPendingCount()
    fetchAttendances()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSettings?.branch_id])

  useEffect(() => {
    setViewExtraHeader(null);
    return () => setViewExtraHeader(null);
  }, [setViewExtraHeader]);

  useEffect(() => {
    if (internalTab === 'verification') {
        fetchVerifications()
    } else if (internalTab === 'attendance') {
        fetchAttendances()
    }
  }, [internalTab, shopSettings?.branch_id])

  useEffect(() => {
    if (selectedStaff) {
      fetchStaffEvaluations(selectedStaff.id)
      fetchStaffIndividualAttendance(selectedStaff.id)
    }
  }, [selectedStaff?.id])

  const fetchStaff = async () => {
    setLoading(true)
    const branchId = shopSettings?.branch_id

    let query = supabase.from('profiles').select('*').eq('role', 'staff').order('display_name')

    if (branchId) {
      const { data: branchData } = await supabase.from('branches').select('branch_code').eq('id', branchId).maybeSingle()
      if (branchData?.branch_code) {
        query = query.eq('branch_code', branchData.branch_code)
      }
    }

    const { data } = await query
    if (data) setStaff(data)
    setLoading(false)
  }

  const fetchPendingCount = async () => {
    const { count } = await supabase.from('staff_identity').select('*', { count: 'exact', head: true }).is('verified_at', null)
    setPendingCount(count || 0)
  }

  const fetchVerifications = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_identity').select('*, profiles(display_name, full_name, email, staff_code, is_verified)').order('created_at', { ascending: false })
    if (data) setVerifications(data)
    setLoading(false)
  }

  const fetchStaffEvaluations = async (staffId: string) => {
    const { data } = await supabase
      .from('pos_staff_evaluations')
      .select('*, profiles!evaluator_id(display_name)')
      .eq('staff_id', staffId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
    if (data) setStaffEvaluations(data)
    else setStaffEvaluations([])
  }

  const fetchStaffIndividualAttendance = async (staffId: string) => {
    const { data } = await supabase
      .from('attendance_logs')
      .select('*, profiles(display_name, staff_code, shift_start, shift_end)')
      .eq('profile_id', staffId)
      .order('timestamp', { ascending: false })
      .limit(300)

    if (data) {
       const grouped: Record<string, any> = {};
       data.forEach(log => {
           const d = new Date(log.timestamp);
           const dateStr = d.toLocaleDateString();
           const key = `${dateStr}-${log.profile_id}`;
           if (!grouped[key]) {
               grouped[key] = {
                   id: key,
                   profile_id: log.profile_id,
                   date: d,
                   profiles: log.profiles,
                   clock_in: null,
                   clock_out: null,
                   total_hours: null,
                   late_minutes: 0,
                   ot_hours: 0
               };
           }
           if (log.type === 'check_in') {
               if (!grouped[key].clock_in || new Date(grouped[key].clock_in) > new Date(log.timestamp)) {
                   grouped[key].clock_in = log.timestamp;

                   const shiftStart = log.profiles?.shift_start || "08:30";
                   const [sHour, sMin] = shiftStart.split(':').map(Number);
                   const checkInDate = new Date(log.timestamp);
                   const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
                   const targetMins = (sHour || 8) * 60 + (sMin || 30);
                   const gracePeriod = 10;

                   if (checkInMins > targetMins + gracePeriod) {
                       grouped[key].late_minutes = checkInMins - targetMins;
                   } else {
                       grouped[key].late_minutes = 0;
                   }
               }
           } else if (log.type === 'check_out') {
               if (!grouped[key].clock_out || new Date(grouped[key].clock_out) < new Date(log.timestamp)) {
                   grouped[key].clock_out = log.timestamp;
               }
           }
       });

       const groupedList = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
       groupedList.forEach(item => {
           if (item.clock_in && item.clock_out) {
               const diffMs = new Date(item.clock_out).getTime() - new Date(item.clock_in).getTime();
               item.total_hours = diffMs / (1000 * 60 * 60);

               // Calculate OT Hours
               const shiftEnd = item.profiles?.shift_end || "17:30";
               const [eHour, eMin] = shiftEnd.split(':').map(Number);
               const checkOutDate = new Date(item.clock_out);
               const checkOutMins = checkOutDate.getHours() * 60 + checkOutDate.getMinutes();
               const targetEndMins = (eHour || 17) * 60 + (eMin || 30);

               if (checkOutMins > targetEndMins) {
                   const rawOtMins = checkOutMins - targetEndMins;
                   item.ot_hours = rawOtMins / 60;
               } else {
                   item.ot_hours = 0;
               }
           }
       });

       setIndividualAttendances(groupedList)
    } else {
       setIndividualAttendances([])
    }
  }

  const fetchAttendances = async () => {
    setLoading(true)

    // Query attendance_logs directly
    let query = supabase.from('attendance_logs').select('*, profiles(display_name, staff_code, shift_start)').order('timestamp', { ascending: false }).limit(500)

    const { data } = await query
    
    if (data) {
       // Group logs into daily check-in/out records
       const grouped: Record<string, any> = {};
       data.forEach(log => {
           const d = new Date(log.timestamp);
           const dateStr = d.toLocaleDateString();
           const key = `${dateStr}-${log.profile_id}`;
           if (!grouped[key]) {
               grouped[key] = {
                   id: key,
                   profile_id: log.profile_id,
                   date: d,
                   profiles: log.profiles,
                   clock_in: null,
                   clock_out: null,
                   total_hours: null,
                   late_minutes: 0
               };
           }
           if (log.type === 'check_in') {
               if (!grouped[key].clock_in || new Date(grouped[key].clock_in) > new Date(log.timestamp)) {
                   grouped[key].clock_in = log.timestamp;

                   const shiftStart = log.profiles?.shift_start || "08:30";
                   const [sHour, sMin] = shiftStart.split(':').map(Number);
                   const checkInDate = new Date(log.timestamp);
                   const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
                   const targetMins = (sHour || 8) * 60 + (sMin || 30);
                   const gracePeriod = 10;

                   if (checkInMins > targetMins + gracePeriod) {
                       grouped[key].late_minutes = checkInMins - targetMins;
                   } else {
                       grouped[key].late_minutes = 0;
                   }
               }
           } else if (log.type === 'check_out') {
               if (!grouped[key].clock_out || new Date(grouped[key].clock_out) < new Date(log.timestamp)) {
                   grouped[key].clock_out = log.timestamp;
               }
           }
       });

       const groupedList = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
       
       // Calculate total hours
       groupedList.forEach(item => {
           if (item.clock_in && item.clock_out) {
               const diffMs = new Date(item.clock_out).getTime() - new Date(item.clock_in).getTime();
               item.total_hours = diffMs / (1000 * 60 * 60);
           }
       });

       setAttendances(groupedList)
    }
    setLoading(false)
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update({
        staff_level: selectedStaff.staff_level,
        staff_type: selectedStaff.staff_type,
        department: selectedStaff.department,
        daily_wage: selectedStaff.daily_wage,
        salary_type: selectedStaff.salary_type,
        is_pos_account: selectedStaff.is_pos_account
    }).eq('id', selectedStaff.id)
    if (!error) {
        fetchStaff()
    }
    setIsSaving(false)
  }

  const approveVerification = async (identityId: string, profileId: string) => {
    await supabase.from('staff_identity').update({ verified_at: new Date().toISOString() }).eq('id', identityId)
    await supabase.from('profiles').update({ is_verified: true }).eq('id', profileId)
    fetchVerifications()
    fetchPendingCount()
    fetchStaff()
  }

  // Access Control: Only manager or admin
  const isOwnerOrAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isManager = profile?.staff_level === 'manager' || profile?.staff_level === 'admin';

  if (!isOwnerOrAdmin && !isManager) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
              <ShieldCheck size={64} className="text-gray-300 mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-2">Access Restricted</h2>
              <p className="text-sm font-bold text-gray-500">Only Managers and Administrators can access Staff Management.</p>
          </div>
      );
  }

  const filteredStaff = staff.filter(s => 
    s.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMonthStr = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const filteredAttendances = (selectedStaffFilter === 'all' 
    ? attendances 
    : attendances.filter(a => a.profile_id === selectedStaffFilter)
  ).filter(a => getMonthStr(a.date) === selectedMonth);

  const handleApproveOT = async (logId: string, status: 'approved' | 'rejected', otMinutes: number) => {
    if (!logId) {
      alert('ไม่พบข้อมูลรายการตอกบัตรเลิกงาน');
      return;
    }
    const { error } = await supabase.from('attendance_logs').update({
      ot_status: status,
      ot_approved_minutes: status === 'approved' ? otMinutes : 0
    }).eq('id', logId);

    if (!error) {
      if (selectedStaff) {
        fetchStaffIndividualAttendance(selectedStaff.id);
      }
      fetchAttendances();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกสถานะ OT');
    }
  };

  // Calculations for selected staff in slide-over
  const monthIndividualAttendances = individualAttendances.filter(a => getMonthStr(a.date) === selectedMonth);
  const totalDaysWorked = monthIndividualAttendances.length;
  const totalHoursWorked = monthIndividualAttendances.reduce((acc, cur) => acc + (cur.total_hours || 0), 0);
  const totalApprovedOTHours = monthIndividualAttendances
    .filter(a => a.ot_status === 'approved')
    .reduce((acc, cur) => acc + (cur.ot_approved_minutes ? cur.ot_approved_minutes / 60 : (cur.ot_hours || 0)), 0);
  const totalPendingOTHours = monthIndividualAttendances
    .filter(a => a.ot_status !== 'approved' && a.ot_status !== 'rejected' && (a.ot_hours || 0) > 0)
    .reduce((acc, cur) => acc + (cur.ot_hours || 0), 0);
  const totalLateMinutes = monthIndividualAttendances.reduce((acc, cur) => acc + (cur.late_minutes || 0), 0);

  // FULL PAGE STAFF PROFILE VIEW (When a staff is clicked)
  if (selectedStaff) {
      return (
          <div className="h-full flex flex-col bg-[#FAFAF8] overflow-y-auto no-scrollbar font-bold p-6 sm:p-10 space-y-6">
              {/* Header & Back Navigation */}
              <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-200 pb-6 shrink-0">
                  <div>
                      <button 
                          onClick={() => { setSelectedStaff(null); setIsDetailOpen(false); }}
                          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-3 group"
                      >
                          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                          กลับไปยังหน้ารายชื่อพนักงาน (Back to Staff List)
                      </button>
                      <div className="flex items-center gap-3">
                          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A18]">
                              {selectedStaff.display_name || selectedStaff.full_name}
                          </h1>
                          {selectedStaff.is_verified ? (
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 border border-green-200">Verified Profile</span>
                          ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 border border-amber-200">Unverified</span>
                          )}
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mt-1">
                          รหัส: {selectedStaff.staff_code || 'NO ID'} • สิทธิ์: {selectedStaff.staff_level?.toUpperCase()} • แผนก: {selectedStaff.staff_type?.toUpperCase()}
                      </p>
                  </div>

                  {detailTab === 'info' && (
                      <button
                          onClick={handleUpdateStaff}
                          disabled={isSaving}
                          className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
                      >
                          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                          บันทึกการเปลี่ยนแปลง (Save Profile)
                      </button>
                  )}
              </div>

              {/* Full Width Tabs */}
              <div className="max-w-6xl mx-auto w-full">
                  <div className="flex bg-white border border-gray-200 p-1 gap-2 shadow-xs">
                      <button 
                          onClick={() => setDetailTab('info')}
                          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${detailTab === 'info' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                      >
                          ข้อมูลส่วนตัว & การตั้งค่าเงินเดือน
                      </button>
                      <button 
                          onClick={() => setDetailTab('attendance')}
                          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${detailTab === 'attendance' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                      >
                          ประวัติเข้างาน / OT / ปฏิทิน
                      </button>
                      <button 
                          onClick={() => setDetailTab('evaluations')}
                          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${detailTab === 'evaluations' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                      >
                          ผลการประเมินงาน & KPI ({staffEvaluations.length})
                      </button>
                  </div>
              </div>

              {/* Body Content Area */}
              <div className="max-w-6xl mx-auto w-full pb-16 flex-1">
                  
                  {/* TAB 1: PROFILE & WAGES */}
                  {detailTab === 'info' && (
                      <div className="bg-white border border-gray-200 p-8 space-y-8 shadow-sm">
                          <div>
                              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">ข้อมูลติดต่อ & ตำแหน่ง</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                  <div className="bg-gray-50 p-4 border border-gray-100">
                                      <span className="text-xs font-bold text-gray-400 block mb-1">Contact Email</span>
                                      <span className="text-sm font-black text-black">{selectedStaff.email || '-'}</span>
                                  </div>
                                  <div className="bg-gray-50 p-4 border border-gray-100">
                                      <span className="text-xs font-bold text-gray-400 block mb-1">Phone Number</span>
                                      <span className="text-sm font-black text-black">{selectedStaff.phone_number || '-'}</span>
                                  </div>
                                  <div className="bg-gray-50 p-4 border border-gray-100">
                                      <span className="text-xs font-bold text-gray-400 block mb-1">Branch Code</span>
                                      <span className="text-sm font-black text-black">{selectedStaff.branch_code || 'Headquarter'}</span>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">การตั้งค่าสิทธิ์ & เงินเดือน</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Access Level (ระดับสิทธิ์)</label>
                                      <select value={selectedStaff.staff_level || ''} onChange={e => setSelectedStaff({...selectedStaff, staff_level: e.target.value})} className="w-full bg-gray-50 border border-gray-200 py-3.5 px-4 text-sm outline-none font-black text-black">
                                          <option value="staff">STAFF (พนักงานทั่วไป)</option>
                                          <option value="manager">MANAGER (ผู้จัดการ)</option>
                                          <option value="admin">ADMINISTRATOR (แอดมิน)</option>
                                      </select>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Department / Duty Type (แผนก)</label>
                                      <select value={selectedStaff.staff_type || ''} onChange={e => setSelectedStaff({...selectedStaff, staff_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 py-3.5 px-4 text-sm outline-none font-black text-black">
                                          <option value="cafe">CAFE OPERATIONS (หน้าร้านคาเฟ่)</option>
                                          <option value="kitchen">KITCHEN (ห้องครัว)</option>
                                          <option value="general">GENERAL DUTY (ทั่วไป)</option>
                                      </select>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Salary Type (ประเภทเงินเดือน)</label>
                                      <select value={selectedStaff.salary_type || 'daily'} onChange={e => setSelectedStaff({...selectedStaff, salary_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 py-3.5 px-4 text-sm outline-none font-black text-black">
                                          <option value="daily">รายวัน (Daily)</option>
                                          <option value="monthly">รายเดือน (Monthly)</option>
                                      </select>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Wage / Salary Amount (บาท)</label>
                                      <input 
                                          type="number" 
                                          value={selectedStaff.daily_wage || 0} 
                                          onChange={e => setSelectedStaff({...selectedStaff, daily_wage: Number(e.target.value)})} 
                                          className="w-full bg-gray-50 border border-gray-200 py-3.5 px-4 text-sm outline-none font-black text-black"
                                      />
                                  </div>
                              </div>

                              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between bg-gray-50 p-4">
                                  <div>
                                      <span className="text-xs font-black uppercase tracking-[0.2em] text-black block">POS Auto-Login Account</span>
                                      <span className="text-xs text-gray-400 font-bold">อนุญาตให้ใช้สิทธิ์ล็อกอินเข้าหน้าร้าน POS โดยอัตโนมัติ</span>
                                  </div>
                                  <button
                                      onClick={() => setSelectedStaff({...selectedStaff, is_pos_account: !selectedStaff.is_pos_account})}
                                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${selectedStaff.is_pos_account ? 'bg-black' : 'bg-gray-200'}`}
                                  >
                                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${selectedStaff.is_pos_account ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* TAB 2: ATTENDANCE & OT */}
                  {detailTab === 'attendance' && (
                      <div className="space-y-6">
                          {/* Month Selector & View Mode Toggle */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 border border-gray-200 shadow-sm gap-4">
                              <div className="flex bg-gray-100 p-0.5 border border-gray-200">
                                  <button 
                                      onClick={() => setSlideOverViewMode('list')}
                                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${slideOverViewMode === 'list' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-black'}`}
                                  >
                                      รายการตาราง (List View)
                                  </button>
                                  <button 
                                      onClick={() => setSlideOverViewMode('calendar')}
                                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${slideOverViewMode === 'calendar' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-black'}`}
                                  >
                                      ปฏิทินรายเดือน (Calendar View)
                                  </button>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">เลือกประจำเดือน:</span>
                                  <input 
                                      type="month" 
                                      value={selectedMonth} 
                                      onChange={(e) => setSelectedMonth(e.target.value)}
                                      className="bg-gray-50 border border-gray-200 py-2 px-4 text-xs font-black text-black outline-none cursor-pointer"
                                  />
                              </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white border border-gray-200 p-6 text-center shadow-xs">
                                  <div className="text-xs font-black uppercase tracking-widest text-gray-400">วันทำงานสะสม ({selectedMonth})</div>
                                  <div className="text-4xl font-black text-black mt-2">{totalDaysWorked} <span className="text-xs font-bold text-gray-400">วัน</span></div>
                              </div>
                              <div className="bg-amber-50/50 border border-amber-200 p-6 text-center shadow-xs">
                                  <div className="text-xs font-black uppercase tracking-widest text-amber-600">โอทีรวมสะสม (OT)</div>
                                  <div className="text-3xl font-black text-amber-700 mt-2">{totalApprovedOTHours.toFixed(1)} <span className="text-xs font-bold text-amber-600">ชม. (อนุมัติแล้ว)</span></div>
                                  {totalPendingOTHours > 0 && (
                                      <div className="text-[10px] font-bold text-amber-600 mt-1">รออนุมัติ: {totalPendingOTHours.toFixed(1)} ชม.</div>
                                  )}
                              </div>
                              <div className="bg-red-50/50 border border-red-200 p-6 text-center shadow-xs">
                                  <div className="text-xs font-black uppercase tracking-widest text-red-500">นาทีมาสายสะสม</div>
                                  <div className="text-4xl font-black text-red-600 mt-2">{totalLateMinutes} <span className="text-xs font-bold text-red-500">นาที</span></div>
                              </div>
                          </div>

                          {/* Render Calendar or Table List */}
                          {slideOverViewMode === 'calendar' ? (
                                  <CalendarGrid logsList={monthIndividualAttendances} monthStr={selectedMonth} />
                          ) : (
                              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                                  <table className="w-full text-left">
                                      <thead>
                                          <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                              <th className="px-6 py-4">วันที่ (Date)</th>
                                              <th className="px-6 py-4">เวลาเข้างาน (Clock In)</th>
                                              <th className="px-6 py-4">เวลาออกงาน (Clock Out)</th>
                                              <th className="px-6 py-4">สถานะ (Status)</th>
                                              <th className="px-6 py-4">ชั่วโมงทำงานรวม</th>
                                              <th className="px-6 py-4">อนุมัติ OT (Overtime)</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                          {monthIndividualAttendances.map(a => (
                                              <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                                  <td className="px-6 py-5 text-sm font-bold text-black">{new Date(a.date).toLocaleDateString()}</td>
                                                  <td className="px-6 py-5 text-sm font-bold text-green-600">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '-'}</td>
                                                  <td className="px-6 py-5 text-sm font-bold text-gray-500">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '-'}</td>
                                                  <td className="px-6 py-5">
                                                      {a.late_minutes > 0 ? (
                                                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 flex items-center gap-1 w-max">
                                                              <Clock size={10} /> +{a.late_minutes}m สาย
                                                          </span>
                                                      ) : a.clock_in ? (
                                                          <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 w-max block">
                                                              ตรงเวลา (On Time)
                                                          </span>
                                                      ) : (
                                                          <span className="text-gray-300 text-xs">-</span>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-5 text-sm font-bold text-black">{a.total_hours ? parseFloat(a.total_hours).toFixed(2) + 'h' : '-'}</td>
                                              </tr>
                                          ))}
                                          {monthIndividualAttendances.length === 0 && (
                                              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">ไม่มีประวัติการเข้างานในเดือน {selectedMonth}</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          )}
                      </div>
                  )}

                  {/* TAB 3: EVALUATIONS */}
                  {detailTab === 'evaluations' && (
                      <div className="space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">ผลการประเมินงานประจำเดือน & KPI</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {staffEvaluations.map(ev => (
                                  <div key={ev.id} className="bg-white border border-gray-200 p-6 space-y-4 shadow-sm">
                                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                          <span className="text-xs font-black uppercase tracking-wider text-black">ประจำเดือน {ev.period_month}/{ev.period_year}</span>
                                          <div className="flex items-center gap-1 text-amber-500 font-black text-sm bg-amber-50 px-3 py-1 border border-amber-200">
                                              <Star size={16} fill="currentColor"/> {ev.overall_score || 0} / 5
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                          <div className="bg-gray-50 p-3">
                                              <span className="text-gray-400 text-[10px] block uppercase mb-1">Sales Performance</span>
                                              <span className="text-black font-black text-base">{ev.sales_performance_score || 0} / 5</span>
                                          </div>
                                          <div className="bg-gray-50 p-3">
                                              <span className="text-gray-400 text-[10px] block uppercase mb-1">Customer Rating</span>
                                              <span className="text-black font-black text-base">{ev.customer_rating_score || 0} / 5</span>
                                          </div>
                                      </div>
                                      {ev.feedback && (
                                          <div className="bg-gray-50 p-4 text-xs text-gray-600 font-bold border-l-4 border-black italic">
                                              "{ev.feedback}"
                                          </div>
                                      )}
                                      <div className="text-[10px] text-gray-400 font-bold text-right pt-2">
                                          ผู้ประเมิน: {ev.profiles?.display_name || 'Manager/Admin'}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          {staffEvaluations.length === 0 && (
                              <div className="text-center py-16 bg-white border border-gray-200 p-8 shadow-xs">
                                  <Award className="mx-auto text-gray-300 mb-3" size={48} />
                                  <p className="text-sm font-bold text-gray-400">ยังไม่มีประวัติการประเมินผลพนักงานคนนี้</p>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAF8] overflow-hidden font-bold relative">
      
      {/* HEADER & TABS */}
      <div className="bg-white border-b border-gray-200 px-6 sm:px-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0 z-10">
          <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3A5A40] mb-1">POS Management Hub</div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black">{locale === 'en' ? 'Staff Directory' : locale === 'zh' ? '员工名录' : 'ระบบจัดการพนักงาน'}</h1>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-none shadow-inner">
             <button 
                onClick={() => setInternalTab('list')}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${internalTab === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
             >
                 {locale === 'en' ? 'Overview' : locale === 'zh' ? '概览' : 'ภาพรวม'}
             </button>
             <button 
                onClick={() => setInternalTab('verification')}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${internalTab === 'verification' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
             >
                 {locale === 'en' ? 'Verification' : locale === 'zh' ? '验证' : 'ยืนยันตัวตน'}
                 {pendingCount > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{pendingCount}</span>}
             </button>
             <button 
                onClick={() => setInternalTab('attendance')}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${internalTab === 'attendance' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
             >
                 {locale === 'en' ? 'Attendance' : locale === 'zh' ? '考勤' : 'เวลาเข้างาน'}
             </button>
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10">
          
          {/* VIEW: STAFF LIST */}
          {internalTab === 'list' && (
              <div className="max-w-6xl mx-auto space-y-8">
                  {/* Search */}
                  <div className="bg-white p-2 flex items-center gap-4 border border-gray-200 shadow-sm">
                      <div className="pl-4 text-gray-400"><Search size={18} /></div>
                      <input 
                          type="text" 
                          placeholder={locale === 'en' ? 'Search by name or ID...' : locale === 'zh' ? '按姓名或ID搜索...' : 'ค้นหาพนักงานด้วยชื่อ หรือ รหัส...'} 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 bg-transparent border-none py-3 pr-4 text-sm font-bold focus:ring-0 outline-none"
                      />
                  </div>

                  {loading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={48} /></div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                          {filteredStaff.map(person => (
                              <div key={person.id} onClick={() => { setSelectedStaff(person); setIsDetailOpen(true); setDetailTab('info'); }} className="group bg-white border border-gray-100 p-6 flex flex-col relative transition-all hover:border-black cursor-pointer shadow-sm">
                                  <div className="flex items-start justify-between mb-6">
                                      <div className="w-14 h-14 bg-gray-50 flex items-center justify-center text-[#1A1A18] group-hover:bg-[#1A1A18] group-hover:text-white transition-all text-xl font-black">
                                          {(person.display_name || person.full_name || 'S').slice(0,1).toUpperCase()}
                                      </div>
                                      {person.is_verified ? (
                                          <ShieldCheck size={18} className="text-green-500" />
                                      ) : (
                                          <AlertCircle size={18} className="text-amber-500" />
                                      )}
                                  </div>
                                  <div>
                                      <h4 className="text-lg font-black uppercase tracking-tighter text-[#1A1A18] line-clamp-1">{person.display_name || person.full_name || 'Staff'}</h4>
                                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{person.staff_level} • {person.department || person.staff_type}</p>
                                  </div>
                                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                      <span className="text-gray-400">{person.staff_code || 'NO ID'}</span>
                                      <span className="flex items-center gap-1 group-hover:text-black text-transparent transition-all">MANAGE <ChevronRight size={12}/></span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* VIEW: VERIFICATION */}
          {internalTab === 'verification' && (
              <div className="max-w-6xl mx-auto">
                  {loading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={48} /></div>
                  ) : (
                      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                      <th className="px-6 py-4">Employee</th>
                                      <th className="px-6 py-4">Submitted At</th>
                                      <th className="px-6 py-4">Status</th>
                                      <th className="px-6 py-4">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {verifications.map(v => (
                                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-6 py-5">
                                              <div className="text-sm font-black text-black">{v.profiles?.display_name || v.profiles?.full_name}</div>
                                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{v.profiles?.staff_code}</div>
                                          </td>
                                          <td className="px-6 py-5 text-xs text-gray-500 font-bold">{new Date(v.created_at).toLocaleString()}</td>
                                          <td className="px-6 py-5">
                                              {v.verified_at ? (
                                                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1">Verified</span>
                                              ) : (
                                                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1">Pending</span>
                                              )}
                                          </td>
                                          <td className="px-6 py-5">
                                              {!v.verified_at && (
                                                  <button onClick={() => approveVerification(v.id, v.profile_id)} className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-gray-800">
                                                      Approve
                                                  </button>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                                  {verifications.length === 0 && (
                                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">No verification requests found.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}

          {/* VIEW: ATTENDANCE */}
          {internalTab === 'attendance' && (
              <div className="max-w-6xl mx-auto space-y-6">
                   {/* Staff & Month Filter Bar */}
                   <div className="bg-white p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
                            <Filter size={16} /> Filter Attendance:
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* View Type Toggle */}
                            <div className="flex bg-gray-100 p-0.5 border border-gray-200">
                                <button 
                                    onClick={() => setAttendanceViewMode('list')}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${attendanceViewMode === 'list' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                                >
                                    ตาราง (List)
                                </button>
                                <button 
                                    onClick={() => setAttendanceViewMode('calendar')}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${attendanceViewMode === 'calendar' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                                >
                                    ปฏิทิน (Calendar)
                                </button>
                            </div>

                            <input 
                                type="month" 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-gray-50 border border-gray-200 py-2 px-4 text-xs font-bold outline-none font-black text-black cursor-pointer"
                            />
                            <select 
                                value={selectedStaffFilter} 
                                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 py-2 px-4 text-xs font-bold outline-none font-black text-black"
                            >
                                <option value="all">ALL EMPLOYEES (แสดงพนักงานทุกคน)</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.display_name || s.full_name} ({s.staff_code || 'No ID'})</option>
                                ))}
                            </select>
                        </div>
                   </div>

                   {loading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" size={48} /></div>
                  ) : attendanceViewMode === 'calendar' ? (
                      <CalendarGrid logsList={filteredAttendances} monthStr={selectedMonth} />
                  ) : (
                      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                      <th className="px-6 py-4">Date</th>
                                      <th className="px-6 py-4">Employee</th>
                                      <th className="px-6 py-4">Clock In</th>
                                      <th className="px-6 py-4">Clock Out</th>
                                      <th className="px-6 py-4">Status / Late</th>
                                      <th className="px-6 py-4">Hours</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {filteredAttendances.map(a => (
                                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-6 py-5 text-sm font-bold text-gray-800">{new Date(a.date).toLocaleDateString()}</td>
                                          <td className="px-6 py-5">
                                              <div className="text-sm font-black text-black">{a.profiles?.display_name || 'Staff'}</div>
                                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.profiles?.staff_code}</div>
                                          </td>
                                          <td className="px-6 py-5 text-sm font-bold text-green-600">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '-'}</td>
                                          <td className="px-6 py-5 text-sm font-bold text-gray-500">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '-'}</td>
                                          <td className="px-6 py-5">
                                              {a.late_minutes > 0 ? (
                                                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 flex items-center gap-1 w-max">
                                                      <Clock size={10} /> +{a.late_minutes}m สาย
                                                  </span>
                                              ) : a.clock_in ? (
                                                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 w-max block">
                                                      ตรงเวลา (On Time)
                                                  </span>
                                              ) : (
                                                  <span className="text-gray-300 text-xs">-</span>
                                              )}
                                          </td>
                                          <td className="px-6 py-5 text-sm font-bold text-black">{a.total_hours ? parseFloat(a.total_hours).toFixed(2) + 'h' : '-'}</td>
                                      </tr>
                                  ))}
                                  {filteredAttendances.length === 0 && (
                                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">No attendance records found for selected month.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}

      </div>



      <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
