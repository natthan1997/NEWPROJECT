import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { lineUserId } = await req.json();
        if (!lineUserId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: member } = await supabase
            .from('pos_members')
            .select('id, points')
            .eq('line_user_id', lineUserId)
            .single();

        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        
        const POINTS_REQUIRED = 1000;

        if (member.points < POINTS_REQUIRED) {
            return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
        }

        // 1. Deduct points
        await supabase
            .from('pos_members')
            .update({ points: member.points - POINTS_REQUIRED })
            .eq('id', member.id);

        // 2. Add History
        await supabase
            .from('pos_points_history')
            .insert({
                member_id: member.id,
                points: -POINTS_REQUIRED,
                type: 'redeem',
                points_change: -POINTS_REQUIRED,
                description: 'Harvested Digital Tree for Reward'
            });

        // 3. Create Coupon
        await supabase
            .from('pos_member_coupons')
            .insert({
                member_id: member.id,
                coupon_type: 'tree_harvest',
                coupon_name: 'ฟรี! ต้นไม้จริง 1 ต้น (จาก Digital Garden)'
            });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
