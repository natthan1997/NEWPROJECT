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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { name, shopName, email, password, locale = 'th' } = body

        if (!name || !shopName || !email || !password) {
            return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()

        // 1. Create auth user (auto-confirmed)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'staff',
                staff_level: 'owner'
            }
        })

        if (authError || !authData.user) {
            console.error('Merchant owner user creation failed:', authError)
            return NextResponse.json({ error: authError?.message || 'ไม่สามารถสร้างบัญชีผู้ใช้ได้' }, { status: 400 })
        }

        const userId = authData.user.id

        // 2. Create pos_merchant record
        const { data: merchantData, error: merchantErr } = await supabase
            .from('pos_merchants')
            .insert([{
                name: shopName,
                owner_id: userId
            }])
            .select()
            .single()

        if (merchantErr || !merchantData) {
            console.error('Failed to create merchant:', merchantErr)
            return NextResponse.json({ error: 'ไม่สามารถสร้างร้านค้าได้: ' + merchantErr.message }, { status: 500 })
        }

        const merchantId = merchantData.id

        // 3. Create default branch
        const { data: branchData, error: branchErr } = await supabase
            .from('branches')
            .insert([{
                merchant_id: merchantId,
                branch_name: 'สำนักงานใหญ่',
                branch_code: '01'
            }])
            .select()
            .single()

        if (branchErr || !branchData) {
            console.error('Failed to create branch:', branchErr)
            return NextResponse.json({ error: 'ไม่สามารถสร้างสาขาเริ่มต้นได้' }, { status: 500 })
        }

        const branchId = branchData.id

        // 4. Create default pos_shop_settings
        const { error: settingsErr } = await supabase
            .from('pos_shop_settings')
            .insert([{
                branch_id: branchId,
                name: shopName,
                is_open: true,
                status: 'open',
                role_permissions: { staff: [], manager: [] }
            }])

        if (settingsErr) {
            console.error('Failed to create settings:', settingsErr)
        }

        // 5. Create profile record linking to merchant_id as a verified owner
        const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email,
                role: 'staff',
                staff_level: 'owner',
                staff_code: '0101',
                branch_code: '01',
                is_verified: true,
                is_pos_account: true,
                display_name: name,
                merchant_id: merchantId,
                timezone: 'Asia/Bangkok',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

        if (profileErr) {
            console.error('Failed to create profile:', profileErr)
            return NextResponse.json({ error: 'ไม่สามารถสร้างโปรไฟล์ผู้ดูแลระบบได้' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'สมัครสมาชิกและสร้างร้านค้าสำเร็จ!' })

    } catch (err: any) {
        console.error('Merchant registration error:', err)
        return NextResponse.json({ error: 'ระบบเซิร์ฟเวอร์ขัดข้อง' }, { status: 500 })
    }
}
