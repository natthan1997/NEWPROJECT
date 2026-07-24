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
const FULL_DAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

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
        const dayIndex = nowBangkok.getDay()
        const todayDayOfWeek = DAY_MAP[dayIndex] // 'sun', 'mon', ...
        const todayFullDayStr = FULL_DAY_MAP[dayIndex] // 'sunday', 'monday', ...

        const localTodayStart = `${todayDateStr}T00:00:00+07:00`
        const localTodayEnd = `${todayDateStr}T23:59:59+07:00`

        // 2. Resolve branch_code if branch_id is passed as UUID or code
        const branchId = req.nextUrl.searchParams.get('branch_id') || req.nextUrl.searchParams.get('branchId') || req.nextUrl.searchParams.get('branch_code')
        let targetBranchCode: string | null = null

        if (branchId) {
            const { data: bData } = await supabase
                .from('branches')
                .select('branch_code')
                .eq('id', branchId)
                .maybeSingle()

            if (bData?.branch_code) {
                targetBranchCode = bData.branch_code
            } else {
                targetBranchCode = branchId
            }
        }

        // 3. Fetch profiles safely using display_name and branch_code
        const { data: allStaff, error: staffErr } = await supabase
            .from('profiles')
            .select('id, display_name, email, role, staff_level, staff_type, department, is_active, is_pos_device, is_pos_account, work_days, rest_days, shift_start, shift_end, branch_code')

        if (staffErr) {
            console.error('Fetch staff error:', staffErr)
            return NextResponse.json({ error: staffErr.message }, { status: 500 })
        }

        // Filter staff profiles (EXCLUSIVELY Cafe Staff: staff_type === 'cafe')
        const realStaff = (allStaff || []).filter(s => {
            if (s.is_pos_device || s.is_pos_account) return false
            if (s.is_active === false) return false

            const r = (s.role || '').toLowerCase()
            if (r === 'customer') return false

            // Strictly filter for Cafe staff only (staff_type === 'cafe')
            const st = (s.staff_type || '').toLowerCase()
            const isCafeStaff = st === 'cafe'
            if (!isCafeStaff) return false

            // Branch filter matching targetBranchCode or branch_code
            if (targetBranchCode && s.branch_code && s.branch_code !== targetBranchCode && s.branch_code !== branchId) {
                return false
            }

            return true
        })

        // Filter staff scheduled to work today
        const scheduledStaff = realStaff.filter(s => {
            // Check rest_days first if set
            if (s.rest_days && Array.isArray(s.rest_days) && s.rest_days.length > 0) {
                const isRestDay = s.rest_days.some((rd: any) => {
                    const norm = String(rd).toLowerCase()
                    return norm === todayFullDayStr || norm.slice(0, 3) === todayDayOfWeek
                })
                if (isRestDay) return false
            }

            // Check work_days if set
            if (!s.work_days || !Array.isArray(s.work_days) || s.work_days.length === 0) {
                return true // Default to all days if not specified
            }
            const normalizedDays = s.work_days.map((d: any) => String(d).toLowerCase().slice(0, 3))
            return normalizedDays.includes(todayDayOfWeek)
        })

        // 4. Fetch emergency leave overrides for today
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

        // 5. Fetch today's attendance logs
        const { data: logs, error: logsErr } = await supabase
            .from('attendance_logs')
            .select('*')
            .gte('timestamp', localTodayStart)
            .lte('timestamp', localTodayEnd)

        if (logsErr) {
            console.error('Fetch logs error:', logsErr)
        }

        const todayLogs = logs || []

        // 6. Determine missing check-in staff
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

        // 7. Determine missing check-out staff (for shift close)
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
