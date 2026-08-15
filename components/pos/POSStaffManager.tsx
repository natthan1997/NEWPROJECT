'use client';
import React, { useState, useEffect } from 'react'
import {
    Plus, Search, Edit3, Trash2, Loader2,
    ChevronRight, Save, LayoutGrid, X,
    Menu as MenuIcon, LogOut, Settings, Users,
    ShieldCheck, UserPlus, Phone, Mail,
    Calendar, Award, Briefcase, Trash, MapPin, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
    Clock, DollarSign, Star, FileText, Filter, Printer
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useI18n } from "@/lib/I18nContext";
import { motion } from 'framer-motion'
import POSSOPEditorModal from './POSSOPEditorModal'
import SOPStaticContent from './SOPStaticContent'

function bahtText(num: number): string {
    if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';
    const numFixed = num.toFixed(2);
    const [baht, satang] = numFixed.split('.');

    const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    function convertGroup(nStr: string): string {
        let res = '';
        const len = nStr.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(nStr[i], 10);
            const pos = len - i - 1;
            if (digit !== 0) {
                if (pos === 1 && digit === 1) {
                    res += 'สิบ';
                } else if (pos === 1 && digit === 2) {
                    res += 'ยี่สิบ';
                } else if (pos === 0 && digit === 1 && len > 1) {
                    res += 'เอ็ด';
                } else {
                    res += digits[digit] + units[pos];
                }
            }
        }
        return res;
    }

    let result = '';
    if (baht.length > 6) {
        const millions = baht.slice(0, baht.length - 6);
        const remainder = baht.slice(baht.length - 6);
        result = convertGroup(millions) + 'ล้าน' + convertGroup(remainder);
    } else {
        result = convertGroup(baht);
    }

    result += 'บาท';

    if (!satang || satang === '00') {
        result += 'ถ้วน';
    } else {
        result += convertGroup(satang) + 'สตางค์';
    }

    return result;
}

const getRoleLabel = (roleId: string, customRoles?: any[]) => {
    if (!roleId) return 'STAFF';
    const role = customRoles?.find(r => r.id === roleId);
    return role ? role.label : roleId.toUpperCase();
}

const translateStaffType = (type?: string) => {
    if (!type) return 'ทั่วไป';
    const t = type.toLowerCase();
    if (t === 'cafe') return 'หน้าร้านคาเฟ่';
    if (t === 'kitchen') return 'ห้องครัว';
    if (t === 'landscape') return 'ทีมจัดสวน';
    if (t === 'general') return 'ทั่วไป';
    return type.toUpperCase();
}

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

