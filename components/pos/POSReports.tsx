'use client';
import React, { useState, useEffect, useMemo } from 'react'
import {
    Plus, Search, Edit3, Trash2, Loader2,
    ChevronRight, ChevronLeft, Save, LayoutGrid, X,
    Menu as MenuIcon, LogOut, Settings, BarChart3,
    PieChart, FileText, Download, Calendar,
    ArrowUpRight, ArrowDownRight, Printer, RefreshCcw,
    Zap, Clock, DollarSign, Users, ShoppingBag,
    TrendingUp, CalendarDays, Filter, ChevronDown, Award,
    AlertTriangle, Info, TrendingDown, Package, FileSpreadsheet,
    Layers, CreditCard, Banknote, ArrowRight, Wallet, ChevronUp
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend, LabelList
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateAttendanceStats, calculateSalary } from "@/lib/attendanceUtils"
import { useI18n } from "@/lib/I18nContext";

interface POSReportsProps {
    profile: any
    activeView: string
    allowedNav: any[]
    onSetView: (view: any) => void
    onShiftModalOpen?: () => void
    activeShift?: any
    shopSettings?: any
    setViewExtraHeader: (node: React.ReactNode) => void
}

type TimeRange = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all' | 'custom'
type ReportTab = 'overview' | 'menu' | 'payment' | 'inventory' | 'expenses' | 'discounts_voids'

const TIME_RANGE_OPTIONS = [
    { value: 'today', label: 'วันนี้' },
    { value: 'this_month', label: 'เดือนนี้' },
    { value: 'last_month', label: 'เดือนที่แล้ว' },
    { value: '7d', label: '7 วันที่ผ่านมา' },
    { value: '30d', label: '30 วันที่ผ่านมา' },
    { value: 'last_3_months', label: '3 เดือนที่ผ่านมา' },
    { value: 'this_year', label: 'ปีนี้' },
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'custom', label: 'กำหนดเอง...' },
]

const DAY_MS = 24 * 60 * 60 * 1000

function resolveDateRange(timeRange: TimeRange, customRange: { start: string; end: string }) {
    const end = new Date()
    const start = new Date()

    if (timeRange === 'custom' && customRange.start && customRange.end) {
        const customStart = new Date(customRange.start)
        const customEnd = new Date(customRange.end)
        customStart.setHours(0, 0, 0, 0)
        customEnd.setHours(23, 59, 59, 999)
        return { startDate: customStart, endDate: customEnd }
    }

    if (timeRange === 'today') start.setHours(0, 0, 0, 0)
    else if (timeRange === '7d') start.setDate(end.getDate() - 7)
    else if (timeRange === '30d') start.setDate(end.getDate() - 30)
    else if (timeRange === 'this_month') {
        start.setDate(1); start.setHours(0, 0, 0, 0)
    }
    else if (timeRange === 'last_month') {
        start.setMonth(start.getMonth() - 1); start.setDate(1); start.setHours(0, 0, 0, 0)
        end.setDate(0); end.setHours(23, 59, 59, 999)
    }
    else if (timeRange === 'last_3_months') {
        start.setMonth(start.getMonth() - 3); start.setDate(1); start.setHours(0, 0, 0, 0)
        end.setDate(0); end.setHours(23, 59, 59, 999)
    }
    else if (timeRange === 'this_year') {
        start.setMonth(0); start.setDate(1); start.setHours(0, 0, 0, 0)
    }
    else if (timeRange === 'all') start.setTime(0)

    return { startDate: start, endDate: end }
}

function getComparisonRange(timeRange: TimeRange, startDate: Date, endDate: Date) {
    if (timeRange === 'all') return null

    if (timeRange === 'today') {
        const compareStart = new Date(startDate.getTime() - DAY_MS)
        compareStart.setHours(0, 0, 0, 0)
        const compareEnd = new Date(startDate.getTime() - 1)
        return { startDate: compareStart, endDate: compareEnd, label: 'เทียบเมื่อวาน' }
    }

    if (timeRange === 'this_month') {
        const compareStart = new Date(startDate)
        compareStart.setMonth(compareStart.getMonth() - 1)
        compareStart.setDate(1)
        compareStart.setHours(0, 0, 0, 0)
        const compareEnd = new Date(startDate.getTime() - 1)
        return { startDate: compareStart, endDate: compareEnd, label: 'เทียบเดือนก่อน' }
    }

    if (timeRange === 'last_month') {
        const compareEnd = new Date(startDate.getTime() - 1)
        const compareStart = new Date(startDate)
        compareStart.setMonth(compareStart.getMonth() - 1)
        compareStart.setDate(1)
        compareStart.setHours(0, 0, 0, 0)
        return { startDate: compareStart, endDate: compareEnd, label: 'เทียบเดือนก่อนหน้า' }
    }

    if (timeRange === 'last_3_months') {
        const compareEnd = new Date(startDate.getTime() - 1)
        const compareStart = new Date(startDate)
        compareStart.setMonth(compareStart.getMonth() - 3)
        compareStart.setHours(0, 0, 0, 0)
        return { startDate: compareStart, endDate: compareEnd, label: 'เทียบ 3 เดือนก่อนหน้า' }
    }

    if (timeRange === 'this_year') {
        const compareStart = new Date(startDate)
        compareStart.setFullYear(compareStart.getFullYear() - 1)
        compareStart.setHours(0, 0, 0, 0)
        const compareEnd = new Date(startDate.getTime() - 1)
        return { startDate: compareStart, endDate: compareEnd, label: 'เทียบปีก่อน' }
    }

    const duration = endDate.getTime() - startDate.getTime() + 1
    if (duration <= 0) return null

    const compareEnd = new Date(startDate.getTime() - 1)
    const compareStart = new Date(compareEnd.getTime() - duration + 1)
    compareStart.setHours(0, 0, 0, 0)

    if (timeRange === '7d') return { startDate: compareStart, endDate: compareEnd, label: 'เทียบ 7 วันก่อนหน้า' }
    if (timeRange === '30d') return { startDate: compareStart, endDate: compareEnd, label: 'เทียบ 30 วันก่อนหน้า' }
    if (timeRange === 'custom') return { startDate: compareStart, endDate: compareEnd, label: 'เทียบช่วงก่อนหน้า' }

    return { startDate: compareStart, endDate: compareEnd, label: 'เทียบช่วงก่อนหน้า' }
}

