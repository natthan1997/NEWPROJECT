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

        // Get member id
        const { data: member } = await supabase
            .from('pos_members')
            .select('id, created_at')
            .eq('line_user_id', lineUserId)
            .single();

        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        // Get all orders
        const { data: orders } = await supabase
            .from('pos_orders')
            .select('id, created_at')
            .eq('customer_id', member.id);

        let totalCups = 0;
        let favoriteMenu = 'ยังไม่มีข้อมูล';
        let mostVisitedDay = 'ยังไม่มีข้อมูล';

        if (orders && orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            
            // Get order items
            const { data: items } = await supabase
                .from('pos_order_items')
                .select('item_id, pos_menu_items(name, category_id), quantity')
                .in('order_id', orderIds);

            if (items && items.length > 0) {
                totalCups = items.reduce((sum, item) => sum + item.quantity, 0);

                // Calculate favorite menu
                const menuCounts: any = {};
                items.forEach(item => {
                    const name = item.pos_menu_items?.name;
                    if (name) {
                        menuCounts[name] = (menuCounts[name] || 0) + item.quantity;
                    }
                });
                
                const sortedMenus = Object.entries(menuCounts).sort((a: any, b: any) => b[1] - a[1]);
                if (sortedMenus.length > 0) favoriteMenu = sortedMenus[0][0];
            }

            // Calculate favorite day
            const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
            const dayCounts = [0, 0, 0, 0, 0, 0, 0];
            orders.forEach(o => {
                if (o.created_at) {
                    dayCounts[new Date(o.created_at).getDay()]++;
                }
            });
            const maxDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
            if (dayCounts[maxDayIdx] > 0) {
                mostVisitedDay = 'วัน' + days[maxDayIdx];
            }
        }

        return NextResponse.json({
            success: true,
            totalCups,
            favoriteMenu,
            mostVisitedDay,
            memberSince: member.created_at
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
