const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testClaim() {
    const token = 'b434f25e4fe3882e49ffa7e8835ee3af';

    const { data: tokenInfo, error: tokenError } = await supabase
        .from('pos_qr_reward_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();

    if (!tokenInfo) {
        console.log('Token not found');
        return;
    }

    console.log('Token Info:', tokenInfo);

    let orderItems = [];
    const { data: items } = await supabase
        .from('pos_order_items')
        .select('quantity, item:pos_menu_items!pos_order_items_item_id_fkey(name), unit_price, subtotal, status')
        .eq('order_id', tokenInfo.order_id);

    console.log('Raw Items:', items);

    if (items) {
        orderItems = items
            .filter((i) => i.status !== 'cancelled' && i.status !== 'void' && i.status !== 'refunded')
            .map((i) => ({
                ...i,
                item_name: i.item?.name || 'Unknown Item'
            }));
    }

    console.log('Filtered Order Items:', orderItems);
}

testClaim();