function TimeRangeSelector({ timeRange, setTimeRange, customRange, setCustomRange }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCustomPicking, setIsCustomPicking] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const [tempStart, setTempStart] = useState<Date | null>(null)
    const [tempEnd, setTempEnd] = useState<Date | null>(null)

    // Sync temp selection with customRange
    useEffect(() => {
        if (customRange.start) setTempStart(new Date(customRange.start))
        if (customRange.end) setTempEnd(new Date(customRange.end))
    }, [customRange])

    const selectedLabel = TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label || 'เลือกช่วงเวลา'

    const handleSelectOption = (value: string) => {
        if (value === 'custom') {
            setIsCustomPicking(true)
        } else {
            setTimeRange(value)
            setIsOpen(false)
            setIsCustomPicking(false)
        }
    }

    // Calendar generation
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const daysArray: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
        daysArray.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
        daysArray.push(new Date(year, month, d))
    }

    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentMonth(new Date(year, month - 1, 1))
    }

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    const handleDayClick = (day: Date, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!tempStart || (tempStart && tempEnd)) {
            setTempStart(day)
            setTempEnd(null)
        } else {
            if (day < tempStart) {
                setTempStart(day)
                setTempEnd(null)
            } else {
                setTempEnd(day)
            }
        }
    }

    const handleApplyCustomRange = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (tempStart && tempEnd) {
            const startStr = tempStart.toISOString().split('T')[0]
            const endStr = tempEnd.toISOString().split('T')[0]
            setCustomRange({ start: startStr, end: endStr })
            setTimeRange('custom')
            setIsOpen(false)
            setIsCustomPicking(false)
        }
    }

    const handleCancelCustom = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsCustomPicking(false)
    }

    const formattedCustomRange = (customRange.start && customRange.end)
        ? `${new Date(customRange.start).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${new Date(customRange.end).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
        : ''

    return (
        <div className="flex items-center gap-4">
            {timeRange === 'custom' && formattedCustomRange && (
                <div className="text-[11px] font-black text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full animate-in fade-in">
                    {formattedCustomRange}
                </div>
            )}
            <div className="relative group">
                <button
                    onClick={() => {
                        setIsOpen(!isOpen)
                        if (!isOpen) {
                            setIsCustomPicking(timeRange === 'custom')
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white border border-neutral-100 rounded-full hover:bg-neutral-50 transition-all text-neutral-800 focus:outline-none shadow-sm"
                >
                    <Calendar size={14} className="text-neutral-400 group-hover:text-black transition-colors" />
                    <span>{timeRange === 'custom' ? 'กำหนดเอง' : selectedLabel}</span>
                    <ChevronDown size={14} className={`text-neutral-400 group-hover:text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setIsCustomPicking(false); }}></div>
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-neutral-100 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-4">
                            {!isCustomPicking ? (
                                <div className="space-y-1">
                                    {TIME_RANGE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSelectOption(opt.value)}
                                            className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-colors ${timeRange === opt.value ? 'bg-red-50 text-[#C62229]' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    {/* Calendar Header */}
                                    <div className="flex justify-between items-center mb-4">
                                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-black text-black">
                                            {monthNames[month]} {year + 543}
                                        </span>
                                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    {/* Weekdays */}
                                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <span>อา</span>
                                        <span>จ</span>
                                        <span>อ</span>
                                        <span>พ</span>
                                        <span>พฤ</span>
                                        <span>ศ</span>
                                        <span>ส</span>
                                    </div>

                                    {/* Days Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {daysArray.map((day, idx) => {
                                            if (!day) return <div key={idx} />;

                                            const isSelectedStart = tempStart && day.toDateString() === tempStart.toDateString();
                                            const isSelectedEnd = tempEnd && day.toDateString() === tempEnd.toDateString();
                                            const isInRange = tempStart && tempEnd && day > tempStart && day < tempEnd;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => handleDayClick(day, e)}
                                                    className={`h-8 w-8 text-xs font-bold rounded-full flex items-center justify-center transition-all ${
                                                        isSelectedStart || isSelectedEnd
                                                            ? 'bg-[#C62229] text-white shadow-md shadow-red-500/20'
                                                            : isInRange
                                                            ? 'bg-red-50 text-[#C62229]'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {day.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between gap-2">
                                        <button
                                            onClick={handleCancelCustom}
                                            className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded-xl"
                                        >
                                            ย้อนกลับ
                                        </button>
                                        <button
                                            onClick={handleApplyCustomRange}
                                            disabled={!tempStart || !tempEnd}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-white shadow-md transition-all ${
                                                tempStart && tempEnd
                                                    ? 'bg-[#C62229] hover:bg-red-700 shadow-red-500/10'
                                                    : 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none'
                                            }`}
                                        >
                                            ยืนยัน
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default function POSReports({
    profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, shopSettings, setViewExtraHeader
}: POSReportsProps) {
    const { locale } = useI18n();
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<TimeRange>('today')
    const [activeTab, setActiveTab] = useState<ReportTab>('overview')
    const [customRange, setCustomRange] = useState({ start: '', end: '' })
    const [showAddExpense, setShowAddExpense] = useState(false)
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
    const [reportSearchTerm, setReportSearchTerm] = useState('')

    const staffLevel = profile?.staff_level || 'staff'
    const role = (profile?.role === 'admin' || staffLevel === 'owner' || staffLevel === 'superadmin') ? 'admin' : staffLevel
    const hasProfitPermission = role === 'admin' || (shopSettings?.role_permissions?.[role] || []).includes('reports:profit')


    const [financials, setFinancials] = useState<any>({
        totalRevenue: 0, totalOrders: 0, laborCost: 0, totalWorkDays: 0, theoreticalCogs: 0, otherExpenses: 0, netProfit: 0,
        salesTrend: [], menuPerformance: [], categoryPerformance: [], worstPerformance: [], expenseList: [],
        staffList: [], workedStaff: [], paymentData: [], varianceCost: 0,
        platformGpData: [], totalGpFee: 0, netAfterGp: 0,
        averageTicketSize: 0, discountTotal: 0, hourlyHeatmap: [], topModifiers: [], voidedOrders: [],
        comparisonPct: 0, comparisonLabel: 'เทียบช่วงก่อนหน้า', comparisonBaseNetRevenue: 0, comparisonDirection: 'neutral'
    })

    useEffect(() => {
        if (timeRange !== 'custom') {
            const { startDate: start, endDate: end } = resolveDateRange(timeRange, customRange)
            setCustomRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] })
        }
    }, [timeRange])

    useEffect(() => {
        fetchData()

        // Setup realtime subscription
        const branchId = shopSettings?.branch_id
        const channel = supabase.channel('pos_reports_orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pos_orders'
            }, (payload) => {
                // Only fetch if it belongs to our branch (or if branch is not set/admin)
                if (!branchId || payload.new.branch_id === branchId || payload.old?.branch_id === branchId) {
                    fetchData()
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [timeRange, customRange.start, customRange.end, shopSettings?.branch_id])

    useEffect(() => {
        setViewExtraHeader(
            <div className="flex items-center justify-end flex-1 gap-4">
                <TimeRangeSelector
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    customRange={customRange}
                    setCustomRange={setCustomRange}
                />
            </div>
        );
        return () => setViewExtraHeader(null);
    }, [setViewExtraHeader, timeRange, customRange]);

    const fetchData = async () => {
        setLoading(true)
        try {
            const { startDate, endDate } = resolveDateRange(timeRange, customRange)
            const comparisonRange = getComparisonRange(timeRange, startDate, endDate)
            const startISO = startDate.toISOString(); const endISO = endDate.toISOString()
            const startDateStr = startDate.toISOString().split('T')[0]; const endDateStr = endDate.toISOString().split('T')[0]

            let currentBCode = profile?.branch_code
            let bId = shopSettings?.branch_id || null
            let bCode = null

            if (bId) {
                const { data: bInfo } = await supabase.from('branches').select('branch_code').eq('id', bId).single()
                bCode = bInfo?.branch_code
            } else {
                if (!currentBCode) {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const { data: p } = await supabase.from('profiles').select('branch_code').eq('id', user.id).single()
                        currentBCode = p?.branch_code
                    }
                }
                if (currentBCode) {
                    const { data: branchInfo } = await supabase.from('branches').select('id, branch_code').or(`id.eq.${currentBCode},branch_code.eq.${currentBCode}`).single()
                    bId = branchInfo?.id; bCode = branchInfo?.branch_code
                }
            }

            // 0. VOIDS & CANCELLED
            const { data: voidOrdersData, error: voidError } = await supabase.from('pos_orders')
                .select('*')
                .gte('updated_at', startISO).lte('updated_at', endISO)
                .in('status', ['cancelled', 'voided'])

            if (voidError) console.error('Error fetching void orders:', voidError)

            const branchVoids = (voidOrdersData || []).filter(o => !bId || o.branch_id === bId || (bCode && o.branch_code === bCode))

            if (branchVoids.length > 0) {
                const staffIds = branchVoids.map(o => o.staff_id).filter(Boolean)
                if (staffIds.length > 0) {
                    const { data: staffProfiles } = await supabase.from('profiles').select('*').in('id', staffIds)
                    if (staffProfiles) {
                        branchVoids.forEach(o => {
                            const profile = staffProfiles.find((p: any) => p.id === o.staff_id)
                            if (profile) o.profiles = profile
                        })
                    }
                }
            }

            // 1. REVENUE
            const { data: allOrders } = await supabase.from('pos_orders').select('*, pos_order_payments(amount, payment_method, status)').gte('updated_at', startISO).lte('updated_at', endISO).in('status', ['paid', 'completed'])
            const branchOrders = (allOrders || []).filter(o => !bId || o.branch_id === bId || (bCode && o.branch_code === bCode))
            const totalRevenue = branchOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
            const totalOrders = branchOrders.length
            const averageTicketSize = totalOrders > 0 ? totalRevenue / totalOrders : 0
            const discountTotal = branchOrders.reduce((sum, o) => sum + (Number(o.discount_amount) || 0), 0)
            const netRevenue = totalRevenue - discountTotal

            let comparisonPct = 0
            let comparisonBaseNetRevenue = 0
            let comparisonDirection: 'up' | 'down' | 'neutral' = 'neutral'
            const comparisonLabel = comparisonRange?.label || 'ไม่มีช่วงเปรียบเทียบ'

            let comparisonOrdersPct = 0
            let comparisonOrdersDirection: 'up' | 'down' | 'neutral' = 'neutral'
            let comparisonAvgTicketPct = 0
            let comparisonAvgTicketDirection: 'up' | 'down' | 'neutral' = 'neutral'

            if (comparisonRange) {
                const compareStartISO = comparisonRange.startDate.toISOString()
                const compareEndISO = comparisonRange.endDate.toISOString()
                const { data: previousOrders } = await supabase
                    .from('pos_orders')
                    .select('*, pos_order_payments(amount, payment_method, status)')
                    .gte('updated_at', compareStartISO)
                    .lte('updated_at', compareEndISO)
                    .in('status', ['paid', 'completed'])

                const branchPreviousOrders = (previousOrders || []).filter(o => !bId || o.branch_id === bId || (bCode && o.branch_code === bCode))
                const previousRevenue = branchPreviousOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
                const previousDiscount = branchPreviousOrders.reduce((sum, o) => sum + (Number(o.discount_amount) || 0), 0)
                comparisonBaseNetRevenue = previousRevenue - previousDiscount

                if (comparisonBaseNetRevenue === 0) {
                    comparisonPct = netRevenue > 0 ? 100 : 0
                } else {
                    comparisonPct = ((netRevenue - comparisonBaseNetRevenue) / Math.abs(comparisonBaseNetRevenue)) * 100
                }

                if (comparisonPct > 0.01) comparisonDirection = 'up'
                else if (comparisonPct < -0.01) comparisonDirection = 'down'

                // Orders Comparison
                const previousOrdersCount = branchPreviousOrders.length
                if (previousOrdersCount === 0) {
                    comparisonOrdersPct = totalOrders > 0 ? 100 : 0
                } else {
                    comparisonOrdersPct = ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100
                }
                if (comparisonOrdersPct > 0.01) comparisonOrdersDirection = 'up'
                else if (comparisonOrdersPct < -0.01) comparisonOrdersDirection = 'down'

                // Avg Ticket Comparison
                const previousAvgTicket = previousOrdersCount > 0 ? (previousRevenue / previousOrdersCount) : 0
                if (previousAvgTicket === 0) {
                    comparisonAvgTicketPct = averageTicketSize > 0 ? 100 : 0
                } else {
                    comparisonAvgTicketPct = ((averageTicketSize - previousAvgTicket) / previousAvgTicket) * 100
                }
                if (comparisonAvgTicketPct > 0.01) comparisonAvgTicketDirection = 'up'
                else if (comparisonAvgTicketPct < -0.01) comparisonAvgTicketDirection = 'down'
            }

            const trendMap: Record<string, number> = {}
            const paymentBreakdown: Record<string, number> = {}
            const hourlyHeatmapRaw: Record<number, { revenue: number, orders: number }> = {}

            for (let i = 0; i < 24; i++) hourlyHeatmapRaw[i] = { revenue: 0, orders: 0 }

            branchOrders.forEach(o => {
                const d = new Date(o.updated_at || o.created_at); const k = timeRange === 'today' ? d.getHours().toString().padStart(2, '0') + ':00' : d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
                trendMap[k] = (trendMap[k] || 0) + (o.total_amount || 0)

                const hour = d.getHours()
                hourlyHeatmapRaw[hour].revenue += (o.total_amount || 0)
                hourlyHeatmapRaw[hour].orders += 1

                const payments = o.pos_order_payments ? o.pos_order_payments.filter((p: any) => p.status === 'paid') : []
                if (payments.length > 0) {
                    payments.forEach((p: any) => {
                        const pm = p.payment_method || 'unknown'
                        paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + (Number(p.amount) || 0)
                    })
                } else if (o.status === 'paid' || o.status === 'completed') {
                    const pm = o.payment_method || 'unknown'
                    paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + (o.net_total ?? o.total_amount ?? 0)
                }
            })
            const paymentData = Object.entries(paymentBreakdown).map(([method, amount]) => ({ method, amount }))
            const hourlyHeatmap = Object.entries(hourlyHeatmapRaw).map(([hour, data]) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, revenue: data.revenue, orders: data.orders }))

            // 1b. PLATFORM GP BREAKDOWN
            const platformGpMap: Record<string, { revenue: number; gpFee: number; orders: number }> = {}
            branchOrders.forEach(o => {
                if (o.order_type === 'delivery' && o.delivery_platform) {
                    const p = o.delivery_platform
                    if (!platformGpMap[p]) platformGpMap[p] = { revenue: 0, gpFee: 0, orders: 0 }
                    platformGpMap[p].revenue += (o.total_amount || 0)
                    platformGpMap[p].gpFee += (Number(o.delivery_gp_amount) || 0)
                    platformGpMap[p].orders += 1
                }
            })
            const platformGpData = Object.entries(platformGpMap).map(([platform, data]) => ({
                platform,
                revenue: data.revenue,
                gpFee: data.gpFee,
                netReceived: data.revenue - data.gpFee,
                orders: data.orders,
                gpRate: data.revenue > 0 ? ((data.gpFee / data.revenue) * 100).toFixed(1) : '0.0'
            }))
            const totalGpFee = platformGpData.reduce((sum, p) => sum + p.gpFee, 0)

            // 2. STAFF & ATTENDANCE (Filter by Branch AND Staff Type 'cafe' AND NOT POS Account)
            const { data: allStaff } = await supabase.from('profiles').select('*').eq('role', 'staff')
            const branchStaff = (allStaff || []).filter(s =>
                (!bId || s.branch_id === bId || (bCode && s.branch_code === bCode)) &&
                s.staff_type === 'cafe' &&
                s.is_pos_account !== true
            )

            let totalLaborCost = 0; let totalWorkDays = 0; const workedStaffList: any[] = []

            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const reportDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

            if (branchStaff.length > 0) {
                const staffIds = branchStaff.map(s => s.id)
                const { data: logs } = await supabase.from('attendance_logs').select('*').in('profile_id', staffIds).gte('timestamp', startISO).lte('timestamp', endISO)

                branchStaff.forEach(s => {
                    const sLogs = (logs || []).filter(l => l.profile_id === s.id)
                    const stats = calculateAttendanceStats(sLogs, s.shift_start || "08:30", s.shift_end || "17:30")

                    if (s.salary_type === 'monthly') {
                        const baseMonthly = s.daily_wage || 0;
                        const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                        const dailyRate = baseMonthly / daysInMonth;

                        let staffCost = dailyRate * reportDays;
                        const otHours = stats.approvedOtMinutes / 60;
                        staffCost += otHours * (s.overtime_rate_per_hour || 0);

                        totalLaborCost += staffCost;
                        totalWorkDays += reportDays;
                        workedStaffList.push({ name: s.display_name || `${s.first_name || ''} ${s.last_name || ''} (รายเดือน)`, wage: staffCost, days: reportDays })
                    } else {
                        const salary = calculateSalary(stats, {
                            daily_wage: s.daily_wage || 0,
                            overtime_rate_per_hour: s.overtime_rate_per_hour || 0,
                            salary_type: 'daily',
                            target_working_days: s.target_working_days || 26
                        })
                        if (stats.daysWorked > 0) {
                            totalLaborCost += salary; totalWorkDays += stats.daysWorked
                            workedStaffList.push({ name: s.display_name || `${s.first_name || ''} ${s.last_name || ''}`, wage: salary, days: stats.daysWorked })
                        }
                    }
                })
            }

            // Fetch inventory for dynamic cost calculation and variance
            let itemQuery = supabase.from('inventory_items').select('id, cost_price')
            if (bId) {
                itemQuery = itemQuery.eq('branch_id', bId)
            }

            const { data: invItems } = await itemQuery
            const costMap = new Map((invItems || []).map((i: any) => [i.id, i.cost_price || 0]))

            const calculateDynamicCost = (recipe_data: any[]) => {
                return (recipe_data || []).reduce((sum: number, ing: any) => {
                    const cost = costMap.get(ing.ingredient_id) || 0;
                    return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
                }, 0);
            }

            // 3. MENU & EXPENSES
            const orderIds = branchOrders.map(o => o.id)
            let menuPerf: any[] = []
            let categoryPerf: any[] = []
            let worstPerf: any[] = []
            let topModifiers: any[] = []
            let actualCogs = 0

            const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data, category_id, status, image_url').eq('status', 'active')
            const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data')
            const { data: categories } = await supabase.from('pos_menu_categories').select('id, name')
            
            const menuMap = new Map(menuList?.map(m => [m.id, { name: m.name, category_id: m.category_id, recipe_data: m.recipe_data, image_url: m.image_url }]))
            const catMap = new Map(categories?.map(c => [c.id, c.name]))
            const itemAggr: Record<string, any> = {}
            const catAggr: Record<string, any> = {}
            const modAggr: Record<string, number> = {}

            // Initialize itemAggr with all active menus to catch 0 sales
            menuList?.forEach(m => {
                itemAggr[m.name] = { name: m.name, quantity: 0, revenue: 0, image_url: m.image_url }
            })

            if (orderIds.length > 0) {
                let items: any[] = []
                const chunkSize = 100
                for (let i = 0; i < orderIds.length; i += chunkSize) {
                    const chunk = orderIds.slice(i, i + chunkSize)
                    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk)
                    if (itemsChunk) items = items.concat(itemsChunk)
                }

                items?.forEach(item => {
                    const mInfo = menuMap.get(item.item_id)
                    const itemName = mInfo?.name || 'Unknown'
                    const catName = catMap.get(mInfo?.category_id) || 'ไม่มีหมวดหมู่'

                    if (!itemAggr[itemName]) itemAggr[itemName] = { name: itemName, quantity: 0, revenue: 0, image_url: mInfo?.image_url }
                    itemAggr[itemName].quantity += item.quantity || 0; itemAggr[itemName].revenue += Number(item.subtotal) || 0

                    if (!catAggr[catName]) catAggr[catName] = { name: catName, quantity: 0, revenue: 0 }
                    catAggr[catName].quantity += item.quantity || 0; catAggr[catName].revenue += Number(item.subtotal) || 0

                    const menuRecipe = mInfo?.recipe_data || [];
                    const baseCost = calculateDynamicCost(menuRecipe);
                    let modifierCost = 0;

                    if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
                        item.selected_modifiers.forEach((mod: any) => {
                            const modName = mod.name || mod.title || 'Unknown'
                            const modDb = modifierList?.find(m => m.name === modName || m.id === mod.id);
                            if (modDb) {
                                modifierCost += calculateDynamicCost(modDb.recipe_data || []);
                            }
                            modAggr[modName] = (modAggr[modName] || 0) + (item.quantity || 1)
                        })
                    }

                    const dynamicUnitCost = baseCost + modifierCost;
                    const finalUnitCost = dynamicUnitCost > 0 ? dynamicUnitCost : (Number(item.cost_price) || 0);

                    actualCogs += finalUnitCost * (item.quantity || 1)
                })
            }
            menuPerf = Object.values(itemAggr).sort((a, b) => b.revenue - a.revenue)
            worstPerf = Object.values(itemAggr).sort((a, b) => a.quantity - b.quantity).slice(0, 20) // Get bottom 20 worst sellers
            topModifiers = Object.entries(modAggr).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
            categoryPerf = Object.values(catAggr).sort((a, b) => b.revenue - a.revenue)

            let expenseQuery = supabase.from('pos_other_expenses')
                .select('*')
                .lte('date', endDateStr)
                .or(`expense_type.eq.monthly,date.gte.${startDateStr}`);

            if (bId) {
                if (bCode) expenseQuery = expenseQuery.or(`branch_id.eq.${bId},branch_code.eq.${bCode}`)
                else expenseQuery = expenseQuery.eq('branch_id', bId)
            } else if (bCode) {
                expenseQuery = expenseQuery.eq('branch_code', bCode).eq('merchant_id', profile.merchant_id)
            }
            const { data: expenses } = await expenseQuery

            let totalOtherExp = 0;
            const validExpenses: any[] = [];

            if (expenses) {
                expenses.forEach((e: any) => {
                    const eDateStr = e.date; // YYYY-MM-DD
                    const eDateObj = new Date(eDateStr);
                    eDateObj.setHours(0, 0, 0, 0);
                    const isWithinRange = eDateStr >= startDateStr && eDateStr <= endDateStr;

                    if (e.expense_type === 'monthly') {
                        let overlappingDays = 0;
                        let proratedAmount = 0;

                        // Start counting from startDate or eDateObj, whichever is later
                        const countStart = new Date(Math.max(startDate.getTime(), eDateObj.getTime()));
                        const countEnd = new Date(endDate);

                        for (let d = new Date(countStart); d <= countEnd; d.setDate(d.getDate() + 1)) {
                            const daysInThisMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                            const dailyRate = Number(e.amount) / daysInThisMonth;
                            proratedAmount += dailyRate;
                            overlappingDays++;
                        }

                        if (overlappingDays > 0) {
                            totalOtherExp += proratedAmount;
                            validExpenses.push({
                                ...e,
                                proratedAmount,
                                overlappingDays,
                                dailyRate: Number(e.amount) / 30, // rough avg for display
                                isProrated: true
                            });
                        }
                    } else {
                        if (isWithinRange) {
                            totalOtherExp += Number(e.amount);
                            validExpenses.push({ ...e, proratedAmount: Number(e.amount), isProrated: false });
                        }
                    }
                });
            }

            const netProfit = totalRevenue - discountTotal - actualCogs - totalLaborCost - totalOtherExp - totalGpFee

            // 4. INVENTORY VARIANCE
            let varianceCost = 0
            try {
                if (invItems && invItems.length > 0) {
                    const itemIds = invItems.map((i: any) => i.id)

                    const { data: movements } = await supabase.from('inventory_movements')
                        .select('item_id, change_amount, reason')
                        .in('item_id', itemIds)
                        .gte('created_at', startISO)
                        .lte('created_at', endISO)

                    if (movements) {
                        varianceCost = movements.reduce((sum, m) => {
                            if (m.change_amount < 0 && (m.reason === 'waste' || m.reason === 'loss' || m.reason === 'audit')) {
                                return sum + (Math.abs(m.change_amount) * costMap.get(m.item_id)!)
                            }
                            return sum
                        }, 0)
                    }
                }
            } catch (e) {
                console.error('Error fetching inventory variance:', e)
            }

            setFinancials({
                totalRevenue, netRevenue, laborCost: totalLaborCost, totalWorkDays, theoreticalCogs: actualCogs, otherExpenses: totalOtherExp, netProfit, totalOrders, averageTicketSize, discountTotal, hourlyHeatmap, topModifiers, voidedOrders: branchVoids,
                salesTrend: Object.entries(trendMap).map(([name, value]) => ({ name, value })),
                menuPerformance: menuPerf, categoryPerformance: categoryPerf, worstPerformance: worstPerf, expenseList: validExpenses || [],
                staffList: branchStaff, workedStaff: workedStaffList,
                paymentData, varianceCost, platformGpData, totalGpFee, netAfterGp: netRevenue - totalGpFee,
                comparisonPct, comparisonLabel, comparisonBaseNetRevenue, comparisonDirection,
                comparisonOrdersPct, comparisonOrdersDirection, comparisonAvgTicketPct, comparisonAvgTicketDirection
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 font-sans overflow-y-auto no-scrollbar bg-[#F9F9F6] h-full pb-32">
            {/* Category tabs list in original style (underline style) */}
            <div className="flex overflow-x-auto no-scrollbar mb-8 border-b border-neutral-200 w-full">
                {(['overview', 'menu', 'payment', 'inventory', 'expenses', 'discounts_voids'] as ReportTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 text-center whitespace-nowrap pb-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-[#0F172A]' : 'text-[#9CA3AF] hover:text-neutral-700'}`}
                    >
                        {tab === 'overview' ? 'ภาพรวม' : tab === 'menu' ? 'อันดับขายดี' : tab === 'payment' ? 'การเงิน' : tab === 'inventory' ? 'สต็อกสินค้า' : tab === 'expenses' ? 'ค่าใช้จ่าย' : 'ส่วนลด/ยกเลิก'}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A]"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Title & Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-xl font-black text-black">รายงานยอดขาย</h1>
                <button className="flex items-center justify-center gap-2 bg-[#C62229] hover:bg-red-700 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-md transition-all">
                    <Download size={14} />
                    <span>ส่งออกรายงาน</span>
                </button>
            </div>


            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center opacity-30 font-bold gap-6">
                    <Loader2 className="animate-spin text-[#C62229]" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black">กำลังคำนวณและประมวลผลข้อมูล...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    {activeTab === 'overview' && (
                        <OverviewReport
                            financials={financials}
                            hasProfitPermission={hasProfitPermission}
                            menuPerformance={financials.menuPerformance}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'menu' && (
                        <MenuReport
                            menuPerformance={financials.menuPerformance}
                            categoryPerformance={financials.categoryPerformance}
                            worstPerformance={financials.worstPerformance}
                            topModifiers={financials.topModifiers}
                        />
                    )}
                    {activeTab === 'payment' && (
                        <PaymentReport
                            paymentData={financials.paymentData}
                            totalRevenue={financials.netRevenue}
                            platformGpData={financials.platformGpData}
                            totalGpFee={financials.totalGpFee}
                            hasProfitPermission={hasProfitPermission}
                        />
                    )}
                    {activeTab === 'inventory' && (
                        <InventoryReport
                            varianceCost={financials.varianceCost}
                        />
                    )}
                    {activeTab === 'expenses' && (
                        <ExpensesTab
                            expenseList={financials.expenseList}
                            total={financials.otherExpenses}
                            onDelete={() => fetchData()}
                            onAdd={() => setShowAddExpense(true)}
                        />
                    )}
                    {activeTab === 'discounts_voids' && (
                        <DiscountsVoidsReport
                            discountTotal={financials.discountTotal}
                            voidedOrders={financials.voidedOrders}
                        />
                    )}
                </div>
            )}

            <AnimatePresence>
                {showAddExpense && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-10"><h2 className="text-[12px] font-black uppercase tracking-widest">{locale === 'en' ? 'บันทึกค่าใช้จ่ายอื่นๆ' : locale === 'zh' ? 'บันทึกค่าใช้จ่ายอื่นๆ' : 'บันทึกค่าใช้จ่ายอื่นๆ'}</h2><button onClick={() => setShowAddExpense(false)}><X size={20} /></button></div>
                            <form onSubmit={async (e: any) => {
                                e.preventDefault(); const form = e.target
                                let branchCodeToSave = profile?.branch_code || 'hq'
                                if (shopSettings?.branch_id) {
                                    const { data: b } = await supabase.from('branches').select('branch_code').eq('id', shopSettings.branch_id).single()
                                    if (b?.branch_code) branchCodeToSave = b.branch_code
                                }
                                const { error } = await supabase.from('pos_other_expenses').insert({
                                    name: form.name.value, amount: Number(form.amount.value), date: form.date.value,
                                    expense_type: form.expense_type.value,
                                    branch_id: shopSettings?.branch_id || null,
                                    branch_code: branchCodeToSave
                                })
                                if (error) alert(error.message); else { setShowAddExpense(false); fetchData() }
                            }} className="space-y-6">
                                <input name="name" placeholder={locale === 'en' ? 'รายการ' : locale === 'zh' ? 'รายการ' : 'รายการ (เช่น ค่าเช่า, ค่าไฟ)'} required className="w-full p-4 bg-gray-50 border border-gray-100 text-[11px] font-black uppercase outline-none focus:border-black" />
                                <input name="amount" placeholder={locale === 'en' ? 'ยอดเงิน' : locale === 'zh' ? 'ยอดเงิน' : 'ยอดเงิน'} type="number" step="0.01" required className="w-full p-4 bg-gray-50 border border-gray-100 text-[11px] font-black outline-none focus:border-black" />
                                <select name="expense_type" className="w-full p-4 bg-gray-50 border border-gray-100 text-[11px] font-black outline-none focus:border-black appearance-none cursor-pointer">
                                    <option value="one_time">จ่ายครั้งเดียว (One-time)</option>
                                    <option value="monthly">รายเดือน/หารเฉลี่ยรายวัน (Monthly)</option>
                                </select>
                                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-4 bg-gray-50 border border-gray-100 text-[11px] font-black outline-none focus:border-black" />
                                <button type="submit" className="w-full py-6 bg-black text-white text-[11px] font-black uppercase tracking-widest">{locale === 'en' ? 'บันทึกรายการ' : locale === 'zh' ? 'บันทึกรายการ' : 'บันทึกรายการ'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function OverviewReport({ financials, hasProfitPermission, menuPerformance, setActiveTab }: any) {
    const { locale } = useI18n();
    const [expandLabor, setExpandLabor] = useState(false)
    const [expandExpenses, setExpandExpenses] = useState(false)

    const comparisonLabel = financials.comparisonLabel || 'เทียบช่วงก่อนหน้า'

    const comparisonPct = Number(financials.comparisonPct || 0)
    const comparisonDirection = financials.comparisonDirection || 'neutral'
    const isUp = comparisonDirection === 'up'
    const displayPct = Math.abs(comparisonPct).toFixed(1)

    const comparisonOrdersPct = Number(financials.comparisonOrdersPct || 0)
    const comparisonOrdersDirection = financials.comparisonOrdersDirection || 'neutral'
    const isOrdersUp = comparisonOrdersDirection === 'up'
    const displayOrdersPct = Math.abs(comparisonOrdersPct).toFixed(1)

    const comparisonAvgTicketPct = Number(financials.comparisonAvgTicketPct || 0)
    const comparisonAvgTicketDirection = financials.comparisonAvgTicketDirection || 'neutral'
    const isAvgTicketUp = comparisonAvgTicketDirection === 'up'
    const displayAvgTicketPct = Math.abs(comparisonAvgTicketPct).toFixed(1)

    // Helper for units
    const getItemUnit = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('ข้าว') || lower.includes('ไข่') || lower.includes('กะเพรา') || lower.includes('แกง')) return 'จาน';
        if (lower.includes('เค้ก') || lower.includes('พาย') || lower.includes('ครัวซอง') || lower.includes('ทาร์ต') || lower.includes('โดนัท') || lower.includes('ชีสพาย')) return 'ชิ้น';
        return 'แก้ว';
    }

    const netProfit = financials.netProfit || 0
    const isProfit = netProfit >= 0

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. Gross Revenue */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-6 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <BarChart3 size={20} className="text-[#C62229]" />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ยอดขายรวม</span>
                        <h3 className="text-2xl font-black text-black mt-1">฿{Math.floor(financials.netRevenue || 0).toLocaleString()}</h3>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <span>{comparisonLabel}</span>
                            {comparisonDirection !== 'neutral' && (
                                <span className={`flex items-center gap-0.5 font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isUp ? '▲' : '▼'} {displayPct}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Total Orders */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-6 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} className="text-[#C62229]" />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ออเดอร์ทั้งหมด</span>
                        <h3 className="text-2xl font-black text-black mt-1">
                            {financials.totalOrders || 0} <span className="text-sm font-bold text-gray-450 ml-1">ออเดอร์</span>
                        </h3>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <span>{comparisonLabel}</span>
                            {comparisonOrdersDirection !== 'neutral' && (
                                <span className={`flex items-center gap-0.5 font-black ${isOrdersUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isOrdersUp ? '▲' : '▼'} {displayOrdersPct}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Average Order Value */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-6 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <CreditCard size={20} className="text-[#C62229]" />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ค่าเฉลี่ยต่อออเดอร์</span>
                        <h3 className="text-2xl font-black text-black mt-1">฿{Math.floor(financials.averageTicketSize || 0).toLocaleString()}</h3>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <span>{comparisonLabel}</span>
                            {comparisonAvgTicketDirection !== 'neutral' && (
                                <span className={`flex items-center gap-0.5 font-black ${isAvgTicketUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isAvgTicketUp ? '▲' : '▼'} {displayAvgTicketPct}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Trend Chart Card */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[15px] font-black text-black">ยอดขายตามช่วงเวลา</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-gray-100">
                        <span>รายชั่วโมง</span>
                        <ChevronDown size={12} />
                    </div>
                </div>
                <div className="h-[280px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={financials.hourlyHeatmap} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C62229" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#C62229" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} dx={-8} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '10px 14px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                                labelStyle={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px' }}
                                formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#C62229" strokeWidth={3} fillOpacity={1} fill="url(#colorRedGradient)" activeDot={{ r: 6, fill: '#C62229', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 4, fill: '#C62229', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Grid: Best Sellers & P&L Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Best Sellers Card */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[15px] font-black text-black">สินค้าขายดี</h3>
                            <button onClick={() => setActiveTab('menu')} className="text-sm font-black text-[#C62229] hover:underline">
                                ดูรายละเอียด
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-150 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="pb-3 w-12">#</th>
                                        <th className="pb-3">สินค้า</th>
                                        <th className="pb-3">จำนวนที่ขาย</th>
                                        <th className="pb-3 text-right">ยอดขาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuPerformance?.slice(0, 5).map((item: any, idx: number) => {
                                        const unit = getItemUnit(item.name);
                                        return (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 text-sm font-black text-gray-400 w-12">{idx + 1}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={item.image_url || '/logo-splash.png'}
                                                            alt={item.name}
                                                            onError={(e: any) => { e.target.src = '/logo-splash.png' }}
                                                            className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                                                        />
                                                        <span className="font-bold text-sm text-black">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-black">{item.quantity} {unit}</td>
                                                <td className="py-4 text-sm font-black text-black text-right">฿{item.revenue.toLocaleString()}</td>
                                            </tr>
                                        )
                                    })}
                                    {(!menuPerformance || menuPerformance.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm font-semibold text-gray-400">
                                                ไม่มีข้อมูลยอดขายสำหรับเมนูในช่วงเวลานี้
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Profit & Loss Breakdown Card */}
                {hasProfitPermission && (
                    <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                            <h3 className="text-[15px] font-black text-black mb-6">โครงสร้างต้นทุนและกำไรสุทธิ (P&L)</h3>
                            <div className="space-y-4">
                                {/* Gross revenue */}
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-500">รายได้ยอดขาย (Gross)</span>
                                    <span className="text-sm font-black text-black">฿{Number(financials.totalRevenue || 0).toLocaleString()}</span>
                                </div>

                                {/* Customer discount */}
                                {financials.discountTotal > 0 && (
                                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                                        <span className="text-xs font-bold text-gray-500">(-) ส่วนลดที่ให้ลูกค้า</span>
                                        <span className="text-sm font-black text-red-500">-฿{Number(financials.discountTotal || 0).toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Net Sales / Net Revenue */}
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 font-bold bg-zinc-55/20 -mx-2 px-2 rounded-xl">
                                    <span className="text-xs text-gray-700">รายได้สุทธิ (Net Sales)</span>
                                    <span className="text-sm text-black font-black">฿{Number(financials.netRevenue || 0).toLocaleString()}</span>
                                </div>

                                {/* Material cogs */}
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-500">(-) ต้นทุนวัตถุดิบ</span>
                                    <span className="text-sm font-black text-red-500">-฿{Number(financials.theoreticalCogs || 0).toLocaleString()}</span>
                                </div>

                                {/* Labor Cost */}
                                <div>
                                    <button onClick={() => setExpandLabor(!expandLabor)} className="w-full flex justify-between items-center py-2.5 border-b border-gray-100 focus:outline-none">
                                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                            (-) ค่าแรงพนักงาน {expandLabor ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                                        </span>
                                        <span className="text-sm font-black text-red-500">-฿{Number(financials.laborCost || 0).toLocaleString()}</span>
                                    </button>
                                    {expandLabor && (
                                        <div className="pl-4 mt-2 mb-2 space-y-2 border-l border-gray-100">
                                            {financials.workedStaff?.map((s: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-[11px] text-gray-400 font-bold">
                                                    <span>{s.name}</span>
                                                    <span>฿{Number(s.wage || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                            ))}
                                            {(!financials.workedStaff || financials.workedStaff.length === 0) && (
                                                <div className="text-[11px] text-gray-300 italic">ไม่มีข้อมูลการลงเวลา</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Expenses */}
                                <div>
                                    <button onClick={() => setExpandExpenses(!expandExpenses)} className="w-full flex justify-between items-center py-2.5 border-b border-gray-100 focus:outline-none">
                                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                            (-) ค่าใช้จ่ายอื่นๆ {expandExpenses ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                                        </span>
                                        <span className="text-sm font-black text-red-500">-฿{Number(financials.otherExpenses || 0).toLocaleString()}</span>
                                    </button>
                                    {expandExpenses && (
                                        <div className="pl-4 mt-2 mb-2 space-y-2 border-l border-gray-100">
                                            {financials.expenseList?.map((e: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-[11px] text-gray-400 font-bold">
                                                    <span>{e.name}</span>
                                                    <span>฿{Number(e.amount || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {(!financials.expenseList || financials.expenseList.length === 0) && (
                                                <div className="text-[11px] text-gray-300 italic">ไม่มีบันทึกรายการค่าใช้จ่าย</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* GP delivery fee */}
                                {financials.totalGpFee > 0 && (
                                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                                        <span className="text-xs font-bold text-gray-500">(-) หัก GP Delivery</span>
                                        <span className="text-sm font-black text-red-500">-฿{Number(financials.totalGpFee || 0).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Net profit segment */}
                        <div 
                            className="mt-6 p-4 rounded-2xl flex justify-between items-center transition-all duration-300"
                            style={{
                                backgroundColor: isProfit ? '#F0FDF4' : '#FEF2F2', // green-50, red-50
                                color: isProfit ? '#15803D' : '#B91C1C'          // green-700, red-700
                            }}
                        >
                            <span className="text-xs font-black uppercase tracking-wider">
                                {isProfit ? 'กำไรสุทธิ (Net Profit)' : 'ขาดทุนสุทธิ (Net Loss)'}
                            </span>
                            <span className="text-xl font-black">
                                {isProfit ? '' : '-'}฿{Number(Math.abs(netProfit)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 
function MetricCard({ title, value, icon, color, iconColor = "bg-white/20", unit = "บาท", noAbs = false }: any) {
    const displayValue = noAbs ? value : Math.abs(value)
    return (
        <div className={`p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 ring-1 ${color}`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl shadow-sm ${iconColor}`}>{icon}</div>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80 mb-2">{title}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-[32px] leading-none font-black tracking-tight">{displayValue.toLocaleString()}</span>
                <span className="text-[10px] font-bold uppercase opacity-60">{unit}</span>
            </div>
        </div>
    )
}

function PLRow({ label, value, color }: any) {
    const { locale } = useI18n();
    return (
        <div className="flex justify-between items-center group p-3 -ml-3 rounded-xl hover:bg-neutral-50/80 transition-colors">
            <span className="text-[11px] font-semibold text-neutral-500 group-hover:text-[#1A1A18] transition-colors">{label}</span>
            <span className={`text-[13px] font-black tracking-tight ${color}`}>{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{value.toLocaleString()}</span>
        </div>
    )
}

function MenuReport({ menuPerformance, categoryPerformance, worstPerformance, topModifiers }: any) {
    const { locale } = useI18n();
    const [activeView, setActiveView] = useState<'menu' | 'category' | 'modifier' | 'worst'>('menu');

    return (
        <>
            <div className="sm:hidden">
                <div className="flex flex-wrap bg-neutral-100/80 p-1 rounded-2xl mb-6 mx-1 shadow-inner gap-1">
                    <button onClick={() => setActiveView('menu')} className={`flex-1 py-3 text-[11px] font-bold rounded-xl transition-all duration-300 ${activeView === 'menu' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-neutral-500 hover:text-neutral-700'}`}>เมนู</button>
                    <button onClick={() => setActiveView('category')} className={`flex-1 py-3 text-[11px] font-bold rounded-xl transition-all duration-300 ${activeView === 'category' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-neutral-500 hover:text-neutral-700'}`}>หมวดหมู่</button>
                    <button onClick={() => setActiveView('modifier')} className={`flex-1 py-3 text-[11px] font-bold rounded-xl transition-all duration-300 ${activeView === 'modifier' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-neutral-500 hover:text-neutral-700'}`}>ตัวเลือก</button>
                    <button onClick={() => setActiveView('worst')} className={`flex-1 py-3 text-[11px] font-bold rounded-xl transition-all duration-300 ${activeView === 'worst' ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100' : 'text-neutral-500 hover:text-red-500'}`}>ควรพิจารณา</button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="border-b border-neutral-100/50 px-6 py-5 text-[16px] font-black text-[#1A1A18] tracking-tight">{activeView === 'menu' ? 'อันดับเมนูขายดี' : activeView === 'category' ? 'อันดับหมวดหมู่ขายดี' : activeView === 'worst' ? 'เมนูยอดแย่ / ควรพิจารณา' : 'อันดับตัวเลือกขายดี'}</h3>
                    <div className="divide-y divide-neutral-50">
                        {activeView === 'menu' && menuPerformance?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-6 py-5 hover:bg-neutral-50/50 transition-colors">
                                <div className="min-w-0 pr-4 flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-red-100 text-red-700' : 'bg-neutral-50 text-neutral-400'}`}>{idx + 1}</div>
                                    <div>
                                        <div className="truncate text-[14px] font-bold text-[#1A1A18]">{item.name}</div>
                                        <div className="mt-1 text-[11px] font-semibold text-neutral-400">{item.quantity} รายการ</div>
                                    </div>
                                </div>
                                <div className="text-right text-[15px] font-black tracking-tight text-[#1A1A18]">฿{item.revenue.toLocaleString()}</div>
                            </div>
                        ))}

                        {activeView === 'category' && categoryPerformance?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-6 py-5 hover:bg-neutral-50/50 transition-colors">
                                <div className="min-w-0 pr-4 flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${idx === 0 ? 'bg-indigo-100 text-indigo-600' : idx === 1 ? 'bg-blue-100 text-blue-600' : 'bg-neutral-50 text-neutral-400'}`}>{idx + 1}</div>
                                    <div>
                                        <div className="truncate text-[14px] font-bold text-[#1A1A18]">{item.name}</div>
                                        <div className="mt-1 text-[11px] font-semibold text-neutral-400">{item.quantity} รายการ</div>
                                    </div>
                                </div>
                                <div className="text-right text-[15px] font-black tracking-tight text-[#1A1A18]">฿{item.revenue.toLocaleString()}</div>
                            </div>
                        ))}

                        {activeView === 'worst' && worstPerformance?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-6 py-5 hover:bg-neutral-50/50 transition-colors">
                                <div className="min-w-0 pr-4 flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${item.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>{idx + 1}</div>
                                    <div>
                                        <div className={`truncate text-[14px] font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-[#1A1A18]'}`}>{item.name}</div>
                                        <div className="mt-1 text-[11px] font-semibold text-neutral-400">{item.quantity} รายการ</div>
                                    </div>
                                </div>
                                <div className="text-right text-[15px] font-black tracking-tight text-[#1A1A18]">฿{item.revenue.toLocaleString()}</div>
                            </div>
                        ))}
                        
                        {activeView === 'modifier' && topModifiers?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between px-6 py-5 hover:bg-neutral-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-red-100 text-red-700' : 'bg-neutral-50 text-neutral-400'}`}>{idx + 1}</div>
                                    <div className="text-[14px] font-bold text-[#1A1A18]">{item.name}</div>
                                </div>
                                <div className="text-[15px] font-black tracking-tight text-neutral-600">{item.count} ครั้ง</div>
                            </div>
                        ))}
                        
                        {activeView === 'modifier' && (!topModifiers || topModifiers.length === 0) && (
                            <div className="px-6 py-10 text-center text-[13px] font-semibold text-neutral-400">ไม่มีข้อมูลตัวเลือกเสริม</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden sm:grid lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black uppercase tracking-widest p-6 border-b border-neutral-100/50 text-[#1A1A18]">{locale === 'en' ? 'หมวดหมู่ขายดี' : locale === 'zh' ? 'หมวดหมู่ขายดี' : 'หมวดหมู่ขายดี'}</h3>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100/50">
                            <tr><th className="px-6 py-4">{locale === 'en' ? 'หมวดหมู่' : locale === 'zh' ? 'หมวดหมู่' : 'หมวดหมู่'}</th><th className="px-6 py-4 text-center">{locale === 'en' ? 'qty' : locale === 'zh' ? 'qty' : 'จำนวน'}</th><th className="px-6 py-4 text-right">{locale === 'en' ? 'ยอดขาย' : locale === 'zh' ? 'ยอดขาย' : 'ยอดขาย'}</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {categoryPerformance?.map((item: any, idx: number) => (<tr key={idx} className="hover:bg-neutral-50/80 transition-colors cursor-pointer"><td className="px-6 py-4 text-[12px] font-bold text-[#1A1A18] truncate max-w-[100px]">{item.name}</td><td className="px-6 py-4 text-center font-black text-neutral-600 tracking-tight">{item.quantity}</td><td className="px-6 py-4 text-right font-black tracking-tight text-[#1A1A18]">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{item.revenue.toLocaleString()}</td></tr>))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black uppercase tracking-widest p-6 border-b border-neutral-100/50 text-[#1A1A18]">{locale === 'en' ? 'สินค้าขายดี' : locale === 'zh' ? 'สินค้าขายดี' : 'สินค้าขายดี'}</h3>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100/50">
                            <tr><th className="px-6 py-4">{locale === 'en' ? 'รายการเมนู' : locale === 'zh' ? 'รายการเมนู' : 'รายการเมนู'}</th><th className="px-6 py-4 text-center">{locale === 'en' ? 'qty' : locale === 'zh' ? 'qty' : 'จำนวน'}</th><th className="px-6 py-4 text-right">{locale === 'en' ? 'ยอดขาย' : locale === 'zh' ? 'ยอดขาย' : 'ยอดขาย'}</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {menuPerformance?.map((item: any, idx: number) => (<tr key={idx} className="hover:bg-neutral-50/80 transition-colors cursor-pointer"><td className="px-6 py-4 text-[12px] font-bold text-[#1A1A18] truncate max-w-[100px]">{item.name}</td><td className="px-6 py-4 text-center font-black text-neutral-600 tracking-tight">{item.quantity}</td><td className="px-6 py-4 text-right font-black tracking-tight text-[#1A1A18]">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{item.revenue.toLocaleString()}</td></tr>))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black uppercase tracking-widest p-6 border-b border-neutral-100/50 text-[#1A1A18]">{locale === 'en' ? 'ตัวเลือกเสริม' : locale === 'zh' ? 'ตัวเลือกเสริม' : 'ตัวเลือกเสริม (Modifiers)'}</h3>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-[8px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                            <tr><th className="px-6 py-4">ตัวเลือกเสริม</th><th className="px-6 py-4 text-right">จำนวน</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {topModifiers?.map((item: any, idx: number) => (<tr key={idx} className="hover:bg-gray-50 transition-all"><td className="px-6 py-4 text-[11px] font-black uppercase truncate max-w-[120px]">{item.name}</td><td className="px-6 py-4 text-right font-black">{item.count}</td></tr>))}
                            {(!topModifiers || topModifiers.length === 0) && <tr><td colSpan={2} className="px-6 py-4 text-center text-[10px] text-gray-400 font-bold uppercase">ไม่มีข้อมูลตัวเลือกเสริม</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="hidden sm:block mt-6">
                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-red-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black uppercase tracking-widest p-6 border-b border-red-50 text-red-600 bg-red-50/30 flex items-center gap-2">
                        <span>เมนูยอดแย่ / ควรพิจารณาเอาออก (Worst Sellers)</span>
                    </h3>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100/50">
                            <tr><th className="px-6 py-4">อันดับ</th><th className="px-6 py-4">รายการเมนู</th><th className="px-6 py-4 text-center">ขายได้ (รายการ)</th><th className="px-6 py-4 text-right">ยอดขายรวม</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {worstPerformance?.map((item: any, idx: number) => (
                                <tr key={idx} className={`transition-colors cursor-pointer ${item.quantity === 0 ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-neutral-50/80'}`}>
                                    <td className="px-6 py-4 text-[12px] font-black text-neutral-400">{idx + 1}</td>
                                    <td className={`px-6 py-4 text-[12px] font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-[#1A1A18]'}`}>{item.name}</td>
                                    <td className={`px-6 py-4 text-center font-black tracking-tight ${item.quantity === 0 ? 'text-red-500' : 'text-neutral-600'}`}>{item.quantity}</td>
                                    <td className="px-6 py-4 text-right font-black tracking-tight text-[#1A1A18]">฿ {item.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                            {(!worstPerformance || worstPerformance.length === 0) && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-[11px] text-neutral-400 font-bold uppercase">ไม่มีข้อมูลเมนูยอดแย่</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

function PaymentReport({ paymentData, totalRevenue, platformGpData, totalGpFee, hasProfitPermission }: any) {
    const { locale } = useI18n();
    return (
        <>
            <div className="sm:hidden space-y-5">
                <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-gradient-to-br from-indigo-50/40 to-white">
                    <div className="text-[11px] font-semibold text-neutral-500 tracking-wider">ยอดรับรวมทั้งหมด</div>
                    <div className="mt-3 text-[36px] leading-none font-black text-[#1A1A18] tracking-tight">฿{(totalRevenue || 0).toLocaleString()}</div>
                    {totalGpFee > 0 && (
                        <div className="mt-4 rounded-2xl bg-red-50/60 px-4 py-3">
                            <div className="text-[11px] font-black text-red-400">หักค่า GP รวม</div>
                            <div className="mt-1 text-[18px] font-black text-red-600">-฿{totalGpFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    )}
                </div>
                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="border-b border-neutral-100/50 px-6 py-5 text-[16px] font-black text-[#1A1A18] tracking-tight">ช่องทางการรับชำระเงิน</h3>
                    <div className="divide-y divide-neutral-50">
                        {paymentData?.map((item: any, idx: number) => {
                            const percent = totalRevenue > 0 ? (item.amount / totalRevenue * 100).toFixed(1) : 0
                            return (
                                <div key={idx} className="flex items-center justify-between px-5 py-4">
                                    <div>
                                        <div className="text-[14px] font-black text-[#1A1A18]">{item.method === 'cash' ? 'เงินสด' : item.method === 'promptpay' ? 'พร้อมเพย์' : item.method === 'credit_card' ? 'บัตรเครดิต' : item.method}</div>
                                        <div className="mt-1 text-[11px] font-bold text-neutral-400">{percent}%</div>
                                    </div>
                                    <div className="text-[15px] font-black tracking-tight text-[#1A1A18]">฿{item.amount.toLocaleString()}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="hidden sm:block bg-white ring-1 ring-black/5 overflow-hidden p-10 rounded-3xl space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-[12px] font-black uppercase tracking-widest border-b border-neutral-100/50 pb-6 text-[#1A1A18]">{locale === 'en' ? 'ช่องทางการรับชำระเงิน' : locale === 'zh' ? 'ช่องทางการรับชำระเงิน' : 'ช่องทางการรับชำระเงิน'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-[8px] font-black uppercase tracking-widest text-neutral-400 rounded-t-xl">
                                <tr><th className="px-6 py-4 rounded-tl-xl">{locale === 'en' ? 'ช่องทาง' : locale === 'zh' ? 'ช่องทาง' : 'ช่องทาง'}</th><th className="px-6 py-4 text-right">{locale === 'en' ? 'ยอดรับ (บาท)' : locale === 'zh' ? 'ยอดรับ (บาท)' : 'ยอดรับ (บาท)'}</th><th className="px-6 py-4 text-right rounded-tr-xl">{locale === 'en' ? 'สัดส่วน' : locale === 'zh' ? 'สัดส่วน' : 'สัดส่วน'}</th></tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {paymentData?.map((item: any, idx: number) => {
                                    const percent = totalRevenue > 0 ? (item.amount / totalRevenue * 100).toFixed(1) : 0
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-[11px] font-black uppercase">
                                                {item.method === 'cash' ? 'เงินสด' : item.method === 'promptpay' ? 'พร้อมเพย์' : item.method === 'credit_card' ? 'บัตรเครดิต' : item.method}
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-black text-right text-emerald-600">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{item.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-[10px] font-black text-right text-gray-400">{percent}%</td>
                                        </tr>
                                    )
                                })}
                                {(!paymentData || paymentData.length === 0) && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-[10px] text-gray-400 font-bold uppercase">{locale === 'en' ? 'ไม่มีข้อมูลการรับชำระเงิน' : locale === 'zh' ? 'ไม่มีข้อมูลการรับชำระเงิน' : 'ไม่มีข้อมูลการรับชำระเงิน'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {hasProfitPermission && (
                    <div className="p-8 bg-gray-50 flex flex-col justify-center items-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{locale === 'en' ? 'ยอดรับรวมทั้งหมด' : locale === 'zh' ? 'ยอดรับรวมทั้งหมด' : 'ยอดรับรวมทั้งหมด'}</div>
                        <div className="text-4xl font-black text-black">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{(totalRevenue || 0).toLocaleString()}</div>
                        {totalGpFee > 0 && (
                            <div className="mt-4 text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">หักค่า GP รวม</div>
                                <div className="text-2xl font-black text-red-600">-฿{totalGpFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-2 mb-1">ยอดสุทธิหลังหัก GP</div>
                                <div className="text-2xl font-black text-blue-700">฿{(totalRevenue - totalGpFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {platformGpData && platformGpData.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-[12px] font-black uppercase tracking-widest border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 text-[9px]">GP</span>
                            สรุป GP แต่ละแพลตฟอร์ม Delivery
                        </h4>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">แพลตฟอร์ม</th>
                                    <th className="px-6 py-4 text-center">บิล</th>
                                    <th className="px-6 py-4 text-right">ยอดขายรวม</th>
                                    <th className="px-6 py-4 text-right text-red-500">หัก GP</th>
                                    <th className="px-6 py-4 text-right">% GP</th>
                                    <th className="px-6 py-4 text-right text-blue-600">ยอดสุทธิ (Net)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {platformGpData.map((p: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black uppercase bg-red-100 text-red-800 px-2 py-1">{p.platform}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[11px] font-black text-gray-500">{p.orders}</td>
                                        <td className="px-6 py-4 text-right text-[11px] font-black text-emerald-600">฿{p.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-[11px] font-black text-red-600">-฿{p.gpFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right text-[10px] font-black text-gray-400">{p.gpRate}%</td>
                                        <td className="px-6 py-4 text-right text-[11px] font-black text-blue-700">฿{p.netReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-black">
                                    <td className="px-6 py-4 text-[10px] font-black uppercase text-gray-600" colSpan={3}>รวมทั้งหมด</td>
                                    <td className="px-6 py-4 text-right text-[11px] font-black text-red-600">-฿{platformGpData.reduce((s: number, p: any) => s + p.gpFee, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                    <td className="px-6 py-4 text-right text-[11px] font-black text-blue-700">฿{platformGpData.reduce((s: number, p: any) => s + p.netReceived, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

function ExpensesTab({ expenseList, total, onDelete, onAdd }: any) {
    const { locale } = useI18n();
    return (
        <div className="space-y-8">
            <div className="sm:hidden space-y-4">
                <div className="rounded-3xl bg-[#D3202B] p-5 text-white shadow-sm">
                    <div className="text-[11px] font-black text-white/60 tracking-wider">รวมค่าใช้จ่าย</div>
                    <div className="mt-3 text-[32px] leading-none font-black tracking-tight">฿{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                    <button onClick={onAdd} className="mt-5 rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-[#1A1A18] hover:bg-neutral-100 transition-colors">เพิ่มรายการ</button>
                </div>
                <div className="space-y-3">
                    {expenseList.map((e: any) => (
                        <div key={e.id} className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-[14px] font-black text-[#1A1A18]">{e.name}</div>
                                    <div className="mt-1 text-[11px] font-bold text-neutral-400">{e.date}</div>
                                </div>
                                <button onClick={async () => {
                                    const { supabase } = await import('@/lib/supabaseClient');
                                    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                                        await supabase.from('pos_other_expenses').delete().eq('id', e.id);
                                        onDelete();
                                    }
                                }} className="text-neutral-300 transition-colors hover:text-red-500 p-2 -mr-2 -mt-2"><Trash2 size={16} /></button>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${e.isProrated ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{e.isProrated ? 'รายเดือน' : 'ครั้งเดียว'}</span>
                                <span className="text-[16px] font-black text-red-500">-฿{e.proratedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    ))}
                    {expenseList.length === 0 && <div className="rounded-3xl border border-neutral-100 bg-white px-5 py-8 text-center text-[11px] font-bold text-neutral-300 shadow-sm">ไม่มีรายการค่าใช้จ่าย</div>}
                </div>
            </div>

            <div className="hidden sm:block space-y-8">
                <div className="flex justify-between items-end">
                    <div><h3 className="text-[14px] font-black uppercase tracking-widest text-[#1A1A18]">{locale === 'en' ? 'การจัดการค่าใช้จ่ายอื่นๆ' : locale === 'zh' ? 'การจัดการค่าใช้จ่ายอื่นๆ' : 'การจัดการค่าใช้จ่ายอื่นๆ'}</h3></div>
                    <button onClick={onAdd} className="px-6 py-3 rounded-full bg-[#D3202B] text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors">{locale === 'en' ? 'Add item' : locale === 'zh' ? '添加项目' : 'เพิ่มรายการ'}</button>
                </div>
                <div className="grid lg:grid-cols-4 gap-6">
                    <div className="p-8 bg-[#D3202B] text-white rounded-3xl shadow-[0_8px_30px_rgba(26,26,24,0.3)] flex flex-col justify-center items-center h-full">
                        <div className="text-[10px] font-bold mb-2 opacity-60 tracking-widest uppercase">{locale === 'en' ? 'รวมช่วงเวลานี้' : locale === 'zh' ? 'รวมช่วงเวลานี้' : 'รวมค่าใช้จ่ายเฉลี่ย (ตามช่วงเวลา)'}</div>
                        <div className="text-3xl font-black tracking-tight">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="lg:col-span-3 bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100/50">
                                <tr>
                                    <th className="px-8 py-5">{locale === 'en' ? 'date' : locale === 'zh' ? '日期' : 'วันที่บันทึก'}</th>
                                    <th className="px-8 py-5">{locale === 'en' ? 'รายการ' : locale === 'zh' ? 'รายการ' : 'รายการ'}</th>
                                    <th className="px-8 py-5">{locale === 'en' ? 'ประเภท' : locale === 'zh' ? 'ประเภท' : 'ประเภท'}</th>
                                    <th className="px-8 py-5 text-right">{locale === 'en' ? 'ยอดที่หัก (บาท)' : locale === 'zh' ? 'ยอดที่หัก' : 'ยอดที่นำมาหัก (ตามวัน)'}</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {expenseList.map((e: any) => (
                                    <tr key={e.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-8 py-6 text-[10px] font-black text-neutral-500">{e.date}</td>
                                        <td className="px-8 py-6">
                                            <div className="text-[11px] font-black uppercase text-[#1A1A18]">{e.name}</div>
                                            <div className="text-[9px] font-bold text-neutral-400 mt-1">ยอดเต็ม: ฿{Number(e.amount).toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-full ${e.isProrated ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {e.isProrated ? 'รายเดือน (หารเฉลี่ย)' : 'ครั้งเดียว'}
                                            </span>
                                            {e.isProrated && <div className="text-[9px] font-bold text-neutral-400 mt-2">นำมาคิด {e.overlappingDays} วัน (วันละ ฿{e.dailyRate?.toLocaleString(undefined, { maximumFractionDigits: 2 })})</div>}
                                        </td>
                                        <td className="px-8 py-6 text-[12px] font-black text-right text-red-500">
                                            -฿ {e.proratedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button onClick={async () => {
                                                const { supabase } = await import('@/lib/supabaseClient');
                                                if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                                                    await supabase.from('pos_other_expenses').delete().eq('id', e.id);
                                                    onDelete();
                                                }
                                            }} className="text-neutral-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {expenseList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">ไม่มีรายการค่าใช้จ่าย</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
function InventoryReport({ varianceCost }: any) {
    const { locale } = useI18n(); return <>
        <div className="sm:hidden rounded-3xl bg-white ring-1 ring-black/5 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><div className="text-[11px] font-semibold text-neutral-400 tracking-wider">{locale === 'en' ? 'ความสูญเสียในสต็อก' : locale === 'zh' ? 'ความสูญเสียในสต็อก' : 'ความสูญเสียในสต็อก'}</div><div className="mt-4 text-[34px] font-black tracking-tight text-red-500">฿{Math.abs(varianceCost).toLocaleString()}</div><div className="mt-2 text-[11px] font-bold text-neutral-400">{locale === 'en' ? 'มูลค่าความสูญเสียรวมจากการนับสต็อก' : locale === 'zh' ? 'มูลค่าความสูญเสียรวมจากการนับสต็อก' : 'มูลค่าความสูญเสียรวมจากการนับสต็อก'}</div></div>
        <div className="hidden sm:block bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><div className="p-8 border-b border-neutral-100/50"><h3 className="text-[12px] font-black uppercase tracking-widest text-[#1A1A18]">{locale === 'en' ? 'ความสูญเสียในสต็อก' : locale === 'zh' ? 'ความสูญเสียในสต็อก' : 'ความสูญเสียในสต็อก'}</h3></div><div className="p-20 text-center bg-gradient-to-b from-neutral-50/50 to-white"><div className="text-[54px] leading-none font-black text-red-500 mb-4 tracking-tight">{locale === 'en' ? '฿ ' : locale === 'zh' ? '฿ ' : '฿ '}{Math.abs(varianceCost).toLocaleString()}</div><div className="text-[11px] font-bold uppercase text-neutral-400 tracking-widest">{locale === 'en' ? 'มูลค่าความสูญเสียรวมจากการนับสต็อก' : locale === 'zh' ? 'มูลค่าความสูญเสียรวมจากการนับสต็อก' : 'มูลค่าความสูญเสียรวมจากการนับสต็อก'}</div></div></div>
    </>
}
function DiscountsVoidsReport({ discountTotal, voidedOrders }: any) {
    const { locale } = useI18n();
    return (
        <div className="space-y-8">
            <div className="sm:hidden space-y-5">
                <div className="rounded-[2rem] bg-blue-50/80 p-6 ring-1 ring-blue-100 shadow-[0_8px_30px_rgb(59,130,246,0.1)]">
                    <div className="text-[11px] font-bold text-blue-500 tracking-wider">สรุปส่วนลดและโปรโมชั่น</div>
                    <div className="mt-4 text-[36px] leading-none font-black text-blue-600 tracking-tight">฿{discountTotal.toLocaleString()}</div>
                </div>
                <div className="rounded-[2rem] bg-red-50/80 p-6 ring-1 ring-red-100 shadow-[0_8px_30px_rgb(239,68,68,0.1)]">
                    <div className="text-[11px] font-bold text-red-500 tracking-wider">มูลค่าบิลที่ถูกยกเลิก</div>
                    <div className="mt-4 text-[36px] leading-none font-black text-red-600 tracking-tight">฿{voidedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0).toLocaleString()}</div>
                    <div className="mt-2 text-[11px] font-bold text-red-400">{voidedOrders.length} บิล</div>
                </div>
                <div className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="border-b border-neutral-100/50 px-6 py-5 text-[16px] font-black text-[#1A1A18]">Void Report</h3>
                    <div className="divide-y divide-neutral-50">
                        {voidedOrders.map((o: any, idx: number) => (
                            <div key={idx} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[13px] font-black text-[#1A1A18]">{o.order_type === 'dine_in' && o.table_number ? `โต๊ะ ${o.table_number}` : `#${String(o.queue_number || 0).padStart(3, '0')}`}</div>
                                        <div className="mt-1 text-[11px] font-black text-gray-400">{o.order_number}</div>
                                        <div className="mt-1 text-[11px] font-black text-gray-400">{new Date(o.updated_at || o.created_at).toLocaleString('th-TH')}</div>
                                    </div>
                                    <div className="text-[14px] font-black text-red-500">฿{o.total_amount.toLocaleString()}</div>
                                </div>
                                <div className="mt-2 text-[11px] font-black text-gray-500">{o.void_reason || '-'}</div>
                            </div>
                        ))}
                        {voidedOrders.length === 0 && <div className="px-5 py-6 text-center text-[11px] font-black text-gray-300">ไม่มีรายการยกเลิกบิลในช่วงเวลานี้</div>}
                    </div>
                </div>
            </div>

            <div className="hidden sm:block space-y-8">
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="p-8 bg-blue-50/50 text-blue-700 ring-1 ring-blue-100 rounded-3xl shadow-[0_8px_30px_rgba(59,130,246,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-4">สรุปส่วนลดและโปรโมชั่น (Discount)</div>
                        <div className="flex items-baseline gap-2"><span className="text-[44px] leading-none font-black tracking-tight">{discountTotal.toLocaleString()}</span><span className="text-[11px] font-black uppercase opacity-70">บาท</span></div>
                        <div className="text-[11px] font-semibold mt-4 opacity-70">ยอดเงินรวมที่ลดให้ลูกค้าในช่วงเวลานี้</div>
                    </div>
                    <div className="p-8 bg-red-50/50 text-red-600 ring-1 ring-red-100 rounded-3xl shadow-[0_8px_30px_rgba(239,68,68,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-4">มูลค่าบิลที่ถูกยกเลิก (Voided)</div>
                        <div className="flex items-baseline gap-2"><span className="text-[44px] leading-none font-black tracking-tight">{voidedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0).toLocaleString()}</span><span className="text-[11px] font-black uppercase opacity-70">บาท</span></div>
                        <div className="text-[11px] font-semibold mt-4 opacity-70">จำนวนทั้งหมด {voidedOrders.length} บิลที่ถูกยกเลิก</div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black uppercase tracking-widest p-8 border-b border-neutral-100/50 text-[#1A1A18]">รายงานการยกเลิกบิล (Void Report)</h3>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100/50">
                            <tr>
                                <th className="px-8 py-5">วันเวลา</th>
                                <th className="px-8 py-5">หมายเลขบิล</th>
                                <th className="px-8 py-5">พนักงานที่ทำรายการ</th>
                                <th className="px-8 py-5">เหตุผลในการยกเลิก</th>
                                <th className="px-8 py-5 text-right text-red-500">มูลค่าบิล</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {voidedOrders.map((o: any, idx: number) => (
                                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-5 text-[10px] font-black text-neutral-500">{new Date(o.updated_at || o.created_at).toLocaleString('th-TH')}</td>
                                    <td className="px-6 py-5">
                                        <div className="text-[11px] font-black uppercase text-[#1A1A18]">{o.order_type === 'dine_in' && o.table_number ? `โต๊ะ ${o.table_number}` : `#${String(o.queue_number || 0).padStart(3, '0')}`}</div>
                                        <div className="text-[9px] font-bold text-neutral-400 uppercase mt-1">{o.order_number}</div>
                                    </td>
                                    <td className="px-6 py-5 text-[11px] font-black text-[#1A1A18]">{o.profiles?.display_name || o.profiles?.full_name || o.profiles?.first_name || o.cashier_name || 'ไม่ระบุ'}</td>
                                    <td className="px-6 py-5 text-[11px] font-bold text-neutral-500">{o.void_reason || '-'}</td>
                                    <td className="px-6 py-5 text-[12px] font-black text-right text-red-500">฿{o.total_amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {voidedOrders.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-[10px] text-neutral-400 font-black uppercase tracking-widest">ไม่มีรายการยกเลิกบิลในช่วงเวลานี้</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
