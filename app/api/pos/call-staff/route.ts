import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { table_id, table_number, branch_id, action = 'call_bill' } = body

    if (!table_id) {
      return NextResponse.json({ error: 'Missing table_id' }, { status: 400 })
    }

    // Use service role to bypass RLS and broadcast message
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Broadcast the event on the 'pos-alerts' channel
    const channel = supabaseAdmin.channel('pos-alerts')
    await channel.send({
      type: 'broadcast',
      event: 'staff_call',
      payload: {
        table_id,
        table_number,
        branch_id,
        action,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error calling staff:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
