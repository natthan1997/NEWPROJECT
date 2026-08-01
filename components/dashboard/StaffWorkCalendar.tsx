'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  CalendarDaysIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import Holidays from 'date-holidays';

interface AttendanceLog {
  id: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  is_within_range?: boolean;
}

interface StaffLeave {
  id: string;
  leave_date: string;
  leave_type: string;
  reason?: string;
}

export function StaffWorkCalendar({ compact = false }: { compact?: boolean }) {
  const { profile, user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const hd = new Holidays('TH');

  // Fetch attendance logs and leaves for current staff
  useEffect(() => {
    if (!profile?.id) return;
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const [logsRes, leavesRes] = await Promise.all([
          supabase
            .from('attendance_logs')
            .select('*')
            .eq('profile_id', profile.id)
            .order('timestamp', { ascending: false }),
          supabase
            .from('staff_leaves')
            .select('*')
            .eq('profile_id', profile.id)
        ]);

        if (!logsRes.error && logsRes.data) {
          setLogs(logsRes.data);
        }
        if (!leavesRes.error && leavesRes.data) {
          setLeaves(leavesRes.data);
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [profile?.id]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesTH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const dayKeyFromDate = (d: Date) => {
    const map: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    return map[d.getDay()];
  };

  const isDayRestDay = (d: Date) => {
    const p = profile;
    const restDays = p?.rest_days || [];
    const workDays = p?.work_days;
    const dayCode = dayKeyFromDate(d);

    const restDaysNormalized = restDays.map((rd: any) => String(rd).toLowerCase().slice(0, 3));
    if (restDaysNormalized.includes(dayCode)) {
      return true;
    }
    if (workDays && Array.isArray(workDays) && workDays.length > 0) {
      const normalizedDays = workDays.map((wd: any) => String(wd).toLowerCase().slice(0, 3));
      return !normalizedDays.includes(dayCode);
    }
    return false;
  };

  const getLogsForDay = (dayNum: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      return logDateStr === targetDateStr;
    });
  };

  const getLeaveForDay = (dayNum: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return leaves.find(l => {
      if (!l.leave_date) return false;
      const leaveDateStr = l.leave_date.split('T')[0];
      return leaveDateStr === targetDateStr;
    });
  };

  const getPublicHolidayForDay = (dayNum: number) => {
    const d = new Date(year, month, dayNum);
    const holidays = hd.isHoliday(d);
    if (holidays && holidays.length > 0) {
      return holidays[0];
    }
    return null;
  };

  const selectedDayLogs = getLogsForDay(selectedDate.getDate());
  const selectedDayLeave = getLeaveForDay(selectedDate.getDate());
  const selectedDayHoliday = getPublicHolidayForDay(selectedDate.getDate());
  const selectedDayIsRest = isDayRestDay(selectedDate);
  const isSelectedSameMonth = selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

  const today = new Date();
  today.setHours(0,0,0,0);
  const isTodayDate = (dayNum: number) => {
    return today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
  };

  const leaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick': return '🤒 ลาป่วย';
      case 'personal': return '📝 ลากิจ';
      case 'vacation': return '🏖️ ลาพักร้อน';
      default: return '📋 ลางาน';
    }
  };

  return (
    <div className={`w-full text-[#1A1A18] ${compact ? 'pt-0' : 'bg-white rounded-[32px] p-5 md:p-6 border border-gray-200/50 shadow-[0_4px_25px_rgba(0,0,0,0.03)]'}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700">
            <CalendarDaysIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1A1A18] leading-tight">
              {monthNamesTH[month]} {year + 543}
            </h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              ตารางงานและประวัติเข้า-ออกงาน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-full border border-gray-200/40 shrink-0">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-full text-gray-600 hover:bg-white hover:shadow-xs transition-all active:scale-95 shrink-0"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            className="px-3 py-1 text-[11px] font-bold text-[#1A1A18] hover:bg-white rounded-full transition-all whitespace-nowrap shrink-0 leading-none"
          >
            วันนี้
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-full text-gray-600 hover:bg-white hover:shadow-xs transition-all active:scale-95 shrink-0"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Header Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((dayName, idx) => (
          <span 
            key={dayName} 
            className={`text-[11px] font-bold py-1 ${idx === 0 || idx === 6 ? 'text-gray-500' : 'text-gray-400'}`}
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before 1st day of month */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-11 flex items-center justify-center bg-transparent" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const thisDate = new Date(year, month, dayNum);
          const rest = isDayRestDay(thisDate);
          const dayLogs = getLogsForDay(dayNum);
          const dayLeave = getLeaveForDay(dayNum);
          const dayHoliday = getPublicHolidayForDay(dayNum);
          const hasCheckedIn = dayLogs.some(l => l.type === 'check_in');
          const isToday = isTodayDate(dayNum);
          const isSelected = isSelectedSameMonth && selectedDate.getDate() === dayNum;
          
          const isPast = thisDate < today;

          return (
            <div key={dayNum} className="h-11 flex flex-col items-center justify-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedDate(thisDate)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-[#1A1A18] text-white shadow-sm font-bold'
                    : isToday
                    ? 'bg-gray-100 text-gray-900 font-bold border border-gray-300'
                    : dayHoliday && !hasCheckedIn
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 font-bold'
                    : rest
                    ? 'text-gray-400 bg-gray-50/50 hover:bg-gray-100'
                    : 'text-gray-800 hover:bg-gray-100/80 font-medium'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold leading-none">
                  {dayNum}
                </span>

                {/* Proportional Status Dot Badge */}
                <div className="flex items-center gap-0.5 absolute bottom-1">
                  {hasCheckedIn ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                  ) : dayLeave ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                  ) : dayHoliday ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
                  ) : isPast && !rest ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} />
                  ) : rest && !isSelected ? (
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                  ) : null}
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500 font-medium">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>มาทำงาน</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>ลางาน</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>ขาดงาน</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span>วันหยุด</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>นักขัตฤกษ์</span>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#1A1A18]">
            {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            selectedDayHoliday
              ? 'bg-red-50 text-red-700 border border-red-200'
              : selectedDayLeave
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : selectedDayIsRest 
              ? 'bg-gray-100 text-gray-600 border border-gray-200' 
              : selectedDayLogs.length > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : (selectedDate < today && !selectedDayIsRest)
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}>
            {selectedDayHoliday ? `นักขัตฤกษ์: ${selectedDayHoliday.name}` : selectedDayLeave ? leaveTypeLabel(selectedDayLeave.leave_type) : selectedDayIsRest ? 'วันหยุดประจำสัปดาห์' : selectedDayLogs.length > 0 ? 'ปฏิบัติงานแล้ว' : (selectedDate < today && !selectedDayIsRest) ? 'ขาดงาน' : 'วันทำงานปกติ'}
          </span>
        </div>

        {/* Attendance & Leave Records for Selected Day */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-3 text-center text-xs text-gray-400">กำลังโหลดประวัติ...</div>
          ) : selectedDayLeave ? (
            <div className="py-2 px-1 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-amber-900">{leaveTypeLabel(selectedDayLeave.leave_type)}</span>
                <span className="text-[11px] text-gray-400">
                  {selectedDayLeave.reason ? `(${selectedDayLeave.reason})` : '(มีใบลางาน)'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600">
                อนุมัติแล้ว
              </span>
            </div>
          ) : selectedDayLogs.length > 0 ? (
            <div className="py-1 space-y-1">
              {selectedDayLogs.map((log) => {
                const logTime = new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const isCheckIn = log.type === 'check_in';
                return (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between py-2 border-b border-gray-100/80 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCheckIn ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="text-xs font-semibold text-[#1A1A18] mr-2">
                          {isCheckIn ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-[#1A1A18] tracking-wider">
                      {logTime} น.
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-xs text-gray-400 font-normal">
                {selectedDayIsRest ? 'พักผ่อนในวันหยุดประจำสัปดาห์ ☕' : 'ยังไม่มีประวัติการลงเวลาเข้า-ออกงานในวันนี้'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
