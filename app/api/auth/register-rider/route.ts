import { NextRequest, NextResponse } from 'next/server'
import {
  COMPLIANCE_POLICY_VERSIONS,
  createAnonSupabaseServerClient,
  createServiceRoleSupabaseClient,
  getRequestIpAddress,
  getRequestId,
  recordAuditLog,
  recordConsent,
} from '@/lib/server/compliance'

type RegisterRiderPayload = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  vehicleInfo?: string
  locale?: string
}

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 })

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIpAddress(request.headers)
  const requestId = getRequestId(request.headers)
  const userAgent = request.headers.get('user-agent')

  try {
    const body = (await request.json()) as RegisterRiderPayload
    const firstName = body.firstName?.trim() || ''
    const lastName = body.lastName?.trim() || ''
    const email = body.email?.trim().toLowerCase() || ''
    const password = body.password || ''
    const phone = body.phone?.trim() || ''
    const vehicleInfo = body.vehicleInfo?.trim() || ''
    const locale = body.locale?.trim() || 'th'

    if (!firstName || !lastName || !email || !password || !phone || !vehicleInfo) {
      return badRequest('กรุณากรอกข้อมูลให้ครบถ้วน')
    }

    if (!email.includes('@')) {
      return badRequest('รูปแบบอีเมลไม่ถูกต้อง')
    }

    if (password.length < 6) {
      return badRequest('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    }

    const serviceRoleSupabase = createServiceRoleSupabaseClient()
    const fullName = `${firstName} ${lastName}`.trim()

    // Create user in Supabase Auth as staff member
    const { data, error } = await serviceRoleSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'staff',
        staff_type: 'rider',
      },
    })

    if (error) {
      await recordAuditLog({
        userEmail: email,
        action: 'register_rider_failed',
        ipAddress,
        userAgent,
        requestId,
        details: {
          context: 'api.auth.register-rider',
          reason: error.message,
        },
      })

      let errorMessage = error.message
      if (errorMessage.includes('rate limit')) {
        errorMessage = 'ระบบมีการจำกัดจำนวนการสมัคร กรุณาลองใหม่อีกครั้งในภายหลัง หรือติดต่อผู้ดูแลระบบ'
      }

      return NextResponse.json({ error: errorMessage, requestId }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้', requestId }, { status: 500 })
    }

    // Upsert rider profile in profiles table (as unverified staff / rider)
    const { error: profileError } = await serviceRoleSupabase.from('profiles').upsert(
      {
        id: data.user.id,
        email,
        role: 'staff',
        staff_type: 'rider',
        display_name: fullName,
        phone,
        address: vehicleInfo, // Save vehicle details inside the address column to avoid schema changes
        is_verified: false, // Rider is unverified until approved by admin
        timezone: 'Asia/Bangkok',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      await recordAuditLog({
        userId: data.user.id,
        userEmail: email,
        action: 'register_rider_profile_upsert_failed',
        ipAddress,
        userAgent,
        requestId,
        details: {
          context: 'api.auth.register-rider',
          reason: profileError.message,
        },
      })
    }

    // Log compliance & audit logs
    await Promise.all([
      recordConsent({
        userId: data.user.id,
        email,
        consentType: 'privacy_policy',
        consentStatus: 'granted',
        policyVersion: COMPLIANCE_POLICY_VERSIONS.privacyPolicy,
        policyDocument: 'PDPA_PRIVACY_POLICY_TH',
        sourceChannel: 'rider_register_page',
        locale,
        ipAddress,
        userAgent,
        requestId,
        metadata: {
          flow: 'rider_registration',
        },
      }),
      recordConsent({
        userId: data.user.id,
        email,
        consentType: 'terms_of_service',
        consentStatus: 'granted',
        policyVersion: COMPLIANCE_POLICY_VERSIONS.termsOfService,
        policyDocument: 'TERMS_OF_SERVICE_TH',
        sourceChannel: 'rider_register_page',
        locale,
        ipAddress,
        userAgent,
        requestId,
        metadata: {
          flow: 'rider_registration',
        },
      }),
      recordAuditLog({
        userId: data.user.id,
        userEmail: email,
        action: 'register_rider_succeeded',
        ipAddress,
        userAgent,
        requestId,
        details: {
          context: 'api.auth.register-rider',
          locale,
          privacy_policy_version: COMPLIANCE_POLICY_VERSIONS.privacyPolicy,
          terms_version: COMPLIANCE_POLICY_VERSIONS.termsOfService,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      requestId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'

    await recordAuditLog({
      action: 'register_rider_exception',
      ipAddress,
      userAgent,
      requestId,
      details: {
        context: 'api.auth.register-rider',
        reason: message,
      },
    }).catch(() => null)

    return NextResponse.json({ error: 'Server error', requestId }, { status: 500 })
  }
}
