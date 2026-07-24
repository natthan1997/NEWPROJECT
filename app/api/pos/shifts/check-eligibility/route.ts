import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey)
}

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export async function GET(req: NextRequest) {
    return handleCheckEligibility(req)
}

export async function POST(req: NextRequest) {
    return handleCheckEligibility(req)
}

async function handleCheckEligibility(req: NextRequest) {
    try {
        const supabase = createSupabaseServiceClient()

        // 1. Calculate today's date and day of week in Bangkok Time (Asia/Bangkok, UTC+7)
        const nowBangkok = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
        const year = nowBangkok.getFullYear()
        const month = String(nowBangkok.getMonth() + 1).padStart(2, '0')
        const day = String(nowBangkok.getDate()).padStart(2, '0')
        const todayDateStr = `${year}-${month}-${day}` // YYYY-MM-DD
        const todayDayOfWeek = DAY_MAP[nowBangkok.getDay()] // 'sun', 'mon', ...

        const localTodayStart = `${todayDateStr}T00:00:00+07:00`
        const localTodayEnd = `${todayDateStr}T23:59:59+07:00`

        // 2. Fetch active staff profiles (excluding POS device accounts)
        const { data: allStaff, error: staffErr } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, is_active, is_pos_device, work_days, shift_start, shift_end')
            .eq('role', 'staff')
            .eq('is_active', true)

        if (staffErr) {
            console.error('Fetch staff error:', staffErr)
            return NextResponse.json({ error: staffErr.message }, { status: 500 })
        }

        // Filter out POS device accounts
        const realStaff = (allStaff || []).filter(s => !s.is_pos_device)

        // Filter staff scheduled to work today
        const scheduledStaff = realStaff.filter(s => {
            if (!s.work_days || !Array.isArray(s.work_days) || s.work_days.length === 0) {
                return true // Default to all days if not specified
            }
            return s.work_days.includes(todayDayOfWeek)
        })

        // 3. Fetch emergency leave overrides for today
        let emergencyLeaveStaffIds: string[] = []
        try {
            const { data: leaves } = await supabase
                .from('pos_staff_leave_overrides')
                .select('profile_id')
                .eq('date', todayDateStr)
            
            if (leaves) {
                emergencyLeaveStaffIds = leaves.map(l => l.profile_id)
            }
        } catch (e) {
            // Table might not exist yet or empty
        }

        // Exclude staff on emergency leave from required list for today
        const requiredStaffToday = scheduledStaff.filter(s => !emergencyLeaveStaffIds.includes(s.id))
        const emergencyLeaveStaff = scheduledStaff.filter(s => emergencyLeaveStaffIds.includes(s.id))

        // 4. Fetch today's attendance logs
        const { data: logs, error: logsErr } = await supabase
            .from('attendance_logs')
            .select('*')
            .gte('timestamp', localTodayStart)
            .lte('timestamp', localTodayEnd)

        if (logsErr) {
            console.error('Fetch logs error:', logsErr)
        }

        const todayLogs = logs || []

        // 5. Determine missing check-in staff
        const missingCheckInStaff: any[] = []
        const checkedInStaff: any[] = []

        requiredStaffToday.forEach(s => {
            const hasCheckedIn = todayLogs.some(l => l.profile_id === s.id && l.type === 'check_in')
            if (hasCheckedIn) {
                checkedInStaff.push(s)
            } else {
                missingCheckInStaff.push(s)
            }
        })

        // 6. Determine missing check-out staff (for shift close)
        const missingCheckOutStaff: any[] = []
        checkedInStaff.forEach(s => {
            const hasCheckedOut = todayLogs.some(l => l.profile_id === s.id && l.type === 'check_out')
            if (!hasCheckedOut) {
                missingCheckOutStaff.push(s)
            }
        })

        const canOpenShift = missingCheckInStaff.length === 0
        const canCloseShift = missingCheckOutStaff.length === 0

        return NextResponse.json({
            success: true,
            todayDate: todayDateStr,
            todayDayOfWeek,
            totalScheduledStaff: scheduledStaff.length,
            totalRequiredStaff: requiredStaffToday.length,
            scheduledStaff,
            requiredStaffToday,
            checkedInStaff,
            missingCheckInStaff,
            missingCheckOutStaff,
            emergencyLeaveStaff,
            canOpenShift,
            canCloseShift
        })

    } catch (err: any) {
        console.error('Check Shift Eligibility Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
