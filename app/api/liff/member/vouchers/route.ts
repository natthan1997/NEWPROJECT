import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { lineUserId, memberId } = await req.json();

    if (!lineUserId && !memberId) {
      return NextResponse.json({ success: false, error: 'Missing lineUserId or memberId' }, { status: 400 });
    }

    let targetMemberId = null;
    let targetUserId = null;

    if (memberId && memberId.includes('-')) { 
      targetMemberId = memberId; 
      targetUserId = memberId; // Often memberId IS the user_id (UUID)
    }

    if (!targetMemberId && lineUserId) {
      const { data: profile } = await supabase.from('pos_members').select('id, user_id').eq('line_user_id', lineUserId).single();
      if (profile) {
        targetMemberId = profile.id;
        if (profile.user_id) targetUserId = profile.user_id;
      }
    }

    // Try to find the UUID to query member_vouchers
    const queryId = targetUserId || targetMemberId;

    if (!queryId) {
      return NextResponse.json({ success: true, vouchers: [] });
    }

    const { data: vouchers, error } = await supabase
      .from('member_vouchers')
      .select('*')
      .eq('user_id', queryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching vouchers:', error);
      // Fallback: maybe they don't have this table populated or RLS blocks service key (unlikely)
      return NextResponse.json({ success: true, vouchers: [] });
    }

    return NextResponse.json({ 
      success: true, 
      vouchers: vouchers || []
    });

  } catch (err: any) {
    console.error('Error fetching vouchers:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