function CalendarGrid({ logsList, monthStr, publicHolidays = [] }: { logsList: any[]; monthStr: string; publicHolidays?: any[] }): React.ReactElement {
    const [year, month] = monthStr.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const checkPublicHoliday = (d: Date | string) => {
        const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date(d));
        const ph = publicHolidays.find(h => h.date === dateStr);
        return ph ? ph.name : null;
    }

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
        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-neutral-400 border-b border-neutral-100 pb-2">
                <div className="text-rose-500">อาทิตย์</div>
                <div>จันทร์</div>
                <div>อังคาร</div>
                <div>พุธ</div>
                <div>พฤหัสฯ</div>
                <div>ศุกร์</div>
                <div className="text-sky-500">เสาร์</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {daysGrid.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="bg-neutral-50/50 rounded-xl min-h-[85px]"></div>;
                    const hasLog = cell.logs.length > 0;
                    const cellDate = new Date(year, month - 1, cell.day);
                    const holiday = checkPublicHoliday(cellDate);
                    
                    return (
                        <div key={`day-${cell.day}`} className={`min-h-[85px] p-2 rounded-xl border transition-all flex flex-col justify-between ${holiday ? 'bg-rose-50/50 border-rose-200' : hasLog ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50/50 border-neutral-100'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-black ${holiday ? 'text-rose-600' : hasLog ? 'text-[#1A1A18]' : 'text-neutral-400'}`}>{cell.day}</span>
                                {hasLog && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></span>}
                            </div>
                            {holiday && (
                                <div className="text-[8px] font-bold text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded text-center leading-tight mb-1 truncate" title={holiday}>
                                    {holiday}
                                </div>
                            )}
                            <div className="space-y-1">
                                {cell.logs.map((l: any, i: number) => (
                                    <div key={i} className="text-[10px] font-bold p-1.5 rounded-lg bg-neutral-50 border border-neutral-100 leading-tight">
                                        <div className="text-neutral-500 text-center flex justify-center gap-1">
                                            <span>{l.clock_in ? new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            <span>-</span>
                                            <span>{l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                        </div>
                                        {l.override ? (
                                            <span className={`text-[10px] font-bold block text-center mt-1 ${l.override.reason.includes('มาสาย') ? 'text-blue-600' : 'text-amber-600'}`}>{l.override.reason}</span>
                                        ) : l.leave ? (
                                            <span className="text-[10px] font-bold block text-center mt-1 text-orange-600">ลา</span>
                                        ) : l.late_minutes > 0 ? (
                                            <span className="text-[10px] text-rose-600 font-bold block text-center mt-1">สาย {l.late_minutes} นาที</span>
                                        ) : l.ot_hours > 0 ? (
                                            l.ot_status === 'approved' ? (
                                                <span className="text-[10px] text-emerald-700 font-bold block text-center mt-1">OT {l.ot_hours.toFixed(1)} ชม.</span>
                                            ) : l.ot_status === 'rejected' ? (
                                                <span className="text-[10px] text-neutral-400 font-bold block text-center mt-1 line-through">OT {l.ot_hours.toFixed(1)} ชม.</span>
                                            ) : (
                                                <span className="text-[10px] text-amber-600 font-bold block text-center mt-1">OT {l.ot_hours.toFixed(1)} ชม.</span>
                                            )
                                        ) : l.clock_in ? (
                                            <span className="text-[10px] text-emerald-600 font-bold block text-center mt-1">ตรงเวลา</span>
                                        ) : null}
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
    const [detailTab, setDetailTab] = useState<'info' | 'attendance' | 'evaluations' | 'payroll'>('info')
    const [isSaving, setIsSaving] = useState(false)

    // Verification & Attendance & Evaluations Data
    const [verifications, setVerifications] = useState<any[]>([])
    const [attendances, setAttendances] = useState<any[]>([])
    const [staffEvaluations, setStaffEvaluations] = useState<any[]>([])
    const [individualAttendances, setIndividualAttendances] = useState<any[]>([])
    const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all')
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
    const [attendanceViewMode, setAttendanceViewMode] = useState<'list' | 'calendar'>('list')
    const [slideOverViewMode, setSlideOverViewMode] = useState<'list' | 'calendar'>('list')

    const [showAddStaffModal, setShowAddStaffModal] = useState(false)
    const [isSopEditorOpen, setIsSopEditorOpen] = useState(false)
    const [newStaffForm, setNewStaffForm] = useState({
        display_name: '',
        staff_code: '',
        phone: '',
        staff_type: 'general',
        staff_level: 'staff',
        salary_type: 'daily',
        is_rider: false,
        holiday_compensation_type: 'money',
        daily_wage: 0,
        is_pos_device: false,
        has_social_security: false,
        work_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    })

    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [leaveForm, setLeaveForm] = useState({
        profile_id: '',
        leave_date: '',
        leave_type: 'sick',
        is_active: false,
        is_rider: false,
        permissions: [] as string[],
        is_paid: false,
        reason: ''
    })

    const [showUseHolidayModal, setShowUseHolidayModal] = useState(false)
    const [useHolidayForm, setUseHolidayForm] = useState({
        profile_id: '',
        leave_date: '',
        reason: 'ใช้วันหยุดชดเชยนักขัตฤกษ์'
    })


    // Advanced HR States
    const [cashAdvances, setCashAdvances] = useState<any[]>([])
    const [showCashAdvanceModal, setShowCashAdvanceModal] = useState(false)
    const [cashAdvanceForm, setCashAdvanceForm] = useState({
        profile_id: '',
        amount: 0,
        advance_date: '',
        reason: ''
    })

    const [staffShifts, setStaffShifts] = useState<any[]>([])
    const [staffLeaves, setStaffLeaves] = useState<any[]>([])
    const [publicHolidays, setPublicHolidays] = useState<any[]>([])
  const [approvedHolidaysCount, setApprovedHolidaysCount] = useState(0)

    // Printable Report State
    const [printData, setPrintData] = useState<{ type: 'payslip' | 'summary', data: any } | null>(null);

    const translateDay = (day: string) => {
        const map: Record<string, string> = { monday: 'จันทร์', tuesday: 'อังคาร', wednesday: 'พุธ', thursday: 'พฤหัส', friday: 'ศุกร์', saturday: 'เสาร์', sunday: 'อาทิตย์' };
        return map[day] || day;
    }

    useEffect(() => {
        fetchStaff()
        fetchPendingCount()
        fetchAttendances()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopSettings?.branch_id])

    useEffect(() => {
        fetchPublicHolidays()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth])

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
            fetchCashAdvances(selectedStaff.id)
            fetchStaffShifts(selectedStaff.id)
            fetchStaffLeaves(selectedStaff.id)
        }
    }, [selectedStaff?.id])

    const fetchPublicHolidays = async () => {
        try {
            const year = selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear();
            const res = await fetch(`/api/public-holidays?year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setPublicHolidays(data);
            }
        } catch (error) {
            console.error('Failed to fetch public holidays', error);
        }
    }

    const checkPublicHoliday = (d: Date | string) => {
        const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date(d));
        return publicHolidays.find(h => h.date === dateStr);
    }

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
                        grouped[key].checkin_log_id = log.id;
                        grouped[key].holiday_pay_status = log.holiday_pay_status || 'pending';

                        const shiftStart = log.profiles?.shift_start || "08:30";
                        const [sHour, sMin] = shiftStart.split(':').map(Number);
                        const checkInDate = new Date(log.timestamp);
                        const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
                        const targetMins = (sHour || 8) * 60 + (sMin || 30);
                        const shiftSettings = typeof shopSettings?.shift_settings === 'string' ? JSON.parse(shopSettings.shift_settings) : (shopSettings?.shift_settings || {});
                        const gracePeriod = shiftSettings.late_grace_period_minutes !== undefined ? Number(shiftSettings.late_grace_period_minutes) : 10;

                        if (checkInMins > targetMins + gracePeriod) {
                            grouped[key].late_minutes = checkInMins - targetMins;
                        } else {
                            grouped[key].late_minutes = 0;
                        }
                    }
                } else if (log.type === 'check_out') {
                    if (!grouped[key].clock_out || new Date(grouped[key].clock_out) < new Date(log.timestamp)) {
                        grouped[key].clock_out = log.timestamp;
                        grouped[key].checkout_log_id = log.id;
                        grouped[key].ot_status = log.ot_status || 'pending';
                        grouped[key].ot_approved_minutes = log.ot_approved_minutes || 0;
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
                        const otBlocks = Math.floor(rawOtMins / 30);
                        item.ot_hours = otBlocks * 0.5;
                    } else {
                        item.ot_hours = 0;
                    }
                }
            });

            const { data: leaves } = await supabase
                .from('staff_leaves')
                .select('*')
                .eq('profile_id', staffId)

            if (leaves) {
                leaves.forEach(leave => {
                    const d = new Date(leave.leave_date);
                    const dateStr = d.toLocaleDateString();
                    const key = `${dateStr}-${leave.profile_id}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            id: key,
                            profile_id: leave.profile_id,
                            date: d,
                            profiles: selectedStaff,
                            clock_in: null, clock_out: null, total_hours: null, late_minutes: 0, ot_hours: 0
                        }
                    }
                    grouped[key].leave = leave;
                });
            }

            const { data: overrides } = await supabase
                .from('pos_staff_leave_overrides')
                .select('*')
                .eq('profile_id', staffId)
            
            if (overrides) {
                overrides.forEach(override => {
                    const d = new Date(override.date);
                    const dateStr = d.toLocaleDateString();
                    const key = `${dateStr}-${override.profile_id}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            id: key,
                            profile_id: override.profile_id,
                            date: d,
                            profiles: selectedStaff,
                            clock_in: null, clock_out: null, total_hours: null, late_minutes: 0, ot_hours: 0
                        }
                    }
                    grouped[key].override = override;
                });
            }

            const finalGroupedList = Object.values(grouped).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
            setIndividualAttendances(finalGroupedList)
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
                        late_minutes: 0,
                        holiday_pay_status: 'pending'
                    };
                }

                if (log.holiday_pay_status && log.holiday_pay_status !== 'pending') {
                    grouped[key].holiday_pay_status = log.holiday_pay_status;
                }

                if (log.type === 'check_in') {
                    if (!grouped[key].clock_in || new Date(grouped[key].clock_in) > new Date(log.timestamp)) {
                        grouped[key].clock_in = log.timestamp;
                        grouped[key].checkin_log_id = log.id;

                        const shiftStart = log.profiles?.shift_start || "08:30";
                        const [sHour, sMin] = shiftStart.split(':').map(Number);
                        const checkInDate = new Date(log.timestamp);
                        const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
                        const targetMins = (sHour || 8) * 60 + (sMin || 30);                        const shiftSettings = typeof shopSettings?.shift_settings === 'string' ? JSON.parse(shopSettings.shift_settings) : (shopSettings?.shift_settings || {});
                        const gracePeriod = shiftSettings.late_grace_period_minutes !== undefined ? Number(shiftSettings.late_grace_period_minutes) : 10;

                        if (checkInMins > targetMins + gracePeriod) {
                            grouped[key].late_minutes = checkInMins - targetMins;
                        } else {
                            grouped[key].late_minutes = 0;
                        }
                    }
                } else if (log.type === 'check_out') {
                    if (!grouped[key].clock_out || new Date(grouped[key].clock_out) < new Date(log.timestamp)) {
                        grouped[key].clock_out = log.timestamp;
                        grouped[key].checkout_log_id = log.id;
                        grouped[key].ot_status = log.ot_status || 'pending';
                        grouped[key].ot_approved_minutes = log.ot_approved_minutes || 0;
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

            const { data: leaves } = await supabase.from('staff_leaves').select('*, profiles(display_name, staff_code)')
            if (leaves) {
                leaves.forEach(leave => {
                    const d = new Date(leave.leave_date);
                    const dateStr = d.toLocaleDateString();
                    const key = `${dateStr}-${leave.profile_id}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            id: key,
                            profile_id: leave.profile_id,
                            date: d,
                            profiles: leave.profiles,
                            clock_in: null, clock_out: null, total_hours: null, late_minutes: 0, ot_hours: 0
                        }
                    }
                    grouped[key].leave = leave;
                });
            }

            const { data: overrides } = await supabase.from('pos_staff_leave_overrides').select('*, profiles(display_name, staff_code)')
            if (overrides) {
                overrides.forEach(override => {
                    const d = new Date(override.date);
                    const dateStr = d.toLocaleDateString();
                    const key = `${dateStr}-${override.profile_id}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            id: key,
                            profile_id: override.profile_id,
                            date: d,
                            profiles: override.profiles,
                            clock_in: null, clock_out: null, total_hours: null, late_minutes: 0, ot_hours: 0
                        }
                    }
                    grouped[key].override = override;
                });
            }

            const finalGroupedList = Object.values(grouped).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
            setAttendances(finalGroupedList)
        } else {
            setAttendances([])
        }
        setLoading(false)
    }

    const handleToggleCompensationType = async (staffId: string, newType: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setIsSaving(true)
        try {
            
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            const res = await fetch('/api/staff/update-compensation-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ profileId: staffId, compensationType: newType })
            })
            if (!res.ok) throw new Error('Failed to update')
            fetchStaff()
        } catch (err) {
            console.error(err)
            alert('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าชดเชยวันหยุด')
        }
        setIsSaving(false)
    }

    const handleUseHolidaySubmit = async () => {
        if (!useHolidayForm.profile_id || !useHolidayForm.leave_date) {
            return alert('กรุณาเลือกวันที่ต้องการใช้วันหยุด')
        }
        setIsSaving(true)
        try {
            
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            const res = await fetch('/api/staff/use-holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(useHolidayForm)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to use holiday')
            alert('ใช้วันหยุดชดเชยสำเร็จ')
            setShowUseHolidayModal(false)
            fetchStaff() // Refresh balances
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'เกิดข้อผิดพลาด')
        }
        setIsSaving(false)
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
            is_rider: selectedStaff.is_rider || false,
            holiday_compensation_type: selectedStaff.holiday_compensation_type,
            is_pos_account: selectedStaff.is_pos_account,
            shift_start: selectedStaff.shift_start,
            shift_end: selectedStaff.shift_end,
            overtime_rate_per_hour: selectedStaff.overtime_rate_per_hour,
            rest_days: selectedStaff.rest_days || [],
            diligence_allowance: selectedStaff.diligence_allowance || 0,
            quota_sick_leave: selectedStaff.quota_sick_leave !== undefined && selectedStaff.quota_sick_leave !== null ? selectedStaff.quota_sick_leave : 30,
            quota_personal_leave: selectedStaff.quota_personal_leave !== undefined && selectedStaff.quota_personal_leave !== null ? selectedStaff.quota_personal_leave : 3,
            quota_annual_leave: selectedStaff.quota_annual_leave !== undefined && selectedStaff.quota_annual_leave !== null ? selectedStaff.quota_annual_leave : 6,
            quota_public_holiday: selectedStaff.quota_public_holiday !== undefined && selectedStaff.quota_public_holiday !== null ? selectedStaff.quota_public_holiday : 13,
            can_void_orders: !!selectedStaff.can_void_orders,
            can_give_discounts: selectedStaff.can_give_discounts !== false,
            can_open_cash_drawer: selectedStaff.can_open_cash_drawer !== false,
            can_manage_stock: !!selectedStaff.can_manage_stock,
            has_social_security: selectedStaff.has_social_security || false
        }).eq('id', selectedStaff.id)
        if (!error) {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว')
            fetchStaff()
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
        }
        setIsSaving(false)
    }

    
    const fetchStaffLeaves = async (staffId: string) => {
        const currentYear = new Date().getFullYear();
    const profileIdToUse = staffId;
        const { data } = await supabase
            .from('staff_leaves')
            .select('*')
            .eq('profile_id', staffId)
            .gte('leave_date', `${currentYear}-01-01`)
            .lte('leave_date', `${currentYear}-12-31`);
        if (data) setStaffLeaves(data);

    const { count } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileIdToUse)
        .in('holiday_pay_status', ['approved_pay', 'approved_dayoff'])
        .gte('timestamp', `${currentYear}-01-01`)
        .lte('timestamp', `${currentYear}-12-31`);
    
    setApprovedHolidaysCount(count || 0);

    }

    const fetchCashAdvances = async (staffId: string) => {
        const { data } = await supabase
            .from('staff_cash_advances')
            .select('*')
            .eq('profile_id', staffId)
            .order('advance_date', { ascending: false });
        if (data) setCashAdvances(data);
        else setCashAdvances([]);
    }

    const fetchStaffShifts = async (staffId: string) => {
        const { data } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('profile_id', staffId);
        if (data) setStaffShifts(data);
        else setStaffShifts([]);
    }

    const handleCreateCashAdvance = async () => {
        if (!cashAdvanceForm.profile_id || !cashAdvanceForm.advance_date || cashAdvanceForm.amount <= 0) {
            return alert('กรุณากรอกข้อมูลจำนวนเงินและวันที่เบิกให้ถูกต้อง');
        }
        const { error } = await supabase.from('staff_cash_advances').insert({
            profile_id: cashAdvanceForm.profile_id,
            amount: cashAdvanceForm.amount,
            advance_date: cashAdvanceForm.advance_date,
            reason: cashAdvanceForm.reason,
            created_by: profile?.id
        });

        if (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } else {
            setShowCashAdvanceModal(false);
            setCashAdvanceForm({ profile_id: '', amount: 0, advance_date: '', reason: '' });
            if (selectedStaff) fetchCashAdvances(selectedStaff.id);
        }
    }

    const handleSaveShift = async (workDate: string, shiftStart: string, shiftEnd: string, isOff: boolean) => {
        if (!selectedStaff) return;
        const { error } = await supabase.from('staff_shifts').upsert({
            profile_id: selectedStaff.id,
            work_date: workDate,
            shift_start: shiftStart,
            shift_end: shiftEnd,
            is_off: isOff
        }, { onConflict: 'profile_id,work_date' });

        if (error) {
            alert('เกิดข้อผิดพลาดในการบันทึกกะ: ' + error.message);
        } else {
            fetchStaffShifts(selectedStaff.id);
        }
    }

    const approveVerification = async (identityId: string, profileId: string) => {
        await supabase.from('staff_identity').update({ verified_at: new Date().toISOString() }).eq('id', identityId)
        await supabase.from('profiles').update({ is_verified: true }).eq('id', profileId)
        fetchVerifications()
        fetchPendingCount()
        fetchStaff()
    }

    const handleCreateStaff = async () => {
        if (!newStaffForm.display_name) return alert('กรุณากรอกชื่อพนักงาน');

        const { error } = await supabase.from('profiles').insert({
            display_name: newStaffForm.display_name,
            full_name: newStaffForm.display_name,
            staff_code: newStaffForm.staff_code,
            phone: newStaffForm.phone,
            staff_type: newStaffForm.staff_type,
            department: newStaffForm.staff_type,
            salary_type: newStaffForm.salary_type || 'daily',
            is_rider: newStaffForm.is_rider || false,
            holiday_compensation_type: newStaffForm.holiday_compensation_type,
            daily_wage: newStaffForm.daily_wage,
            is_pos_device: newStaffForm.is_pos_device,
            work_days: newStaffForm.work_days,
            role: 'user',
            staff_level: newStaffForm.staff_level || 'staff',
            is_verified: true,
            quota_public_holiday: 0,
            has_social_security: newStaffForm.has_social_security || false
        });

        if (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } else {
            setShowAddStaffModal(false);
            setNewStaffForm({
                display_name: '', staff_code: '', phone: '', staff_type: 'general', staff_level: 'staff', salary_type: 'daily', is_rider: false, holiday_compensation_type: 'money', daily_wage: 0, is_pos_device: false, has_social_security: false, work_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
            });
            fetchStaff();
        }
    }

    const handleCreateLeave = async () => {
        if (!leaveForm.profile_id || !leaveForm.leave_date || !leaveForm.leave_type) {
            return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        }
        const { error } = await supabase.from('staff_leaves').insert({
            profile_id: leaveForm.profile_id,
            leave_date: leaveForm.leave_date,
            leave_type: leaveForm.leave_type,
            is_paid: leaveForm.is_paid,
            reason: leaveForm.reason,
            created_by: profile?.id
        });
        if (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } else {
            setShowLeaveModal(false);
            setLeaveForm({ profile_id: '', leave_date: '', leave_type: 'sick', is_active: false, is_rider: false, permissions: [], is_paid: false, reason: '' });
            fetchAttendances();
            if (selectedStaff) fetchStaffIndividualAttendance(selectedStaff.id);
        }
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

    const handleApproveHolidayPay = async (logId: string, forceStatus?: 'rejected') => {
        if (!logId) {
            alert('ไม่พบข้อมูลรายการตอกบัตร');
            return;
        }
        
        try {
            const res = await fetch('/api/staff/manual-approve-holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId, status: forceStatus })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to update');

            if (selectedStaff) {
                fetchStaffIndividualAttendance(selectedStaff.id);
            }
            fetchAttendances();
            fetchStaff(); // Refresh staff list to update balances
        } catch (err: any) {
            alert('เกิดข้อผิดพลาดในการบันทึกสถานะค่าแรงวันหยุด: ' + err.message);
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
            <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar font-bold p-6 sm:p-10 space-y-6">
                {/* Header & Back Navigation */}
                <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-100 pb-6 shrink-0">
                    <div>
                        <button
                            onClick={() => { setSelectedStaff(null); setIsDetailOpen(false); }}
                            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-[#1A1A18] transition-colors mb-3 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            กลับ
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-[#1A1A18]">
                                {selectedStaff.display_name || selectedStaff.full_name}
                            </h1>
                            {selectedStaff.is_verified ? (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 border border-emerald-100 rounded-full">Verified</span>
                            ) : (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 border border-amber-100 rounded-full">Unverified</span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-neutral-400 mt-1">
                            ID: {selectedStaff.staff_code || 'NO ID'} • {getRoleLabel(selectedStaff.staff_level, shopSettings?.custom_roles)} • {translateStaffType(selectedStaff.staff_type)}
                        </p>
                    </div>

                    {detailTab === 'info' && (
                        <button
                            onClick={handleUpdateStaff}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 bg-[#0F172A] text-white px-8 py-3.5 text-xs font-bold hover:bg-neutral-800 transition-all shadow-md rounded-xl disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            บันทึก
                        </button>
                    )}
                </div>

                {/* Full Width Tabs */}
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex overflow-x-auto no-scrollbar gap-6 sm:gap-8 mb-6 border-b border-neutral-100">
                        <button
                            onClick={() => setDetailTab('info')}
                            className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${detailTab === 'info' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                        >
                            ข้อมูลส่วนตัว
                            {detailTab === 'info' && (
                                <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                            )}
                        </button>
                        <button
                            onClick={() => setDetailTab('attendance')}
                            className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${detailTab === 'attendance' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                        >
                            ประวัติเข้างาน
                            {detailTab === 'attendance' && (
                                <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                            )}
                        </button>
                        <button
                            onClick={() => setDetailTab('payroll')}
                            className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${detailTab === 'payroll' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                        >
                            สรุปเงินเดือน
                            {detailTab === 'payroll' && (
                                <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                            )}
                        </button>
                        <button
                            onClick={() => setDetailTab('evaluations')}
                            className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${detailTab === 'evaluations' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                        >
                            การประเมิน ({staffEvaluations.length})
                            {detailTab === 'evaluations' && (
                                <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Body Content Area */}
                <div className="max-w-6xl mx-auto w-full pb-16 flex-1">

                    {/* TAB 1: PROFILE & WAGES */}
                    {detailTab === 'info' && (
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
                            <div>
                                <h3 className="text-xs font-bold text-neutral-400 mb-4 border-b border-neutral-100 pb-2">ข้อมูลติดต่อ & ตำแหน่ง</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-400 block mb-1">อีเมล</span>
                                        <span className="text-sm font-bold text-neutral-800 break-all">{selectedStaff.email || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-400 block mb-1">เบอร์โทรศัพท์</span>
                                        <span className="text-sm font-bold text-neutral-800">{selectedStaff.phone_number || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-400 block mb-1">สาขา</span>
                                        <span className="text-sm font-bold text-neutral-800">{selectedStaff.branch_code || 'สำนักงานใหญ่'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-neutral-400 mb-4 border-b border-neutral-100 pb-2">การตั้งค่าสิทธิ์ & เงินเดือน</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400">ระดับสิทธิ์</label>
                                        <select value={selectedStaff.staff_level || 'staff'} onChange={e => setSelectedStaff({ ...selectedStaff, staff_level: e.target.value })} className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors">
                                            {(shopSettings?.custom_roles && shopSettings.custom_roles.length > 0 ? shopSettings.custom_roles : [{ id: 'manager', label: 'ผู้จัดการสาขา (Manager)' }, { id: 'staff', label: 'พนักงานทั่วไป (Staff)' }]).map((role: any) => (
                                                <option key={role.id} value={role.id}>{role.label}</option>
                                            ))}
                                            <option value="admin">แอดมิน (Admin)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400">แผนก</label>
                                        <select value={selectedStaff.staff_type || ''} onChange={e => setSelectedStaff({ ...selectedStaff, staff_type: e.target.value, department: e.target.value })} className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors">
                                            <option value="cafe">หน้าร้านคาเฟ่</option>
                                            <option value="kitchen">ห้องครัว</option>
                                            <option value="landscape">ทีมจัดสวน</option>
                                            <option value="general">ทั่วไป</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 flex items-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStaff.is_rider || false}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, is_rider: e.target.checked })}
                                                className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black"
                                            />
                                            <span className="text-xs font-bold text-neutral-700">เป็นไรเดอร์ส่งของควบคู่</span>
                                        </label>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400">ประเภทเงินเดือน</label>
                                        <select value={selectedStaff.salary_type || 'daily'} onChange={e => setSelectedStaff({ ...selectedStaff, salary_type: e.target.value })} className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors">
                                            <option value="daily">รายวัน</option>
                                            <option value="monthly">รายเดือน</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400">รูปแบบรับชดเชยวันหยุด</label>
                                        <select value={selectedStaff.holiday_compensation_type || 'money'} onChange={e => setSelectedStaff({ ...selectedStaff, holiday_compensation_type: e.target.value })} className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors">
                                            <option value="money">รับเป็นค่าแรง (Money)</option>
                                            <option value="dayoff">รับเป็นวันหยุดชดเชย (Day Off)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400">จำนวนเงิน (บาท)</label>
                                        <input
                                            type="number"
                                            value={selectedStaff.daily_wage || 0}
                                            onChange={e => setSelectedStaff({ ...selectedStaff, daily_wage: Number(e.target.value) })}
                                            className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-[10px] font-bold text-neutral-400">เบี้ยขยันประจำเดือน (บาท/เดือน)</label>
                                        <input
                                            type="number"
                                            value={selectedStaff.diligence_allowance || 0}
                                            onChange={e => setSelectedStaff({ ...selectedStaff, diligence_allowance: Number(e.target.value) })}
                                            placeholder="เช่น 500"
                                            className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-[10px] font-bold text-neutral-400">หักประกันสังคม (Social Security)</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                                checked={selectedStaff.has_social_security || false}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, has_social_security: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-gray-700">เข้าระบบหักประกันสังคม 5%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <h3 className="text-xs font-bold text-neutral-400 border-b border-neutral-100 pb-2">สิทธิ์การเปิดใช้ฟีเจอร์ POS หน้าร้าน</h3>

                                    <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                                        <div>
                                            <span className="text-xs font-bold text-neutral-800 block">เข้าใช้งานระบบ POS</span>
                                            <span className="text-[10px] text-neutral-400 block">อนุญาตให้ล็อกอินใช้ POS</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStaff({ ...selectedStaff, is_pos_account: !selectedStaff.is_pos_account })}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${selectedStaff.is_pos_account ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${selectedStaff.is_pos_account ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                                            <div>
                                                <span className="text-xs font-bold text-neutral-800 block">ยกเลิกบิล / ลบรายการ</span>
                                                <span className="text-[10px] text-neutral-400 block">Void Orders</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStaff({ ...selectedStaff, can_void_orders: !selectedStaff.can_void_orders })}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${selectedStaff.can_void_orders ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${selectedStaff.can_void_orders ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                                            <div>
                                                <span className="text-xs font-bold text-neutral-800 block">ให้ส่วนลดลูกค้า</span>
                                                <span className="text-[10px] text-neutral-400 block">Give Discounts</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStaff({ ...selectedStaff, can_give_discounts: selectedStaff.can_give_discounts === false ? true : false })}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${selectedStaff.can_give_discounts !== false ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${selectedStaff.can_give_discounts !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                                            <div>
                                                <span className="text-xs font-bold text-neutral-800 block">เปิดลิ้นชักเก็บเงิน</span>
                                                <span className="text-[10px] text-neutral-400 block">Open Cash Drawer</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStaff({ ...selectedStaff, can_open_cash_drawer: selectedStaff.can_open_cash_drawer === false ? true : false })}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${selectedStaff.can_open_cash_drawer !== false ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${selectedStaff.can_open_cash_drawer !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                                            <div>
                                                <span className="text-xs font-bold text-neutral-800 block">ปรับสต๊อกสินค้า</span>
                                                <span className="text-[10px] text-neutral-400 block">Manage Stock</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStaff({ ...selectedStaff, can_manage_stock: !selectedStaff.can_manage_stock })}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${selectedStaff.can_manage_stock ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${selectedStaff.can_manage_stock ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-neutral-100 pt-6">
                                    <h3 className="text-xs font-bold text-neutral-400 mb-4 border-b border-neutral-100 pb-2">วันหยุดประจำสัปดาห์ (Shift Roster)</h3>
                                    <div className="space-y-1.5 sm:col-span-3">
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                                <button
                                                    key={day}
                                                    onClick={() => {
                                                        const current = selectedStaff.rest_days || [];
                                                        const updated = current.includes(day)
                                                            ? current.filter((d: string) => d !== day)
                                                            : [...current, day];
                                                        setSelectedStaff({ ...selectedStaff, rest_days: updated });
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold border transition-colors ${(selectedStaff.rest_days || []).includes(day)
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300'
                                                        }`}
                                                >
                                                    {translateDay(day)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-neutral-100 pt-6">
                                    <h3 className="text-xs font-bold text-neutral-400 mb-4 border-b border-neutral-100 pb-2">กะเวลาทำงาน & โอที</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">เวลาเข้างาน</label>
                                            <input
                                                type="time"
                                                value={selectedStaff.shift_start || '08:30'}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, shift_start: e.target.value })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">เวลาเลิกงาน</label>
                                            <input
                                                type="time"
                                                value={selectedStaff.shift_end || '17:30'}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, shift_end: e.target.value })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">เรทโอที (บาท/ชม.)</label>
                                            <input
                                                type="number"
                                                value={selectedStaff.overtime_rate_per_hour || 0}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, overtime_rate_per_hour: Number(e.target.value) })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-neutral-400 mb-4 border-b border-neutral-100 pb-2">โควตาวันหยุดและวันลา (ต่อปี)</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">ลาป่วย (วัน)</label>
                                            <input
                                                type="number"
                                                value={selectedStaff.quota_sick_leave !== undefined && selectedStaff.quota_sick_leave !== null ? selectedStaff.quota_sick_leave : 30}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, quota_sick_leave: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">ลากิจ (วัน)</label>
                                            <input
                                                type="number"
                                                value={selectedStaff.quota_personal_leave !== undefined && selectedStaff.quota_personal_leave !== null ? selectedStaff.quota_personal_leave : 3}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, quota_personal_leave: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">ลาพักร้อน (วัน)</label>
                                            <input
                                                type="number"
                                                value={selectedStaff.quota_annual_leave !== undefined && selectedStaff.quota_annual_leave !== null ? selectedStaff.quota_annual_leave : 6}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, quota_annual_leave: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400">นักขัตฤกษ์ (วัน)</label>
                                            <input
                                                type="number"
                                                value={selectedStaff.quota_public_holiday !== undefined && selectedStaff.quota_public_holiday !== null ? selectedStaff.quota_public_holiday : 13}
                                                onChange={e => setSelectedStaff({ ...selectedStaff, quota_public_holiday: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                className="w-full bg-neutral-50 rounded-lg border border-neutral-200 py-2.5 px-3 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ATTENDANCE & OT */}
                    {detailTab === 'attendance' && (
                        <div className="space-y-6">
                            {/* Quota Usage Summary */}
                            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'ลาป่วย', used: staffLeaves.filter(l => l.leave_type === 'sick').length, quota: selectedStaff.quota_sick_leave ?? 30, color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'ลากิจ', used: staffLeaves.filter(l => l.leave_type === 'personal').length, quota: selectedStaff.quota_personal_leave ?? 3, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'ลาพักร้อน', used: staffLeaves.filter(l => l.leave_type === 'vacation').length, quota: selectedStaff.quota_annual_leave ?? 6, color: 'text-amber-600', bg: 'bg-amber-50' },
                                ].map(q => (
                                    <div key={q.label} className="flex flex-col p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                        <span className="text-[10px] font-bold text-neutral-500">{q.label} (เหลือ {q.quota - q.used} วัน)</span>
                                        <div className="mt-1 flex items-end justify-between">
                                            <span className={`text-xl font-black ${q.used >= q.quota ? 'text-red-600' : 'text-[#1A1A18]'}`}>{q.used}</span>
                                            <span className="text-xs font-bold text-neutral-400 mb-0.5">/ {q.quota}</span>
                                        </div>
                                        <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2">
                                            <div className={`h-1.5 rounded-full ${q.used >= q.quota ? 'bg-red-500' : 'bg-[#1A1A18]'}`} style={{ width: `${Math.min(100, (q.used / q.quota) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Month Selector & View Mode Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm gap-4">
                                <div className="flex bg-neutral-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setSlideOverViewMode('list')}
                                        className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${slideOverViewMode === 'list' ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-500 hover:text-[#1A1A18]'}`}
                                    >
                                        ตาราง
                                    </button>
                                    <button
                                        onClick={() => setSlideOverViewMode('calendar')}
                                        className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${slideOverViewMode === 'calendar' ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-500 hover:text-[#1A1A18]'}`}
                                    >
                                        ปฏิทิน
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-neutral-500">เดือน:</span>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-neutral-50 rounded-lg border border-neutral-200 py-2 px-4 text-xs font-bold text-[#1A1A18] outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-xs font-bold text-neutral-400">ทำงานสะสม</div>
                                    <div className="text-4xl font-black text-[#1A1A18] mt-2">{totalDaysWorked} <span className="text-xs font-bold text-neutral-400">วัน</span></div>
                                </div>
                                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-xs font-bold text-amber-600">OT (อนุมัติแล้ว)</div>
                                    <div className="text-3xl font-black text-amber-700 mt-2">{totalApprovedOTHours.toFixed(1)} <span className="text-xs font-bold text-amber-600">ชม.</span></div>
                                    {totalPendingOTHours > 0 && (
                                        <div className="text-[10px] font-bold text-amber-600 mt-1">รออนุมัติ: {totalPendingOTHours.toFixed(1)} ชม.</div>
                                    )}
                                </div>
                                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-xs font-bold text-rose-500">สายสะสม</div>
                                    <div className="text-4xl font-black text-rose-600 mt-2">{totalLateMinutes} <span className="text-xs font-bold text-rose-500">นาที</span></div>
                                </div>
                            </div>

                            {/* Render Calendar or Table List */}
                            {slideOverViewMode === 'calendar' ? (
                                <CalendarGrid logsList={monthIndividualAttendances} monthStr={selectedMonth} publicHolidays={publicHolidays} />
                            ) : (
                                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-400 border-b border-neutral-100">
                                                <th className="px-6 py-4">วันที่</th>
                                                <th className="px-6 py-4">เข้างาน</th>
                                                <th className="px-6 py-4">ออกงาน</th>
                                                <th className="px-6 py-4">สถานะ</th>
                                                <th className="px-6 py-4">ชั่วโมงรวม</th>
                                                <th className="px-6 py-4">OT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {monthIndividualAttendances.map(a => (
                                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-5 text-sm font-bold text-black">{new Date(a.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-5 text-sm font-bold text-green-600">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '-'}</td>
                                                    <td className="px-6 py-5 text-sm font-bold text-gray-500">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '-'}</td>
                                                    <td className="px-6 py-5">
                                                        {a.leave ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 w-max block">
                                                                ลา{a.leave.leave_type === 'sick' ? 'ป่วย' : a.leave.leave_type === 'personal' ? 'กิจ' : 'พักร้อน'} {a.leave.is_paid ? '(ได้ค่าจ้าง)' : '(ไม่ได้ค่าจ้าง)'}
                                                            </span>
                                                        ) : a.late_minutes > 0 ? (
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
                                                        {checkPublicHoliday(new Date(a.date)) && a.clock_in && (a.checkin_log_id || a.checkout_log_id) ? (
                                                            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                                                                <span className="text-[10px] font-black uppercase text-pink-600 tracking-widest block mb-1">ทำงานในวันหยุดนักขัตฤกษ์</span>
                                                                {a.holiday_pay_status === 'approved_pay' ? (
                                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-max inline-block border border-emerald-100">
                                                                        ✓ อนุมัติอัตโนมัติ: จ่ายค่าแรงพิเศษ
                                                                    </span>
                                                                ) : a.holiday_pay_status === 'approved_dayoff' ? (
                                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-max inline-block border border-indigo-100">
                                                                        ✓ อนุมัติอัตโนมัติ: หยุดชดเชย
                                                                    </span>
                                                                ) : a.holiday_pay_status === 'rejected' ? (
                                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md w-max inline-block border border-red-100 line-through">
                                                                        ไม่อนุมัติชดเชย
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleApproveHolidayPay(a.checkout_log_id || a.checkin_log_id); }}
                                                                            className="text-[10px] font-bold text-white px-2.5 py-1.5 rounded-md transition-colors w-full text-left flex justify-between items-center bg-[#1A1A18] hover:bg-neutral-800 ring-2 ring-neutral-300"
                                                                        >
                                                                            อนุมัติ (ตามการตั้งค่า) <span>+</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleApproveHolidayPay(a.checkout_log_id || a.checkin_log_id, 'rejected'); }}
                                                                            className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors w-full text-left"
                                                                        >
                                                                            ไม่อนุมัติ
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-black">{a.total_hours ? parseFloat(a.total_hours).toFixed(2) + 'h' : '-'}</td>
                                                    <td className="px-6 py-5">
                                                        {a.ot_hours > 0 ? (
                                                            a.ot_status === 'approved' ? (
                                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 w-max inline-block">
                                                                    ✓ {(a.ot_approved_minutes / 60).toFixed(1)} ชม.
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-500">{a.ot_hours.toFixed(1)} ชม.</span>
                                                                    {a.checkout_log_id && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleApproveOT(a.checkout_log_id, 'approved', Math.round(a.ot_hours * 60)); }}
                                                                            className="text-[10px] font-bold text-white bg-black hover:bg-neutral-800 px-3 py-1.5 rounded-md transition-colors"
                                                                        >
                                                                            อนุมัติ
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {monthIndividualAttendances.length === 0 && (
                                                <tr><td colSpan={6} className="px-6 py-10 text-center text-neutral-400 text-sm">ไม่มีประวัติการเข้างานในเดือน {selectedMonth}</td></tr>
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
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-4 border-b border-neutral-100 pb-2">ผลการประเมินงานประจำเดือน & KPI</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {staffEvaluations.map(ev => (
                                    <div key={ev.id} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                                            <span className="text-xs font-bold text-[#1A1A18]">ประจำเดือน {ev.period_month}/{ev.period_year}</span>
                                            <div className="flex items-center gap-1 text-amber-500 font-black text-sm bg-amber-50 px-3 py-1 border border-amber-200">
                                                <Star size={16} fill="currentColor" /> {ev.overall_score || 0} / 5
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

                    {detailTab === 'payroll' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-100 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-neutral-900">
                                            สรุปเงินเดือนประจำเดือน
                                        </h3>
                                        <p className="text-xs text-neutral-500 font-bold mt-0.5">เลือกเดือนเพื่อดูสลีปเงินเดือนและสรุปรายการ</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-xl text-xs font-bold text-black outline-none cursor-pointer"
                                        />
                                        <button
                                            onClick={() => {
                                                let daysWorked = 0;
                                                let paidLeaves = 0;
                                                let unpaidLeaves = 0;
                                                let totalLateMinutes = 0;
                                                let totalOtMinutes = 0;
                                                monthIndividualAttendances.forEach(a => {
                                                    if (a.clock_in) daysWorked++;
                                                    if (a.leave) {
                                                        if (a.leave.is_paid) paidLeaves++;
                                                        else unpaidLeaves++;
                                                    }
                                                    if (a.late_minutes) totalLateMinutes += a.late_minutes;
                                                    if (a.ot_approved_minutes) totalOtMinutes += a.ot_approved_minutes;
                                                });
                                                let totalAdvanceAmount = 0;
                                                cashAdvances.forEach(adv => {
                                                    if (adv.advance_date?.slice(0, 7) === selectedMonth) {
                                                        totalAdvanceAmount += Number(adv.amount || 0);
                                                    }
                                                });
                                                const wage = selectedStaff?.daily_wage || 0;
                                                const otRate = selectedStaff?.overtime_rate_per_hour || 0;
                                                let basePay = selectedStaff?.salary_type === 'monthly' ? wage : (daysWorked + paidLeaves) * wage;
                                                const otPay = (totalOtMinutes / 60) * otRate;
                                                const lateDeduction = totalLateMinutes * 1;
                                                const isEligibleDiligence = totalLateMinutes === 0 && unpaidLeaves === 0 && (selectedStaff?.diligence_allowance > 0);
                                                const diligenceBonus = isEligibleDiligence ? Number(selectedStaff?.diligence_allowance || 0) : 0;
                                                
                                                let socialSecurityDeduction = 0;
                                                if (selectedStaff?.has_social_security && basePay > 0) {
                                                    const ssfAmount = Math.round(basePay * 0.05);
                                                    socialSecurityDeduction = Math.min(750, ssfAmount);
                                                }

                                                const netPay = basePay + otPay + diligenceBonus - lateDeduction - totalAdvanceAmount - socialSecurityDeduction;

                                                setPrintData({
                                                    type: 'payslip',
                                                    data: {
                                                        staff: selectedStaff,
                                                        month: selectedMonth,
                                                        daysWorked, paidLeaves, unpaidLeaves, totalLateMinutes, totalOtMinutes,
                                                        basePay, otPay, diligenceBonus, lateDeduction, totalAdvanceAmount, netPay, socialSecurityDeduction
                                                    }
                                                });
                                                setTimeout(() => {
                                                    window.print();
                                                }, 300);
                                            }}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm w-max cursor-pointer"
                                        >
                                            <Printer size={16} /> พิมพ์สลิปเงินเดือน (Payslip)
                                        </button>
                                    </div>
                                </div>

                                {(() => {
                                    let daysWorked = 0;
                                    let paidLeaves = 0;
                                    let unpaidLeaves = 0;
                                    let totalLateMinutes = 0;
                                    let totalOtMinutes = 0;

                                    monthIndividualAttendances.forEach(a => {
                                        if (a.clock_in) daysWorked++;
                                        if (a.leave) {
                                            if (a.leave.is_paid) paidLeaves++;
                                            else unpaidLeaves++;
                                        }
                                        if (a.late_minutes) totalLateMinutes += a.late_minutes;
                                        if (a.ot_approved_minutes) totalOtMinutes += a.ot_approved_minutes;
                                    });

                                    let totalAdvanceAmount = 0;
                                    cashAdvances.forEach(adv => {
                                        if (adv.advance_date?.slice(0, 7) === selectedMonth) {
                                            totalAdvanceAmount += Number(adv.amount || 0);
                                        }
                                    });

                                    const wage = selectedStaff?.daily_wage || 0;
                                    const otRate = selectedStaff?.overtime_rate_per_hour || 0;

                                    let basePay = 0;
                                    if (selectedStaff?.salary_type === 'monthly') {
                                        basePay = wage;
                                    } else {
                                        basePay = (daysWorked + paidLeaves) * wage;
                                    }

                                    const otPay = (totalOtMinutes / 60) * otRate;
                                    
                                    let hourlyRate = 0;
                                    if (selectedStaff?.salary_type === 'monthly') {
                                        hourlyRate = (wage / 30) / 8;
                                    } else {
                                        hourlyRate = wage / 8;
                                    }
                                    const lateDeduction = (hourlyRate / 60) * totalLateMinutes;

                                    const isEligibleDiligence = totalLateMinutes === 0 && unpaidLeaves === 0 && (selectedStaff?.diligence_allowance > 0);
                                    const diligenceBonus = isEligibleDiligence ? Number(selectedStaff?.diligence_allowance || 0) : 0;

                                    let socialSecurityDeduction = 0;
                                    if (selectedStaff?.has_social_security && basePay > 0) {
                                        const ssfAmount = Math.round(basePay * 0.05);
                                        socialSecurityDeduction = Math.min(750, ssfAmount);
                                    }

                                    const netPay = basePay + otPay + diligenceBonus - lateDeduction - totalAdvanceAmount - socialSecurityDeduction;

                                    return (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                                <div>
                                                    <span className="text-xs font-bold text-neutral-800 block">เบิกเงินล่วงหน้า (ระหว่างเดือน)</span>
                                                    <span className="text-[10px] text-neutral-400 block">หักจากเงินเดือนสิ้นเดือน</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setCashAdvanceForm({ profile_id: selectedStaff.id, amount: 0, advance_date: new Date().toISOString().slice(0, 10), reason: '' });
                                                        setShowCashAdvanceModal(true);
                                                    }}
                                                    className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors"
                                                >
                                                    + บันทึกเบิกเงิน
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">วันทำงาน</div>
                                                    <div className="text-xl font-black text-neutral-900">{daysWorked} วัน</div>
                                                </div>
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">วันลา (ได้เงิน)</div>
                                                    <div className="text-xl font-black text-neutral-900">{paidLeaves} วัน</div>
                                                </div>
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">มาสาย (รวม)</div>
                                                    <div className="text-xl font-black text-red-600">{totalLateMinutes} นาที</div>
                                                </div>
                                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">เบิกเงินล่วงหน้า</div>
                                                    <div className="text-xl font-black text-amber-600">฿{totalAdvanceAmount.toLocaleString()}</div>
                                                </div>
                                            </div>

                                            <div className="border-t border-neutral-100 pt-6 space-y-4">
                                                <div className="flex justify-between items-center text-sm font-bold text-neutral-600">
                                                    <span>ค่าแรงพื้นฐาน ({selectedStaff?.salary_type === 'monthly' ? 'รายเดือน' : 'รายวัน'})</span>
                                                    <span>฿{basePay.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                                                    <span>ค่าล่วงเวลา (OT)</span>
                                                    <span>+ ฿{otPay.toLocaleString()}</span>
                                                </div>
                                                {diligenceBonus > 0 && (
                                                    <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                                                        <span>เบี้ยขยัน (ไม่สาย/ไม่ขาดงาน)</span>
                                                        <span>+ ฿{diligenceBonus.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-sm font-bold text-red-500">
                                                    <span>หักมาสายอัตโนมัติ</span>
                                                    <span>- ฿{lateDeduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                {totalAdvanceAmount > 0 && (
                                                    <div className="flex justify-between items-center text-sm font-bold text-amber-600">
                                                        <span>หักเบิกเงินล่วงหน้า</span>
                                                        <span>- ฿{totalAdvanceAmount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {socialSecurityDeduction > 0 && (
                                                    <div className="flex justify-between items-center text-sm font-bold text-rose-600">
                                                        <span>หักประกันสังคม (5%)</span>
                                                        <span>- ฿{socialSecurityDeduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                                                    <span className="text-lg font-black text-neutral-900">ยอดสุทธิ (Net Pay)</span>
                                                    <span className="text-2xl font-black text-[#0F172A]">฿{netPay.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Cash Advance History */}
                                            {cashAdvances.length > 0 && (
                                                <div className="mt-6 border-t border-neutral-100 pt-6">
                                                    <h4 className="text-xs font-bold text-neutral-400 mb-3">ประวัติการเบิกเงินล่วงหน้า</h4>
                                                    <div className="space-y-2">
                                                        {cashAdvances.map(adv => (
                                                            <div key={adv.id} className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs font-bold">
                                                                <div>
                                                                    <span className="text-neutral-800 block">{new Date(adv.advance_date).toLocaleDateString()}</span>
                                                                    <span className="text-[10px] text-neutral-400 font-normal">{adv.reason || 'ไม่ระบุเหตุผล'}</span>
                                                                </div>
                                                                <span className="text-red-500 font-black">- ฿{Number(adv.amount).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 font-sans overflow-y-auto no-scrollbar bg-white min-h-screen pb-32 relative">

            {/* TABS */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-100 mb-8 gap-4 sm:gap-0">
                <div className="flex overflow-x-auto no-scrollbar gap-6 sm:gap-8">
                    <button
                        onClick={() => setInternalTab('list')}
                        className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${internalTab === 'list' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                    >
                        {locale === 'en' ? 'Overview' : locale === 'zh' ? '概览' : 'ภาพรวม'}
                        {internalTab === 'list' && (
                            <motion.div layoutId="activeTabStaff" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                        )}
                    </button>
                    <button
                        onClick={() => setInternalTab('verification')}
                        className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative flex items-center gap-2 ${internalTab === 'verification' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                    >
                        {locale === 'en' ? 'Verification' : locale === 'zh' ? '验证' : 'ยืนยันตัวตน'}
                        {pendingCount > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{pendingCount}</span>}
                        {internalTab === 'verification' && (
                            <motion.div layoutId="activeTabStaff" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                        )}
                    </button>
                    <button
                        onClick={() => setInternalTab('attendance')}
                        className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${internalTab === 'attendance' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                    >
                        {locale === 'en' ? 'Attendance' : locale === 'zh' ? '考勤' : 'เวลาเข้างาน'}
                        {internalTab === 'attendance' && (
                            <motion.div layoutId="activeTabStaff" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                        )}
                    </button>
                    <button
                        onClick={() => setInternalTab('sop')}
                        className={`whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${internalTab === 'sop' ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                    >
                        {locale === 'en' ? 'SOP Manual' : locale === 'zh' ? 'SOP手册' : 'คู่มือ SOP'}
                        {internalTab === 'sop' && (
                            <motion.div layoutId="activeTabStaff" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]" />
                        )}
                    </button>
                </div>

                {/* You can keep or remove the original SOP Editor button if needed. We'll hide it for now since we have the new SOP tab */}
            </div>

            {/* CONTENT AREA */}
            <div>

                {/* VIEW: STAFF LIST */}
                {internalTab === 'list' && (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Search */}
                        <div className="bg-white p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-4 border border-neutral-200 shadow-sm">
                            <div className="flex-1 flex items-center w-full">
                                <div className="pl-4 text-neutral-400"><Search size={18} /></div>
                                <input
                                    type="text"
                                    placeholder={locale === 'en' ? 'Search by name or ID...' : locale === 'zh' ? '按姓名或ID搜索...' : 'ค้นหาพนักงานด้วยชื่อ หรือ รหัส...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none py-3 px-4 text-sm font-bold text-neutral-800 focus:ring-0 outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddStaffModal(true)}
                                className="bg-[#0F172A] text-white px-6 py-3 rounded-xl text-[11px] font-bold tracking-wide hover:bg-neutral-800 transition-colors whitespace-nowrap w-full sm:w-auto text-center"
                            >
                                + เพิ่มพนักงาน
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-neutral-300" size={48} /></div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-400 border-b border-neutral-100">
                                            <th className="px-6 py-4">พนักงาน (Name)</th>
                                            <th className="px-6 py-4">ตำแหน่ง & แผนก (Role)</th>
                                            <th className="px-6 py-4">รหัส (ID)</th>
                                            <th className="px-6 py-4">สถานะ (Status)</th>
                                            <th className="px-6 py-4">วันหยุดชดเชยสะสม</th>
                                            <th className="px-6 py-4 text-right">จัดการ (Action)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {filteredStaff.map(person => (
                                            <tr key={person.id} onClick={() => { setSelectedStaff(person); setIsDetailOpen(true); setDetailTab('info'); }} className="hover:bg-neutral-50 transition-colors cursor-pointer group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-[#1A1A18] group-hover:text-white transition-all text-sm font-black shrink-0">
                                                            {(person.display_name || person.full_name || 'S').slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="text-sm font-black text-[#1A1A18] truncate max-w-[150px] sm:max-w-[200px]">
                                                            {person.display_name || person.full_name || 'Staff'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-neutral-500">
                                                        {getRoleLabel(person.staff_level, shopSettings?.custom_roles)} • {translateStaffType(person.staff_type || person.department)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-neutral-400 font-mono">{person.staff_code || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {person.is_verified ? (
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 inline-flex items-center gap-1">
                                                            <ShieldCheck size={12} /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 inline-flex items-center gap-1">
                                                            <AlertCircle size={12} /> Unverified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-neutral-500">ยอดสะสม:</span>
                                                            <span className="text-sm font-black text-[#1A1A18]">{person.accrued_holiday_days || 0} วัน</span>
                                                            {Number(person.accrued_holiday_days || 0) > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setUseHolidayForm({ ...useHolidayForm, profile_id: person.id });
                                                                        setShowUseHolidayModal(true);
                                                                    }}
                                                                    className="ml-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md transition-colors"
                                                                >
                                                                    ใช้วันหยุด
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg w-max">
                                                            <button 
                                                                onClick={(e) => handleToggleCompensationType(person.id, 'money', e)}
                                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${(!person.holiday_compensation_type || person.holiday_compensation_type === 'money') ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                            >
                                                                รับเป็นเงิน
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleToggleCompensationType(person.id, 'dayoff', e)}
                                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${person.holiday_compensation_type === 'dayoff' ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                            >
                                                                วันหยุดชดเชย
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 group-hover:text-[#1A1A18] transition-all">
                                                        จัดการ <ChevronRight size={14} />
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredStaff.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-neutral-400 text-sm font-bold">ไม่พบรายชื่อพนักงาน</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW: VERIFICATION */}
                {internalTab === 'verification' && (
                    <div className="max-w-6xl mx-auto">
                        {loading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-neutral-300" size={48} /></div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-400 border-b border-neutral-100">
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Submitted At</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {verifications.map(v => (
                                            <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="text-sm font-black text-black">{v.profiles?.display_name || v.profiles?.full_name}</div>
                                                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{v.profiles?.staff_code}</div>
                                                </td>
                                                <td className="px-6 py-5 text-xs text-neutral-500 font-bold">{new Date(v.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-5">
                                                    {v.verified_at ? (
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Verified</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {!v.verified_at && (
                                                        <button onClick={() => approveVerification(v.id, v.profile_id)} className="text-[10px] font-bold bg-[#0F172A] text-white px-4 py-2 hover:bg-neutral-800 rounded-lg">
                                                            Approve
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {verifications.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-neutral-400 text-sm">No verification requests found.</td></tr>
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
                            <CalendarGrid logsList={filteredAttendances} monthStr={selectedMonth} publicHolidays={publicHolidays} />
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
                                                    {a.override ? (
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1 w-max ${a.override.reason.includes('มาสาย') ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'}`}>
                                                            {a.override.reason}
                                                        </span>
                                                    ) : a.leave ? (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 w-max block">
                                                            ลา{a.leave.leave_type === 'sick' ? 'ป่วย' : a.leave.leave_type === 'personal' ? 'กิจ' : 'พักร้อน'} {a.leave.is_paid ? '(ได้ค่าจ้าง)' : '(ไม่ได้ค่าจ้าง)'}
                                                        </span>
                                                    ) : a.late_minutes > 0 ? (
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
                                                    {checkPublicHoliday(new Date(a.date)) && a.clock_in && (a.checkin_log_id || a.checkout_log_id) ? (
                                                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                                                            <span className="text-[10px] font-black uppercase text-pink-600 tracking-widest block mb-1">ทำงานในวันหยุดนักขัตฤกษ์</span>
                                                            {a.holiday_pay_status === 'approved_pay' ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-max inline-block border border-emerald-100">
                                                                    ✓ อนุมัติอัตโนมัติ: จ่ายค่าแรงพิเศษ
                                                                </span>
                                                            ) : a.holiday_pay_status === 'approved_dayoff' ? (
                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-max inline-block border border-indigo-100">
                                                                    ✓ อนุมัติอัตโนมัติ: หยุดชดเชย
                                                                </span>
                                                            ) : a.holiday_pay_status === 'rejected' ? (
                                                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md w-max inline-block border border-red-100 line-through">
                                                                    ไม่อนุมัติชดเชย
                                                                </span>
                                                            ) : (
                                                                <div className="flex flex-col gap-1.5 mt-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleApproveHolidayPay(a.checkout_log_id || a.checkin_log_id); }}
                                                                        className="text-[10px] font-bold text-white px-2.5 py-1.5 rounded-md transition-colors w-full text-left flex justify-between items-center bg-[#1A1A18] hover:bg-neutral-800 ring-2 ring-neutral-300"
                                                                    >
                                                                        อนุมัติ (ตามการตั้งค่า) <span>+</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleApproveHolidayPay(a.checkout_log_id || a.checkin_log_id, 'rejected'); }}
                                                                        className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors w-full text-left"
                                                                    >
                                                                        ไม่อนุมัติ
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
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



            {/* ADD STAFF MODAL */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                            <div>
                                <h2 className="text-lg font-black text-neutral-900 tracking-tight">เพิ่มพนักงานใหม่</h2>
                                <p className="text-xs font-bold text-neutral-400 mt-1">สร้างโปรไฟล์พนักงานเข้าสู่ระบบ</p>
                            </div>
                            <button onClick={() => setShowAddStaffModal(false)} className="text-neutral-400 hover:text-black p-2 rounded-full hover:bg-neutral-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ชื่อพนักงาน *</label>
                                <input
                                    type="text"
                                    value={newStaffForm.display_name}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, display_name: e.target.value })}
                                    placeholder="เช่น คุณสมชาย"
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">รหัสพนักงาน</label>
                                <input
                                    type="text"
                                    value={newStaffForm.staff_code}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, staff_code: e.target.value })}
                                    placeholder="เช่น EMP-001"
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">เบอร์โทรศัพท์</label>
                                <input
                                    type="tel"
                                    value={newStaffForm.phone}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                                    placeholder="080-123-4567"
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">แผนก</label>
                                <select
                                    value={newStaffForm.staff_type}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, staff_type: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                >
                                    <option value="cafe">หน้าร้านคาเฟ่</option>
                                    <option value="kitchen">ห้องครัว</option>
                                    <option value="landscape">ทีมจัดสวน</option>
                                    <option value="general">ทั่วไป</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ตำแหน่ง (Role)</label>
                                <select
                                    value={newStaffForm.staff_level}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, staff_level: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                >
                                    {(shopSettings?.custom_roles && shopSettings.custom_roles.length > 0 ? shopSettings.custom_roles : [{ id: 'manager', label: 'ผู้จัดการสาขา (Manager)' }, { id: 'staff', label: 'พนักงานทั่วไป (Staff)' }]).map((role: any) => (
                                        <option key={role.id} value={role.id}>{role.label}</option>
                                    ))}
                                    <option value="admin">แอดมิน (Admin)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5 flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="add-is-rider"
                                    checked={newStaffForm.is_rider || false}
                                    onChange={e => setNewStaffForm({ ...newStaffForm, is_rider: e.target.checked })}
                                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                />
                                <label htmlFor="add-is-rider" className="text-sm font-bold text-gray-700 cursor-pointer">
                                    เป็นพนักงานส่งของ (Rider) ควบคู่ด้วย
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ประเภทค่าจ้าง</label>
                                    <select
                                        value={newStaffForm.salary_type}
                                        onChange={e => setNewStaffForm({ ...newStaffForm, salary_type: e.target.value })}
                                        className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                    >
                                        <option value="daily">รายวัน</option>
                                        <option value="monthly">รายเดือน</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">รูปแบบรับชดเชยวันหยุด</label>
                                    <select
                                        value={newStaffForm.holiday_compensation_type}
                                        onChange={e => setNewStaffForm({ ...newStaffForm, holiday_compensation_type: e.target.value })}
                                        className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                    >
                                        <option value="money">รับเป็นค่าแรง (Money)</option>
                                        <option value="dayoff">รับเป็นวันหยุดชดเชย (Day Off)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">จำนวนเงิน (บาท)</label>
                                    <input
                                        type="number"
                                        value={newStaffForm.daily_wage || ''}
                                        onChange={e => setNewStaffForm({ ...newStaffForm, daily_wage: Number(e.target.value) })}
                                        placeholder="0"
                                        className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">หักประกันสังคม (Social Security)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                            checked={newStaffForm.has_social_security || false}
                                            onChange={e => setNewStaffForm({ ...newStaffForm, has_social_security: e.target.checked })}
                                        />
                                        <span className="text-sm font-bold text-gray-700">เข้าระบบหักประกันสังคม 5%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-white">
                            <button
                                onClick={handleCreateStaff}
                                className="w-full bg-[#0F172A] text-white py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                            >
                                สร้างโปรไฟล์พนักงาน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEAVE MODAL */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                            <div>
                                <h2 className="text-lg font-black text-neutral-900 tracking-tight">บันทึกวันลา</h2>
                                <p className="text-xs font-bold text-neutral-400 mt-1">บันทึกการลางานของพนักงาน</p>
                            </div>
                            <button onClick={() => setShowLeaveModal(false)} className="text-neutral-400 hover:text-black p-2 rounded-full hover:bg-neutral-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">พนักงาน *</label>
                                <select
                                    value={leaveForm.profile_id}
                                    onChange={e => setLeaveForm({ ...leaveForm, profile_id: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                >
                                    <option value="">-- เลือกพนักงาน --</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.display_name} ({s.staff_code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">วันที่ลา *</label>
                                <input
                                    type="date"
                                    value={leaveForm.leave_date}
                                    onChange={e => setLeaveForm({ ...leaveForm, leave_date: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ประเภทการลา *</label>
                                <select
                                    value={leaveForm.leave_type}
                                    onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                >
                                    <option value="sick">ลาป่วย</option>
                                    <option value="personal">ลากิจ</option>
                                    <option value="vacation">ลาพักร้อน</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_paid_leave"
                                    checked={leaveForm.is_paid}
                                    onChange={e => setLeaveForm({ ...leaveForm, is_paid: e.target.checked })}
                                    className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black"
                                />
                                <label htmlFor="is_paid_leave" className="text-sm font-bold text-neutral-800">ได้ค่าจ้าง (Paid Leave)</label>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">หมายเหตุ</label>
                                <textarea
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    placeholder="รายละเอียดการลา (ถ้ามี)"
                                    rows={3}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-white">
                            <button
                                onClick={handleCreateLeave}
                                className="w-full bg-red-500 text-white py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                บันทึกวันลา
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USE HOLIDAY MODAL */}
            {showUseHolidayModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-indigo-50/50">
                            <div>
                                <h2 className="text-lg font-black text-indigo-900 tracking-tight">ใช้วันหยุดชดเชย</h2>
                                <p className="text-xs font-bold text-indigo-400 mt-1">ใช้วันหยุดชดเชยสะสมของพนักงาน</p>
                            </div>
                            <button onClick={() => setShowUseHolidayModal(false)} className="text-indigo-400 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">วันที่ต้องการหยุด *</label>
                                <input
                                    type="date"
                                    value={useHolidayForm.leave_date}
                                    onChange={e => setUseHolidayForm({ ...useHolidayForm, leave_date: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">หมายเหตุ</label>
                                <textarea
                                    value={useHolidayForm.reason}
                                    onChange={e => setUseHolidayForm({ ...useHolidayForm, reason: e.target.value })}
                                    placeholder="รายละเอียดการหยุด (ถ้ามี)"
                                    rows={2}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-white">
                            <button
                                onClick={handleUseHolidaySubmit}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin inline-block mx-auto" /> : 'ยืนยันการใช้วันหยุด'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CASH ADVANCE MODAL */}
            {showCashAdvanceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                            <div>
                                <h2 className="text-lg font-black text-neutral-900 tracking-tight">บันทึกเบิกเงินล่วงหน้า</h2>
                                <p className="text-xs font-bold text-neutral-400 mt-1">บันทึกการขอเบิกเงินสดระหว่างเดือน</p>
                            </div>
                            <button onClick={() => setShowCashAdvanceModal(false)} className="text-neutral-400 hover:text-black p-2 rounded-full hover:bg-neutral-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">จำนวนเงิน (บาท) *</label>
                                <input
                                    type="number"
                                    value={cashAdvanceForm.amount || ''}
                                    onChange={e => setCashAdvanceForm({ ...cashAdvanceForm, amount: Number(e.target.value) })}
                                    placeholder="เช่น 1000"
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">วันที่เบิกเงิน *</label>
                                <input
                                    type="date"
                                    value={cashAdvanceForm.advance_date}
                                    onChange={e => setCashAdvanceForm({ ...cashAdvanceForm, advance_date: e.target.value })}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">เหตุผล / หมายเหตุ</label>
                                <textarea
                                    value={cashAdvanceForm.reason}
                                    onChange={e => setCashAdvanceForm({ ...cashAdvanceForm, reason: e.target.value })}
                                    placeholder="เหตุผลการเบิกเงิน"
                                    rows={3}
                                    className="w-full bg-neutral-50 rounded-xl border border-neutral-200 py-3 px-4 text-sm outline-none font-bold text-neutral-800 focus:border-neutral-400 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 bg-white">
                            <button
                                onClick={handleCreateCashAdvance}
                                className="w-full bg-amber-600 text-white py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                            >
                                บันทึกการเบิกเงิน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT OVERLAY (A4 LAYOUT) */}
            {printData && (
                <div className="print-area fixed inset-0 z-[999] bg-white p-8 overflow-y-auto font-sans text-black">
                    {/* Screen Close Button & Top Action Bar */}
                    <div className="no-print mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 text-white p-4 rounded-2xl shadow-xl">
                        <div>
                            <span className="text-sm font-black tracking-wide block">📄 ตัวอย่างเอกสารพร้อมพิมพ์ / บันทึก PDF (Print & PDF Export)</span>
                            <span className="text-xs text-neutral-400 font-bold block mt-0.5">กดปุ่มสีเขียวด้านขวาเพื่อเปิดหน้าต่างพิมพ์ และเลือก "Save as PDF" เพื่อโหลดไฟล์เก็บไว้ในเครื่อง</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                                <Printer size={16} /> 🖨️ สั่งพิมพ์ / ดาวน์โหลด PDF
                            </button>
                            <button
                                onClick={() => setPrintData(null)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>

                    {/* PAYSLIP PRINT TEMPLATE (OFFICIAL CORPORATE STANDARD) */}
                    {printData.type === 'payslip' && (
                        <div className="max-w-[210mm] mx-auto bg-white border-2 border-black p-8 text-black space-y-5 shadow-none text-xs font-sans">
                            {/* Company Header */}
                            <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                                <div>
                                    <h1 className="text-lg font-black text-black tracking-tight uppercase">บริษัท ไซเล็ม สตูดิโอ แอนด์ คาเฟ่ จำกัด</h1>
                                    <p className="text-[10px] font-bold text-gray-700 mt-0.5">XYLEM STUDIO & CAFE CO., LTD.</p>
                                    <p className="text-[10px] text-gray-600 mt-1">123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</p>
                                    <p className="text-[10px] text-gray-600">เลขประจำตัวผู้เสียภาษี (TAX ID): 0105565000000 | สำนักงานใหญ่</p>
                                </div>
                                <div className="text-right border-2 border-black p-2 bg-gray-50">
                                    <h2 className="text-sm font-black text-black uppercase">ใบแจ้งยอดเงินเดือน</h2>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase">PAYSLIP / SALARY STATEMENT</p>
                                    <p className="text-[10px] font-bold text-black mt-1">ประจำเดือน: {printData.data.month}</p>
                                </div>
                            </div>

                            {/* Employee Info Grid */}
                            <div className="grid grid-cols-2 gap-4 border border-black p-3 bg-gray-50/50">
                                <div className="space-y-1">
                                    <p><span className="font-bold text-gray-700">ชื่อ-นามสกุล (Employee Name):</span> <span className="font-black text-black">{printData.data.staff?.display_name || printData.data.staff?.full_name}</span></p>
                                    <p><span className="font-bold text-gray-700">รหัสพนักงาน (Staff ID):</span> <span className="font-mono font-bold">{printData.data.staff?.staff_code || '-'}</span></p>
                                    <p><span className="font-bold text-gray-700">แผนก (Department):</span> {printData.data.staff?.staff_type?.toUpperCase() || '-'}</p>
                                </div>
                                <div className="space-y-1 text-right sm:text-left sm:pl-6 sm:border-l sm:border-gray-300">
                                    <p><span className="font-bold text-gray-700">ประเภทค่าจ้าง (Salary Type):</span> {printData.data.staff?.salary_type === 'monthly' ? 'รายเดือน (Monthly)' : 'รายวัน (Daily)'}</p>
                                    <p><span className="font-bold text-gray-700">เลขที่บัญชีรับเงิน (Bank A/C):</span> <span className="font-mono font-bold">xxx-x-x{printData.data.staff?.phone?.slice(-4) || '1234'}-x</span></p>
                                    <p><span className="font-bold text-gray-700">วันที่จ่ายเงิน (Pay Date):</span> {new Date().toLocaleDateString('th-TH')}</p>
                                </div>
                            </div>

                            {/* Earnings vs Deductions Table */}
                            <div className="grid grid-cols-2 border border-black">
                                {/* EARNINGS */}
                                <div className="border-r border-black">
                                    <div className="bg-gray-200 p-2 font-black border-b border-black text-center text-xs uppercase">รายได้ (EARNINGS)</div>
                                    <table className="w-full text-xs">
                                        <tbody>
                                            <tr className="border-b border-gray-200">
                                                <td className="p-2">ค่าแรงพื้นฐาน ({printData.data.daysWorked} วัน)</td>
                                                <td className="p-2 text-right font-bold">฿{printData.data.basePay.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-200">
                                                <td className="p-2">ค่าล่วงเวลา (OT)</td>
                                                <td className="p-2 text-right font-bold">฿{printData.data.otPay.toLocaleString()}</td>
                                            </tr>
                                            {printData.data.diligenceBonus > 0 && (
                                                <tr className="border-b border-gray-200 font-bold">
                                                    <td className="p-2">เบี้ยขยันประจำเดือน</td>
                                                    <td className="p-2 text-right">฿{printData.data.diligenceBonus.toLocaleString()}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="p-2 text-gray-400 font-normal">เงินได้อื่นๆ / เงินพิเศษ</td>
                                                <td className="p-2 text-right text-gray-400">฿0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* DEDUCTIONS */}
                                <div>
                                    <div className="bg-gray-200 p-2 font-black border-b border-black text-center text-xs uppercase">รายการหัก (DEDUCTIONS)</div>
                                    <table className="w-full text-xs">
                                        <tbody>
                                            <tr className="border-b border-gray-200">
                                                <td className="p-2">หักมาสาย ({printData.data.totalLateMinutes} นาที)</td>
                                                <td className="p-2 text-right font-bold text-red-600">฿{printData.data.lateDeduction.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-200">
                                                <td className="p-2">หักเบิกเงินล่วงหน้า (Cash Advance)</td>
                                                <td className="p-2 text-right font-bold text-red-600">฿{printData.data.totalAdvanceAmount.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-200">
                                                <td className="p-2 text-black">หักประกันสังคม (SSF)</td>
                                                <td className="p-2 text-right font-bold text-red-600">฿{(printData.data.socialSecurityDeduction || 0).toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 text-gray-400">ภาษีหัก ณ ที่จ่าย (WHT)</td>
                                                <td className="p-2 text-right text-gray-400">฿0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals Summary Line */}
                            <div className="grid grid-cols-2 border-x border-b border-black text-xs font-bold bg-gray-100/70">
                                <div className="p-2.5 flex justify-between border-r border-black">
                                    <span>รวมรายได้ (Total Earnings):</span>
                                    <span className="font-black">฿{(printData.data.basePay + printData.data.otPay + printData.data.diligenceBonus).toLocaleString()}</span>
                                </div>
                                <div className="p-2.5 flex justify-between">
                                    <span>รวมรายการหัก (Total Deductions):</span>
                                    <span className="font-black text-red-600">฿{(printData.data.lateDeduction + printData.data.totalAdvanceAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Net Pay Box */}
                            <div className="border-2 border-black p-4 bg-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                                <div>
                                    <span className="text-xs font-bold text-gray-700 block">เงินได้สุทธินำจ่าย (NET PAYABLE AMOUNT):</span>
                                    <span className="text-sm font-black text-black">({bahtText(printData.data.netPay)})</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-black font-mono">฿{printData.data.netPay.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="text-[9px] text-gray-500 italic text-center">
                                * เอกสารนี้สร้างขึ้นจากระบบบริหารจัดการพนักงานอัตโนมัติ (Automated HR System) กรุณาเก็บไว้เป็นหลักฐานเพื่อการตรวจสอบ
                            </p>

                            {/* Official Signatures & Stamp Box */}
                            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs border-t border-dashed border-gray-400">
                                <div>
                                    <div className="h-12 border-b border-black w-40 mx-auto mb-2 flex items-end justify-center pb-1"></div>
                                    <p className="font-bold">ลายมือชื่อพนักงานผู้รับเงิน</p>
                                    <p className="text-[10px] text-gray-500">Employee Signature</p>
                                    <p className="text-[10px] text-gray-400 mt-1">วันที่ ...../...../..........</p>
                                </div>
                                <div>
                                    <div className="h-12 border-b border-black w-40 mx-auto mb-2 flex items-end justify-center pb-1"></div>
                                    <p className="font-bold">ลายมือชื่อผู้อนุมัติ / นายจ้าง</p>
                                    <p className="text-[10px] text-gray-500">Employer Signature</p>
                                    <p className="text-[10px] text-gray-400 mt-1">วันที่ ...../...../..........</p>
                                </div>
                                <div className="flex flex-col items-center justify-center border border-gray-300 rounded p-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">ตราประทับบริษัท</span>
                                    <span className="text-[9px] font-bold text-gray-300 uppercase mt-2">(COMPANY STAMP)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MONTHLY SUMMARY REPORT PRINT TEMPLATE (OFFICIAL CORPORATE REPORT) */}
                    {printData.type === 'summary' && (
                        <div className="max-w-[297mm] mx-auto bg-white border-2 border-black p-8 text-black space-y-6 shadow-none text-xs font-sans">
                            {/* Header */}
                            <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                                <div>
                                    <h1 className="text-xl font-black text-black tracking-tight uppercase">บริษัท ไซเล็ม สตูดิโอ แอนด์ คาเฟ่ จำกัด</h1>
                                    <p className="text-xs font-bold text-gray-700">XYLEM STUDIO & CAFE CO., LTD.</p>
                                    <p className="text-[10px] text-gray-600">เลขประจำตัวผู้เสียภาษี (TAX ID): 0105565000000 | สำนักงานใหญ่</p>
                                </div>
                                <div className="text-right border-2 border-black p-2 bg-gray-50">
                                    <h2 className="text-sm font-black text-black uppercase">รายงานสรุปการจ่ายเงินเดือนพนักงาน</h2>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase">MONTHLY PAYROLL SUMMARY REPORT</p>
                                    <p className="text-[10px] font-bold text-black mt-1">ประจำเดือน: {printData.data.month}</p>
                                </div>
                            </div>

                            <table className="w-full text-left text-xs border border-black border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 font-bold border-b border-black text-[10px] uppercase">
                                        <th className="border-r border-black p-2 text-center">ลำดับ</th>
                                        <th className="border-r border-black p-2">รหัสพนักงาน</th>
                                        <th className="border-r border-black p-2">ชื่อ-นามสกุล พนักงาน</th>
                                        <th className="border-r border-black p-2">เลขที่บัญชีรับเงิน</th>
                                        <th className="border-r border-black p-2 text-center">วันทำงาน</th>
                                        <th className="border-r border-black p-2 text-right">ฐานเงินเดือน</th>
                                        <th className="border-r border-black p-2 text-right">ค่า OT</th>
                                        <th className="border-r border-black p-2 text-right">เบี้ยขยัน</th>
                                        <th className="border-r border-black p-2 text-right">หักสาย</th>
                                        <th className="border-r border-black p-2 text-right">หักเบิกล่วงหน้า</th>
                                        <th className="p-2 text-right font-black">ยอดโอนสุทธิ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let grandBase = 0, grandOt = 0, grandBonus = 0, grandLate = 0, grandAdv = 0, grandNet = 0;

                                        return (
                                            <>
                                                {printData.data.staffList.map((st: any, idx: number) => {
                                                    const staffLogs = printData.data.attendances.filter((a: any) => a.profile_id === st.id);
                                                    let daysWorked = 0, paidLeaves = 0, unpaidLeaves = 0, lateMins = 0, otMins = 0;
                                                    staffLogs.forEach((a: any) => {
                                                        if (a.clock_in) daysWorked++;
                                                        if (a.leave) {
                                                            if (a.leave.is_paid) paidLeaves++;
                                                            else unpaidLeaves++;
                                                        }
                                                        if (a.late_minutes) lateMins += a.late_minutes;
                                                        if (a.ot_approved_minutes) otMins += a.ot_approved_minutes;
                                                    });

                                                    const wage = st.daily_wage || 0;
                                                    const base = st.salary_type === 'monthly' ? wage : (daysWorked + paidLeaves) * wage;
                                                    const ot = (otMins / 60) * (st.overtime_rate_per_hour || 0);
                                                    const late = lateMins * 1;
                                                    const bonus = (lateMins === 0 && unpaidLeaves === 0 && st.diligence_allowance > 0) ? Number(st.diligence_allowance) : 0;
                                                    const adv = 0;
                                                    const net = base + ot + bonus - late - adv;

                                                    grandBase += base; grandOt += ot; grandBonus += bonus; grandLate += late; grandAdv += adv; grandNet += net;

                                                    return (
                                                        <tr key={st.id} className="border-b border-black hover:bg-gray-50">
                                                            <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                                                            <td className="border-r border-black p-2 font-mono">{st.staff_code || '-'}</td>
                                                            <td className="border-r border-black p-2 font-bold">{st.display_name || st.full_name}</td>
                                                            <td className="border-r border-black p-2 font-mono text-[10px]">xxx-x-x{st.phone?.slice(-4) || '1234'}-x</td>
                                                            <td className="border-r border-black p-2 text-center">{daysWorked}</td>
                                                            <td className="border-r border-black p-2 text-right">฿{base.toLocaleString()}</td>
                                                            <td className="border-r border-black p-2 text-right">฿{ot.toLocaleString()}</td>
                                                            <td className="border-r border-black p-2 text-right">฿{bonus.toLocaleString()}</td>
                                                            <td className="border-r border-black p-2 text-right text-red-600">฿{late.toLocaleString()}</td>
                                                            <td className="border-r border-black p-2 text-right text-red-600">฿{adv.toLocaleString()}</td>
                                                            <td className="p-2 text-right font-black">฿{net.toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-gray-200 font-black border-t-2 border-black text-xs">
                                                    <td colSpan={5} className="border-r border-black p-2 text-right uppercase">ยอดรวมสุทธิทั้งสิ้น (GRAND TOTAL):</td>
                                                    <td className="border-r border-black p-2 text-right">฿{grandBase.toLocaleString()}</td>
                                                    <td className="border-r border-black p-2 text-right">฿{grandOt.toLocaleString()}</td>
                                                    <td className="border-r border-black p-2 text-right">฿{grandBonus.toLocaleString()}</td>
                                                    <td className="border-r border-black p-2 text-right text-red-600">฿{grandLate.toLocaleString()}</td>
                                                    <td className="border-r border-black p-2 text-right text-red-600">฿{grandAdv.toLocaleString()}</td>
                                                    <td className="p-2 text-right text-sm font-black">฿{grandNet.toLocaleString()}</td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>

                            {/* Corporate Approval Chain */}
                            <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
                                <div>
                                    <div className="h-12 border-b border-black w-40 mx-auto mb-2 flex items-end justify-center pb-1"></div>
                                    <p className="font-bold">ผู้จัดทำเอกสาร (Prepared By)</p>
                                    <p className="text-[10px] text-gray-500">เจ้าหน้าที่ HR / ฝ่ายบุคคล</p>
                                </div>
                                <div>
                                    <div className="h-12 border-b border-black w-40 mx-auto mb-2 flex items-end justify-center pb-1"></div>
                                    <p className="font-bold">ผู้ตรวจสอบเอกสาร (Checked By)</p>
                                    <p className="text-[10px] text-gray-500">ฝ่ายบัญชีและการเงิน</p>
                                </div>
                                <div>
                                    <div className="h-12 border-b border-black w-40 mx-auto mb-2 flex items-end justify-center pb-1"></div>
                                    <p className="font-bold">ผู้อนุมัติจ่ายเงิน (Approved By)</p>
                                    <p className="text-[10px] text-gray-500">กรรมการผู้จัดการ / Owner</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VIEW: SOP MANUAL */}
            {internalTab === 'sop' && (
                <div className="max-w-6xl mx-auto space-y-6 pt-4 pb-20">
                    <SOPStaticContent />
                </div>
            )}

            <POSSOPEditorModal 
                isOpen={isSopEditorOpen}
                onClose={() => setIsSopEditorOpen(false)}
                shopSettings={shopSettings}
                branchId={shopSettings?.branch_id}
            />

            <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 0; margin: 0; background: white !important; }
              .no-print { display: none !important; }
          }
      `}</style>
        </div>
    )
}
